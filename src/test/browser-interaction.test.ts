import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { createSessionToken, verifySessionToken, isSessionTokenRevoked } from "../lib/auth";
import { POST as profilePostHandler, GET as profileGetHandler } from "../app/api/profile/route";
import { POST as outlookPostHandler, GET as outlookGetHandler } from "../app/api/career-outlook/route";
import { GET as opportunitiesGetHandler } from "../app/api/opportunities/route";
import { POST as trackerPostHandler, GET as trackerGetHandler, PATCH as trackerPatchHandler } from "../app/api/tracker/route";
import { POST as prepPostHandler, GET as prepGetHandler, PATCH as prepPatchHandler } from "../app/api/preparation-plans/route";
import { POST as logoutPostHandler } from "../app/api/auth/logout/route";

test("Priority 6 — Interactive Functional Verification with Backend Persistence", async (t) => {
  const interactiveUserId = `user_interactive_${Date.now()}`;
  const sessionToken = createSessionToken({
    userId: interactiveUserId,
    email: `student_${Date.now()}@university.edu`,
    role: "STUDENT",
  });

  const headers = {
    authorization: `Bearer ${sessionToken}`,
    "Content-Type": "application/json",
  };
  let opportunityId = "";

  t.after(async () => {
    try {
      await prisma.applicationEvent.deleteMany({ where: { application: { userId: interactiveUserId } } });
      await prisma.application.deleteMany({ where: { userId: interactiveUserId } });
      await prisma.preparationPlan.deleteMany({ where: { userId: interactiveUserId } });
      await prisma.userProfile.deleteMany({ where: { userId: interactiveUserId } });
      if (opportunityId) {
        await prisma.opportunity.deleteMany({ where: { id: opportunityId } });
      }
    } catch {}
  });

  await t.test("1. Profile Confirmation & Verification", async () => {
    const profilePayload = {
      fullName: "Kiran Patel",
      email: "kiran.patel@georgiatech.edu",
      headline: "Robotics & ML Systems Student",
      university: "Georgia Tech",
      degree: "B.S.",
      major: "Computer Science",
      graduationYear: 2026,
      gpa: 3.85,
      location: "Atlanta, GA",
      skills: ["Python", "C++", "ROS", "PyTorch", "Linux"],
      targetRoles: ["Robotics Software Engineer"],
      preferredWorkModes: ["Hybrid", "On-site"],
      preferredLocations: ["Atlanta, GA", "San Francisco, CA"],
      experiences: [
        {
          id: "exp_gt",
          title: "Robotics Lab Research Assistant",
          company: "Georgia Tech Robotics Institute",
          duration: "2024 - Present",
          bullets: ["Programmed ROS navigation nodes in C++ and Python"],
          verified: true,
        },
      ],
      projects: [
        {
          id: "proj_slam",
          name: "Visual SLAM Pipeline",
          description: "Real-time stereo visual SLAM in C++ and OpenCV",
          techStack: ["C++", "ROS", "OpenCV"],
        },
      ],
      portfolioLinks: [],
      availability: "Summer 2025",
      stipendPreference: "Paid Only",
      constraints: "US Citizen",
      experienceLevel: "Internship / Early-Career",
      factProvenance: {
        skills: { source: "user-confirmed", updatedAt: new Date().toISOString() },
      },
    };

    const res = await profilePostHandler(
      new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers,
        body: JSON.stringify(profilePayload),
      })
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.profile);
    assert.equal(data.profile.fullName, "Kiran Patel");

    // Verify database row
    const inDb = await prisma.userProfile.findFirst({
      where: { userId: interactiveUserId },
    });
    assert.ok(inDb);
    assert.equal(inDb.university, "Georgia Tech");
  });

  await t.test("2. Career Direction Selection & Custom Role Creation", async () => {
    // GET initial outlook
    const getRes = await outlookGetHandler(
      new Request("http://localhost:3000/api/career-outlook", { headers })
    );
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(getData.outlook.directions.length > 0);

    // POST selection: Toggle direction + Add custom role
    const postRes = await outlookPostHandler(
      new Request("http://localhost:3000/api/career-outlook", {
        method: "POST",
        headers,
        body: JSON.stringify({
          selectedDirections: ["Autonomous Systems Engineer"],
          customDirections: ["Autonomous Aerial Robotics Researcher"],
          excludedDirections: ["Sales Engineer"],
        }),
      })
    );
    assert.equal(postRes.status, 200);

    // Verify backend persistence
    const updatedProfile = await prisma.userProfile.findFirst({
      where: { userId: interactiveUserId },
    });
    const targetRoles = JSON.parse(updatedProfile?.targetRoles || "[]");
    assert.ok(
      targetRoles.includes("Autonomous Aerial Robotics Researcher"),
      "Custom direction must be persisted in profile targetRoles"
    );
    const excluded = JSON.parse(updatedProfile?.excludedRoleFamilies || "[]");
    assert.ok(excluded.includes("Sales Engineer"));
  });

  await t.test("3. Search Initiation & Opportunity Retrieval", async () => {
    // Seed opportunity for candidate
    opportunityId = `opp_robotics_${Date.now()}`;
    await prisma.opportunity.create({
      data: {
        id: opportunityId,
        title: "Robotics Software Intern (Perception & Autonomy)",
        organization: "Boston Dynamics",
        category: "Internship",
        roleFamily: "Autonomous Systems",
        seniority: "Intern / Early-Career",
        description: "Develop perception and planning algorithms for autonomous legged robots using C++ and Python.",
        location: "Waltham, MA",
        workMode: "On-site",
        compensation: "$55/hour",
        eligibilityRequirements: JSON.stringify(["Class of 2026 or 2027"]),
        requiredSkills: JSON.stringify(["C++", "Python", "ROS"]),
        preferredSkills: JSON.stringify(["PyTorch"]),
        applyUrl: "https://bostondynamics.com/careers/robotics-intern",
        sourceName: "Boston Dynamics Careers",
        sourceUrl: "https://bostondynamics.com/careers/robotics-intern",
        sourceConfidence: 1.0,
        verificationStatus: "VERIFIED_SOURCE",
        sourceEvidence: JSON.stringify([
          {
            claim: "Active Robotics Internship",
            excerpt: "Hiring Summer 2025 perception interns.",
            url: "https://bostondynamics.com/careers/robotics-intern",
            observedAt: new Date().toISOString(),
            verified: true,
          },
        ]),
        isExpired: false,
        isDemo: false,
      },
    });

    const res = await opportunitiesGetHandler(
      new Request("http://localhost:3000/api/opportunities?mode=LIVE", { headers })
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    const found = data.opportunities.find((o: any) => o.opportunity.id === opportunityId);
    assert.ok(found, "Discovered opportunity must be returned");
    assert.equal(found.opportunity.organization, "Boston Dynamics");
    assert.equal(found.evaluation.recommendation, "APPLY_NOW");
  });

  let applicationId = "";

  await t.test("4. Opportunity Save to Tracker & Employer Dismissal", async () => {
    // Save to tracker
    const saveRes = await trackerPostHandler(
      new Request("http://localhost:3000/api/tracker", {
        method: "POST",
        headers,
        body: JSON.stringify({
          opportunityId,
          stage: "SAVED",
          plannedNextAction: "Polish C++ visual SLAM project bullet points",
        }),
      })
    );
    assert.equal(saveRes.status, 200);
    const saveData = await saveRes.json();
    assert.ok(saveData.application.id);
    applicationId = saveData.application.id;

    // Verify persisted in DB
    const appInDb = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    assert.equal(appInDb?.stage, "SAVED");

    // Hide employer test: hide "Unwanted Employer"
    const hideProfileRes = await profilePostHandler(
      new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fullName: "Kiran Patel",
          email: "kiran.patel@georgiatech.edu",
          university: "Georgia Tech",
          degree: "B.S.",
          major: "Computer Science",
          location: "Atlanta, GA",
          skills: ["Python", "C++"],
          hiddenEmployers: ["Unwanted Corp"],
        }),
      })
    );
    assert.equal(hideProfileRes.status, 200);

    const recheckedProfile = await prisma.userProfile.findFirst({
      where: { userId: interactiveUserId },
    });
    const hidden = JSON.parse(recheckedProfile?.hiddenEmployers || "[]");
    assert.ok(hidden.includes("Unwanted Corp"));
  });

  await t.test("5. Preparation Task Checkbox Toggle & DB Persistence", async () => {
    // Create preparation plan
    const createRes = await prepPostHandler(
      new Request("http://localhost:3000/api/preparation-plans", {
        method: "POST",
        headers,
        body: JSON.stringify({ opportunityId }),
      })
    );
    assert.equal(createRes.status, 200);
    const createData = await createRes.json();
    const planId = createData.preparationPlan.id;
    const items = createData.preparationPlan.items;
    assert.ok(items.length > 0);
    const targetItem = items[0];

    // Toggle checkbox: set isCompleted to true
    const patchRes = await prepPatchHandler(
      new Request("http://localhost:3000/api/preparation-plans", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          planId,
          itemId: targetItem.id,
          isCompleted: true,
        }),
      })
    );
    assert.equal(patchRes.status, 200);

    // Verify directly in DB
    const planInDb = await prisma.preparationPlan.findUnique({
      where: { id: planId },
    });
    assert.ok(planInDb);
    const parsedItems = JSON.parse(planInDb.items);
    assert.equal(parsedItems[0].isCompleted, true, "Checkbox state must persist in DB");
  });

  await t.test("6. Tracker Stage Progression (SAVED -> APPLIED)", async () => {
    const patchRes = await trackerPatchHandler(
      new Request("http://localhost:3000/api/tracker", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: applicationId,
          stage: "APPLIED",
          notes: "Submitted tailored application through Boston Dynamics careers portal",
        }),
      })
    );
    assert.equal(patchRes.status, 200);

    // Verify stage in DB
    const appInDb = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { events: true },
    });
    assert.equal(appInDb?.stage, "APPLIED");
    assert.equal(appInDb?.events.length, 2);
    assert.equal(appInDb?.events[1].toStage, "APPLIED");
    assert.equal(appInDb?.events[1].fromStage, "SAVED");
  });

  await t.test("7. Logout & Permanent Session Revocation", async () => {
    const verifiedBefore = verifySessionToken(sessionToken);
    assert.ok(verifiedBefore);

    // Call logout endpoint
    const logoutRes = await logoutPostHandler(
      new Request("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers,
      })
    );
    assert.equal(logoutRes.status, 200);

    // Verify token is revoked and unusable
    assert.equal(isSessionTokenRevoked(verifiedBefore.tokenId), true);
    assert.equal(verifySessionToken(sessionToken), null);

    // Submitting requests with revoked token should now fail resolution
    const rejectedReq = new Request("http://localhost:3000/api/profile", {
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    });
    const getRes = await profileGetHandler(rejectedReq);
    // In dev fallback, unauthenticated gets "default" profile, not the revoked user's profile
    const getData = await getRes.json();
    if (getData.profile) {
      assert.notEqual(getData.profile.userId, interactiveUserId, "Revoked token must not access user profile");
    }
  });
});
