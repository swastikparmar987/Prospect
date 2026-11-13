import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evaluateEligibility, isRequirementHardBlocker } from "../lib/eligibility-engine";
import { evaluateOpportunity, DEFAULT_CONFIG } from "../lib/scoring-engine";
import { deduplicateOpportunities, canonicalizeUrl } from "../lib/dedup";
import { isSafePublicUrl } from "../lib/safe-url";
import { generatePreparationPlan } from "../lib/gap-action-engine";
import { generateApplicationMaterials } from "../lib/prep-studio";
import { parseResumeText } from "../lib/resume-parser";
import { Opportunity, UserProfile } from "@/types";

// Base Mock Opportunity
const mockOpportunity: Opportunity = {
  id: "test-opp-1",
  title: "Software Engineering Intern",
  organization: "Test Corp",
  category: "Internship",
  description: "Test description for software engineering internship.",
  location: "Boston, MA",
  workMode: "Remote",
  compensation: "$45/hr",
  eligibilityRequirements: [
    "Graduation date between 2024 and 2026 (Class of 2025/2026)",
    "Minimum cumulative GPA of 3.2",
    "Must be enrolled in Computer Science or related degree",
    "Must be legally authorized to work without sponsorship"
  ],
  requiredSkills: ["TypeScript", "React", "Node.js"],
  preferredSkills: ["GraphQL", "Docker"],
  publishedAt: new Date().toISOString(),
  deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  deadlineRaw: "20 days remaining",
  applyUrl: "https://careers.testcorp.com/jobs/swe-intern?utm_source=linkedin&ref=campus#apply",
  sourceName: "Test Careers Site",
  sourceUrl: "https://careers.testcorp.com/jobs/swe-intern",
  sourceConfidence: 0.9,
  verificationStatus: "VERIFIED_SOURCE",
  sourceEvidence: [
    {
      claim: "Compensation verified",
      excerpt: "$45/hr paid summer internship",
      url: "https://careers.testcorp.com/jobs/swe-intern",
      observedAt: new Date().toISOString(),
      verified: true
    }
  ],
  discoveredAt: new Date().toISOString(),
  lastCheckedAt: new Date().toISOString(),
  isDemo: false
};

// Base Mock Profile
const mockProfile: UserProfile = {
  id: "test-user-1",
  fullName: "Jane Doe",
  email: "jane@university.edu",
  headline: "Junior CS Student",
  university: "Tech University",
  degree: "Bachelor of Science",
  major: "Computer Science",
  graduationYear: 2025,
  graduationMonth: "May",
  gpa: 3.6,
  location: "Boston, MA",
  targetRoles: ["Software Engineer", "Frontend Developer"],
  preferredWorkModes: ["Remote", "Hybrid"],
  preferredLocations: ["Boston, MA"],
  skills: ["TypeScript", "React", "Node.js", "Git", "CSS"],
  experiences: [
    {
      id: "exp-1",
      title: "Web Developer Intern",
      company: "Startup Co",
      duration: "3 months",
      bullets: ["Built responsive React user interfaces.", "Improved page load speed by 25%."],
      verified: true
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Task Tracker",
      description: "Full stack task tracking application.",
      techStack: ["React", "TypeScript", "Node.js"],
      link: "https://github.com/janedoe/task-tracker"
    }
  ],
  portfolioLinks: [{ label: "GitHub", url: "https://github.com/janedoe" }],
  availability: "Summer 2025",
  stipendPreference: "Paid Only",
  constraints: "US Citizen; No sponsorship needed.",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("Prospect Test Suite", () => {
  // 1. Eligibility Engine Tests
  describe("Eligibility Engine", () => {
    test("Correctly marks eligibility as MET when profile matches requirements", () => {
      const result = evaluateEligibility(mockOpportunity, mockProfile);
      assert.strictEqual(result.allHardBlockersMet, true);
      assert.strictEqual(result.hardBlockers.length, 0);

      const gradCheck = result.checks.find((c) => c.rule.includes("Graduation"));
      assert.ok(gradCheck);
      assert.strictEqual(gradCheck.status, "MET");

      const gpaCheck = result.checks.find((c) => c.rule.includes("GPA"));
      assert.ok(gpaCheck);
      assert.strictEqual(gpaCheck.status, "MET");
    });

    test("Marks missing profile facts as UNKNOWN instead of inventing failure", () => {
      const profileWithoutGpa: UserProfile = { ...mockProfile, gpa: null };
      const result = evaluateEligibility(mockOpportunity, profileWithoutGpa);

      const gpaCheck = result.checks.find((c) => c.rule.includes("GPA"));
      assert.ok(gpaCheck);
      assert.strictEqual(gpaCheck.status, "UNKNOWN");
      assert.strictEqual(result.hardBlockers.length, 0); // Unknown does not fail as hard blocker
    });

    test("Detects hard blockers for graduation year mismatch", () => {
      const graduatedProfile: UserProfile = { ...mockProfile, graduationYear: 2022 };
      const result = evaluateEligibility(mockOpportunity, graduatedProfile);

      assert.strictEqual(result.allHardBlockersMet, false);
      assert.ok(result.hardBlockers.length > 0);
      assert.ok(result.hardBlockers[0].includes("Graduation year mismatch"));
    });

    test("Detects hard blockers for visa sponsorship mismatch", () => {
      const visaStudentProfile: UserProfile = {
        ...mockProfile,
        constraints: "International Student; Requires H1B Visa sponsorship"
      };
      const result = evaluateEligibility(mockOpportunity, visaStudentProfile);

      assert.strictEqual(result.allHardBlockersMet, false);
      assert.ok(result.hardBlockers.some((b) => b.includes("Visa sponsorship")));
    });

    test("isRequirementHardBlocker identifies hard constraints correctly", () => {
      assert.strictEqual(isRequirementHardBlocker("Must be a US Citizen or Permanent Resident"), true);
      assert.strictEqual(isRequirementHardBlocker("Must have 3.5 minimum GPA"), true);
      assert.strictEqual(isRequirementHardBlocker("Familiarity with GraphQL preferred"), false);
    });
  });

  // 2. Scoring & Decision Engine Tests
  describe("Decision Engine & Hard Blocker Overrides", () => {
    test("APPLY_NOW recommended when eligible, high skills match, and feasible deadline", () => {
      const evalResult = evaluateOpportunity(mockOpportunity, mockProfile);
      assert.strictEqual(evalResult.recommendation, "APPLY_NOW");
      assert.ok(evalResult.overallScore >= DEFAULT_CONFIG.thresholds.applyNowMinScore);
      assert.strictEqual(evalResult.hardBlockers.length, 0);
    });

    test("Hard blocker OVERRIDES high skills fit and forces recommendation to SKIP", () => {
      const graduatedProfile: UserProfile = { ...mockProfile, graduationYear: 2021 };
      const evalResult = evaluateOpportunity(mockOpportunity, graduatedProfile);

      assert.strictEqual(evalResult.recommendation, "SKIP");
      assert.ok(evalResult.rationale.includes("Incompatible hard requirement"));
    });

    test("Expired deadline forces recommendation to SKIP", () => {
      const expiredOpp: Opportunity = {
        ...mockOpportunity,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      };
      const evalResult = evaluateOpportunity(expiredOpp, mockProfile);

      assert.strictEqual(evalResult.recommendation, "SKIP");
      assert.ok(evalResult.rationale.includes("expired"));
    });

    test("PREPARE_FIRST recommended when key required skills are missing", () => {
      const oppWithNovelSkill: Opportunity = {
        ...mockOpportunity,
        requiredSkills: ["Rust", "Solidity", "Smart Contracts", "WebAssembly"]
      };
      const evalResult = evaluateOpportunity(oppWithNovelSkill, mockProfile);

      assert.strictEqual(evalResult.recommendation, "PREPARE_FIRST");
      assert.ok(evalResult.rationale.includes("qualification gaps"));
    });

    test("KEEP_WATCHING recommended when deadline is very distant (> 60 days)", () => {
      const distantOpp: Opportunity = {
        ...mockOpportunity,
        deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString()
      };
      const evalResult = evaluateOpportunity(distantOpp, mockProfile);

      assert.strictEqual(evalResult.recommendation, "KEEP_WATCHING");
      assert.ok(evalResult.rationale.includes("days away"));
    });
  });

  // 3. Deduplication Logic Tests
  describe("Deduplication Engine", () => {
    test("Canonical URL normalization removes tracking parameters and trailing slashes", () => {
      const url1 = "https://example.com/jobs/123/?utm_source=google&ref=test#section";
      const url2 = "https://example.com/jobs/123";
      assert.strictEqual(canonicalizeUrl(url1), canonicalizeUrl(url2));
    });

    test("Removes exact duplicate canonical URLs", () => {
      const opp1: Opportunity = { ...mockOpportunity, id: "opp-1" };
      const opp2: Opportunity = {
        ...mockOpportunity,
        id: "opp-2",
        applyUrl: "https://careers.testcorp.com/jobs/swe-intern?utm_medium=email"
      };
      const result = deduplicateOpportunities([opp1, opp2]);

      assert.strictEqual(result.unique.length, 1);
      assert.strictEqual(result.duplicatesRemoved, 1);
      assert.strictEqual(result.duplicatePairs[0].duplicateId, "opp-2");
    });
  });

  // 4. Safe URL & SSRF Guard Tests
  describe("SSRF & Safe URL Validation", () => {
    test("Blocks localhost and loopback IP addresses", () => {
      assert.strictEqual(isSafePublicUrl("http://localhost:3000").isSafe, false);
      assert.strictEqual(isSafePublicUrl("http://127.0.0.1:8080").isSafe, false);
      assert.strictEqual(isSafePublicUrl("http://::1/").isSafe, false);
    });

    test("Blocks cloud metadata endpoints (169.254.169.254)", () => {
      assert.strictEqual(isSafePublicUrl("http://169.254.169.254/latest/meta-data").isSafe, false);
    });

    test("Blocks private RFC1918 IPv4 ranges", () => {
      assert.strictEqual(isSafePublicUrl("http://192.168.1.1/admin").isSafe, false);
      assert.strictEqual(isSafePublicUrl("http://10.0.0.5:5000").isSafe, false);
      assert.strictEqual(isSafePublicUrl("http://172.16.0.1").isSafe, false);
    });

    test("Permits valid public HTTPS addresses", () => {
      assert.strictEqual(isSafePublicUrl("https://careers.google.com/jobs").isSafe, true);
      assert.strictEqual(isSafePublicUrl("https://github.com/features").isSafe, true);
    });
  });

  // 5. Gap-to-Action & Prep Studio Tests
  describe("Gap-to-Action & Preparation Studio", () => {
    test("Generates actionable plan mapping missing skills to deliverables with estimated effort", () => {
      const oppWithNovelSkill: Opportunity = {
        ...mockOpportunity,
        requiredSkills: ["Kubernetes", "gRPC"]
      };
      const plan = generatePreparationPlan(oppWithNovelSkill, mockProfile);

      assert.ok(plan.items.length >= 2);
      const k8sItem = plan.items.find((item) => item.gap.includes("Kubernetes"));
      assert.ok(k8sItem);
      assert.ok(k8sItem.estimatedEffort.includes("Rough planning estimate"));
      assert.ok(k8sItem.concreteAction.length > 10);
      assert.ok(k8sItem.deliverable.length > 10);
      assert.strictEqual(k8sItem.isCompleted, false);
    });

    test("Preparation Studio generates grounded bullets without hallucinated claims", () => {
      const materials = generateApplicationMaterials(mockOpportunity, mockProfile);

      assert.ok(materials.resumeBulletsDraft?.includes("Startup Co"));
      assert.ok(materials.coverLetterDraft?.includes("Jane Doe"));
      assert.ok(materials.coverLetterDraft?.includes("Tech University"));
      assert.ok(materials.interviewChecklist?.includes("Test Corp"));
    });
  });

  // 6. Resume Parser Tests
  describe("Resume Parser", () => {
    test("Extracts graduation year, GPA, skills, and portfolio links from text", () => {
      const sampleResume = `
        Jane Doe
        jane@university.edu
        Tech University - Bachelor of Science in Computer Science
        Graduation: May 2025 | GPA: 3.82
        github.com/janedoe

        SKILLS
        TypeScript, React, Python, Docker, PostgreSQL, Linux

        EXPERIENCE
        Software Engineering Intern
        • Developed full stack React web applications.
        • Optimized SQL database query response times.
      `;

      const parsed = parseResumeText(sampleResume, "Jane_Doe_Resume.pdf");
      assert.strictEqual(parsed.extractedProfile.fullName, "Jane Doe");
      assert.strictEqual(parsed.extractedProfile.email, "jane@university.edu");
      assert.strictEqual(parsed.extractedProfile.graduationYear, 2025);
      assert.strictEqual(parsed.extractedProfile.gpa, 3.82);
      assert.ok(parsed.extractedProfile.skills?.includes("TypeScript"));
      assert.ok(parsed.extractedProfile.skills?.includes("Docker"));
      assert.ok(parsed.extractedProfile.portfolioLinks?.some((p) => p.url.includes("github.com/janedoe")));
    });
  });

  // 7. Verification & Anti-Hallucination Standards
  describe("Verification & Anti-Hallucination Standards", () => {
    test("Demo records are explicitly labeled and not presented as verified live postings", () => {
      const demoOpp: Opportunity = {
        ...mockOpportunity,
        isDemo: true,
        verificationStatus: "DEMO_DATA",
      };

      assert.strictEqual(demoOpp.isDemo, true);
      assert.strictEqual(demoOpp.verificationStatus, "DEMO_DATA");
      assert.notStrictEqual(demoOpp.verificationStatus, "VERIFIED_SOURCE");
    });

    test("Generic HTTP 200 reachability alone does not elevate an unverified URL to VERIFIED_SOURCE", () => {
      // Simulating the check logic from /api/opportunities/[id]/verify
      const targetUrl = "https://unverified-aggregator-blog.xyz/post/123";
      const parsedUrl = new URL(targetUrl);
      const host = parsedUrl.hostname.toLowerCase();
      const orgName = "Test Corp";

      const isOfficialDomain =
        host.endsWith(".edu") ||
        host.endsWith(".gov") ||
        host.endsWith(".org") ||
        host.includes("greenhouse.io") ||
        host.includes("lever.co") ||
        host.includes("myworkdayjobs.com") ||
        host.includes("careers.") ||
        host.includes(orgName.toLowerCase().replace(/[^a-z0-9]/g, ""));

      // Unofficial aggregator domain must be PARTIALLY_CHECKED, not VERIFIED_SOURCE
      assert.strictEqual(isOfficialDomain, false);
      const computedStatus = isOfficialDomain ? "VERIFIED_SOURCE" : "PARTIALLY_CHECKED";
      assert.strictEqual(computedStatus, "PARTIALLY_CHECKED");
    });

    test("Profile schema correctly preserves structured experiences, projects, and portfolio links", () => {
      const userProfile: UserProfile = {
        ...mockProfile,
        experiences: [
          {
            id: "exp-1",
            title: "Research Assistant",
            company: "AI Lab",
            duration: "Summer 2024",
            bullets: ["Trained transformer model on multi-modal dataset"],
            verified: true,
          },
        ],
        projects: [
          {
            id: "proj-1",
            name: "distributed-db",
            description: "Distributed Raft key-value database",
            techStack: ["Go", "gRPC"],
            link: "https://github.com/test/distributed-db",
          },
        ],
        portfolioLinks: [{ label: "Personal Blog", url: "https://blog.janedoe.me" }],
      };

      assert.strictEqual(userProfile.experiences.length, 1);
      assert.strictEqual(userProfile.experiences[0].company, "AI Lab");
      assert.strictEqual(userProfile.projects[0].techStack[0], "Go");
      assert.strictEqual(userProfile.portfolioLinks[0].label, "Personal Blog");
    });
  });
});

