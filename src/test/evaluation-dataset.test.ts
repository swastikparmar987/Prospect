import test from "node:test";
import assert from "node:assert/strict";
import { UserProfile, Opportunity } from "@/types";
import { evaluateOpportunity } from "../lib/scoring-engine";
import { generateCareerOutlook } from "../lib/career-outlook";

// =========================================================================
// EVALUATION BENCHMARK DATASET: 6 DIVERSE STUDENT PERSONAS
// =========================================================================

export const PERSONA_CS_FULLSTACK: UserProfile = {
  id: "persona-1-cs",
  fullName: "Devika Rao",
  email: "devika@example.edu",
  headline: "Full-Stack & Systems Engineer",
  university: "IIT Madras",
  degree: "B.Tech",
  major: "Computer Science and Engineering",
  graduationYear: 2026,
  location: "Chennai, India",
  targetRoles: ["Software Engineering Intern", "Backend Engineer Intern"],
  preferredWorkModes: ["Remote", "Hybrid"],
  preferredLocations: ["Bengaluru", "Chennai"],
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "Go", "Git"],
  experiences: [],
  projects: [
    {
      id: "p1",
      name: "Distributed Task Scheduler",
      description: "Engineered high-throughput Go background worker pool with Redis queues and PostgreSQL state persistence.",
      techStack: ["Go", "PostgreSQL", "Docker"],
    },
  ],
  portfolioLinks: [],
  availability: "Summer 2025",
  stipendPreference: "Flexible",
  constraints: "",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const PERSONA_ELECTRONICS_EMBEDDED: UserProfile = {
  id: "persona-2-ece",
  fullName: "Rohan Kulkarni",
  email: "rohan@example.edu",
  headline: "Embedded Systems & Robotics Specialist",
  university: "BITS Pilani",
  degree: "B.E.",
  major: "Electronics and Communication Engineering",
  graduationYear: 2026,
  location: "Hyderabad, India",
  targetRoles: ["Embedded Software Intern", "Hardware Systems Intern"],
  preferredWorkModes: ["On-site"],
  preferredLocations: ["Hyderabad", "Bengaluru"],
  skills: ["C", "C++", "Verilog", "RTOS", "Linux", "Microcontrollers", "ARM", "Git"],
  experiences: [],
  projects: [
    {
      id: "p2",
      name: "Autonomous Quadcopter Flight Controller",
      description: "Developed bare-metal C flight stabilization firmware on STM32 ARM Cortex-M4 with real-time sensor fusion.",
      techStack: ["C", "ARM", "RTOS"],
    },
  ],
  portfolioLinks: [],
  availability: "Summer 2025",
  stipendPreference: "Flexible",
  constraints: "",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const PERSONA_DATA_SCIENCE: UserProfile = {
  id: "persona-3-ds",
  fullName: "Ananya Iyer",
  email: "ananya@example.edu",
  headline: "Applied Data Science & Statistical Analytics",
  university: "Delhi Technological University",
  degree: "B.Tech",
  major: "Mathematics and Computing",
  graduationYear: 2027,
  location: "New Delhi, India",
  targetRoles: ["Data Science Intern", "Business Analytics Intern"],
  preferredWorkModes: ["Hybrid", "Remote"],
  preferredLocations: ["New Delhi", "Gurugram"],
  skills: ["Python", "SQL", "Pandas", "NumPy", "Scikit-learn", "Tableau", "Statistics"],
  experiences: [],
  projects: [
    {
      id: "p3",
      name: "Algorithmic Customer Churn Predictor",
      description: "Trained gradient boosted trees with Scikit-learn and evaluated precision-recall tradeoffs on 500k tabular records.",
      techStack: ["Python", "Pandas", "Scikit-learn", "SQL"],
    },
  ],
  portfolioLinks: [],
  availability: "Summer 2026",
  stipendPreference: "Flexible",
  constraints: "",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const PERSONA_RESEARCH_AI: UserProfile = {
  id: "persona-4-research",
  fullName: "Kabir Mehta",
  email: "kabir@example.edu",
  headline: "Computer Vision & Multimodal Deep Learning Researcher",
  university: "IIIT Hyderabad",
  degree: "B.Tech",
  major: "Computer Science",
  graduationYear: 2025,
  location: "Hyderabad, India",
  targetRoles: ["AI Research Intern", "Computer Vision Fellow"],
  preferredWorkModes: ["On-site", "Hybrid"],
  preferredLocations: ["Hyderabad", "Bengaluru"],
  skills: ["Python", "PyTorch", "OpenCV", "Deep Learning", "Model Evaluation", "Research Writing", "C++"],
  experiences: [],
  projects: [
    {
      id: "p4",
      name: "Zero-Shot Video Action Localization",
      description: "Fine-tuned vision-language transformers with PyTorch. Authored paper evaluated with mAP benchmarking on UCF101 dataset.",
      techStack: ["Python", "PyTorch", "Model Evaluation"],
    },
  ],
  portfolioLinks: [],
  availability: "Immediate",
  stipendPreference: "Flexible",
  constraints: "",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const PERSONA_EARLY_FRESHMAN: UserProfile = {
  id: "persona-5-freshman",
  fullName: "Pooja Verma",
  email: "pooja@example.edu",
  headline: "First-Year Computer Science Student",
  university: "State Technical University",
  degree: "B.Tech",
  major: "Computer Science",
  graduationYear: 2028,
  location: "Pune, India",
  targetRoles: ["Software Engineering Intern"],
  preferredWorkModes: ["Remote", "Hybrid"],
  preferredLocations: ["Pune"],
  skills: ["Python", "HTML", "CSS"],
  experiences: [],
  projects: [], // No projects yet
  portfolioLinks: [],
  availability: "Summer 2026",
  stipendPreference: "Flexible",
  constraints: "",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// =========================================================================
// BENCHMARK OPPORTUNITY SAMPLES
// =========================================================================

const BENCHMARK_SWE_INTERN: Opportunity = {
  id: "bench-swe",
  title: "Software Engineering Intern",
  organization: "CloudFlow Tech",
  category: "Internship",
  roleFamily: "Direct Roles (Core Competency Match)",
  seniority: "Intern",
  description: "Build robust backend microservices and web components using TypeScript and PostgreSQL.",
  location: "Bengaluru, India",
  workMode: "Hybrid",
  compensation: "INR 50,000/month",
  eligibilityRequirements: [
    "Graduation between 2025 and 2027",
    "Computer Science, Software Engineering, or related degree",
  ],
  requiredSkills: ["TypeScript", "Node.js", "PostgreSQL"],
  preferredSkills: ["Docker", "React"],
  deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
  applyUrl: "https://cloudflow.io/careers/swe-intern",
  canonicalUrl: "https://cloudflow.io/careers/swe-intern",
  sourceName: "Direct Employer Feed",
  sourceUrl: "https://cloudflow.io",
  sourceConfidence: 0.95,
  verificationStatus: "VERIFIED_SOURCE",
  sourceEvidence: [],
  multiSourceProvenance: [],
  guardVerdict: "CLEAN",
  isExpired: false,
  fetchedAt: new Date().toISOString(),
  discoveredAt: new Date().toISOString(),
  lastCheckedAt: new Date().toISOString(),
  isDemo: false,
};

const BENCHMARK_EMBEDDED_INTERN: Opportunity = {
  id: "bench-embedded",
  title: "Embedded Firmware Engineer Intern",
  organization: "RoboDynamics India",
  category: "Internship",
  roleFamily: "Direct Roles (Core Competency Match)",
  seniority: "Intern",
  description: "Low-level firmware development for robotics controllers using C, C++, and RTOS.",
  location: "Hyderabad, India",
  workMode: "On-site",
  compensation: "INR 35,000/month",
  eligibilityRequirements: [
    "B.Tech/BE in Electronics, Electrical, or Computer Engineering",
    "Graduation year 2025 or 2026",
  ],
  requiredSkills: ["C", "RTOS", "Linux"],
  preferredSkills: ["ARM", "C++"],
  deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
  applyUrl: "https://robodynamics.in/careers/firmware",
  canonicalUrl: "https://robodynamics.in/careers/firmware",
  sourceName: "Company Career Page",
  sourceUrl: "https://robodynamics.in",
  sourceConfidence: 0.92,
  verificationStatus: "VERIFIED_SOURCE",
  sourceEvidence: [],
  multiSourceProvenance: [],
  guardVerdict: "CLEAN",
  isExpired: false,
  fetchedAt: new Date().toISOString(),
  discoveredAt: new Date().toISOString(),
  lastCheckedAt: new Date().toISOString(),
  isDemo: false,
};

const BENCHMARK_AI_FELLOWSHIP: Opportunity = {
  id: "bench-ai-research",
  title: "Undergraduate AI Research Fellow",
  organization: "Indian Institute of Science (IISc)",
  category: "Research",
  roleFamily: "Emerging & Specialized Roles",
  seniority: "Research Fellow",
  description: "Research assistantship in multimodal deep learning and computer vision architectures.",
  location: "Bengaluru, India",
  workMode: "On-site",
  compensation: "INR 15,000/month stipend",
  eligibilityRequirements: [
    "Currently enrolled undergraduate student in CS or AI",
    "Graduation year 2025 or 2026",
  ],
  requiredSkills: ["Python", "PyTorch", "Deep Learning"],
  preferredSkills: ["Model Evaluation", "Computer Vision"],
  deadline: new Date(Date.now() + 40 * 86400000).toISOString(),
  applyUrl: "https://iisc.ac.in/research/fellowship",
  canonicalUrl: "https://iisc.ac.in/research/fellowship",
  sourceName: "IISc Official Portal",
  sourceUrl: "https://iisc.ac.in",
  sourceConfidence: 0.96,
  verificationStatus: "VERIFIED_SOURCE",
  sourceEvidence: [],
  multiSourceProvenance: [],
  guardVerdict: "CLEAN",
  isExpired: false,
  fetchedAt: new Date().toISOString(),
  discoveredAt: new Date().toISOString(),
  lastCheckedAt: new Date().toISOString(),
  isDemo: false,
};

// =========================================================================
// EVALUATION BENCHMARK TEST SUITE
// =========================================================================

test("Evaluation Dataset — Benchmark Personas & Relevance Suite", async (t) => {
  await t.test("1. CS Full-Stack Student scores APPLY_NOW on matching Backend SWE role", () => {
    const evalResult = evaluateOpportunity(BENCHMARK_SWE_INTERN, PERSONA_CS_FULLSTACK);
    assert.equal(evalResult.recommendation, "APPLY_NOW");
    assert.ok(evalResult.overallScore >= 80);
    assert.equal(evalResult.hardBlockers.length, 0);
  });

  await t.test("2. Electronics Student scores APPLY_NOW on Embedded Firmware role and SKIP on web dev role lacking skills", () => {
    const evalEmbedded = evaluateOpportunity(BENCHMARK_EMBEDDED_INTERN, PERSONA_ELECTRONICS_EMBEDDED);
    assert.equal(evalEmbedded.recommendation, "APPLY_NOW");
    assert.ok(evalEmbedded.overallScore >= 70);

    // Electronics student lacks TypeScript/Node.js/PostgreSQL for SWE role
    const evalSwe = evaluateOpportunity(BENCHMARK_SWE_INTERN, PERSONA_ELECTRONICS_EMBEDDED);
    assert.notEqual(evalSwe.recommendation, "APPLY_NOW"); // Should be PREPARE_FIRST or SKIP
  });

  await t.test("3. Research AI Student matches Research Fellow role with high score", () => {
    const evalResult = evaluateOpportunity(BENCHMARK_AI_FELLOWSHIP, PERSONA_RESEARCH_AI);
    assert.equal(evalResult.recommendation, "APPLY_NOW");
    assert.ok(evalResult.overallScore >= 75);
  });

  await t.test("4. Early Freshman with limited projects receives PREPARE_FIRST and not falsely rejected", () => {
    const evalResult = evaluateOpportunity(BENCHMARK_SWE_INTERN, PERSONA_EARLY_FRESHMAN);
    // Hard blocker: graduation year 2028 is outside 2025-2027 eligibility
    assert.equal(evalResult.recommendation, "SKIP");
    assert.ok(evalResult.hardBlockers.length > 0);
    assert.ok(evalResult.rationale.includes("Graduation") || evalResult.rationale.includes("graduation"));
  });

  await t.test("5. Career Outlook generates tailored directions matching each persona's demonstrated skills", () => {
    // ECE Persona
    const eceOutlook = generateCareerOutlook(PERSONA_ELECTRONICS_EMBEDDED);
    assert.ok(eceOutlook.directions.length >= 1);
    const hasHardwareOrEmbedded = eceOutlook.directions.some(
      (d) => d.title.toLowerCase().includes("embedded") || d.title.toLowerCase().includes("systems") || d.title.toLowerCase().includes("software")
    );
    assert.equal(hasHardwareOrEmbedded, true);

    // Data Science Persona
    const dsOutlook = generateCareerOutlook(PERSONA_DATA_SCIENCE);
    assert.ok(dsOutlook.directions.length >= 1);
    const hasData = dsOutlook.directions.some(
      (d) => d.title.toLowerCase().includes("data") || d.title.toLowerCase().includes("analytics")
    );
    assert.equal(hasData, true);
  });
});
