import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateOpportunity, classifyOpportunitySeniority } from "../lib/scoring-engine";
import { Opportunity, UserProfile } from "../types";

const studentProfile: UserProfile = {
  id: "profile_student_2026",
  fullName: "Alex Chen",
  email: "alex@university.edu",
  headline: "Computer Science Undergraduate | ML & Systems",
  university: "Stanford University",
  degree: "B.S.",
  major: "Computer Science",
  graduationYear: 2026,
  gpa: 3.9,
  location: "San Francisco, CA",
  skills: ["Python", "Machine Learning", "PyTorch", "SQL", "Docker", "Git"],
  targetRoles: ["Machine Learning Intern", "Software Engineering Intern"],
  preferredWorkModes: ["Hybrid", "Remote", "On-site"],
  preferredLocations: ["San Francisco, CA"],
  experiences: [
    {
      id: "exp_1",
      title: "Undergraduate ML Research Assistant",
      company: "Stanford AI Lab",
      duration: "May 2024 - Present",
      bullets: ["Trained vision models with PyTorch", "Benchmarked inference latency"],
      verified: true,
    },
  ],
  projects: [
    {
      id: "proj_1",
      name: "Distributed Image Classifier",
      description: "Trained PyTorch ResNet models with CUDA and Docker",
      techStack: ["Python", "PyTorch", "Docker"],
    },
  ],
  portfolioLinks: [],
  availability: "Summer 2025",
  stipendPreference: "Paid Only",
  constraints: "F-1 visa; CPT authorized",
  experienceLevel: "Internship / Early-Career",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("Priority 3 — Seniority Classification & Student Opportunity Relevance", async (t) => {
  await t.test("1. Engineering Manager, ML (Fraud) is classified as MANAGER and BLOCKED for student", () => {
    const opp: Opportunity = {
      id: "opp_eng_mgr",
      title: "Engineering Manager, ML (Fraud)",
      organization: "Stripe",
      category: "Entry-level", // Mistagged category at source
      description: "Manage a team of 8 machine learning engineers detecting high-velocity fraud using Python, PyTorch, and distributed streaming systems. Lead hiring, career progression, and performance reviews.",
      location: "San Francisco, CA",
      workMode: "Hybrid",
      compensation: "$220,000 - $280,000",
      eligibilityRequirements: ["5+ years of software engineering experience", "2+ years managing teams"],
      requiredSkills: ["Python", "Machine Learning", "PyTorch"],
      preferredSkills: ["Docker", "SQL"],
      applyUrl: "https://stripe.com/jobs/eng-mgr-fraud",
      sourceName: "Stripe Careers",
      sourceUrl: "https://stripe.com/jobs/eng-mgr-fraud",
      sourceConfidence: 1.0,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const classification = classifyOpportunitySeniority(opp);
    assert.equal(classification.level, "MANAGER");
    assert.equal(classification.isLeadershipOrSenior, true);

    const evaluation = evaluateOpportunity(opp, studentProfile);
    assert.equal(
      evaluation.recommendation,
      "SKIP",
      "Engineering Manager MUST be marked SKIP for a student profile"
    );
    assert.ok(
      evaluation.hardBlockers.some((b) => b.includes("Seniority Mismatch") && b.includes("MANAGER")),
      `Hard blockers must include Seniority Mismatch (MANAGER). Got: ${JSON.stringify(evaluation.hardBlockers)}`
    );
    assert.equal(
      evaluation.scoreBreakdown.eligibility,
      0,
      "Eligibility score must be 0 when hard blocker is present"
    );
    assert.ok(
      evaluation.overallScore <= 39,
      `Overall score must be capped below skip threshold (<= 39). Got: ${evaluation.overallScore}`
    );
  });

  await t.test("2. Director of AI Research is classified as DIRECTOR and BLOCKED for student", () => {
    const opp: Opportunity = {
      id: "opp_director_ai",
      title: "Director of AI Research",
      organization: "DeepMind",
      category: "Research",
      description: "Executive leadership role defining organizational research roadmap, managing multi-million dollar GPU budgets, and heading 30+ research scientists.",
      location: "San Francisco, CA",
      workMode: "On-site",
      compensation: "$350,000",
      eligibilityRequirements: ["10+ years in AI research", "Demonstrated research leadership"],
      requiredSkills: ["Python", "Machine Learning", "PyTorch"],
      preferredSkills: [],
      applyUrl: "https://deepmind.google/jobs/director-ai",
      sourceName: "Google DeepMind",
      sourceUrl: "https://deepmind.google/jobs/director-ai",
      sourceConfidence: 1.0,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const classification = classifyOpportunitySeniority(opp);
    assert.equal(classification.level, "DIRECTOR");
    assert.equal(classification.isLeadershipOrSenior, true);

    const evaluation = evaluateOpportunity(opp, studentProfile);
    assert.equal(evaluation.recommendation, "SKIP");
    assert.ok(evaluation.hardBlockers.some((b) => b.includes("DIRECTOR")));
    assert.ok(evaluation.overallScore <= 39);
  });

  await t.test("3. Staff Distributed Systems Engineer is classified as STAFF and BLOCKED", () => {
    const opp: Opportunity = {
      id: "opp_staff_swe",
      title: "Staff Distributed Systems Engineer",
      organization: "Snowflake",
      category: "Entry-level",
      description: "Architect core database query planner with 8+ years experience required.",
      location: "San Francisco, CA",
      workMode: "Hybrid",
      compensation: "$240,000",
      eligibilityRequirements: ["8+ years industry experience"],
      requiredSkills: ["Python", "SQL", "Docker"],
      preferredSkills: [],
      applyUrl: "https://snowflake.com/jobs/staff-swe",
      sourceName: "Snowflake Careers",
      sourceUrl: "https://snowflake.com/jobs/staff-swe",
      sourceConfidence: 1.0,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const classification = classifyOpportunitySeniority(opp);
    assert.equal(classification.level, "STAFF");
    assert.equal(classification.isLeadershipOrSenior, true);

    const evaluation = evaluateOpportunity(opp, studentProfile);
    assert.equal(evaluation.recommendation, "SKIP");
    assert.ok(evaluation.hardBlockers.some((b) => b.includes("STAFF")));
    assert.ok(evaluation.overallScore <= 39);
  });

  await t.test("4. Senior ML Engineer with 5+ years is classified as SENIOR and BLOCKED for student", () => {
    const opp: Opportunity = {
      id: "opp_sr_ml",
      title: "Senior ML Engineer",
      organization: "Anthropic",
      category: "Entry-level",
      description: "Scale frontier training clusters. 5+ years of full-time experience in production ML systems.",
      location: "San Francisco, CA",
      workMode: "Hybrid",
      compensation: "$210,000",
      eligibilityRequirements: ["5+ years of full-time software engineering experience"],
      requiredSkills: ["Python", "PyTorch", "Docker"],
      preferredSkills: [],
      applyUrl: "https://anthropic.com/jobs/sr-ml",
      sourceName: "Anthropic Careers",
      sourceUrl: "https://anthropic.com/jobs/sr-ml",
      sourceConfidence: 1.0,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const classification = classifyOpportunitySeniority(opp);
    assert.equal(classification.level, "SENIOR");
    assert.equal(classification.isLeadershipOrSenior, true);

    const evaluation = evaluateOpportunity(opp, studentProfile);
    assert.equal(evaluation.recommendation, "SKIP");
    assert.ok(evaluation.hardBlockers.some((b) => b.includes("SENIOR")));
    assert.ok(evaluation.overallScore <= 39);
  });

  await t.test("5. Machine Learning Intern is classified as INTERN and receives APPLY_NOW", () => {
    const opp: Opportunity = {
      id: "opp_ml_intern",
      title: "Machine Learning Research Intern",
      organization: "OpenAI",
      category: "Internship",
      description: "Work alongside research scientists training large-scale multimodal models with PyTorch and Python. Designed for undergraduate and graduate students graduating in 2026 or 2027.",
      location: "San Francisco, CA",
      workMode: "Hybrid",
      compensation: "$65/hour",
      eligibilityRequirements: [
        "Currently enrolled in a degree program graduating in 2026 or 2027",
        "Authorized to work in US via CPT or OPT",
      ],
      requiredSkills: ["Python", "PyTorch", "Machine Learning"],
      preferredSkills: ["Docker"],
      applyUrl: "https://openai.com/careers/ml-intern",
      sourceName: "OpenAI Careers",
      sourceUrl: "https://openai.com/careers/ml-intern",
      sourceConfidence: 1.0,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [
        {
          claim: "Official OpenAI Careers Listing",
          excerpt: "OpenAI is hiring Machine Learning Research Interns for Summer 2025.",
          url: "https://openai.com/careers/ml-intern",
          observedAt: new Date().toISOString(),
          verified: true,
        },
      ],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const classification = classifyOpportunitySeniority(opp);
    assert.equal(classification.level, "INTERN");
    assert.equal(classification.isLeadershipOrSenior, false);

    const evaluation = evaluateOpportunity(opp, studentProfile);
    assert.equal(
      evaluation.recommendation,
      "APPLY_NOW",
      `ML Intern should receive APPLY_NOW. Rationale: ${evaluation.rationale}`
    );
    assert.ok(
      evaluation.overallScore >= 75,
      `Expected overallScore >= 75, got ${evaluation.overallScore}`
    );
    assert.equal(evaluation.hardBlockers.length, 0);
  });

  await t.test("6. New Grad Software Engineer is classified as NEW_GRAD and is accessible", () => {
    const opp: Opportunity = {
      id: "opp_new_grad",
      title: "New Grad Software Engineer (Class of 2026)",
      organization: "Figma",
      category: "Entry-level",
      description: "Full-time role for students graduating in 2026.",
      location: "San Francisco, CA",
      workMode: "Hybrid",
      compensation: "$145,000",
      eligibilityRequirements: ["Graduating in 2026 with a degree in Computer Science"],
      requiredSkills: ["Python", "Docker"],
      preferredSkills: [],
      applyUrl: "https://figma.com/jobs/new-grad-2026",
      sourceName: "Figma Careers",
      sourceUrl: "https://figma.com/jobs/new-grad-2026",
      sourceConfidence: 1.0,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const classification = classifyOpportunitySeniority(opp);
    assert.equal(classification.level, "NEW_GRAD");
    assert.equal(classification.isLeadershipOrSenior, false);

    const evaluation = evaluateOpportunity(opp, studentProfile);
    assert.notEqual(evaluation.recommendation, "SKIP");
    assert.equal(evaluation.hardBlockers.length, 0);
  });
});
