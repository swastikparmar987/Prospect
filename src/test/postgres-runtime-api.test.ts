import { test } from "node:test";
import assert from "node:assert/strict";

// Configure PostgreSQL environment before loading db module
process.env.DATABASE_URL =
  process.env.POSTGRES_TEST_URL ||
  "postgresql://prospect_admin:prospect_staging_pass_2026@localhost:5433/prospect_staging_db?schema=public";

import { prisma } from "../lib/db";
import { createSessionToken } from "../lib/auth";
import { DurableWorkerEngine } from "../lib/agent/durable-worker";
import { GET as profileGetHandler, POST as profilePostHandler } from "../app/api/profile/route";
import { GET as outlookGetHandler, POST as outlookPostHandler } from "../app/api/career-outlook/route";
import { GET as opportunitiesGetHandler } from "../app/api/opportunities/route";
import { GET as trackerGetHandler, POST as trackerPostHandler, PATCH as trackerPatchHandler } from "../app/api/tracker/route";
import { GET as prepPlansGetHandler, POST as prepPlansPostHandler, PATCH as prepPlansPatchHandler } from "../app/api/preparation-plans/route";
import { GET as agentRunsGetHandler, POST as agentRunsPostHandler } from "../app/api/agent/runs/route";

test("Priority 1 — Comprehensive PostgreSQL Runtime API & Workflow Verification", async (t) => {
  const testUserId = `pg_runtime_user_${Date.now()}`;
  const token = createSessionToken({ userId: testUserId, email: `${testUserId}@prospect.ai` });
  const authHeaders = {
    authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let testOpportunityId = "";

  t.after(async () => {
    try {
      await prisma.applicationEvent.deleteMany({ where: { application: { userId: testUserId } } });
      await prisma.application.deleteMany({ where: { userId: testUserId } });
      await prisma.preparationPlan.deleteMany({ where: { userId: testUserId } });
      await prisma.agentStep.deleteMany({ where: { run: { userId: testUserId } } });
      await prisma.agentRun.deleteMany({ where: { userId: testUserId } });
      await prisma.durableTask.deleteMany({ where: { userId: testUserId } });
      await prisma.userProfile.deleteMany({ where: { userId: testUserId } });
      if (testOpportunityId) {
        await prisma.opportunity.deleteMany({ where: { id: testOpportunityId } });
      }
    } catch {}
  });

  await t.test("1. Profile POST and GET through Next.js API Handlers on PostgreSQL", async () => {
    const profilePayload = {
      fullName: "Maya Lin",
      email: "maya.lin@berkeley.edu",
      headline: "AI & Distributed Systems Researcher",
      university: "UC Berkeley",
      degree: "B.S.",
      major: "EECS",
      graduationYear: 2026,
      gpa: 3.95,
      location: "Berkeley, CA",
      skills: ["Python", "PyTorch", "Rust", "Distributed Systems", "SQL"],
      targetRoles: ["Machine Learning Engineer", "Systems Engineer"],
      preferredWorkModes: ["Hybrid", "Remote"],
      preferredLocations: ["San Francisco, CA", "Seattle, WA"],
      experiences: [
        {
          id: "exp_1",
          title: "Undergraduate Systems Researcher",
          company: "Sky Computing Lab",
          duration: "2024 - Present",
          bullets: ["Engineered distributed tensor parallelism scheduler"],
          verified: true,
        },
      ],
      projects: [
        {
          id: "proj_1",
          name: "Async KV Store",
          description: "Raft consensus KV store in Rust",
          techStack: ["Rust", "Tokio"],
        },
      ],
      portfolioLinks: [{ label: "GitHub", url: "https://github.com/mayalin" }],
      availability: "Summer 2025",
      stipendPreference: "Paid Only",
      constraints: "US Citizen; No visa sponsorship required",
      experienceLevel: "Internship / Early-Career",
      factProvenance: {
        skills: { source: "user-confirmed", updatedAt: new Date().toISOString() },
      },
    };

    // POST /api/profile
    const postReq = new Request("http://localhost:3000/api/profile", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(profilePayload),
    });

    const postRes = await profilePostHandler(postReq);
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.ok(postData.profile);
    assert.equal(postData.profile.fullName, "Maya Lin");

    // Verify row directly in PostgreSQL table
    const pgRecord = await prisma.userProfile.findFirst({
      where: { userId: testUserId },
    });
    assert.ok(pgRecord, "Profile must be persisted in PostgreSQL userProfile table");
    assert.equal(pgRecord.university, "UC Berkeley");
    assert.equal(pgRecord.graduationYear, 2026);

    // GET /api/profile
    const getReq = new Request("http://localhost:3000/api/profile", {
      headers: authHeaders,
    });
    const getRes = await profileGetHandler(getReq);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(getData.profile);
    assert.equal(getData.profile.fullName, "Maya Lin");
    assert.ok(getData.profile.capabilityMap, "Should hydrate capability map");
  });

  await t.test("2. Career Outlook GET and POST on PostgreSQL", async () => {
    // GET /api/career-outlook
    const getReq = new Request("http://localhost:3000/api/career-outlook", {
      headers: authHeaders,
    });
    const getRes = await outlookGetHandler(getReq);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    assert.ok(getData.outlook.directions.length > 0, "Should generate career directions");

    // POST /api/career-outlook (Save selected directions)
    const postReq = new Request("http://localhost:3000/api/career-outlook", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        selectedDirections: ["Machine Learning Engineer", "Distributed Systems Engineer"],
        customDirections: ["AI Infrastructure Engineer"],
      }),
    });
    const postRes = await outlookPostHandler(postReq);
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.equal(postData.success, true);

    // Verify update persisted in PostgreSQL
    const recheck = await prisma.userProfile.findFirst({
      where: { userId: testUserId },
    });
    const targetRoles = JSON.parse(recheck?.targetRoles || "[]");
    assert.ok(targetRoles.includes("AI Infrastructure Engineer"));
  });

  await t.test("3. Opportunity Retrieval & Filtering on PostgreSQL", async () => {
    // Insert a verified opportunity into PostgreSQL
    testOpportunityId = `opp_pg_${Date.now()}`;
    const opp = await prisma.opportunity.create({
      data: {
        id: testOpportunityId,
        title: "Distributed Systems Engineering Intern",
        organization: "Databricks",
        category: "Internship",
        roleFamily: "Systems & Infrastructure",
        seniority: "Intern / Early-Career",
        description: "Build high-throughput storage engines for Apache Spark using Rust and Python.",
        location: "San Francisco, CA",
        workMode: "Hybrid",
        compensation: "$65/hour",
        eligibilityRequirements: JSON.stringify(["Class of 2026 or 2027"]),
        requiredSkills: JSON.stringify(["Python", "Rust", "Distributed Systems"]),
        preferredSkills: JSON.stringify(["SQL"]),
        applyUrl: "https://databricks.com/jobs/intern-systems",
        sourceName: "Databricks Careers",
        sourceUrl: "https://databricks.com/jobs/intern-systems",
        sourceConfidence: 1.0,
        verificationStatus: "VERIFIED_SOURCE",
        sourceEvidence: JSON.stringify([
          {
            claim: "Databricks Systems Intern",
            excerpt: "Hiring Summer 2025 systems interns.",
            url: "https://databricks.com/jobs/intern-systems",
            observedAt: new Date().toISOString(),
            verified: true,
          },
        ]),
        isExpired: false,
        isDemo: false,
      },
    });
    assert.ok(opp.id);

    // Query via GET /api/opportunities?mode=LIVE
    const req = new Request("http://localhost:3000/api/opportunities?mode=LIVE", {
      headers: authHeaders,
    });
    const res = await opportunitiesGetHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.totalCount > 0);
    const found = data.opportunities.find((o: any) => o.opportunity.id === testOpportunityId);
    assert.ok(found, "Opportunity should be retrieved from PostgreSQL");
    assert.equal(found.opportunity.organization, "Databricks");
  });

  let testApplicationId = "";

  await t.test("4. Application Tracker Workflows on PostgreSQL", async () => {
    // POST /api/tracker (Save opportunity)
    const postReq = new Request("http://localhost:3000/api/tracker", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        opportunityId: testOpportunityId,
        stage: "SAVED",
        plannedNextAction: "Review distributed systems resume bullet points",
      }),
    });
    const postRes = await trackerPostHandler(postReq);
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.ok(postData.application.id);
    testApplicationId = postData.application.id;

    // Verify in PostgreSQL
    const inDb = await prisma.application.findUnique({
      where: { id: testApplicationId },
      include: { events: true },
    });
    assert.ok(inDb);
    assert.equal(inDb.stage, "SAVED");
    assert.ok(inDb.events.length > 0, "Should generate initial ApplicationEvent");

    // PATCH /api/tracker (Advance stage from SAVED -> APPLIED)
    const patchReq = new Request("http://localhost:3000/api/tracker", {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        id: testApplicationId,
        stage: "APPLIED",
        notes: "Submitted application via Databricks careers site",
      }),
    });
    const patchRes = await trackerPatchHandler(patchReq);
    assert.equal(patchRes.status, 200);

    // Verify stage updated in PostgreSQL
    const updated = await prisma.application.findUnique({
      where: { id: testApplicationId },
      include: { events: true },
    });
    assert.equal(updated?.stage, "APPLIED");
    assert.equal(updated?.events.length, 2, "Should have 2 timeline events");
  });

  await t.test("5. Preparation Plans Workflow on PostgreSQL", async () => {
    // POST /api/preparation-plans (Create plan)
    const postReq = new Request("http://localhost:3000/api/preparation-plans", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        opportunityId: testOpportunityId,
      }),
    });
    const postRes = await prepPlansPostHandler(postReq);
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.ok(postData.preparationPlan?.id);
    const planId = postData.preparationPlan.id;

    // PATCH /api/preparation-plans (Complete a prep checklist item)
    const items = postData.preparationPlan.items;
    assert.ok(items.length > 0);
    const firstItemId = items[0].id;

    const patchReq = new Request("http://localhost:3000/api/preparation-plans", {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        planId,
        itemId: firstItemId,
        isCompleted: true,
      }),
    });
    const patchRes = await prepPlansPatchHandler(patchReq);
    assert.equal(patchRes.status, 200);

    // Verify in PostgreSQL
    const planInDb = await prisma.preparationPlan.findUnique({
      where: { id: planId },
    });
    assert.ok(planInDb);
    const parsedItems = JSON.parse(planInDb.items);
    assert.equal(parsedItems[0].isCompleted, true);
  });

  await t.test("6. DurableTask Enqueue & Process Recovery on PostgreSQL", async () => {
    const worker = new DurableWorkerEngine(`pg-test-worker-${Date.now()}`);

    // Enqueue task
    const task = await worker.enqueue(
      "ADAPTIVE_SEARCH",
      testUserId,
      { query: "Systems Intern", mode: "LIVE" },
      `idemp_pg_${Date.now()}`
    );
    assert.ok(task.id);

    // Verify task row in PostgreSQL DurableTask table
    const dbTask = await prisma.durableTask.findUnique({
      where: { id: task.id },
    });
    assert.ok(dbTask, "DurableTask must exist in PostgreSQL table");
    assert.equal(dbTask.status, "QUEUED");
    assert.equal(dbTask.userId, testUserId);

    // Claim task
    const claimed = await worker.claimNextTask(testUserId);
    assert.ok(claimed);
    assert.equal(claimed.id, task.id);
    assert.equal(claimed.status, "RUNNING");

    // Heartbeat & checkpoint
    await worker.heartbeat(claimed.id, 50, "ROUND_1_SEARCH", {
      roundsCompleted: 1,
      candidatesFound: 5,
    });

    const checkpointed = await prisma.durableTask.findUnique({
      where: { id: task.id },
    });
    assert.equal(checkpointed?.currentStep, "ROUND_1_SEARCH");
    const cpData = JSON.parse(checkpointed?.checkpointJson || "{}");
    assert.equal(cpData.roundsCompleted, 1);

    // Complete task
    await worker.completeTask(claimed.id, "Successfully discovered 5 systems opportunities.");

    const completed = await prisma.durableTask.findUnique({
      where: { id: task.id },
    });
    assert.equal(completed?.status, "COMPLETED");
    assert.equal(completed?.resultSummary, "Successfully discovered 5 systems opportunities.");
  });
});
