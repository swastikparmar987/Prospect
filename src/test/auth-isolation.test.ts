import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { createSessionToken, verifySessionToken, resolveAuthenticatedUser } from "../lib/auth";
import { GET as getProfile, POST as postProfile } from "../app/api/profile/route";
import { GET as getTracker, POST as postTracker, PATCH as patchTracker, DELETE as deleteTracker } from "../app/api/tracker/route";
import { GET as getFeedback, POST as postFeedback } from "../app/api/feedback/route";
import { GET as getPrepPlans, POST as postPrepPlans, PATCH as patchPrepPlans } from "../app/api/preparation-plans/route";
import { GET as getAgentRuns, POST as postAgentRuns } from "../app/api/agent/runs/route";
import { durableWorker } from "../lib/agent/durable-worker";

test("Priority 3 — Multi-User Authentication & Data Isolation Suite", async (t) => {
  const userAId = `usr_alice_${Date.now()}`;
  const userBId = `usr_bob_${Date.now()}`;

  const tokenA = createSessionToken({ userId: userAId, email: "alice@university.edu", role: "STUDENT" });
  const tokenB = createSessionToken({ userId: userBId, email: "bob@university.edu", role: "STUDENT" });

  t.after(async () => {
    try {
      await prisma.applicationEvent.deleteMany({ where: { application: { userId: { in: [userAId, userBId] } } } });
      await prisma.application.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
      await prisma.preparationPlan.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
      await prisma.agentStep.deleteMany({ where: { run: { userId: { in: [userAId, userBId] } } } });
      await prisma.agentRun.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
      await prisma.durableTask.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
      await prisma.userFeedback.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
      await prisma.userProfile.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
      await prisma.opportunity.deleteMany({ where: { id: "test-opp-iso-1" } });
    } catch {}
  });

  await t.test("1. Session token verification and anti-tampering protection", () => {
    const verifiedA = verifySessionToken(tokenA);
    assert.ok(verifiedA);
    assert.equal(verifiedA.userId, userAId);
    assert.equal(verifiedA.email, "alice@university.edu");

    // Tampered token test (altering payload or signature)
    const tampered = tokenA.slice(0, -4) + "XXXX";
    assert.equal(verifySessionToken(tampered), null);

    // Empty/invalid token test
    assert.equal(verifySessionToken(""), null);
    assert.equal(verifySessionToken("invalid-token"), null);
  });

  await t.test("2. Profile Isolation: User B cannot view User A's profile", async () => {
    // User A creates their profile
    const reqA = new Request("http://localhost:3000/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-prospect-session": tokenA,
      },
      body: JSON.stringify({
        fullName: "Alice Student",
        email: "alice@university.edu",
        headline: "Robotics & Embedded Systems",
        university: "MIT",
        degree: "B.S.",
        major: "EECS",
        graduationYear: 2026,
        location: "Boston, MA",
        targetRoles: ["Robotics Intern"],
        skills: ["C++", "ROS", "Python"],
        experiences: [],
        projects: [],
        portfolioLinks: [],
      }),
    });

    const resA = await postProfile(reqA);
    assert.equal(resA.status, 200);

    // User A reads their profile -> gets Alice
    const getReqA = new Request("http://localhost:3000/api/profile", {
      method: "GET",
      headers: { "x-prospect-session": tokenA },
    });
    const getResA = await getProfile(getReqA);
    const dataA = await getResA.json();
    assert.equal(dataA.profile.fullName, "Alice Student");

    // User B reads their profile -> gets null (User B has not created one yet)
    const getReqB = new Request("http://localhost:3000/api/profile", {
      method: "GET",
      headers: { "x-prospect-session": tokenB },
    });
    const getResB = await getProfile(getReqB);
    const dataB = await getResB.json();
    assert.equal(dataB.profile, null);
  });

  await t.test("3. Application Tracker Isolation: User B cannot view, modify, or delete User A's applications", async () => {
    // Seed an opportunity for application testing
    const opp = await prisma.opportunity.upsert({
      where: { id: "test-opp-iso-1" },
      update: {},
      create: {
        id: "test-opp-iso-1",
        title: "Systems Engineer Intern",
        organization: "Lockheed Tech",
        category: "Internship",
        description: "Embedded C/C++ engineering",
        location: "Remote",
        workMode: "Remote",
        compensation: "$45/hr",
        applyUrl: "https://example.com/apply-1",
        sourceName: "Direct",
        sourceUrl: "https://example.com/1",
      },
    });

    // User A saves application to their tracker
    const saveReqA = new Request("http://localhost:3000/api/tracker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-prospect-session": tokenA,
      },
      body: JSON.stringify({
        opportunityId: opp.id,
        stage: "SAVED",
        notes: "Confidential application notes by Alice",
      }),
    });
    const saveResA = await postTracker(saveReqA);
    const saveBodyA = await saveResA.json();
    assert.equal(saveResA.status, 200);
    const appIdA = saveBodyA.application.id;
    assert.ok(appIdA);

    // User B lists applications -> receives 0 applications (User A's app is invisible)
    const listReqB = new Request("http://localhost:3000/api/tracker", {
      method: "GET",
      headers: { "x-prospect-session": tokenB },
    });
    const listResB = await getTracker(listReqB);
    const listDataB = await listResB.json();
    assert.equal(listDataB.applications.length, 0);

    // User B attempts to PATCH User A's application -> 404 unauthorized
    const patchReqB = new Request("http://localhost:3000/api/tracker", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-prospect-session": tokenB,
      },
      body: JSON.stringify({
        id: appIdA,
        stage: "REJECTED",
      }),
    });
    const patchResB = await patchTracker(patchReqB);
    assert.equal(patchResB.status, 404);

    // User B attempts to DELETE User A's application -> 404 unauthorized
    const delReqB = new Request(`http://localhost:3000/api/tracker?id=${appIdA}`, {
      method: "DELETE",
      headers: { "x-prospect-session": tokenB },
    });
    const delResB = await deleteTracker(delReqB);
    assert.equal(delResB.status, 404);

    // User A verifies application is still intact
    const verifyReqA = new Request("http://localhost:3000/api/tracker", {
      method: "GET",
      headers: { "x-prospect-session": tokenA },
    });
    const verifyResA = await getTracker(verifyReqA);
    const verifyDataA = await verifyResA.json();
    assert.equal(verifyDataA.applications.length, 1);
    assert.equal(verifyDataA.applications[0].id, appIdA);
    assert.equal(verifyDataA.applications[0].notes, "Confidential application notes by Alice");
  });

  await t.test("4. User Feedback Isolation: User B cannot see User A's feedback signals", async () => {
    // User A records a feedback signal (e.g. HIDE_EMPLOYER)
    const fbReqA = new Request("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-prospect-session": tokenA,
      },
      body: JSON.stringify({
        organization: "SecretCorp",
        signalType: "HIDE_EMPLOYER",
        notes: "Alice hates SecretCorp",
      }),
    });
    const fbResA = await postFeedback(fbReqA);
    assert.equal(fbResA.status, 200);

    // User B fetches feedback -> receives empty list
    const fbReqB = new Request("http://localhost:3000/api/feedback", {
      method: "GET",
      headers: { "x-prospect-session": tokenB },
    });
    const fbResB = await getFeedback(fbReqB);
    const fbDataB = await fbResB.json();
    assert.equal(fbDataB.records.length, 0);
  });

  await t.test("5. Agent Runs Isolation: User B cannot see User A's search background tasks", async () => {
    // Verify DEMO mode is strictly rejected over HTTP API
    const demoReqA = new Request("http://localhost:3000/api/agent/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-prospect-session": tokenA,
      },
      body: JSON.stringify({
        query: "Alice Private Search",
        mode: "DEMO",
      }),
    });
    const demoResA = await postAgentRuns(demoReqA);
    assert.equal(demoResA.status, 422);

    // Enqueue a real LIVE background search task for User A cleanly without external HTTP flakiness
    await durableWorker.enqueue("ADAPTIVE_SEARCH", userAId, {
      query: "Alice Private Search",
      mode: "LIVE",
    });

    // User A sees their own queued run
    const runReqA = new Request("http://localhost:3000/api/agent/runs", {
      method: "GET",
      headers: { "x-prospect-session": tokenA },
    });
    const runResA = await getAgentRuns(runReqA);
    assert.equal(runResA.status, 200);
    const runDataA = await runResA.json();
    assert.ok(runDataA.runs.some((r: any) => r.query === "Alice Private Search"));

    // User B fetches agent runs -> does not see Alice's run
    const runReqB = new Request("http://localhost:3000/api/agent/runs", {
      method: "GET",
      headers: { "x-prospect-session": tokenB },
    });
    const runResB = await getAgentRuns(runReqB);
    const runDataB = await runResB.json();
    const foundAliceRun = runDataB.runs.find((r: any) => r.query === "Alice Private Search");
    assert.equal(foundAliceRun, undefined);
  });
});
