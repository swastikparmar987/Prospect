import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadActiveUserProfile, runOpportunityDiscoveryAgent } from "@/lib/agent/orchestrator";
import { evaluateOpportunity } from "@/lib/scoring-engine";
import { generatePreparationPlan } from "@/lib/gap-action-engine";
import { doesOpportunityMatchRequestedDestination, parseSearchIntent } from "@/lib/query-intent-parser";
import {
  Opportunity,
  EvaluationResult,
  LocationDiscoveryMode,
  FeedbackSignalType,
  UserFeedbackRecord,
} from "@/types";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { applyEmployerDiversity, applyMultiPlatformDiversity, computeConcentrationMetrics } from "@/lib/search-diversity";
import { publishRealtimeEvent } from "@/lib/realtime/opportunity-events";
import {
  doesOpportunityMatchCity,
  enrichOpportunityWithLocationIntelligence,
  filterOpportunitiesByLocationMode,
} from "@/lib/location-intelligence";
import { evaluateRankingPerformance } from "@/lib/ai/semantic-embeddings";
import {
  EMPTY_LIVE_OPPORTUNITIES_MESSAGE,
  assertNoDemoDataInLiveMode,
  isDemoOrFixtureRecord,
} from "@/lib/search-config";

function matchesPlatformFilter(
  sourceName: string,
  applyUrl: string,
  platform: string
): boolean {
  const p = (platform || "ALL").toUpperCase();
  if (p === "ALL") return true;
  const sLower = (sourceName || "").toLowerCase();
  const uLower = (applyUrl || "").toLowerCase();
  if (p === "LINKEDIN") {
    return sLower.includes("linkedin") || uLower.includes("linkedin.com/jobs");
  }
  if (p === "NAUKRI") {
    return sLower.includes("naukri") || uLower.includes("naukri.com");
  }
  if (p === "INDEED") {
    return sLower.includes("indeed") || uLower.includes("indeed.");
  }
  if (p === "BOARDS") {
    return sLower.includes("board");
  }
  if (p === "PUBLIC") {
    return /(remotive|arbeitnow|himalayas|freehire)/i.test(sLower);
  }
  return true;
}

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    const category = searchParams.get("category");
    const workMode = searchParams.get("workMode");
    const locationParam = searchParams.get("location");
    const deadlineParam = searchParams.get("deadline");
    const action = searchParams.get("action");
    const sortBy = searchParams.get("sortBy") || "fit"; // fit, semantic, action, deadline, recency, distance
    const rawModeParam = searchParams.get("mode")?.toUpperCase();
    if (rawModeParam === "DEMO") {
      return NextResponse.json(
        {
          error:
            "NO_MOCK_DATA_POLICY_VIOLATION: Demo/mock mode is disabled. Prospect operates exclusively on verified live sources.",
        },
        { status: 422 }
      );
    }
    const modeParam = "LIVE" as const;
    const locationModeParam = (searchParams.get("locationMode") || "ALL") as LocationDiscoveryMode;
    const selectedCityParam = searchParams.get("selectedCity") || "";
    let platformParam = (searchParams.get("platform") || "ALL").toUpperCase();
    if (platformParam === "ALL" && query) {
      if (/\b(?:on\s+|from\s+)?linkedin(?:\s+only)?\b/i.test(query)) {
        platformParam = "LINKEDIN";
      } else if (/\b(?:on\s+|from\s+)?naukri(?:\.com)?(?:\s+only)?\b/i.test(query)) {
        platformParam = "NAUKRI";
      }
    }

    const requireProfile = searchParams.get("requireProfile") === "1";
    const freshSinceParam = searchParams.get("freshSince");
    const freshSinceDate =
      freshSinceParam && !isNaN(Date.parse(freshSinceParam))
        ? new Date(freshSinceParam)
        : null;

    const profile = await loadActiveUserProfile(user.userId);
    const hasConfiguredProfile = Boolean(
      profile &&
        ((profile.skills && profile.skills.length > 0) ||
          (profile.targetRoles && profile.targetRoles.length > 0) ||
          (profile.projects && profile.projects.length > 0))
    );

    if (requireProfile && !hasConfiguredProfile) {
      return NextResponse.json({
        mode: modeParam,
        totalCount: 0,
        opportunities: [],
        diversityMetrics: computeConcentrationMetrics([]),
        personalizationSummary:
          "Upload your resume first to unlock real-time opportunity discovery tailored to your capabilities.",
        emptyStateMessage:
          "Upload your resume first to run real-time opportunity discovery tailored to your skills.",
        profileConfigured: false,
        rankingMetrics: null,
        locationPreference: null,
        lastChecked: new Date().toISOString(),
        isDemo: false,
      });
    }

    const rawHidden = Array.isArray(profile?.hiddenEmployers)
      ? profile.hiddenEmployers
      : [];
    const hiddenEmployersSet = new Set(
      rawHidden.map((e) => e.trim().toLowerCase())
    );

    const effectiveFreshCutoff =
      freshSinceDate ||
      (requireProfile && hasConfiguredProfile && profile?.createdAt
        ? new Date(new Date(profile.createdAt).getTime() - 10000)
        : null);

    const opportunitiesRaw = await prisma.opportunity.findMany({
      where: {
        isDemo: false,
        ...(category && category !== "ALL" ? { category } : {}),
        ...(workMode && workMode !== "ALL" ? { workMode } : {}),
        ...(effectiveFreshCutoff ? { lastCheckedAt: { gte: effectiveFreshCutoff } } : {}),
      },
      include: {
        evaluations: {
          orderBy: { evaluatedAt: "desc" },
          take: 1,
        },
        preparationPlans: {
          take: 1,
        },
      },
      orderBy: { discoveredAt: "desc" },
    });

    // Hydrate lightweight Opportunity shapes BEFORE running heavy ML/RAG evaluation
    let candidates = opportunitiesRaw
      .filter((item) => !item.isDemo && !hiddenEmployersSet.has(item.organization.trim().toLowerCase()))
      .map((item) => {
        const parsedEmbedding: number[] = (() => {
          try {
            const arr = JSON.parse((item as any).embeddingJson || "[]");
            return Array.isArray(arr) ? arr : [];
          } catch {
            return [];
          }
        })();
        const parsedAiStructured = (() => {
          try {
            const obj = JSON.parse((item as any).aiStructuredJson || "{}");
            return obj && typeof obj === "object" && obj.extractedAt ? obj : null;
          } catch {
            return null;
          }
        })();

        const baseOpp: Opportunity = {
          id: item.id,
          title: item.title,
          organization: item.organization,
          category: item.category as any,
          employmentType: (item as any).employmentType || item.category,
          roleFamily: item.roleFamily || "General Technical",
          seniority: item.seniority || "Intern / Early-Career",
          description: item.description,
          location: item.location,
          latitude: (item as any).latitude ?? null,
          longitude: (item as any).longitude ?? null,
          workMode: item.workMode as any,
          compensation: item.compensation,
          eligibilityRequirements: JSON.parse(item.eligibilityRequirements || "[]"),
          requiredSkills: JSON.parse(item.requiredSkills || "[]"),
          preferredSkills: JSON.parse(item.preferredSkills || "[]"),
          publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
          deadline: item.deadline ? item.deadline.toISOString() : null,
          deadlineRaw: item.deadlineRaw,
          applyUrl: item.applyUrl,
          applicationUrl: item.applyUrl,
          canonicalUrl: item.canonicalUrl || item.applyUrl,
          providerId: item.providerId,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          sourceSnippet: item.sourceSnippet || "",
          sourceConfidence: item.sourceConfidence,
          verificationStatus: item.verificationStatus as any,
          sourceEvidence: JSON.parse(item.sourceEvidence || "[]"),
          evidenceRecords: JSON.parse(item.sourceEvidence || "[]"),
          multiSourceProvenance: JSON.parse(item.multiSourceProvenance || "[]"),
          guardVerdict: (item.guardVerdict as any) || "CLEAN",
          embedding: parsedEmbedding.length > 0 ? parsedEmbedding : undefined,
          aiStructured: parsedAiStructured,
          isExpired: Boolean(item.isExpired),
          fetchedAt: item.fetchedAt
            ? item.fetchedAt.toISOString()
            : item.lastCheckedAt.toISOString(),
          discoveredAt: item.discoveredAt.toISOString(),
          lastCheckedAt: item.lastCheckedAt.toISOString(),
          isDemo: item.isDemo,
        };

        const opp = enrichOpportunityWithLocationIntelligence(
          baseOpp,
          profile?.locationPreference
        );

        return {
          opportunity: opp,
          evalId: item.evaluations?.[0]?.id,
          hasPrepPlan: item.preparationPlans.length > 0,
        };
      })
      .filter(({ opportunity }) => !isDemoOrFixtureRecord(opportunity));

    assertNoDemoDataInLiveMode(
      "LIVE",
      candidates.map((x) => x.opportunity)
    );

    const explicitIntent = query ? parseSearchIntent(query) : null;
    const hasExplicitDestinationPrompt = Boolean(explicitIntent?.location);

    // Pre-filter Location & Vicinity BEFORE heavy cosine/BM25 scoring (~10x faster)
    // User freedom rule: if the user explicitly prompts another city/state/country or global/worldwide,
    // honor their requested destination instead of locking them into the resume's default vicinity.
    if (hasExplicitDestinationPrompt && explicitIntent?.location) {
      if (explicitIntent.locationScope !== "GLOBAL") {
        candidates = candidates.filter(({ opportunity }) =>
          doesOpportunityMatchRequestedDestination(
            opportunity.location,
            opportunity.workMode,
            explicitIntent.location!,
            explicitIntent.locationScope
          )
        );
      }
    } else if (locationModeParam && locationModeParam !== "ALL" && !(locationParam && locationParam !== "ALL")) {
      const allowedOpps = new Set(
        filterOpportunitiesByLocationMode(
          candidates.map((x) => x.opportunity),
          locationModeParam,
          profile?.locationPreference,
          selectedCityParam,
          profile?.preferredLocations || []
        ).map((o) => o.id)
      );
      candidates = candidates.filter(({ opportunity }) => allowedOpps.has(opportunity.id));
    }

    if (locationParam && locationParam !== "ALL") {
      candidates = candidates.filter(
        ({ opportunity }) =>
          doesOpportunityMatchCity(opportunity.location, locationParam) ||
          opportunity.location.toLowerCase().includes(locationParam.toLowerCase())
      );
    }

    if (platformParam && platformParam !== "ALL") {
      candidates = candidates.filter(({ opportunity }) =>
        matchesPlatformFilter(opportunity.sourceName, opportunity.applyUrl, platformParam)
      );
    }

    // Score only surviving candidates cleanly
    let items: Array<{
      opportunity: Opportunity;
      evaluation: EvaluationResult;
      hasPrepPlan: boolean;
    }> = candidates.map(({ opportunity, evalId, hasPrepPlan }) => {
      const freshEval = evaluateOpportunity(opportunity, profile);
      return {
        opportunity,
        evaluation: evalId ? { ...freshEval, id: evalId } : freshEval,
        hasPrepPlan,
      };
    });

    // 1. Natural Language Intent & Keyword Filter
    if (query) {
      if (query === "paid only" || query === "paid") {
        items = items.filter(
          ({ opportunity }) =>
            !opportunity.compensation.toLowerCase().includes("unpaid") &&
            !opportunity.compensation.toLowerCase().includes("volunteer") &&
            opportunity.compensation.length > 0
        );
      } else {
        const intent = explicitIntent || parseSearchIntent(query);
        const locationTokenSet = new Set((intent.matchedLocationTokens || []).map((t) => t.toLowerCase()));
        const STOPWORDS = new Set([
          "for", "in", "and", "the", "with", "a", "an", "to", "of", "on", "at", "by", "from",
          "students", "student", "seeking", "looking", "need", "accepting", "prior",
          "job", "jobs", "role", "roles", "opportunity", "opportunities", "opening", "openings",
          "position", "positions", "find", "show", "me", "near", "nearby", "around", "state", "country",
          "only", "platform", "source", "linkedin", "naukri", "com",
        ]);
        const tokens = query
          .toLowerCase()
          .replace(/[^a-z0-9+#\s]/g, " ")
          .split(/\s+/)
          .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !locationTokenSet.has(t));

        if (tokens.length === 0) {
          // Pure destination / mode prompt (e.g. "jobs in Bengaluru", "Worldwide", "Remote UK")
          if (intent.workMode) {
            items = items.filter(({ opportunity }) => opportunity.workMode === intent.workMode);
          }
        } else {
          items = items.filter(({ opportunity }) => {
            const title = opportunity.title.toLowerCase();
            const org = opportunity.organization.toLowerCase();
            const desc = opportunity.description.toLowerCase();
            const comp = opportunity.compensation.toLowerCase();
            const loc = opportunity.location.toLowerCase();
            const skills = opportunity.requiredSkills.map((s) => s.toLowerCase());

            // Direct whole-query substring match
            if (
              title.includes(query) ||
              org.includes(query) ||
              desc.includes(query) ||
              comp.includes(query)
            ) {
              return true;
            }

            // Structured intent skill match
            if (intent.skills.length > 0) {
              const hasSkill = intent.skills.some((sk) =>
                skills.includes(sk.toLowerCase()) || desc.includes(sk.toLowerCase())
              );
              if (hasSkill) return true;
            }

            // Structured intent work mode match
            if (intent.workMode && opportunity.workMode === intent.workMode) {
              if (tokens.some((tok) => title.includes(tok) || desc.includes(tok))) {
                return true;
              }
            }

            // Structured category match
            if (intent.category && opportunity.category === intent.category) {
              if (tokens.some((tok) => title.includes(tok) || desc.includes(tok) || skills.some((s) => s.includes(tok)))) {
                return true;
              }
            }

            // Token overlap: at least 1 significant token in title/skills, or >= 2 in full text
            const titleOrSkillMatch = tokens.some(
              (tok) => title.includes(tok) || skills.some((s) => s.includes(tok))
            );
            if (titleOrSkillMatch) return true;

            const descMatches = tokens.filter(
              (tok) => desc.includes(tok) || loc.includes(tok) || org.includes(tok)
            );
            return descMatches.length >= Math.min(2, tokens.length);
          });
        }
      }
    }

    // 2. Category, WorkMode & Location already applied in pre-evaluation stage
    // (Retain unused imports/helpers cleanly without duplicate passes)
    void doesOpportunityMatchCity;

    // 5. Deadline Filter (e.g. 14, 30, 60 days)
    if (deadlineParam && deadlineParam !== "ALL") {
      const maxDays = parseInt(deadlineParam, 10);
      if (!isNaN(maxDays)) {
        const cutoff = Date.now() + maxDays * 24 * 60 * 60 * 1000;
        items = items.filter(({ opportunity }) => {
          if (!opportunity.deadline) return false;
          const t = new Date(opportunity.deadline).getTime();
          return t >= Date.now() && t <= cutoff;
        });
      }
    }

    // 6. Recommendation Action Filter
    if (action && action !== "ALL") {
      items = items.filter(({ evaluation }) => evaluation.recommendation === action);
    }

    // 7. Sorting
    items.sort((a, b) => {
      if (sortBy === "fit") {
        const diff = b.evaluation.overallScore - a.evaluation.overallScore;
        if (Math.abs(diff) > 1.5) return diff;
        // Tie-break by vicinity proximity and recency
        const bProx = b.evaluation.scoreBreakdown.proximity || 0;
        const aProx = a.evaluation.scoreBreakdown.proximity || 0;
        if (bProx !== aProx) return bProx - aProx;
        const bTime = new Date(b.opportunity.publishedAt || b.opportunity.discoveredAt).getTime();
        const aTime = new Date(a.opportunity.publishedAt || a.opportunity.discoveredAt).getTime();
        return bTime - aTime;
      }
      if (sortBy === "semantic") {
        return (
          (b.evaluation.semanticScore || 0) - (a.evaluation.semanticScore || 0)
        );
      }
      if (sortBy === "distance") {
        const da = a.opportunity.distanceKm ?? 999999;
        const db = b.opportunity.distanceKm ?? 999999;
        return da - db;
      }
      if (sortBy === "action") {
        const actionOrder: Record<string, number> = {
          APPLY_NOW: 4,
          PREPARE_FIRST: 3,
          KEEP_WATCHING: 2,
          SKIP: 1,
        };
        return (
          (actionOrder[b.evaluation.recommendation] || 0) -
          (actionOrder[a.evaluation.recommendation] || 0)
        );
      }
      if (sortBy === "deadline") {
        if (!a.opportunity.deadline) return 1;
        if (!b.opportunity.deadline) return -1;
        return (
          new Date(a.opportunity.deadline).getTime() -
          new Date(b.opportunity.deadline).getTime()
        );
      }
      if (sortBy === "recency") {
        return (
          new Date(b.opportunity.discoveredAt).getTime() -
          new Date(a.opportunity.discoveredAt).getTime()
        );
      }
      return 0;
    });

    // 8. Multi-Platform & Employer Concentration Re-ranking
    if (requireProfile && hasConfiguredProfile && !query) {
      items = items
        .filter(
          (x) =>
            x.evaluation.recommendation !== "SKIP" &&
            (x.evaluation.overallScore >= 42 ||
              (x.evaluation.positiveEvidence?.length || 0) > 0)
        )
        .slice(0, 120);
    }

    if (sortBy === "fit" || sortBy === "action") {
      items = applyMultiPlatformDiversity(applyEmployerDiversity(items, 3, 10), 2, 4, 12);
    }

    const diversityMetrics = computeConcentrationMetrics(items);

    // 9. Compute Dynamic Data-Derived Personalization Summary (Priority 6)
    const eligibleItems = items.filter(
      (x) => x.evaluation.hardBlockers.length === 0 && !x.opportunity.isExpired
    );
    const strongSkillMatches = eligibleItems.filter(
      (x) =>
        x.evaluation.recommendation === "APPLY_NOW" ||
        x.evaluation.overallScore >= 72 ||
        (x.evaluation.semanticScore || 0) >= 0.45
    );
    const topDemonstratedSkills = (profile?.skills || []).slice(0, 3);
    const locationPhrase = profile?.locationPreference?.city
      ? `matching ${profile.locationPreference.city} & your preferred work modes`
      : profile?.preferredLocations?.length
        ? `across ${profile.preferredLocations.slice(0, 2).join(" & ")}`
        : "from verified employer feeds";
    const personalizationSummary =
      items.length === 0
        ? EMPTY_LIVE_OPPORTUNITIES_MESSAGE
        : hasConfiguredProfile
          ? `Found ${eligibleItems.length} eligible opportunit${
              eligibleItems.length === 1 ? "y" : "ies"
            } (${items.length} total) ${locationPhrase}. ${
              strongSkillMatches.length
            } strongly match your demonstrated ${
              topDemonstratedSkills.length > 0
                ? topDemonstratedSkills.join(", ")
                : "profile"
            } capabilities.`
          : `Found ${eligibleItems.length} verified opportunit${
              eligibleItems.length === 1 ? "y" : "ies"
            } (${items.length} total) ${locationPhrase}. Upload your resume or add skills in Profile to enable personalized candidate-to-job matching.`;

    // 10. Compute ML Ranking Evaluation Metrics (Precision@K, Recall@K, NDCG@K)
    let rankingMetrics = null;
    if (profile) {
      try {
        const [feedbackRows, appRows] = await Promise.all([
          prisma.userFeedback.findMany({ take: 100 }),
          prisma.application.findMany({ take: 100 }),
        ]);
        const fbRecords: UserFeedbackRecord[] = feedbackRows.map((r) => ({
          id: r.id,
          profileId: r.profileId,
          opportunityId: r.opportunityId,
          organization: r.organization,
          roleFamily: r.roleFamily,
          signalType: r.signalType as FeedbackSignalType,
          outcome: (r.outcome as any) ?? null,
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
        }));
        const evalMap = new Map<string, EvaluationResult>();
        for (const it of items) {
          evalMap.set(it.opportunity.id, it.evaluation);
        }
        rankingMetrics = evaluateRankingPerformance({
          rankedOpportunities: items.map((x) => x.opportunity),
          evaluationsByOppId: evalMap,
          feedbackRecords: fbRecords,
          applications: appRows as any,
          profile,
        });
      } catch {
        // Non-fatal if feedback tables are empty
      }
    }

    return NextResponse.json({
      mode: modeParam,
      totalCount: items.length,
      opportunities: items,
      diversityMetrics,
      personalizationSummary,
      emptyStateMessage:
        items.length === 0 ? EMPTY_LIVE_OPPORTUNITIES_MESSAGE : null,
      profileConfigured: hasConfiguredProfile,
      rankingMetrics,
      locationPreference: profile?.locationPreference || null,
      lastChecked: new Date().toISOString(),
      isDemo: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to query opportunities",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || "";
    const category = body.category;
    const workMode = body.workMode;
    const location = body.location;
    if (typeof body.mode === "string" && body.mode.toUpperCase() === "DEMO") {
      return NextResponse.json(
        {
          error:
            "NO_MOCK_DATA_POLICY_VIOLATION: Demo/mock mode is disabled. Live discovery only.",
        },
        { status: 422 }
      );
    }
    const mode = "LIVE" as const;
    const reqUser = resolveAuthenticatedUser(req);
    const reqProfile = await loadActiveUserProfile(reqUser.userId);
    const requestedLocMode = (body.locationMode || "ALL") as LocationDiscoveryMode;
    const requestedPlatform = typeof body.platform === "string" ? body.platform.toUpperCase() : "ALL";
    const requestedSelectedCity =
      typeof body.selectedCity === "string"
        ? body.selectedCity
        : typeof location === "string"
          ? location
          : "";
    const maxRounds = typeof body.maxRounds === "number" ? body.maxRounds : undefined;
    const configOverrides = body.configOverrides || {
      ...(typeof body.queriesPerRound === "number"
        ? { queriesPerRound: body.queriesPerRound }
        : {}),
      ...(typeof body.resultsPerProvider === "number"
        ? { resultsPerProvider: body.resultsPerProvider }
        : {}),
      ...(typeof body.searchBudgetPerRun === "number"
        ? { searchBudgetPerRun: body.searchBudgetPerRun }
        : {}),
      ...(typeof body.minMarginalYield === "number"
        ? { minMarginalYield: body.minMarginalYield }
        : {}),
    };

    const result = await runOpportunityDiscoveryAgent({
      query,
      category,
      workMode,
      location,
      mode,
      maxRounds,
      userProfile: reqProfile ?? null,
      configOverrides,
      signal: req.signal,
    });

    if (result.mode === "LIVE") {
      assertNoDemoDataInLiveMode(
        "LIVE",
        result.opportunities.map((x) => x.opportunity)
      );
    }

    const postIntent = query ? parseSearchIntent(query) : null;
    let filteredOpps = result.opportunities.map((x) => ({
      ...x,
      opportunity: enrichOpportunityWithLocationIntelligence(
        x.opportunity,
        reqProfile?.locationPreference
      ),
    }));

    if (postIntent?.location) {
      if (postIntent.locationScope !== "GLOBAL") {
        filteredOpps = filteredOpps.filter((x) =>
          doesOpportunityMatchRequestedDestination(
            x.opportunity.location,
            x.opportunity.workMode,
            postIntent.location!,
            postIntent.locationScope
          )
        );
      }
    } else if (requestedLocMode && requestedLocMode !== "ALL") {
      const allowedIds = new Set(
        filterOpportunitiesByLocationMode(
          filteredOpps.map((x) => x.opportunity),
          requestedLocMode,
          reqProfile?.locationPreference,
          requestedSelectedCity,
          reqProfile?.preferredLocations || []
        ).map((o) => o.id)
      );
      filteredOpps = filteredOpps.filter((x) => allowedIds.has(x.opportunity.id));
    }

    if (requestedPlatform && requestedPlatform !== "ALL") {
      filteredOpps = filteredOpps.filter((x) =>
        matchesPlatformFilter(x.opportunity.sourceName, x.opportunity.applyUrl, requestedPlatform)
      );
    }

    // Automatically synthesize real, resume-grounded preparation plans for top 3 live matches
    if (reqProfile && filteredOpps.length > 0) {
      const topForPrep = [...filteredOpps]
        .filter((x) => x.evaluation.recommendation !== "SKIP")
        .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore)
        .slice(0, 3);

      for (const item of topForPrep) {
        try {
          const generated = generatePreparationPlan(
            item.opportunity,
            reqProfile,
            item.evaluation
          );
          await prisma.preparationPlan.deleteMany({
            where: { opportunityId: item.opportunity.id, userId: reqUser.userId },
          });
          await prisma.preparationPlan.create({
            data: {
              userId: reqUser.userId,
              opportunityId: item.opportunity.id,
              title: generated.title,
              summary: generated.summary,
              items: JSON.stringify(generated.items),
            },
          });
        } catch {
          // Non-fatal if DB write skipped
        }
      }
    }

    if (filteredOpps.length > 0) {
      publishRealtimeEvent(
        "OPPORTUNITY_UPSERTED",
        `Discovery agent found ${filteredOpps.length} verified live opportunities matching ${postIntent?.location || "your selected scope"}.`,
        {
          count: filteredOpps.length,
          query,
        },
        reqUser.userId
      );
    }
    publishRealtimeEvent(
      "SEARCH_COMPLETED",
      `Agent search finished for "${query || "profile matches"}".`,
      {
        totalFound: filteredOpps.length,
      },
      reqUser.userId
    );

    return NextResponse.json({
      ...result,
      opportunities: filteredOpps,
      emptyStateMessage:
        filteredOpps.length === 0 && result.mode === "LIVE"
          ? EMPTY_LIVE_OPPORTUNITIES_MESSAGE
          : null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Agent run failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
