import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateOpportunity } from "../lib/scoring-engine";
import {
  deriveLocationPreferenceFromProfile,
  enrichOpportunityWithLocationIntelligence,
  filterOpportunitiesByLocationMode,
  isOpportunityWithinUserVicinity,
} from "../lib/location-intelligence";
import { applyMultiPlatformDiversity } from "../lib/search-diversity";
import {
  isOpportunityListing,
  normalizeTavilyResult,
} from "../lib/providers/tavily-provider";
import { PublicJobBoardsProvider } from "../lib/providers/public-boards-provider";
import { computeDeterministicProjectEvaluation } from "../lib/project-evaluator";
import {
  publishRealtimeEvent,
  subscribeRealtimeEvents,
} from "../lib/realtime/opportunity-events";
import {
  doesOpportunityMatchRequestedDestination,
  parseSearchIntent,
} from "../lib/query-intent-parser";
import { Opportunity, SearchConfig, SearchQueryItem, UserProfile } from "../types";

const BASE_TECH_CANDIDATE: UserProfile = {
  id: "cand-rahul-ggn",
  fullName: "Rahul Verma",
  email: "rahul@example.com",
  headline: "B.Tech CS • Machine Learning & Backend Engineering",
  university: "NSUT Delhi",
  degree: "B.Tech",
  major: "Computer Science",
  graduationYear: 2026,
  gpa: 8.8,
  location: "Gurgaon, Haryana, India",
  locationPreference: deriveLocationPreferenceFromProfile("Gurgaon, Haryana, India"),
  targetRoles: ["Machine Learning Intern", "Software Engineering Intern", "AI Engineer"],
  preferredWorkModes: ["Remote", "Hybrid", "On-site"],
  preferredLocations: ["Gurugram", "New Delhi", "Remote"],
  skills: ["Python", "PyTorch", "Machine Learning", "RAG", "FastAPI", "TypeScript", "Docker"],
  experiences: [],
  projects: [
    {
      id: "proj-rag",
      name: "Multimodal RAG Document QA",
      description: "Built semantic indexing pipelines with PyTorch embeddings and FastAPI.",
      techStack: ["Python", "PyTorch", "RAG", "FastAPI"],
    },
  ],
  portfolioLinks: [],
  availability: "Immediate",
  stipendPreference: "Paid Only",
  constraints: "",
  factProvenance: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("Prospect Upgraded ML, Proximity, Multi-Platform & Realtime Suite", async (t) => {
  await t.test("1. Scoring Engine sharply separates ML Intern from Corporate Finance Analyst (ends flat 87% bug)", () => {
    const mlLocalOpp: Opportunity = {
      id: "opp-ml-ncr",
      title: "Machine Learning Intern (LLM & RAG)",
      organization: "Groww",
      category: "Internship",
      description: "Train and evaluate PyTorch and RAG pipelines with FastAPI and Python.",
      location: "Gurugram, Haryana, India",
      workMode: "Hybrid",
      compensation: "₹60,000 / month",
      eligibilityRequirements: ["B.Tech CS 2026 batch"],
      requiredSkills: ["Python", "PyTorch", "RAG"],
      preferredSkills: ["FastAPI", "Docker"],
      applyUrl: "https://boards.greenhouse.io/groww/jobs/123",
      sourceName: "Groww Careers",
      sourceUrl: "https://boards.greenhouse.io/groww/jobs/123",
      sourceConfidence: 0.95,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      publishedAt: new Date().toISOString(),
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const financeNyOpp: Opportunity = {
      id: "opp-fin-ny",
      title: "Finance & Strategy, Corporate Finance Analyst",
      organization: "Stripe",
      category: "Entry-level",
      roleFamily: "Finance & Strategy",
      description: "Build financial FP&A forecasts, GAAP reporting, and treasury models using SQL and Python scripts.",
      location: "New York, NY",
      workMode: "On-site",
      compensation: "$115,000",
      eligibilityRequirements: [],
      requiredSkills: [],
      preferredSkills: [],
      applyUrl: "https://boards.greenhouse.io/stripe/jobs/999",
      sourceName: "Stripe Careers",
      sourceUrl: "https://boards.greenhouse.io/stripe/jobs/999",
      sourceConfidence: 0.95,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const evalMl = evaluateOpportunity(mlLocalOpp, BASE_TECH_CANDIDATE);
    const evalFinance = evaluateOpportunity(financeNyOpp, BASE_TECH_CANDIDATE);

    assert.equal(evalMl.recommendation, "APPLY_NOW");
    assert.ok(evalMl.overallScore >= 80, `Expected ML score >= 80, got ${evalMl.overallScore}`);

    assert.equal(evalFinance.domainVerdict, "DOMAIN_MISMATCH");
    assert.equal(evalFinance.recommendation, "SKIP");
    assert.ok(
      evalFinance.overallScore <= 42,
      `Corporate Finance Analyst must score <= 42 for CS/ML student, got ${evalFinance.overallScore}`
    );
    assert.ok(
      evalMl.overallScore - evalFinance.overallScore >= 40,
      "ML Engineer and Finance Analyst must have >= 40 pt separation"
    );
  });

  await t.test("2. Dynamic Resume-Driven Vicinity Engine adapts from Rahul (Gurgaon) to another candidate automatically", () => {
    const ggnPref = deriveLocationPreferenceFromProfile("Gurgaon, Haryana, India");
    assert.equal(ggnPref.city, "Gurugram");
    assert.equal(ggnPref.country, "India");
    assert.equal(ggnPref.source, "PROFILE");

    const makeOppAt = (id: string, location: string, workMode: Opportunity["workMode"]) =>
      enrichOpportunityWithLocationIntelligence(
        {
          id,
          title: "AI Engineer Intern",
          organization: "StartupNCR",
          category: "Internship",
          description: "Build LLM workflows",
          location,
          workMode,
          compensation: "Paid",
          eligibilityRequirements: [],
          requiredSkills: ["Python"],
          preferredSkills: [],
          applyUrl: "https://example.com/1",
          sourceName: "Test",
          sourceUrl: "https://example.com/1",
          sourceConfidence: 0.9,
          verificationStatus: "VERIFIED_SOURCE",
          sourceEvidence: [],
          discoveredAt: new Date().toISOString(),
          lastCheckedAt: new Date().toISOString(),
          isDemo: false,
        },
        ggnPref
      );

    const oppDelhi = makeOppAt("opp-delhi", "New Delhi, Delhi NCR, India", "Hybrid");
    const oppNewYork = makeOppAt("opp-ny", "New York, NY", "On-site");
    const oppSingapore = makeOppAt("opp-sg", "Singapore", "On-site");
    const oppIndiaRemote = makeOppAt("opp-in-rem", "Remote - India", "Remote");
    const oppUsRemote = makeOppAt("opp-us-rem", "Remote - United States", "Remote");

    assert.ok(
      isOpportunityWithinUserVicinity(oppDelhi, ggnPref).matches,
      "Delhi should be within Gurgaon candidate 80km metro vicinity"
    );
    assert.equal(isOpportunityWithinUserVicinity(oppNewYork, ggnPref).matches, false);
    assert.equal(isOpportunityWithinUserVicinity(oppSingapore, ggnPref).matches, false);
    assert.equal(isOpportunityWithinUserVicinity(oppIndiaRemote, ggnPref).matches, true);
    assert.equal(isOpportunityWithinUserVicinity(oppUsRemote, ggnPref).matches, false);

    const filtered = filterOpportunitiesByLocationMode(
      [oppDelhi, oppNewYork, oppSingapore, oppIndiaRemote, oppUsRemote],
      "VICINITY",
      ggnPref
    );
    assert.deepEqual(
      filtered.map((o) => o.id).sort(),
      ["opp-delhi", "opp-in-rem"]
    );

    // Switching dynamically to Bengaluru candidate flips vicinity without touching hardcoded cities
    const blrPref = deriveLocationPreferenceFromProfile("Bengaluru, India");
    assert.equal(isOpportunityWithinUserVicinity(oppDelhi, blrPref).matches, false);
  });

  await t.test("3. Multi-Platform Filter rejects aggregator SEO pages & preserves real LinkedIn/Naukri/Public feeds", async () => {
    // Reject listicle aggregator pages (Naukri 2-digit SEO listicles & LinkedIn category listicles)
    assert.equal(
      isOpportunityListing({
        title: "51504 Ai Ml Job Vacancies in Bengaluru",
        url: "https://www.naukri.com/ai-ml-jobs-in-bengaluru",
        content: "Explore 51504 AI ML job vacancies and openings across top companies.",
      }),
      false
    );
    assert.equal(
      isOpportunityListing({
        title: "Machine Learning Intern Jobs In Delhi Ncr - 133 Machine Learning Intern Job Vacancies",
        url: "https://www.naukri.com/machine-learning-intern-jobs-in-delhi-ncr",
        content: "133 Machine Learning Intern Job Vacancies in Delhi NCR on Naukri.com",
      }),
      false
    );
    assert.equal(
      isOpportunityListing({
        title: "Machine Learning Jobs in APJ (21,000+ Open Roles)",
        url: "https://za.linkedin.com/jobs/machine-learning-jobs-apj",
        content: "21,000+ Machine Learning jobs in APJ.",
      }),
      false
    );

    // Accept genuine Naukri job-listings posting with clean org extraction
    const naukriResult = {
      title: "AI/ML Internship - Bengaluru - Pragyan Ai - 0 to 5 years of experience - Naukri.com",
      url: "https://www.naukri.com/job-listings-ai-ml-internship-pragyan-ai-bengaluru-0-to-5-years-200625500001",
      content: "Pragyan Ai is hiring an AI/ML Intern in Bengaluru working with Python and PyTorch.",
      score: 0.89,
    };
    assert.equal(isOpportunityListing(naukriResult), true);
    const normalizedNaukri = normalizeTavilyResult(naukriResult, ["Python", "PyTorch"]);
    assert.ok(normalizedNaukri);
    assert.equal(normalizedNaukri.sourceName, "Naukri (Web Index)");
    assert.equal(normalizedNaukri.organization, "Pragyan Ai");

    // Accept genuine LinkedIn job posting with accurate provenance
    const linkedinResult = {
      title: "Machine Learning Intern at Razorpay",
      url: "https://www.linkedin.com/jobs/view/1234567890",
      content: "Razorpay is hiring a Machine Learning Intern in Bengaluru using Python and PyTorch.",
      score: 0.91,
    };
    assert.equal(isOpportunityListing(linkedinResult), true);
    const normalizedLi = normalizeTavilyResult(linkedinResult, ["Python", "PyTorch"]);
    assert.ok(normalizedLi);
    assert.equal(normalizedLi.sourceName, "LinkedIn Jobs (Web Index)");

    // PublicJobBoardsProvider ingests Remotive/Arbeitnow/Himalayas cleanly
    const pbProvider = new PublicJobBoardsProvider();
    const dummyQuery: SearchQueryItem = {
      id: "q-pb",
      query: "Python Machine Learning",
      strategy: "DIRECT_ROLE",
      roleTitles: ["Machine Learning Intern"],
      skillCombinations: ["Python", "Machine Learning"],
      projectKeywords: [],
      locationFilters: ["India"],
      workModeFilters: ["Remote"],
      experienceLevelTerms: ["Intern"],
      companyTargets: [],
      targetProviders: ["public_boards"],
      exclusionTerms: ["Senior"],
      rationale: "test",
      expectedCategory: "Internship",
      priority: 1,
      maxResults: 10,
    };
    const cfg: SearchConfig = {
      mode: "LIVE",
      maxRounds: 1,
      queriesPerRound: 1,
      resultsPerProvider: 10,
      providerConcurrency: 1,
      requestTimeoutMs: 5000,
      maxRetries: 1,
      cacheTtlSeconds: 0,
      minUniqueNewOpportunities: 1,
      minMarginalYield: 0.1,
      searchBudgetPerRun: 2,
      minEligibleToStopEarly: 1,
      enableLinkedInLocalPersonal: false,
      enableGeneralWebDiscovery: true,
    };

    const res = await pbProvider.search({
      queryItem: dummyQuery,
      roundNumber: 1,
      limit: 10,
      config: cfg,
      fetchImpl: async (url) => {
        const u = String(url);
        if (u.includes("remotive")) {
          return new Response(
            JSON.stringify({
              jobs: [
                {
                  id: 77,
                  title: "AI Python Engineer Intern",
                  company_name: "OpenSourceLabs",
                  url: "https://remotive.com/remote-jobs/software-dev/ai-python-intern-77",
                  tags: ["Python", "Machine Learning"],
                  candidate_required_location: "Anywhere",
                  publication_date: new Date().toISOString(),
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({ data: [], jobs: [] }), { status: 200 });
      },
    });
    assert.equal(res.status, "SUCCESS");
    assert.equal(res.opportunities.length, 1);
    assert.equal(res.opportunities[0].sourceName, "Remotive Public Feed");

    // Diversity mixes platforms instead of letting one employer dominate
    const makeBundled = (id: string, org: string, sourceName: string) => ({
      opportunity: {
        id,
        title: `SWE ${id}`,
        organization: org,
        category: "Internship" as const,
        description: "Test",
        location: "Remote",
        workMode: "Remote" as const,
        compensation: "Paid",
        eligibilityRequirements: [],
        requiredSkills: ["Python"],
        preferredSkills: [],
        applyUrl: `https://example.com/${id}`,
        sourceName,
        sourceUrl: `https://example.com/${id}`,
        sourceConfidence: 0.9,
        verificationStatus: "VERIFIED_SOURCE" as const,
        sourceEvidence: [],
        discoveredAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        isDemo: false,
      },
    });
    const diversified = applyMultiPlatformDiversity(
      [
        makeBundled("a1", "Anthropic", "Greenhouse"),
        makeBundled("a2", "Anthropic", "Greenhouse"),
        makeBundled("a3", "Anthropic", "Greenhouse"),
        makeBundled("a4", "Anthropic", "Greenhouse"),
        makeBundled("r1", "HuggingFace", "Remotive Public Feed"),
        makeBundled("l1", "Razorpay", "LinkedIn Jobs (Web Index)"),
      ],
      2,
      3,
      6
    );
    const anthropicInTop4 = diversified
      .slice(0, 4)
      .filter((x) => x.opportunity.organization === "Anthropic").length;
    assert.ok(anthropicInTop4 <= 2);
  });

  await t.test("4. Project Evaluator rates deep RAG project above trivial tutorial clone", () => {
    const ragEval = computeDeterministicProjectEvaluation(
      {
        title: "Hybrid RAG Career Matching Pipeline",
        description:
          "Engineered 128-D semantic embeddings combined with BM25 lexical scoring, achieving 0.91 nDCG@5 latency under 40ms with Prisma + SSE live streaming.",
        techStack: ["Python", "PyTorch", "RAG", "BM25", "TypeScript", "Docker"],
        repoUrl: "https://github.com/example/rag-engine",
      },
      BASE_TECH_CANDIDATE,
      null
    );

    const cloneEval = computeDeterministicProjectEvaluation(
      {
        title: "Todo List App",
        description: "A basic todo list app to add and delete items.",
        techStack: ["HTML", "CSS"],
      },
      BASE_TECH_CANDIDATE,
      null
    );

    assert.equal(ragEval.shouldIncludeOnResume, true);
    assert.ok(ragEval.overallScore >= 72);
    assert.equal(cloneEval.shouldIncludeOnResume, false);
    assert.ok(ragEval.overallScore > cloneEval.overallScore + 25);
  });

  await t.test("5. Real-time SSE Event Bus dispatches live updates synchronously to subscribers", () => {
    const received: string[] = [];
    const unsub = subscribeRealtimeEvents((evt) => {
      received.push(`${evt.type}:${evt.message}`);
    });
    try {
      publishRealtimeEvent("OPPORTUNITY_UPSERTED", "Added AI Intern at Groww");
      assert.equal(received.length, 1);
      assert.ok(received[0].includes("OPPORTUNITY_UPSERTED:Added AI Intern at Groww"));
    } finally {
      unsub();
    }
  });

  await t.test("6. Vicinity blocks foreign noise (Qatar/Doha/Poland/Ontario) AND honors user destination prompts dynamically", () => {
    const delhiPref = deriveLocationPreferenceFromProfile("New Delhi, India");
    const torontoPref = deriveLocationPreferenceFromProfile("Toronto, Ontario, Canada");

    const oppQatar = enrichOpportunityWithLocationIntelligence(
      {
        id: "opp-qatar",
        title: "Research Intern",
        organization: "Doha Institute",
        category: "Internship",
        description: "Work in Doha.",
        location: "Doha, Qatar",
        workMode: "On-site",
        compensation: "Paid",
        eligibilityRequirements: [],
        requiredSkills: ["Python"],
        preferredSkills: [],
        applyUrl: "https://example.com/q",
        sourceName: "Test",
        sourceUrl: "https://example.com/q",
        sourceConfidence: 0.9,
        verificationStatus: "VERIFIED_SOURCE",
        sourceEvidence: [],
        discoveredAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        isDemo: false,
      },
      delhiPref
    );

    const oppOntario = { ...oppQatar, id: "opp-ontario", location: "Ontario, Canada", workMode: "Remote" as const };
    const oppPoland = { ...oppQatar, id: "opp-poland", location: "Remote - Poland", workMode: "Remote" as const };
    const oppWorldwide = { ...oppQatar, id: "opp-ww", location: "Worldwide", workMode: "Remote" as const };

    // Blocked for New Delhi candidate in strict VICINITY mode
    assert.equal(isOpportunityWithinUserVicinity(oppQatar, delhiPref).matches, false);
    assert.equal(isOpportunityWithinUserVicinity(oppOntario, delhiPref).matches, false);
    assert.equal(isOpportunityWithinUserVicinity(oppPoland, delhiPref).matches, false);
    assert.equal(isOpportunityWithinUserVicinity(oppWorldwide, delhiPref).matches, false);

    // Zero hardcoded lock: for a Canadian candidate in Toronto, Ontario IS within vicinity!
    assert.equal(isOpportunityWithinUserVicinity(oppOntario, torontoPref).matches, true);

    // Explicit natural-language prompt overrides allow any state, country, or global scope
    const intentBlr = parseSearchIntent("AI intern in Bengaluru");
    assert.equal(intentBlr.location, "Bengaluru, India");
    assert.equal(intentBlr.locationScope, "CITY");
    assert.equal(
      doesOpportunityMatchRequestedDestination("Bengaluru, Karnataka, India", "Hybrid", intentBlr.location!, intentBlr.locationScope),
      true
    );
    assert.equal(
      doesOpportunityMatchRequestedDestination("New Delhi, India", "On-site", intentBlr.location!, intentBlr.locationScope),
      false
    );

    const intentUs = parseSearchIntent("Remote ML roles in United States");
    assert.equal(intentUs.location, "United States");
    assert.equal(intentUs.locationScope, "COUNTRY");
    assert.equal(
      doesOpportunityMatchRequestedDestination("Remote - US", "Remote", intentUs.location!, intentUs.locationScope),
      true
    );
    assert.equal(
      doesOpportunityMatchRequestedDestination("Doha, Qatar", "On-site", intentUs.location!, intentUs.locationScope),
      false
    );

    const intentGlobal = parseSearchIntent("Software engineer worldwide");
    assert.equal(intentGlobal.locationScope, "GLOBAL");
    assert.equal(
      doesOpportunityMatchRequestedDestination("Doha, Qatar", "On-site", intentGlobal.location!, intentGlobal.locationScope),
      true
    );
  });
});
