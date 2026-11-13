import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SEARCH_CONFIG,
  EMPTY_LIVE_OPPORTUNITIES_MESSAGE,
  assertNoDemoDataInLiveMode,
  isDemoOrFixtureRecord,
  resolveSearchConfig,
} from "../lib/search-config";
import { resolveDatabaseUrl, prisma } from "../lib/db";
import { SearchProviderRegistry } from "../lib/providers/provider-registry";
import { executeAdaptiveSearchLoop } from "../lib/agent/adaptive-search-loop";
import { runOpportunityDiscoveryAgent } from "../lib/agent/orchestrator";
import { getSearchAdapter } from "../lib/adapters/search-adapter";
import { recordUserFeedbackSignal } from "../lib/feedback-engine";
import { GET as getOpportunitiesRoute } from "../app/api/opportunities/route";
import { POST as postTrackerRoute, GET as getTrackerRoute } from "../app/api/tracker/route";
import { POST as postFeedbackRoute } from "../app/api/feedback/route";
import { POST as postPrepPlanRoute } from "../app/api/preparation-plans/route";
import { GET as getAiIntelligenceRoute } from "../app/api/ai/intelligence/route";
import { SearchQueryItem } from "../types";
import { SearchProvider } from "../lib/providers/types";

describe("Permanent No-Mock-Data Policy Enforcement", () => {
  it("1. defaults search configuration to LIVE mode and never silently falls back to DEMO", () => {
    assert.equal(DEFAULT_SEARCH_CONFIG.mode, "LIVE");
    const resolvedDefault = resolveSearchConfig();
    assert.equal(resolvedDefault.mode, "LIVE");

    const resolvedExplicitLive = resolveSearchConfig({ mode: "LIVE" });
    assert.equal(resolvedExplicitLive.mode, "LIVE");

    const resolvedExplicitDemo = resolveSearchConfig({ mode: "DEMO" });
    assert.equal(resolvedExplicitDemo.mode, "DEMO");
  });

  it("2. separates production and test database configurations", () => {
    const testUrl = resolveDatabaseUrl();
    assert.ok(testUrl.includes("test.db"));
    assert.notEqual(testUrl, "file:./dev.db");
  });

  it("3. excludes all demo providers in LIVE mode and blocks demo provider execution in LIVE mode", async () => {
    const registry = new SearchProviderRegistry();
    const liveConfig = resolveSearchConfig({ mode: "LIVE" });
    const activeLiveProviders = registry.getActiveProviders(liveConfig);

    assert.ok(activeLiveProviders.length > 0);
    for (const provider of activeLiveProviders) {
      assert.equal(provider.id.startsWith("demo_"), false);
    }

    // Even if a caller directly invokes executeProviderWithGuards on a demo provider in LIVE mode, it must be blocked
    const demoProvider = registry.getProvider("demo_career_feeds")!;
    const queryItem: SearchQueryItem = {
      id: "test-guard-1",
      query: "software engineer intern",
      strategy: "DIRECT_ROLE",
      roleTitles: ["Software Engineer Intern"],
      skillCombinations: [],
      projectKeywords: [],
      locationFilters: [],
      workModeFilters: [],
      experienceLevelTerms: ["Intern"],
      companyTargets: [],
      targetProviders: ["demo_career_feeds"],
      exclusionTerms: [],
      rationale: "Guard verification",
      expectedCategory: "Internship",
      priority: 1,
      maxResults: 10,
    };
    const result = await registry.executeProviderWithGuards(demoProvider, {
      queryItem,
      config: liveConfig,
      roundNumber: 1,
      limit: 10,
    });
    assert.equal(result.status, "FAILED");
    assert.equal(result.opportunities.length, 0);
    assert.ok(
      result.warnings.some((w) => w.includes("NO_MOCK_DATA_POLICY"))
    );
  });

  it("4. strips any fixture record leaked by a misbehaving provider in LIVE mode and enforces assertNoDemoDataInLiveMode", async () => {
    const leakyLiveProvider: SearchProvider = {
      id: "leaky_live_provider",
      displayName: "Leaky Live Provider",
      description: "Test provider that attempts to return a fixture in LIVE mode",
      scopeNote: "Test only",
      isEnabled: () => true,
      search: async ({ queryItem }) => ({
        provider: "leaky_live_provider",
        queryExecuted: queryItem.query,
        sourcesChecked: ["https://acme-demo.test/jobs/1"],
        warnings: [],
        status: "SUCCESS",
        opportunities: [
          {
            externalId: "demo-leaked-1",
            title: "Fake Demo Opportunity",
            organization: "Acme Demo Corp",
            category: "Internship",
            description: "Fake description",
            location: "Remote",
            workMode: "Remote",
            compensation: "$50/hr",
            eligibilityRequirements: [],
            requiredSkills: ["Python"],
            preferredSkills: [],
            publishedAt: new Date().toISOString(),
            deadline: null,
            deadlineRaw: null,
            applyUrl: "https://acme-demo.test/jobs/1",
            sourceName: "Demo Fixture",
            sourceUrl: "https://acme-demo.test/jobs/1",
            sourceConfidence: 1,
            verificationStatus: "DEMO_DATA",
            sourceEvidence: [],
            isDemo: true,
          },
        ],
        fetchedAt: new Date().toISOString(),
      }),
    };

    const registry = new SearchProviderRegistry([leakyLiveProvider]);
    const liveConfig = resolveSearchConfig({ mode: "LIVE", cacheTtlSeconds: 0 });
    const queryItem: SearchQueryItem = {
      id: "test-leak-1",
      query: "python intern",
      strategy: "DIRECT_ROLE",
      roleTitles: ["Python Intern"],
      skillCombinations: ["Python"],
      projectKeywords: [],
      locationFilters: [],
      workModeFilters: [],
      experienceLevelTerms: ["Intern"],
      companyTargets: [],
      targetProviders: ["leaky_live_provider"],
      exclusionTerms: [],
      rationale: "Leak test",
      expectedCategory: "Internship",
      priority: 1,
      maxResults: 10,
    };

    const res = await registry.executeProviderWithGuards(leakyLiveProvider, {
      queryItem,
      config: liveConfig,
      roundNumber: 1,
      limit: 10,
    });
    assert.equal(res.opportunities.length, 0);

    assert.throws(
      () =>
        assertNoDemoDataInLiveMode("LIVE", [
          {
            id: "demo-opp-1",
            isDemo: true,
            verificationStatus: "DEMO_DATA",
          },
        ]),
      /NO_MOCK_DATA_POLICY_VIOLATION/
    );
  });

  it("5. never fabricates results or falls back to DEMO when all LIVE providers fail", async () => {
    const failingLiveProvider: SearchProvider = {
      id: "failing_live_provider",
      displayName: "Failing Live Provider",
      description: "Simulates upstream network failure",
      scopeNote: "Test only",
      isEnabled: () => true,
      search: async ({ queryItem }) => ({
        provider: "failing_live_provider",
        queryExecuted: queryItem.query,
        sourcesChecked: [],
        warnings: ["HTTP 503 Service Unavailable from upstream employer feed"],
        status: "FAILED",
        opportunities: [],
        fetchedAt: new Date().toISOString(),
      }),
    };

    const registry = new SearchProviderRegistry([failingLiveProvider]);
    const loopResult = await executeAdaptiveSearchLoop({
      profile: undefined as any,
      userQuery: "machine learning intern",
      configOverrides: { mode: "LIVE", maxRounds: 1, queriesPerRound: 1, cacheTtlSeconds: 0 },
      registry,
    });

    assert.equal(loopResult.mode, "LIVE");
    assert.equal(loopResult.shortlist.length, 0);
    assert.equal(loopResult.allEvaluated.length, 0);
    assert.ok(
      loopResult.coverageSummary.providersFailed.includes("failing_live_provider")
    );
  });

  it("6. getSearchAdapter never returns DemoSearchAdapter in LIVE mode", () => {
    const liveAdapter = getSearchAdapter("LIVE");
    assert.equal(liveAdapter.isLive, true);
    assert.ok(!liveAdapter.name.includes("Demo"));

    const demoAdapter = getSearchAdapter("DEMO");
    assert.equal(demoAdapter.isLive, false);
  });

  it("7. DEMO mode runs are strictly isolated and never insert demo opportunities into SQLite", async () => {
    const countBefore = await prisma.opportunity.count({
      where: { isDemo: true },
    });
    assert.equal(countBefore, 0);

    const demoRun = await runOpportunityDiscoveryAgent({
      query: "software engineer intern",
      mode: "DEMO",
      maxRounds: 1,
    });

    assert.equal(demoRun.mode, "DEMO");
    assert.ok(demoRun.opportunities.length > 0);

    const countAfter = await prisma.opportunity.count({
      where: { isDemo: true },
    });
    assert.equal(countAfter, 0);
  });

  it("8. blocks demo fixture opportunities from entering Application Tracker, User Feedback, and Preparation Plans", async () => {
    // 8a. Tracker POST rejects demo opportunityId with 422
    const trackerReq = new Request("http://localhost:3000/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: "demo-opp-1",
        stage: "SAVED",
      }),
    });
    const trackerRes = await postTrackerRoute(trackerReq);
    assert.equal(trackerRes.status, 422);
    const trackerBody = await trackerRes.json();
    assert.ok(
      trackerBody.error.includes("Demo fixture opportunities cannot be saved")
    );

    // 8b. Feedback POST rejects demo opportunityId with 422
    const feedbackReq = new Request("http://localhost:3000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: "demo-opp-1",
        signalType: "SAVE",
      }),
    });
    const feedbackRes = await postFeedbackRoute(feedbackReq);
    assert.equal(feedbackRes.status, 422);

    await assert.rejects(
      async () =>
        recordUserFeedbackSignal({
          opportunityId: "demo-opp-2",
          signalType: "MARK_RELEVANT",
        }),
      /NO_MOCK_DATA_POLICY_VIOLATION/
    );

    // 8c. Preparation Plan POST rejects demo opportunityId with 422
    const prepReq = new Request("http://localhost:3000/api/preparation-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: "demo-opp-1",
      }),
    });
    const prepRes = await postPrepPlanRoute(prepReq);
    assert.equal(prepRes.status, 422);
  });

  it("9. GET /api/opportunities in LIVE mode never returns demo fixtures and returns the exact honest empty message when no matches exist", async () => {
    const liveReq = new Request(
      "http://localhost:3000/api/opportunities?mode=LIVE&q=zzqwxvnonexistent98765"
    );
    const liveRes = await getOpportunitiesRoute(liveReq);
    assert.equal(liveRes.status, 200);
    const liveData = await liveRes.json();

    assert.equal(liveData.mode, "LIVE");
    assert.equal(liveData.isDemo, false);
    assert.equal(liveData.opportunities.length, 0);
    assert.equal(liveData.emptyStateMessage, EMPTY_LIVE_OPPORTUNITIES_MESSAGE);
    assert.equal(
      liveData.personalizationSummary,
      "No verified opportunities found from the currently available sources."
    );

    // Also verify all LIVE opportunities in DB have isDemo === false
    const allLiveReq = new Request("http://localhost:3000/api/opportunities?mode=LIVE");
    const allLiveRes = await getOpportunitiesRoute(allLiveReq);
    const allLiveData = await allLiveRes.json();
    for (const item of allLiveData.opportunities) {
      assert.equal(isDemoOrFixtureRecord(item.opportunity), false);
      assert.equal(item.opportunity.isDemo, false);
    }
  });

  it("10. GET /api/ai/intelligence does not invent candidate skills when no profile exists for a user", async () => {
    const req = new Request("http://localhost:3000/api/ai/intelligence?mode=LIVE");
    const res = await getAiIntelligenceRoute(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.mode, "LIVE");
    assert.equal(typeof data.aiConfigured, "boolean");
  });

  it("11. GET /api/tracker never returns demo records", async () => {
    const req = new Request("http://localhost:3000/api/tracker?mode=LIVE");
    const res = await getTrackerRoute(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    for (const app of data.applications) {
      assert.equal(isDemoOrFixtureRecord(app.opportunity), false);
    }
  });
});
