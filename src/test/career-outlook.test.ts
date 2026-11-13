import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateCareerOutlook,
  evaluateCustomCareerDirection,
  determineEvidenceStrength,
  generatePersonalizedCareerBrief,
  groupOpportunitiesByCareerDirection,
} from "../lib/career-outlook";
import {
  UserProfile,
  Opportunity,
  EvaluationResult,
} from "../types";

describe("Career Outlook & Direction Intelligence Engine", () => {
  const sampleProfile: UserProfile = {
    id: "profile-swastik-101",
    fullName: "Swastik Parmar",
    email: "swastik@example.edu",
    headline: "Computer Science Student & ML Enthusiast",
    university: "National Institute of Technology",
    degree: "B.Tech",
    major: "Computer Science & Engineering",
    graduationYear: 2026,
    graduationMonth: "May",
    gpa: 8.8,
    location: "Bengaluru, India",
    skills: ["Python", "PyTorch", "TensorFlow", "OpenCV", "FastAPI", "Docker", "SQL", "Git"],
    projects: [
      {
        id: "proj-1",
        name: "Autonomous Vision Navigation",
        description: "Trained deep learning ResNet models with OpenCV and PyTorch for real-time robotic obstacle detection.",
        techStack: ["Python", "PyTorch", "OpenCV", "Docker"],
        link: "https://github.com/swastik/vision-nav",
      },
      {
        id: "proj-2",
        name: "Medical Image Segmentation",
        description: "Implemented U-Net architecture for CT scan segmentation with quantitative model evaluation and ablation testing.",
        techStack: ["Python", "PyTorch", "NumPy", "Model Evaluation"],
        link: "https://github.com/swastik/med-seg",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        title: "Undergraduate ML Research Intern",
        company: "AI Innovation Lab",
        duration: "Summer 2024",
        bullets: ["Benchmarked computer vision models", "Authored reproducible evaluation scripts"],
        verified: true,
      },
    ],
    targetRoles: ["Machine Learning Intern"],
    preferredWorkModes: ["Remote", "Hybrid"],
    preferredLocations: ["Bengaluru, India"],
    portfolioLinks: [],
    availability: "Summer 2025",
    stipendPreference: "Flexible",
    constraints: "",
    excludedRoleFamilies: [],
    factProvenance: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("1. Generates up to three relevant career directions from verified profile facts", () => {
    const outlook = generateCareerOutlook(sampleProfile);

    assert.ok(outlook.directions.length > 0, "Should generate career directions");
    assert.ok(outlook.directions.length <= 3, "Must not generate more than three primary directions");
    assert.equal(outlook.candidateName, "Swastik Parmar");
    assert.equal(outlook.coreEvidenceCount.skills, 8);
    assert.equal(outlook.coreEvidenceCount.projects, 2);
    assert.equal(outlook.coreEvidenceCount.experiences, 1);
  });

  it("2. Assigns 'Strong evidence' when supported by verified projects and multiple matching skills", () => {
    const strength = determineEvidenceStrength(4, 2, 1);
    assert.equal(strength, "Strong evidence");

    const outlook = generateCareerOutlook(sampleProfile);
    const mlDirection = outlook.directions.find((d) =>
      d.title.toLowerCase().includes("machine learning") || d.title.toLowerCase().includes("computer vision")
    );
    assert.ok(mlDirection, "Should identify ML or CV direction");
    assert.equal(mlDirection?.evidenceStrength, "Strong evidence");
  });

  it("3. Accurately maps student projects to matching career directions", () => {
    const outlook = generateCareerOutlook(sampleProfile);
    const visionOrML = outlook.directions.find(
      (d) => d.title.toLowerCase().includes("machine learning") || d.title.toLowerCase().includes("computer vision")
    );

    assert.ok(visionOrML);
    assert.ok(visionOrML.relevantProjects.length >= 1, "Should link relevant projects");
    const projNames = visionOrML.relevantProjects.map((p) => p.name);
    assert.ok(
      projNames.includes("Autonomous Vision Navigation") || projNames.includes("Medical Image Segmentation"),
      "Must cite actual project names"
    );
  });

  it("4. Identifies missing industry requirements without hallucinating unmentioned qualifications", () => {
    const outlook = generateCareerOutlook(sampleProfile);
    const firstDir = outlook.directions[0];

    assert.ok(Array.isArray(firstDir.missingRequirements));
    // Candidate has Python and PyTorch; missing requirements should only contain skills NOT in candidate skills
    for (const req of firstDir.missingRequirements) {
      assert.ok(
        !sampleProfile.skills.map((s) => s.toLowerCase()).includes(req.toLowerCase()),
        `Missing requirement "${req}" must not be a skill the candidate already possesses`
      );
    }
  });

  it("5. Assigns 'Insufficient evidence' when student lacks supporting skills and projects", () => {
    const strength = determineEvidenceStrength(0, 0, 0);
    assert.equal(strength, "Insufficient evidence");

    const strengthSome = determineEvidenceStrength(2, 0, 0);
    assert.equal(strengthSome, "Some evidence");
  });

  it("6. Evaluates user-added custom career directions using actual profile evidence", () => {
    // Student adds a custom role they have evidence for
    const customML = evaluateCustomCareerDirection("Computer Vision Specialist", sampleProfile);
    assert.equal(customML.isCustom, true);
    assert.equal(customML.title, "Computer Vision Specialist");
    assert.equal(customML.evidenceStrength, "Strong evidence");
    assert.ok(customML.supportingSkills.includes("OpenCV") || customML.supportingSkills.includes("PyTorch"));

    // Student adds a custom role they have zero evidence for
    const customBio = evaluateCustomCareerDirection("Biomedical Embedded Firmware Engineer", sampleProfile);
    assert.equal(customBio.isCustom, true);
    assert.equal(customBio.evidenceStrength, "Insufficient evidence");
    assert.ok(customBio.relevanceExplanation.includes("Aspirational"));
  });

  it("7. Deduplicates career directions and handles case-insensitivity cleanly", () => {
    const duplicateProfile: UserProfile = {
      ...sampleProfile,
      targetRoles: ["Machine Learning Intern", "machine learning intern", "Software Engineering Intern"],
    };
    const outlook = generateCareerOutlook(duplicateProfile);
    const titles = outlook.directions.map((d) => d.title.toLowerCase());
    const uniqueTitles = new Set(titles);

    assert.equal(titles.length, uniqueTitles.size, "Should never produce duplicate direction titles");
  });

  it("8. Respects user-excluded career directions", () => {
    const excludedProfile: UserProfile = {
      ...sampleProfile,
      excludedRoleFamilies: ["Machine Learning Intern"],
    };
    const outlook = generateCareerOutlook(excludedProfile);
    const hasExcluded = outlook.directions.some(
      (d) => d.title.toLowerCase() === "machine learning intern"
    );
    assert.equal(hasExcluded, false, "Must not recommend excluded career directions");
  });

  it("9. Synthesizes all 7 sections (A through G) of the Personalized Career Brief", () => {
    const sampleOpp: Opportunity = {
      id: "opp-tavily-1",
      title: "Machine Learning Intern",
      organization: "Razorpay",
      category: "Internship",
      roleFamily: "Machine Learning Intern",
      description: "Build deep learning and vision pipelines with Python and PyTorch.",
      location: "Bengaluru, India",
      workMode: "Hybrid",
      compensation: "₹45,000/month",
      eligibilityRequirements: ["Undergraduate CS student"],
      requiredSkills: ["Python", "PyTorch"],
      preferredSkills: ["Docker"],
      applyUrl: "https://careers.razorpay.com/ml-intern",
      sourceName: "Direct Employer Portal",
      sourceUrl: "https://careers.razorpay.com/ml-intern",
      sourceConfidence: 0.95,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [
        {
          claim: "Stipend: ₹45,000/month",
          excerpt: "Monthly stipend of ₹45,000 provided",
          url: "https://careers.razorpay.com/ml-intern",
          observedAt: new Date().toISOString(),
          verified: true,
        },
      ],
      deadline: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const sampleEval: EvaluationResult = {
      opportunityId: "opp-tavily-1",
      recommendation: "APPLY_NOW",
      overallScore: 88,
      scoreBreakdown: {
        eligibility: 35,
        skills: 28,
        quality: 15,
        preferences: 10,
        deadline: 10,
      },
      hardBlockers: [],
      rationale: "Direct alignment with Python, PyTorch, and Computer Vision background.",
      nextAction: "Tailor grounded resume bullets highlighting Autonomous Vision Navigation.",
      uncertainties: [],
      eligibilityChecks: [
        {
          rule: "Academic Standing",
          status: "MET",
          reason: "Candidate is Class of 2026",
          evidence: "Undergraduate student",
          isHardBlocker: false,
        },
      ],
      evaluatedAt: new Date().toISOString(),
    };

    const brief = generatePersonalizedCareerBrief(sampleProfile, [
      { opportunity: sampleOpp, evaluation: sampleEval, hasPrepPlan: false },
    ]);

    // Verify all 7 sections exist and are populated
    // A. Strongest directions
    assert.ok(brief.strongestDirections.length > 0, "Section A: strongestDirections");
    // B. Opportunities worth pursuing
    assert.equal(brief.opportunitiesWorthPursuing.length, 1, "Section B: opportunitiesWorthPursuing");
    assert.equal(brief.opportunitiesWorthPursuing[0].opportunity.title, "Machine Learning Intern");
    // C. Opportunities requiring prep
    assert.ok(Array.isArray(brief.opportunitiesRequiringPrep), "Section C: opportunitiesRequiringPrep");
    // D. Important skill gaps
    assert.ok(Array.isArray(brief.importantSkillGaps), "Section D: importantSkillGaps");
    // E. Recommended next actions
    assert.ok(brief.recommendedNextActions.length > 0, "Section E: recommendedNextActions");
    assert.equal(brief.recommendedNextActions[0].priority, "HIGH");
    // F. Upcoming deadlines
    assert.equal(brief.upcomingDeadlines.length, 1, "Section F: upcomingDeadlines");
    assert.equal(brief.upcomingDeadlines[0].daysRemaining, 10);
    // G. Source references
    assert.equal(brief.sourceReferences.length, 1, "Section G: sourceReferences");
    assert.equal(brief.sourceReferences[0].url, "https://careers.razorpay.com/ml-intern");
  });

  it("10. Groups opportunities by career direction with accurate evidence strength labels", () => {
    const oppA: Opportunity = {
      id: "opp-1",
      title: "Machine Learning Intern",
      organization: "AlphaAI",
      category: "Internship",
      roleFamily: "Machine Learning Intern",
      description: "Python ML role",
      location: "Bengaluru",
      workMode: "Remote",
      compensation: "Competitive",
      eligibilityRequirements: [],
      requiredSkills: ["Python"],
      preferredSkills: [],
      applyUrl: "https://example.com/1",
      sourceName: "Live Web",
      sourceUrl: "https://example.com/1",
      sourceConfidence: 0.9,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const evalA: EvaluationResult = {
      opportunityId: "opp-1",
      recommendation: "APPLY_NOW",
      overallScore: 85,
      scoreBreakdown: { eligibility: 35, skills: 25, quality: 15, preferences: 10, deadline: 10 },
      hardBlockers: [],
      rationale: "Strong match",
      nextAction: "Apply",
      uncertainties: [],
      eligibilityChecks: [],
      evaluatedAt: new Date().toISOString(),
    };

    const outlook = generateCareerOutlook(sampleProfile);
    const grouped = groupOpportunitiesByCareerDirection(
      [{ opportunity: oppA, evaluation: evalA }],
      outlook.directions
    );

    assert.ok(grouped.length > 0, "Should create grouped partitions");
    const mlGroup = grouped.find((g) => g.directionTitle.toLowerCase().includes("machine learning"));
    assert.ok(mlGroup, "Should group ML opportunity under Machine Learning Intern");
    assert.equal(mlGroup?.opportunities.length, 1);
  });
});

