import dotenv from "dotenv";
dotenv.config();

import { TavilySearchProvider } from "../src/lib/providers/tavily-provider";
import { evaluateOpportunity } from "../src/lib/scoring-engine";
import { UserProfile, SearchConfig, SearchQueryItem, Opportunity, OpportunityCategory, VerificationStatus, WorkMode } from "../src/types";

async function runLiveSmokeTest() {
  console.log("=================================================");
  console.log("PROSPECT — TAVILY LIVE SEARCH SMOKE TEST");
  console.log("=================================================");

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error("❌ TAVILY_API_KEY not found in environment.");
    process.exit(1);
  }
  console.log(`✅ Loaded TAVILY_API_KEY: ${apiKey.slice(0, 10)}...${apiKey.slice(-6)}`);

  const provider = new TavilySearchProvider();
  const config: SearchConfig = {
    mode: "LIVE",
    maxRounds: 1,
    queriesPerRound: 1,
    resultsPerProvider: 5,
    providerConcurrency: 1,
    requestTimeoutMs: 10000,
    maxRetries: 1,
    cacheTtlSeconds: 0,
    minUniqueNewOpportunities: 1,
    minMarginalYield: 0.1,
    searchBudgetPerRun: 5,
    minEligibleToStopEarly: 3,
    enableLinkedInLocalPersonal: false,
    enableGeneralWebDiscovery: true,
  };

  const testQuery: SearchQueryItem = {
    id: "smoke-test-query",
    query: "software engineering intern Bengaluru apply 2025 2026",
    strategy: "DIRECT_ROLE",
    roleTitles: ["software engineering intern"],
    skillCombinations: ["Python", "SQL", "JavaScript"],
    projectKeywords: [],
    locationFilters: ["Bengaluru, India"],
    workModeFilters: [],
    experienceLevelTerms: ["Intern"],
    companyTargets: [],
    targetProviders: ["tavily"],
    exclusionTerms: [],
    rationale: "Live integration smoke verification",
    expectedCategory: "Internship",
    priority: 1,
    maxResults: 5,
  };

  console.log(`🔍 Querying Tavily: "${testQuery.query}"...`);
  const startTime = Date.now();
  const result = await provider.search({
    queryItem: testQuery,
    roundNumber: 1,
    limit: 5,
    config,
  });
  const duration = Date.now() - startTime;

  console.log(`\n⏱️ Execution time: ${duration}ms`);
  console.log(`📡 Status: ${result.status}`);
  console.log(`🌐 Sources checked: ${result.sourcesChecked.length}`);
  console.log(`📦 Opportunities extracted: ${result.opportunities.length}`);

  if (result.warnings.length > 0) {
    console.log(`⚠️ Warnings:`, result.warnings);
  }

  if (result.status !== "SUCCESS" || result.opportunities.length === 0) {
    console.error("❌ Smoke test failed to retrieve opportunities.");
    process.exit(1);
  }

  // Student profile for decision engine evaluation
  const mockStudent: UserProfile = {
    id: "candidate-chen",
    fullName: "Alex Chen",
    email: "alex.chen@college.edu",
    headline: "CS Student",
    university: "College of Engineering",
    degree: "B.Tech",
    major: "Computer Science",
    graduationYear: 2026,
    graduationMonth: "June",
    gpa: 8.6,
    location: "Bengaluru, India",
    targetRoles: ["Software Engineering Intern"],
    preferredWorkModes: ["Hybrid", "On-site", "Remote"],
    preferredLocations: ["Bengaluru, India"],
    skills: ["Python", "SQL", "TypeScript", "React", "Data Structures", "Git"],
    experiences: [],
    projects: [],
    portfolioLinks: [],
    availability: "Summer 2025",
    stipendPreference: "Paid Only",
    constraints: "",
    factProvenance: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("\n=================================================");
  console.log("EXTRACTED OPPORTUNITIES & DECISION ENGINE EVALUATION:");
  console.log("=================================================");

  result.opportunities.forEach((rawOpp, idx) => {
    // Convert to full Opportunity
    const opp: Opportunity = {
      ...rawOpp,
      id: `live-opp-${idx + 1}`,
      category: (rawOpp.category || "Internship") as OpportunityCategory,
      workMode: (rawOpp.workMode || "Remote") as WorkMode,
      compensation: rawOpp.compensation || "Competitive / Unlisted",
      eligibilityRequirements: rawOpp.eligibilityRequirements || [],
      requiredSkills: rawOpp.requiredSkills || [],
      preferredSkills: rawOpp.preferredSkills || [],
      applyUrl: rawOpp.applicationUrl,
      sourceConfidence: 0.9,
      verificationStatus: (rawOpp.verificationStatus || "PARTIALLY_CHECKED") as VerificationStatus,
      sourceEvidence: [
        {
          claim: "Opportunity Listing",
          excerpt: rawOpp.sourceSnippet || "",
          url: rawOpp.sourceUrl,
          observedAt: rawOpp.fetchedAt,
          verified: true,
        },
      ],
      discoveredAt: rawOpp.fetchedAt,
      lastCheckedAt: rawOpp.fetchedAt,
      isDemo: false,
    };

    const evaluation = evaluateOpportunity(opp, mockStudent);

    console.log(`\n[#${idx + 1}] ${opp.title}`);
    console.log(`    🏢 Organization:    ${opp.organization}`);
    console.log(`    🏷️ Category:        ${opp.category}`);
    console.log(`    📍 Location:        ${opp.location} (${opp.workMode})`);
    console.log(`    💰 Compensation:    ${opp.compensation}`);
    console.log(`    📅 Deadline:        ${opp.deadline || opp.deadlineRaw || "Rolling / Unlisted"}`);
    console.log(`    🛠️ Skills:          ${opp.requiredSkills?.join(", ") || "None extracted"}`);
    console.log(`    🎓 Eligibility:     ${opp.eligibilityRequirements?.join(" | ") || "See posting"}`);
    console.log(`    🔗 Source URL:      ${opp.sourceUrl}`);
    console.log(`    🔎 Verification:    ${opp.verificationStatus}`);
    console.log(`    🎯 Decision Engine: ${evaluation.recommendation} (Overall Fit Score: ${evaluation.overallScore}%)`);
    console.log(`    💡 Next Action:     ${evaluation.nextAction}`);
    if (evaluation.hardBlockers.length > 0) {
      console.log(`    ⚠️ Hard Blockers:   ${evaluation.hardBlockers.join("; ")}`);
    }
  });

  console.log("\n=================================================");
  console.log("✅ LIVE TAVILY SMOKE TEST COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
}

runLiveSmokeTest().catch((err) => {
  console.error("❌ Uncaught smoke test error:", err);
  process.exit(1);
});
