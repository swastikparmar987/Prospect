import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDistanceKm,
  reverseGeocodeCoordinates,
  buildManualLocationPreference,
  enrichOpportunityWithLocationIntelligence,
  filterOpportunitiesByLocationMode,
} from "../lib/location-intelligence";
import {
  generateSemanticEmbedding,
  generateCandidateEmbedding,
  generateOpportunityEmbedding,
  computeCosineSimilarity,
  computePrecisionAtK,
  computeRecallAtK,
  computeNDCGAtK,
  evaluateRankingPerformance,
  EMBEDDING_DIM,
  EMBEDDING_MODEL_ID,
} from "../lib/ai/semantic-embeddings";
import {
  extractStructuredJobIntelligence,
  generateCandidateJobMatchIntelligence,
  buildDeterministicSkillGapItem,
} from "../lib/ai/job-intelligence";
import { ModelRouter } from "../lib/ai/model-router";
import { InstitutionalResearchProvider } from "../lib/providers/institutional-research-provider";
import {
  DEFAULT_PARTICIPATING_COMPANY_BOARDS,
  CareerFeedsProvider,
} from "../lib/providers/career-feeds-provider";
import { executeAdaptiveSearchLoop } from "../lib/agent/adaptive-search-loop";
import { DEFAULT_SEARCH_CONFIG } from "../lib/search-config";
import { evaluateOpportunity } from "../lib/scoring-engine";
import {
  getPersistentSchedulerState,
  runScheduledSyncIfDue,
} from "../lib/sync/scheduler";
import { LiveDiscoveryEvent, Opportunity, UserProfile } from "../types";

const sampleCandidate: UserProfile = {
  id: "test-candidate-upgrade",
  fullName: "Aarav Sharma",
  email: "aarav@iitb.ac.in",
  headline: "B.Tech CS Student • Machine Learning & Backend Systems",
  university: "IIT Bombay",
  degree: "B.Tech",
  major: "Computer Science",
  graduationYear: 2027,
  gpa: 3.85,
  location: "Bengaluru, India",
  targetRoles: ["Machine Learning Intern", "Software Engineering Intern"],
  preferredWorkModes: ["Remote", "Hybrid"],
  preferredLocations: ["Bengaluru", "Remote"],
  skills: ["Python", "PyTorch", "TypeScript", "SQL", "Docker", "FastAPI"],
  experiences: [
    {
      id: "exp-1",
      title: "ML Research Intern",
      company: "AI Systems Lab",
      duration: "May 2025 - Aug 2025",
      bullets: [
        "Built semantic retrieval and RAG evaluation pipelines in Python and PyTorch.",
      ],
      verified: true,
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Distributed Vector Search Engine",
      description: "Implemented cosine similarity indexing with FastAPI and Docker.",
      techStack: ["Python", "PyTorch", "FastAPI", "Docker"],
    },
  ],
  portfolioLinks: [],
  availability: "Summer 2026",
  stipendPreference: "Paid",
  constraints: "",
  workAuthStatus: "Authorized in India",
  locationPreference: buildManualLocationPreference("Bengaluru"),
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleMlJob: Opportunity = {
  id: "opp-ml-bengaluru",
  title: "Machine Learning Engineering Intern",
  organization: "Anthropic",
  category: "Internship",
  employmentType: "Internship",
  roleFamily: "ML / AI Engineering",
  description:
    "Work on LLM evaluation, PyTorch training pipelines, Python backend services, and Kubernetes deployment in Bengaluru.",
  location: "Bengaluru, Karnataka, India",
  workMode: "Hybrid",
  compensation: "Paid",
  eligibilityRequirements: ["Currently enrolled in B.Tech or M.S. in CS (Class of 2026 or 2027)"],
  requiredSkills: ["Python", "PyTorch", "Kubernetes"],
  preferredSkills: ["Docker", "TypeScript"],
  applyUrl: "https://boards.greenhouse.io/anthropic/jobs/101",
  sourceName: "Anthropic Greenhouse",
  sourceUrl: "https://boards.greenhouse.io/anthropic/jobs/101",
  sourceConfidence: 0.95,
  verificationStatus: "VERIFIED_SOURCE",
  sourceEvidence: [],
  discoveredAt: new Date().toISOString(),
  lastCheckedAt: new Date().toISOString(),
  isDemo: false,
};

const sampleUnrelatedJob: Opportunity = {
  id: "opp-accounting-ny",
  title: "Corporate Tax Accounting Intern",
  organization: "LedgerCorp",
  category: "Internship",
  employmentType: "Internship",
  roleFamily: "Finance",
  description: "Prepare GAAP balance sheets, audit tax filings, and manage Excel ledgers in New York.",
  location: "New York, NY",
  workMode: "On-site",
  compensation: "Paid",
  eligibilityRequirements: ["Accounting major required"],
  requiredSkills: ["Excel", "GAAP", "Tax Filing"],
  preferredSkills: [],
  applyUrl: "https://example.com/jobs/tax-1",
  sourceName: "Company Feed",
  sourceUrl: "https://example.com/jobs/tax-1",
  sourceConfidence: 0.9,
  verificationStatus: "VERIFIED_SOURCE",
  sourceEvidence: [],
  discoveredAt: new Date().toISOString(),
  lastCheckedAt: new Date().toISOString(),
  isDemo: false,
};

test("PROSPECT Intelligence Upgrade Suite (Priorities 1–12)", async (t) => {
  await t.test("Priority 1: Location Intelligence — Haversine distance, reverse geocoding, and location modes", async () => {
    // 1. Never fabricate distance if coordinates are missing
    assert.equal(calculateDistanceKm(null, null, 12.9716, 77.5946), null);
    assert.equal(calculateDistanceKm(12.9716, 77.5946, null, undefined), null);

    // 2. Accurate Haversine calculation when both coordinates exist (Bengaluru to Chennai ~290km)
    const distBlrToMaa = calculateDistanceKm(12.9716, 77.5946, 13.0827, 80.2707);
    assert.ok(typeof distBlrToMaa === "number");
    assert.ok(distBlrToMaa > 250 && distBlrToMaa < 330);

    // 3. Reverse geocoding resolves coordinates to city centroid (does not store raw 6-decimal GPS)
    const resolvedPref = await reverseGeocodeCoordinates(
      12.9751234,
      77.5998765,
      async () =>
        new Response(
          JSON.stringify({
            address: {
              city: "Bengaluru",
              state: "Karnataka",
              country: "India",
            },
          }),
          { status: 200 }
        )
    );
    assert.equal(resolvedPref.city, "Bengaluru");
    assert.equal(resolvedPref.source, "BROWSER_GPS");
    assert.equal(resolvedPref.permissionState, "granted");
    assert.ok(typeof resolvedPref.cityLatitude === "number");

    // 4. Honest geocoding failure when remote service fails and coordinates are in open ocean
    const failedPref = await reverseGeocodeCoordinates(
      0.0,
      -160.0,
      async () => new Response("Service error", { status: 503 })
    );
    assert.equal(failedPref.city, "");
    assert.equal(failedPref.source, "NONE");
    assert.ok(failedPref.errorReason);

    // 5. Location mode filtering (NEAR_ME, IN_MY_CITY, REMOTE, HYBRID, ONSITE, SELECTED_CITY)
    const enrichedBlr = enrichOpportunityWithLocationIntelligence(
      sampleMlJob,
      resolvedPref
    );
    const enrichedNy = enrichOpportunityWithLocationIntelligence(
      sampleUnrelatedJob,
      resolvedPref
    );
    const remoteJob: Opportunity = enrichOpportunityWithLocationIntelligence(
      {
        ...sampleMlJob,
        id: "opp-remote-ml",
        location: "Remote - Global",
        workMode: "Remote",
      },
      resolvedPref
    );

    const items = [enrichedBlr, enrichedNy, remoteJob];

    const nearMe = filterOpportunitiesByLocationMode(items, "NEAR_ME", resolvedPref);
    assert.equal(nearMe.length, 1);
    assert.equal(nearMe[0].id, "opp-ml-bengaluru");

    const remoteOnly = filterOpportunitiesByLocationMode(items, "REMOTE", resolvedPref);
    assert.equal(remoteOnly.length, 1);
    assert.equal(remoteOnly[0].id, "opp-remote-ml");

    const selectedNy = filterOpportunitiesByLocationMode(
      items,
      "SELECTED_CITY",
      resolvedPref,
      "New York"
    );
    assert.equal(selectedNy.length, 1);
    assert.equal(selectedNy[0].id, "opp-accounting-ny");
  });

  await t.test("Priority 2 & 11: Expanded Discovery & Strict LIVE vs DEMO Mode Separation", async () => {
    // 1. Expanded company boards (16 boards across Greenhouse, Lever, Ashby)
    assert.ok(DEFAULT_PARTICIPATING_COMPANY_BOARDS.length >= 16);

    const feedsProvider = new CareerFeedsProvider();
    const page1 = feedsProvider.selectCandidateBoards(
      {
        id: "q-1",
        query: "AI Machine Learning Intern",
        strategy: "COMPANY_CAREER_BOARD",
        roleTitles: ["Machine Learning Intern"],
        skillCombinations: ["Python", "PyTorch"],
        projectKeywords: [],
        locationFilters: [],
        workModeFilters: [],
        experienceLevelTerms: [],
        companyTargets: [],
        targetProviders: ["company_career_feeds"],
        exclusionTerms: [],
        rationale: "Test pagination",
        expectedCategory: "Internship",
        priority: 1,
        maxResults: 10,
      },
      1
    );
    const page2 = feedsProvider.selectCandidateBoards(
      {
        id: "q-1",
        query: "AI Machine Learning Intern",
        strategy: "COMPANY_CAREER_BOARD",
        roleTitles: ["Machine Learning Intern"],
        skillCombinations: ["Python", "PyTorch"],
        projectKeywords: [],
        locationFilters: [],
        workModeFilters: [],
        experienceLevelTerms: [],
        companyTargets: [],
        targetProviders: ["company_career_feeds"],
        exclusionTerms: [],
        rationale: "Test pagination",
        expectedCategory: "Internship",
        priority: 1,
        maxResults: 10,
      },
      2
    );
    assert.ok(page1.length >= 6);
    assert.ok(page2.length >= 6);

    // 2. InstitutionalResearchProvider NEVER returns demo data in LIVE mode
    const instProvider = new InstitutionalResearchProvider();
    const liveRes = await instProvider.search({
      queryItem: {
        id: "q-inst",
        query: "AI Research Intern",
        strategy: "RESEARCH_ACADEMIC",
        roleTitles: ["AI Research Intern"],
        skillCombinations: ["Python"],
        projectKeywords: [],
        locationFilters: [],
        workModeFilters: [],
        experienceLevelTerms: [],
        companyTargets: [],
        targetProviders: ["institutional_research"],
        exclusionTerms: [],
        rationale: "Verify zero synthetic data in LIVE mode",
        expectedCategory: "Research",
        priority: 1,
        maxResults: 10,
      },
      roundNumber: 1,
      limit: 10,
      config: { ...DEFAULT_SEARCH_CONFIG, mode: "LIVE" },
      fetchImpl: async () => new Response("Upstream error", { status: 500 }),
    });
    assert.equal(
      liveRes.opportunities.filter((o) => o.isDemo).length,
      0,
      "LIVE mode must never return synthetic demo opportunities"
    );
  });

  await t.test("Priority 3: Live Discovery Pipeline Events & Cancellation", async () => {
    const observedEvents: LiveDiscoveryEvent[] = [];
    const loopResult = await executeAdaptiveSearchLoop({
      profile: sampleCandidate,
      userQuery: "Machine Learning Intern",
      config: {
        ...DEFAULT_SEARCH_CONFIG,
        mode: "DEMO",
        maxRounds: 1,
        queriesPerRound: 2,
      },
      onEvent: (ev) => observedEvents.push(ev),
    });

    assert.ok(observedEvents.length >= 6);
    const stages = new Set(observedEvents.map((e) => e.stage));
    assert.ok(stages.has("PROFILE_LOADED"));
    assert.ok(stages.has("CAPABILITIES_EXTRACTED"));
    assert.ok(stages.has("LOCATION_RESOLVED"));
    assert.ok(stages.has("ROLE_FAMILIES_GENERATED"));
    assert.ok(stages.has("QUERIES_PLANNED"));
    assert.ok(stages.has("SEARCH_COMPLETED"));
    assert.ok(loopResult.liveEvents.length >= 6);

    // Test AbortController cancellation
    const abortController = new AbortController();
    abortController.abort();
    const cancelledResult = await executeAdaptiveSearchLoop({
      profile: sampleCandidate,
      userQuery: "Machine Learning Intern",
      config: { ...DEFAULT_SEARCH_CONFIG, mode: "DEMO", maxRounds: 2 },
      abortSignal: abortController.signal,
    });
    assert.equal(cancelledResult.stopReason, "USER_CANCELLED");
  });

  await t.test("Priority 4 & 5: Semantic Embeddings, Hybrid Scoring, Skill Gaps & IR Metrics", async () => {
    // 1. 128-D L2-normalized semantic embeddings
    const candVec = generateCandidateEmbedding(sampleCandidate);
    const mlJobVec = generateOpportunityEmbedding(sampleMlJob);
    const taxJobVec = generateOpportunityEmbedding(sampleUnrelatedJob);

    assert.equal(candVec.length, EMBEDDING_DIM);
    assert.equal(mlJobVec.length, EMBEDDING_DIM);
    assert.equal(EMBEDDING_MODEL_ID, "prospect-semantic-embed-v1-128d");

    const simMl = computeCosineSimilarity(candVec, mlJobVec);
    const simTax = computeCosineSimilarity(candVec, taxJobVec);
    assert.ok(
      simMl > simTax,
      `Expected ML job cosine similarity (${simMl}) > Tax job similarity (${simTax})`
    );

    // 2. Hybrid evaluation includes semantic score, AI match explanation, and skill gap intelligence
    const evalMl = evaluateOpportunity(sampleMlJob, sampleCandidate);
    const evalTax = evaluateOpportunity(sampleUnrelatedJob, sampleCandidate);
    assert.ok(evalMl.overallScore > evalTax.overallScore);
    assert.ok(typeof evalMl.scoreBreakdown.semantic === "number");
    assert.ok(typeof evalMl.scoreBreakdown.rawCosineSimilarity === "number");
    assert.ok(evalMl.aiMatchExplanation && evalMl.aiMatchExplanation.length > 20);
    assert.ok(Array.isArray(evalMl.skillGapAnalysis));
    // Kubernetes is in sampleMlJob.requiredSkills but not in sampleCandidate.skills
    const k8sGap = evalMl.skillGapAnalysis?.find(
      (g) => g.skill.toLowerCase() === "kubernetes"
    );
    assert.ok(k8sGap, "Expected Kubernetes to be identified as a missing skill gap");
    assert.ok(k8sGap.whyItMatters.length > 10);
    assert.ok(k8sGap.preparationPath.length > 10);
    assert.ok(k8sGap.recommendedResources.length > 0);

    // 3. AI unavailable state when API key is missing
    const prevGroq = process.env.GROQ_API_KEY;
    const prevGemini = process.env.GEMINI_API_KEY;
    try {
      process.env.GROQ_API_KEY = "";
      process.env.GEMINI_API_KEY = "";
      const unconfiguredRouter = new ModelRouter();
      assert.equal(unconfiguredRouter.isAnyAiConfigured(), false);
      const reason = unconfiguredRouter.getAiUnavailableReason();
      assert.ok(reason && reason.includes("not configured"));

      const matchIntel = await generateCandidateJobMatchIntelligence({
        opportunity: sampleMlJob,
        profile: sampleCandidate,
        evaluation: evalMl,
      });
      assert.equal(matchIntel.isAiGenerated, false);
      assert.ok(matchIntel.unavailableReason);
    } finally {
      if (prevGroq !== undefined) process.env.GROQ_API_KEY = prevGroq;
      else delete process.env.GROQ_API_KEY;
      if (prevGemini !== undefined) process.env.GEMINI_API_KEY = prevGemini;
      else delete process.env.GEMINI_API_KEY;
    }

    // 4. Precision@K, Recall@K, NDCG@K evaluation metrics
    const relevanceGrades = [3, 2, 0, 0, 1];
    const pAt3 = computePrecisionAtK(relevanceGrades, 3);
    const rAt3 = computeRecallAtK(relevanceGrades, 3, 3);
    const ndcgAt5 = computeNDCGAtK(relevanceGrades, 5);
    assert.ok(Math.abs(pAt3 - 2 / 3) < 0.01);
    assert.ok(Math.abs(rAt3 - 2 / 3) < 0.01);
    assert.ok(ndcgAt5 > 0.85 && ndcgAt5 <= 1.0);

    const rankingPerf = evaluateRankingPerformance({
      rankedOpportunities: [sampleMlJob, sampleUnrelatedJob],
      evaluationsByOppId: new Map([
        [sampleMlJob.id, evalMl],
        [sampleUnrelatedJob.id, evalTax],
      ]),
      feedbackRecords: [],
      profile: sampleCandidate,
    });
    assert.ok(rankingPerf.modelFramingNote.toLowerCase().includes("semantic embedding"));
    assert.ok(rankingPerf.ndcgAtK[5] > 0);
  });

  await t.test("Priority 9: Persistent Scheduler & Sync Worker Retry State", async () => {
    const stateBefore = await getPersistentSchedulerState(30);
    assert.equal(stateBefore.schedulerType, "PERSISTENT_DATABASE_LEDGER");
    assert.ok(typeof stateBefore.nextScheduledSyncAt === "string");

    // Trigger a forced scheduled sync with a mock fetch so it executes deterministically and writes to DB
    const execRes = await runScheduledSyncIfDue({
      force: true,
      maxBoards: 2,
      maxRetries: 1,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            jobs: [
              {
                id: 999111,
                title: "AI Research Intern (Scheduled Sync Verification)",
                location: { name: "Bengaluru, India" },
                absolute_url: "https://boards.greenhouse.io/anthropic/jobs/999111",
                updated_at: new Date().toISOString(),
                content:
                  "Build LLM evaluation benchmarks using Python and PyTorch in Bengaluru.",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ),
    });

    assert.equal(execRes.triggered, true);
    assert.ok(execRes.syncResult);
    assert.ok(execRes.syncResult.itemsFetched >= 1);
    assert.equal(execRes.schedulerState.lastSyncStatus, "SUCCESS");
  });
});
