import { prisma } from "../db";
import {
  DEFAULT_PARTICIPATING_COMPANY_BOARDS,
  buildBoardEndpointUrl,
  CareerFeedsProvider,
} from "../providers/career-feeds-provider";
import { FreeHireProvider } from "../providers/freehire-provider";
import { normalizeOpportunity, isOpportunityDeadlineExpired } from "../normalizer";
import { evaluateOpportunity } from "../scoring-engine";
import { generatePreparationPlan } from "../gap-action-engine";
import { loadActiveUserProfile } from "../agent/orchestrator";
import { makeCanonicalJobKey, canonicalizeJobUrl } from "../posting-guard";
import { DEFAULT_SEARCH_CONFIG } from "../search-config";
import { RawOpportunity, MultiSourceProvenanceRecord } from "../../types";
import { generateOpportunityEmbedding } from "../ai/semantic-embeddings";
import { PublicJobBoardsProvider } from "../providers/public-boards-provider";
import { TavilySearchProvider } from "../providers/tavily-provider";
import { publishRealtimeEvent } from "../realtime/opportunity-events";

export interface SyncWorkerOptions {
  fetchImpl?: typeof fetch;
  providers?: Array<"CAREER_FEEDS" | "FREEHIRE" | "PUBLIC_BOARDS" | "TAVILY">;
  archiveStaleThresholdDays?: number;
  maxRetries?: number;
  maxBoards?: number;
}

export interface SyncWorkerResult {
  syncId: string;
  itemsFetched: number;
  itemsAdded: number;
  itemsUpdated: number;
  itemsExpired: number;
  durationMs: number;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  providerStatuses: Record<string, "SUCCESS" | "FAILED" | "SKIPPED">;
  failedProviders: string[];
  retryCount: number;
  errors: string[];
  completedAt: string;
}

export async function runOpportunitySyncWorker(
  options: SyncWorkerOptions = {}
): Promise<SyncWorkerResult> {
  const fetchImpl = options.fetchImpl || fetch;
  const providersToSync =
    options.providers ||
    (options.fetchImpl
      ? ["CAREER_FEEDS", "FREEHIRE", "PUBLIC_BOARDS"]
      : ["CAREER_FEEDS", "FREEHIRE", "PUBLIC_BOARDS", "TAVILY"]);
  const archiveThresholdDays = options.archiveStaleThresholdDays || 30;
  const maxRetries = options.maxRetries ?? 1;
  const maxBoards = options.maxBoards ?? DEFAULT_PARTICIPATING_COMPANY_BOARDS.length;

  const startTime = Date.now();
  const fetchedAt = new Date().toISOString();
  const now = new Date();

  let itemsFetched = 0;
  let itemsAdded = 0;
  let itemsUpdated = 0;
  let itemsExpired = 0;
  let retryCount = 0;
  const errors: string[] = [];
  const failedProviders: string[] = [];
  const providerStatuses: Record<string, "SUCCESS" | "FAILED" | "SKIPPED"> = {};

  const profile = await loadActiveUserProfile();

  // 1. Mark Expired Opportunities in Database
  try {
    const activeOpps = await prisma.opportunity.findMany({
      where: { isExpired: false },
    });

    for (const opp of activeOpps) {
      const isPast = opp.deadline ? new Date(opp.deadline).getTime() < now.getTime() : false;
      const isExpiredVerdict = isOpportunityDeadlineExpired(
        opp.deadline ? opp.deadline.toISOString() : null,
        true,
        now
      );

      if (isPast || isExpiredVerdict) {
        await prisma.opportunity.update({
          where: { id: opp.id },
          data: {
            isExpired: true,
            lastCheckedAt: now,
          },
        });
        itemsExpired++;
      } else {
        await prisma.opportunity.update({
          where: { id: opp.id },
          data: { lastCheckedAt: now },
        });
      }
    }
  } catch (err) {
    errors.push(`Expiry check error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2. Ingest from Registered Providers
  const discoveredRawItems: RawOpportunity[] = [];

  // Provider A: Career Feeds (Greenhouse, Lever, Ashby)
  if (providersToSync.includes("CAREER_FEEDS")) {
    const boardsToQuery = DEFAULT_PARTICIPATING_COMPANY_BOARDS.slice(0, maxBoards);
    const feedsProvider = new CareerFeedsProvider(boardsToQuery);
    let cfSuccess = 0;
    let cfFail = 0;

    for (const board of boardsToQuery) {
      const endpoint = buildBoardEndpointUrl(board);
      let succeeded = false;
      let lastErr = "";

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) retryCount++;
        try {
          const res = await fetchImpl(endpoint, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(6000),
          });

          if (res.ok) {
            const data = await res.json();
            const parsed = feedsProvider.parseBoardPayload(board, data, fetchedAt);
            const sortedFresh = parsed
              .sort((a, b) => {
                const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return tb - ta;
              })
              .slice(0, 40);
            discoveredRawItems.push(...sortedFresh);
            cfSuccess++;
            succeeded = true;
            break;
          } else {
            lastErr = `HTTP ${res.status}`;
          }
        } catch (err) {
          lastErr = err instanceof Error ? err.message : String(err);
        }
      }

      if (!succeeded) {
        cfFail++;
        failedProviders.push(`${board.companyName} (${board.platform})`);
        errors.push(`${board.companyName} feed error: ${lastErr}`);
      }
    }

    if (cfSuccess > 0) {
      providerStatuses["CAREER_FEEDS"] = "SUCCESS";
    } else if (cfFail > 0) {
      providerStatuses["CAREER_FEEDS"] = "FAILED";
    } else {
      providerStatuses["CAREER_FEEDS"] = "SKIPPED";
    }
  }

  // Provider B: FreeHire Open Index
  if (providersToSync.includes("FREEHIRE")) {
    const freeHireProvider = new FreeHireProvider();
    let fhSuccess = false;
    let fhLastErr = "";

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) retryCount++;
      try {
        const result = await freeHireProvider.search({
          queryItem: {
            id: "sync-freehire",
            query: "engineer intern",
            strategy: "DIRECT_ROLE",
            roleTitles: ["engineer", "intern"],
            skillCombinations: [],
            projectKeywords: [],
            locationFilters: [],
            workModeFilters: [],
            experienceLevelTerms: [],
            companyTargets: [],
            targetProviders: ["freehire"],
            exclusionTerms: [],
            rationale: "Background synchronization pass",
            expectedCategory: "Internship",
            priority: 1,
            maxResults: 25,
          },
          roundNumber: 1,
          limit: 25,
          config: DEFAULT_SEARCH_CONFIG,
          fetchImpl,
        });

        if (result.status === "SUCCESS" || result.status === "PARTIAL") {
          discoveredRawItems.push(...result.opportunities);
          providerStatuses["FREEHIRE"] = "SUCCESS";
          fhSuccess = true;
          break;
        } else {
          fhLastErr = result.warnings.join("; ") || "FreeHire returned FAILED status";
        }
      } catch (err) {
        fhLastErr = err instanceof Error ? err.message : String(err);
      }
    }

    if (!fhSuccess) {
      providerStatuses["FREEHIRE"] = "FAILED";
      failedProviders.push("FREEHIRE");
      errors.push(`FreeHire sync error: ${fhLastErr}`);
    }
  }

  // Provider C: Multi-Platform Public Job Boards (Remotive, Arbeitnow, Himalayas)
  if (providersToSync.includes("PUBLIC_BOARDS")) {
    try {
      const publicBoards = new PublicJobBoardsProvider();
      const targetRoles = profile?.targetRoles?.length
        ? profile.targetRoles
        : ["Machine Learning Intern", "Software Engineer"];
      const topSkills = (profile?.skills || ["Python", "TypeScript"]).slice(0, 4);
      const profileLocs = [
        profile?.locationPreference?.city || profile?.location || "",
        ...(profile?.preferredLocations || []),
      ].filter(Boolean);

      const pbResult = await publicBoards.search({
        queryItem: {
          id: "sync-public-boards",
          query: `${targetRoles[0]} ${topSkills.slice(0, 2).join(" ")}`,
          strategy: "DIRECT_ROLE",
          roleTitles: targetRoles,
          skillCombinations: topSkills,
          projectKeywords: [],
          locationFilters: profileLocs,
          workModeFilters: profile?.preferredWorkModes || [],
          experienceLevelTerms: ["Intern", "Early-Career"],
          companyTargets: [],
          targetProviders: ["public_boards"],
          exclusionTerms: ["Senior", "Director", "VP", "Principal"],
          rationale: "Background multi-platform public job board synchronization",
          expectedCategory: "Internship",
          priority: 1,
          maxResults: 30,
        },
        roundNumber: 1,
        limit: 30,
        config: DEFAULT_SEARCH_CONFIG,
        fetchImpl,
      });

      if (pbResult.status === "SUCCESS" || pbResult.status === "PARTIAL") {
        discoveredRawItems.push(...pbResult.opportunities);
        providerStatuses["PUBLIC_BOARDS"] = "SUCCESS";
      } else {
        providerStatuses["PUBLIC_BOARDS"] = "FAILED";
        failedProviders.push("PUBLIC_BOARDS");
      }
    } catch (err) {
      providerStatuses["PUBLIC_BOARDS"] = "FAILED";
      failedProviders.push("PUBLIC_BOARDS");
      errors.push(`Public boards sync error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Provider D: Targeted Multi-Platform Web Discovery via Tavily (LinkedIn / Naukri / Indeed / Wellfound)
  if (
    providersToSync.includes("TAVILY") &&
    !options.maxBoards &&
    process.env.TAVILY_API_KEY
  ) {
    try {
      const tavily = new TavilySearchProvider();
      const city =
        profile?.locationPreference?.city ||
        profile?.location?.split(",")[0]?.trim() ||
        "";
      const targetRole = profile?.targetRoles?.[0] || "Software Machine Learning Intern";
      const topSkill = profile?.skills?.[0] || "Python";
      const baseQueryItem = {
        strategy: "DIRECT_ROLE" as const,
        roleTitles: [targetRole],
        skillCombinations: (profile?.skills || []).slice(0, 4),
        projectKeywords: [],
        locationFilters: city ? [city] : [],
        workModeFilters: profile?.preferredWorkModes || [],
        experienceLevelTerms: ["Intern", "New Grad"],
        companyTargets: [],
        targetProviders: ["tavily"],
        exclusionTerms: ["Senior", "Director"],
        expectedCategory: "Internship" as const,
        priority: 1,
        maxResults: 8,
      };

      const country =
        profile?.locationPreference?.country ||
        (profile?.location?.includes(",")
          ? profile.location.split(",").pop()?.trim()
          : "") ||
        "India";
      const portalSpecs = [
        {
          id: "sync-tavily-linkedin-local",
          query: `${targetRole} ${topSkill} ${city ? `${city} ` : ""}site:linkedin.com/jobs/view`.trim(),
          includeDomains: ["linkedin.com", "in.linkedin.com"],
          locationFilters: city ? [city] : [],
          rationale: "Dedicated LinkedIn Jobs local vicinity index",
        },
        {
          id: "sync-tavily-linkedin-national",
          query: `Machine Learning Software Intern ${topSkill} ${country} site:linkedin.com/jobs/view`.trim(),
          includeDomains: ["linkedin.com", "in.linkedin.com"],
          locationFilters: [country],
          rationale: "Dedicated LinkedIn Jobs country-wide index",
        },
        {
          id: "sync-tavily-naukri",
          query: `Machine Learning AI Intern ${topSkill} ${country} job-listings`.trim(),
          includeDomains: ["naukri.com"],
          locationFilters: [country],
          rationale: "Dedicated Naukri.com individual job-listings index",
        },
        {
          id: "sync-tavily-portals",
          query: `${targetRole} ${topSkill} ${city ? `${city} ` : ""}(site:indeed.com OR site:wellfound.com OR site:internshala.com)`.trim(),
          locationFilters: city ? [city] : [],
          rationale: "Multi-platform web index (Indeed, Wellfound, Internshala)",
        },
      ];

      const tvResponses = await Promise.all(
        portalSpecs.map((spec) =>
          tavily.search({
            queryItem: {
              ...baseQueryItem,
              id: spec.id,
              query: spec.query,
              includeDomains: spec.includeDomains,
              locationFilters: spec.locationFilters,
              rationale: spec.rationale,
            },
            roundNumber: 1,
            limit: 8,
            config: { ...DEFAULT_SEARCH_CONFIG, mode: "LIVE" },
            fetchImpl,
          })
        )
      );

      let anyOk = false;
      for (const tvRes of tvResponses) {
        if (tvRes.status === "SUCCESS" || tvRes.status === "PARTIAL") {
          discoveredRawItems.push(...tvRes.opportunities);
          anyOk = true;
        }
      }

      if (anyOk) {
        providerStatuses["TAVILY"] = "SUCCESS";
      } else {
        providerStatuses["TAVILY"] = "FAILED";
        failedProviders.push("TAVILY");
      }
    } catch (err) {
      providerStatuses["TAVILY"] = "FAILED";
      errors.push(`Tavily portal sync error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  itemsFetched = discoveredRawItems.length;

  // 3. Deduplicate and Upsert into Database
  for (const raw of discoveredRawItems) {
    try {
      const safeCanonicalUrl = canonicalizeJobUrl(raw.canonicalUrl || raw.applicationUrl);
      const jobKey = makeCanonicalJobKey(raw.organization, raw.title, safeCanonicalUrl);

      // Check for existing opportunity
      const existing = await prisma.opportunity.findFirst({
        where: {
          OR: [
            { canonicalUrl: safeCanonicalUrl },
            { id: { startsWith: `opp-${jobKey}` } },
          ],
        },
      });

      if (existing) {
        // Merge multi-source provenance
        const existingProvenance: MultiSourceProvenanceRecord[] = JSON.parse(
          existing.multiSourceProvenance || "[]"
        );
        const alreadyHasSource = existingProvenance.some(
          (p) => p.sourceUrl === raw.sourceUrl || p.provider === raw.provider
        );

        if (!alreadyHasSource) {
          existingProvenance.push({
            provider: raw.provider,
            sourceName: raw.sourceName,
            sourceUrl: raw.sourceUrl,
            applicationUrl: raw.applicationUrl,
            fetchedAt,
            verificationStatus: "VERIFIED_SOURCE",
          });
        }

        await prisma.opportunity.update({
          where: { id: existing.id },
          data: {
            multiSourceProvenance: JSON.stringify(existingProvenance),
            lastCheckedAt: now,
            fetchedAt: now,
          },
        });
        itemsUpdated++;
      } else {
        // Normalize and insert fresh opportunity
        const normalized = normalizeOpportunity(raw, itemsAdded);
        normalized.verificationStatus = "VERIFIED_SOURCE";
        const oppEmbedding = generateOpportunityEmbedding(normalized);
        normalized.embedding = oppEmbedding;

        const evaluation = evaluateOpportunity(normalized, profile);

        await prisma.opportunity.create({
          data: {
            id: normalized.id,
            title: normalized.title,
            organization: normalized.organization,
            category: normalized.category,
            roleFamily: normalized.roleFamily,
            seniority: normalized.seniority,
            description: normalized.description,
            location: normalized.location,
            workMode: normalized.workMode,
            employmentType: normalized.employmentType || "",
            latitude: normalized.latitude ?? null,
            longitude: normalized.longitude ?? null,
            compensation: normalized.compensation,
            eligibilityRequirements: JSON.stringify(normalized.eligibilityRequirements || []),
            requiredSkills: JSON.stringify(normalized.requiredSkills || []),
            preferredSkills: JSON.stringify(normalized.preferredSkills || []),
            embeddingJson: JSON.stringify(oppEmbedding),
            publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : null,
            deadline: normalized.deadline ? new Date(normalized.deadline) : null,
            deadlineRaw: normalized.deadlineRaw || null,
            applyUrl: normalized.applyUrl,
            canonicalUrl: normalized.canonicalUrl || normalized.applyUrl,
            providerId: normalized.providerId || null,
            sourceName: normalized.sourceName,
            sourceUrl: normalized.sourceUrl,
            sourceSnippet: normalized.sourceSnippet || "",
            sourceConfidence: normalized.sourceConfidence,
            verificationStatus: normalized.verificationStatus,
            sourceEvidence: JSON.stringify(normalized.sourceEvidence || []),
            multiSourceProvenance: JSON.stringify(normalized.multiSourceProvenance || []),
            guardVerdict: normalized.guardVerdict || "CLEAN",
            isExpired: Boolean(normalized.isExpired),
            fetchedAt: now,
            discoveredAt: now,
            lastCheckedAt: now,
            isDemo: false,
          },
        });

        await prisma.evaluation.create({
          data: {
            opportunityId: normalized.id,
            recommendation: evaluation.recommendation,
            overallScore: evaluation.overallScore,
            semanticScore: evaluation.scoreBreakdown.semantic ?? 0,
            scoreBreakdown: JSON.stringify(evaluation.scoreBreakdown),
            hardBlockers: JSON.stringify(evaluation.hardBlockers || []),
            rationale: evaluation.rationale,
            nextAction: evaluation.nextAction,
            uncertainties: JSON.stringify(evaluation.uncertainties || []),
            eligibilityChecks: JSON.stringify(evaluation.eligibilityChecks || []),
            aiMatchExplanation: evaluation.aiMatchExplanation || "",
            skillGapAnalysisJson: JSON.stringify(evaluation.skillGapAnalysis || []),
          },
        });

        if (evaluation.recommendation === "PREPARE_FIRST") {
          const prepPlan = generatePreparationPlan(normalized, profile);
          await prisma.preparationPlan.create({
            data: {
              id: prepPlan.id,
              opportunityId: normalized.id,
              title: prepPlan.title,
              summary: prepPlan.summary,
              items: JSON.stringify(prepPlan.items || []),
            },
          });
        }

        itemsAdded++;
      }
    } catch {
      // Continue through remaining postings
    }
  }

  const durationMs = Date.now() - startTime;
  const overallStatus =
    errors.length === 0 ? "SUCCESS" : itemsAdded + itemsUpdated > 0 ? "PARTIAL" : "FAILED";

  // 4. Save Sync Log to Database
  let syncId = `sync-${Date.now()}`;
  try {
    const createdLog = await prisma.syncLog.create({
      data: {
        provider: providersToSync.join(","),
        itemsFetched,
        itemsAdded,
        itemsUpdated,
        itemsExpired,
        durationMs,
        status: overallStatus,
        errorDetails: errors.length > 0 ? errors.join("; ") : null,
        metricsJson: JSON.stringify({
          providerStatuses,
          failedProviders,
          retryCount,
          archiveThresholdDays,
        }),
        startedAt: new Date(startTime),
        completedAt: now,
      },
    });
    syncId = createdLog.id;
  } catch {
    // Graceful fallback for isolated unit tests
  }

  const resultPayload: SyncWorkerResult = {
    syncId,
    itemsFetched,
    itemsAdded,
    itemsUpdated,
    itemsExpired,
    durationMs,
    status: overallStatus,
    providerStatuses,
    failedProviders,
    retryCount,
    errors,
    completedAt: now.toISOString(),
  };

  if (itemsAdded > 0) {
    publishRealtimeEvent(
      "OPPORTUNITY_UPSERTED",
      `${itemsAdded} new live opportunity listing(s) synced across multi-platform feeds.`,
      { itemsAdded, itemsUpdated, itemsFetched, providers: Object.keys(providerStatuses) }
    );
  }
  publishRealtimeEvent(
    "SYNC_COMPLETED",
    `Background sync finished (${itemsAdded} added, ${itemsUpdated} refreshed, ${itemsExpired} expired).`,
    resultPayload as unknown as Record<string, unknown>
  );

  return resultPayload;
}

