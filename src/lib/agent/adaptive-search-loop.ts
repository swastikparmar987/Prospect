import {
  AdaptiveRoundMetrics,
  CandidateCapabilityMap,
  EvaluationResult,
  ExpandedRole,
  ExpansionCaseCode,
  LiveDiscoveryEvent,
  LiveDiscoveryEventStage,
  Opportunity,
  ProviderStatus,
  SearchConfig,
  SearchPlan,
  StopReasonCode,
  UserFeedbackRecord,
  UserProfile,
} from "../../types";
import { generateOpportunityEmbedding } from "../ai/semantic-embeddings";
import { extractCandidateCapabilityMap } from "../candidate-intelligence";
import { deduplicateOpportunities } from "../dedup";
import { computeFeedbackPersonalization } from "../feedback-engine";
import { generateGapActionPlan } from "../gap-action-engine";
import { normalizeRawOpportunity } from "../normalizer";
import { SearchProviderRegistry } from "../providers/provider-registry";
import { expandCandidateRoleFamilies } from "../role-expansion";
import { evaluateOpportunity } from "../scoring-engine";
import {
  assertNoDemoDataInLiveMode,
  isDemoOrFixtureRecord,
  resolveSearchConfig,
} from "../search-config";
import { buildDeterministicSearchPlan } from "../search-planner";

export interface EvaluatedOpportunityBundle {
  opportunity: Opportunity;
  evaluation: EvaluationResult;
}

export interface AdaptiveSearchLoopOutput {
  mode: "DEMO" | "LIVE";
  capabilityMap: CandidateCapabilityMap;
  expandedRoles: ExpandedRole[];
  plans: SearchPlan[];
  rounds: AdaptiveRoundMetrics[];
  shortlist: EvaluatedOpportunityBundle[];
  allEvaluated: EvaluatedOpportunityBundle[];
  duplicatesRemovedTotal: number;
  stopReason: StopReasonCode;
  budgetUsed: number;
  budgetLimit: number;
  preparationRecommendations: string[];
  liveEvents: LiveDiscoveryEvent[];
  coverageSummary: {
    sourcesChecked: string[];
    providersFailed: string[];
    providerStatuses: Record<string, ProviderStatus>;
    totalRawFound: number;
    totalUniqueEvaluated: number;
    duplicatesRemoved: number;
    eligibleCount: number;
    applyNowCount: number;
    prepareFirstCount: number;
    keepWatchingCount: number;
    skipCount: number;
    coverageStatement: string;
  };
}

export interface AdaptiveSearchLoopInput {
  profile: UserProfile;
  userQuery?: string;
  configOverrides?: Partial<SearchConfig>;
  config?: Partial<SearchConfig>;
  registry?: SearchProviderRegistry;
  feedbackRecords?: UserFeedbackRecord[];
  signal?: AbortSignal;
  abortSignal?: AbortSignal;
  fetchImpl?: typeof fetch;
  onStep?: (step: {
    toolName: string;
    status: "SUCCESS" | "SKIPPED" | "RETRYING" | "FAILED";
    inputSummary: string;
    outputSummary: string;
    sourceReferences?: string[];
    errorDetails?: string;
  }) => Promise<void> | void;
  onLiveEvent?: (event: LiveDiscoveryEvent) => Promise<void> | void;
  onEvent?: (event: LiveDiscoveryEvent) => Promise<void> | void;
}

/**
 * Diagnoses coverage gaps after a search round (Cases A through G from Phase 6).
 */
export function analyzeRoundCoverageAndExpansionCases(params: {
  roundMetrics: AdaptiveRoundMetrics;
  cumulativeEligibleCount: number;
  cumulativeCategories: Set<string>;
  expandedRoles: ExpandedRole[];
  capabilityMap: CandidateCapabilityMap;
  config: SearchConfig;
}): {
  casesTriggered: ExpansionCaseCode[];
  decisions: string[];
} {
  const {
    roundMetrics,
    cumulativeEligibleCount,
    cumulativeCategories,
    expandedRoles,
    capabilityMap,
    config,
  } = params;

  const casesTriggered: ExpansionCaseCode[] = [];
  const decisions: string[] = [];

  // CASE A — Low result count
  if (
    roundMetrics.eligibleResultCount < config.minEligibleToStopEarly &&
    cumulativeEligibleCount < config.minEligibleToStopEarly
  ) {
    casesTriggered.push("CASE_A_LOW_RESULT_COUNT");
    decisions.push(
      `Eligible result count (${roundMetrics.eligibleResultCount}) is below target threshold (${config.minEligibleToStopEarly}); expanding to adjacent and project-derived role queries.`
    );
  }

  // CASE B — Many duplicates
  if (roundMetrics.duplicateRate >= 0.2) {
    casesTriggered.push("CASE_B_MANY_DUPLICATES");
    decisions.push(
      `Duplicate rate is ${(roundMetrics.duplicateRate * 100).toFixed(0)}%; switching query strategy and routing to direct company career boards.`
    );
  }

  // CASE C — Low skill relevance
  if (
    roundMetrics.uniqueNormalizedResults > 0 &&
    roundMetrics.averageCompatibilityScore < 18
  ) {
    casesTriggered.push("CASE_C_LOW_SKILL_RELEVANCE");
    decisions.push(
      `Average skill compatibility (${roundMetrics.averageCompatibilityScore.toFixed(1)}/30) is low; anchoring next round queries on demonstrated project technologies.`
    );
  }

  // CASE D — Geographic limitation
  const nonRemoteCount =
    (roundMetrics.locationWorkModeDistribution["On-site"] || 0) +
    (roundMetrics.locationWorkModeDistribution["Hybrid"] || 0);
  const remoteCount = roundMetrics.locationWorkModeDistribution["Remote"] || 0;
  if (roundMetrics.eligibleResultCount < 3 && remoteCount === 0 && nonRemoteCount <= 2) {
    casesTriggered.push("CASE_D_GEOGRAPHIC_LIMITATION");
    decisions.push(
      "Location filter yielded sparse results; broadening to Remote and regional hubs within candidate preferences without violating hard constraints."
    );
  }

  // CASE E — Missing opportunity categories (only standard internships found so far)
  if (
    !cumulativeCategories.has("Research") ||
    !cumulativeCategories.has("Fellowship")
  ) {
    casesTriggered.push("CASE_E_MISSING_CATEGORIES");
    decisions.push(
      "Missing Research and Fellowship categories; expanding search to academic research assistantships and technical fellowships."
    );
  }

  // CASE F — Poor source coverage (any provider failed or rate-limited)
  const failedProviders = Object.entries(roundMetrics.providerStatuses)
    .filter(([, st]) => st === "FAILED" || st === "RATE_LIMITED")
    .map(([p]) => p);
  if (failedProviders.length > 0) {
    casesTriggered.push("CASE_F_POOR_SOURCE_COVERAGE");
    decisions.push(
      `Provider(s) [${failedProviders.join(", ")}] reported failures or rate limits; routing subsequent queries to healthy alternative providers.`
    );
  }

  // CASE G — Insufficient candidate evidence for unsupported niche roles
  const rolesWithMissingSkills = expandedRoles.filter(
    (r) => !r.excludedByUser && r.missingSkills.length > 0
  );
  if (
    rolesWithMissingSkills.length > 0 ||
    capabilityMap.demonstratedCapabilities.length < 3
  ) {
    casesTriggered.push("CASE_G_INSUFFICIENT_CANDIDATE_EVIDENCE");
    decisions.push(
      "Guarding against unsupported role expansion: roles requiring unverified skills are excluded from speculative search and routed to Gap-to-Action preparation plans."
    );
  }

  return { casesTriggered, decisions };
}

/**
 * Executes the complete Adaptive Opportunity Search Loop State Machine:
 * INITIALIZE → PLAN SEARCH ROUND → EXECUTE PROVIDERS → NORMALIZE RESULTS →
 * DEDUPLICATE → EVALUATE OPPORTUNITIES → ANALYSE SEARCH COVERAGE →
 * DECIDE WHETHER TO EXPAND SEARCH → GENERATE NEW QUERIES → NEXT ROUND OR STOP →
 * FINAL RANKING AND SHORTLIST
 */
export async function executeAdaptiveSearchLoop(
  input: AdaptiveSearchLoopInput
): Promise<AdaptiveSearchLoopOutput> {
  const loopStartTime = Date.now();
  const config = resolveSearchConfig(input.configOverrides ?? input.config);
  const registry = input.registry || new SearchProviderRegistry();
  const {
    userQuery,
    feedbackRecords = [],
    fetchImpl,
    onStep,
  } = input;
  const profile: UserProfile = input.profile || {
    id: "unconfigured-profile",
    fullName: "",
    email: "",
    headline: "",
    university: "",
    degree: "",
    major: "",
    graduationYear: null,
    gpa: null,
    location: "",
    targetRoles: [],
    preferredWorkModes: [],
    preferredLocations: [],
    skills: [],
    experiences: [],
    projects: [],
    portfolioLinks: [],
    availability: "",
    stipendPreference: "Any",
    constraints: "",
    factProvenance: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const signal = input.signal ?? input.abortSignal;
  const onLiveEvent = input.onLiveEvent ?? input.onEvent;

  const liveEvents: LiveDiscoveryEvent[] = [];
  const emitLiveEvent = async (
    stage: LiveDiscoveryEventStage,
    label: string,
    detail: string,
    extra: Partial<LiveDiscoveryEvent> = {}
  ) => {
    const evt: LiveDiscoveryEvent = {
      id: `evt-${liveEvents.length + 1}-${stage.toLowerCase()}`,
      stage,
      label,
      detail,
      elapsedMs: Date.now() - loopStartTime,
      status: extra.status || "COMPLETED",
      timestamp: new Date().toISOString(),
      ...extra,
    };
    liveEvents.push(evt);
    await onLiveEvent?.(evt);
  };

  // ------------------------------------------------------------------
  // STATE 1: INITIALIZE (Capability Extraction + Location + Role Expansion + Feedback)
  // ------------------------------------------------------------------
  await emitLiveEvent(
    "PROFILE_LOADED",
    "Candidate profile loaded",
    `Loaded ${profile.fullName || "Candidate"} (${(profile.skills || []).length} skills, ${(profile.projects || []).length} projects, ${(profile.experiences || []).length} experiences).`
  );

  const capabilityMap = extractCandidateCapabilityMap(profile);
  await emitLiveEvent(
    "CAPABILITIES_EXTRACTED",
    "Candidate capabilities extracted",
    `Extracted ${capabilityMap.demonstratedCapabilities.length} direct capabilities and ${capabilityMap.inferredAdjacentCapabilities.length} adjacent capabilities.`
  );

  const resolvedCity =
    profile.locationPreference?.displayLabel ||
    profile.locationPreference?.city ||
    profile.location ||
    "Flexible / Remote";
  await emitLiveEvent(
    "LOCATION_RESOLVED",
    "Location resolved",
    `Active discovery location: ${resolvedCity} (Source: ${profile.locationPreference?.source || "PROFILE"}).`
  );

  const expandedRoles = expandCandidateRoleFamilies(profile, capabilityMap);
  const activeRoleCount = expandedRoles.filter((r) => !r.excludedByUser).length;
  await emitLiveEvent(
    "ROLE_FAMILIES_GENERATED",
    "Role families generated",
    `Generated ${activeRoleCount} role families: ${expandedRoles
      .filter((r) => !r.excludedByUser)
      .slice(0, 4)
      .map((r) => r.title)
      .join(", ")}.`
  );

  const feedbackSummary = computeFeedbackPersonalization(feedbackRecords, profile);

  await onStep?.({
    toolName: "candidate_intelligence_and_role_expansion",
    status: "SUCCESS",
    inputSummary: `Profile: ${profile.fullName || "Candidate"} (${(profile.skills || []).length} skills, ${(profile.projects || []).length} projects) | Location: ${resolvedCity}`,
    outputSummary: `${capabilityMap.summary} Generated ${activeRoleCount} active role families (${expandedRoles.map((r) => r.title).join(", ")}).`,
  });

  const executedQueries = new Set<string>();
  const plans: SearchPlan[] = [];
  const rounds: AdaptiveRoundMetrics[] = [];

  const cumulativeUniqueMap = new Map<string, Opportunity>();
  const cumulativeCanonicalUrls = new Set<string>();
  const cumulativeEvaluatedMap = new Map<string, EvaluatedOpportunityBundle>();
  const cumulativeCategories = new Set<string>();
  const allSourcesChecked = new Set<string>();
  const globalProviderStatuses: Record<string, ProviderStatus> = {};

  let duplicatesRemovedTotal = 0;
  let budgetUsed = 0;
  let consecutiveLowYieldRounds = 0;
  let stopReason: StopReasonCode = "MAX_ROUNDS_REACHED";
  let pendingExpansionCases: ExpansionCaseCode[] = [];

  // ------------------------------------------------------------------
  // ADAPTIVE ROUND LOOP
  // ------------------------------------------------------------------
  for (let roundNumber = 1; roundNumber <= config.maxRounds; roundNumber++) {
    if (signal?.aborted) {
      stopReason = "USER_CANCELLED";
      break;
    }

    const remainingBudget = config.searchBudgetPerRun - budgetUsed;
    if (remainingBudget <= 0) {
      stopReason = "SEARCH_BUDGET_EXHAUSTED";
      break;
    }

    // STATE 2: PLAN SEARCH ROUND
    const plan = buildDeterministicSearchPlan({
      profile: {
        ...profile,
        excludedRoleFamilies: feedbackSummary.excludedRoleFamilies,
        hiddenEmployers: feedbackSummary.hiddenEmployers,
      },
      capabilityMap,
      expandedRoles,
      roundNumber,
      executedQueries,
      previousRounds: rounds,
      expansionCasesTriggered: pendingExpansionCases,
      remainingBudget,
      config,
      userQueryOverride: roundNumber === 1 ? userQuery : undefined,
      feedbackBoostedFamilies: feedbackSummary.boostedRoleFamilies,
      feedbackPenalizedFamilies: feedbackSummary.penalizedRoleFamilies,
    });

    if (plan.queryGroups.length === 0) {
      stopReason = "NO_NEW_QUERY_STRATEGY";
      break;
    }

    plans.push(plan);

    await emitLiveEvent(
      "QUERIES_PLANNED",
      "Search queries planned",
      `Round ${roundNumber}: Planned ${plan.queryGroups.length} query group(s) targeting [${plan.relevantSourceProviders.join(", ")}].`,
      {
        round: roundNumber,
        query: plan.queryGroups[0]?.query,
        provider: plan.relevantSourceProviders.join(", "),
      }
    );

    await onStep?.({
      toolName: `search_planner_round_${roundNumber}`,
      status: "SUCCESS",
      inputSummary: `Round ${roundNumber} | Budget remaining: ${remainingBudget} | Triggers: ${pendingExpansionCases.join(", ") || "Initial Direct + Project Plan"}`,
      outputSummary: `Planned ${plan.queryGroups.length} query group(s): ${plan.queryGroups.map((q) => `[${q.strategy}] "${q.query}"`).join("; ")}`,
    });

    // STATE 3: EXECUTE PROVIDERS
    await emitLiveEvent(
      "PROVIDERS_CONTACTED",
      "Providers contacted",
      `Contacting ${plan.relevantSourceProviders.join(", ")} across ${plan.queryGroups.length} planned query group(s).`,
      {
        round: roundNumber,
        provider: plan.relevantSourceProviders.join(", "),
        query: plan.queryGroups.map((q) => q.query).join(" | "),
      }
    );

    const { results: providerResults, callsExecuted } =
      await registry.executeRoundQueries({
        queryItems: plan.queryGroups,
        roundNumber,
        config,
        remainingBudget,
        signal,
        fetchImpl,
      });

    budgetUsed += callsExecuted;

    // Strictly filter out any synthetic/demo opportunities when running in LIVE mode
    const roundRawOpportunities = providerResults
      .flatMap((r) => r.opportunities)
      .filter((raw) =>
        config.mode === "LIVE"
          ? !isDemoOrFixtureRecord({
              id: raw.providerId,
              isDemo: raw.isDemo,
              verificationStatus: raw.verificationStatus,
              provider: raw.provider,
              sourceName: raw.sourceName,
            })
          : true
      );
    const roundWarnings = providerResults.flatMap((r) => r.warnings);
    const roundProviderStatuses: Record<string, ProviderStatus> = {};
    const roundSourcesChecked: string[] = [];

    for (const pr of providerResults) {
      roundProviderStatuses[pr.provider] = pr.status;
      globalProviderStatuses[pr.provider] = pr.status;
      for (const src of pr.sourcesChecked) {
        allSourcesChecked.add(src);
        roundSourcesChecked.push(src);
      }
    }

    const roundFailedProviders = Object.entries(roundProviderStatuses)
      .filter(([, st]) => st === "FAILED" || st === "RATE_LIMITED")
      .map(([p]) => p);

    await emitLiveEvent(
      "RESULTS_RETRIEVED",
      "Results retrieved",
      `Retrieved ${roundRawOpportunities.length} raw opportunity listing(s) in Round ${roundNumber} from ${Object.keys(roundProviderStatuses).join(", ")}.`,
      {
        round: roundNumber,
        provider: Object.keys(roundProviderStatuses).join(", "),
        query: plan.queryGroups[0]?.query,
        resultsRetrieved: roundRawOpportunities.length,
        failedProviders: roundFailedProviders,
        status: roundFailedProviders.length > 0 ? "WARNING" : "COMPLETED",
      }
    );

    // STATE 4: NORMALIZE RESULTS (with Untrusted Posting Guard + Semantic Embedding)
    const normalizedRoundList = roundRawOpportunities.map((raw, idx) => {
      const norm = normalizeRawOpportunity(raw, idx);
      norm.embedding = generateOpportunityEmbedding(norm);
      return norm;
    });

    // STATE 5: DEDUPLICATE (within round and against cumulative pool)
    const combinedPool = [
      ...Array.from(cumulativeUniqueMap.values()),
      ...normalizedRoundList,
    ];
    const previousUniqueCount = cumulativeUniqueMap.size;
    const deduped = deduplicateOpportunities(combinedPool);
    const roundDuplicatesRemoved =
      normalizedRoundList.length - (deduped.unique.length - previousUniqueCount);
    duplicatesRemovedTotal += Math.max(0, roundDuplicatesRemoved);

    await emitLiveEvent(
      "DUPLICATES_REMOVED",
      "Duplicates removed",
      `Removed ${Math.max(0, roundDuplicatesRemoved)} duplicate listing(s) in Round ${roundNumber}; ${deduped.unique.length} unique opportunity record(s) in pool.`,
      {
        round: roundNumber,
        resultsRetrieved: normalizedRoundList.length,
        uniqueResults: deduped.unique.length,
        duplicatesRemoved: Math.max(0, roundDuplicatesRemoved),
      }
    );

    cumulativeUniqueMap.clear();
    for (const item of deduped.unique) {
      cumulativeUniqueMap.set(item.id, item);
      if (item.canonicalUrl) cumulativeCanonicalUrls.add(item.canonicalUrl);
      cumulativeCategories.add(item.category);
    }

    const marginalNewUnique = Math.max(
      0,
      cumulativeUniqueMap.size - previousUniqueCount
    );
    const marginalYieldRate =
      normalizedRoundList.length > 0
        ? Number((marginalNewUnique / normalizedRoundList.length).toFixed(3))
        : 0;
    const duplicateRate =
      normalizedRoundList.length > 0
        ? Number(
            (
              Math.max(0, roundDuplicatesRemoved) / normalizedRoundList.length
            ).toFixed(3)
          )
        : 0;

    // STATE 6: EVALUATE OPPORTUNITIES
    const roundEvaluated: EvaluatedOpportunityBundle[] = [];
    for (const opp of deduped.unique) {
      const evaluation = evaluateOpportunity(opp, profile);
      const bundle = { opportunity: opp, evaluation };
      cumulativeEvaluatedMap.set(opp.id, bundle);
      roundEvaluated.push(bundle);
    }

    // STATE 7: ANALYSE SEARCH COVERAGE (Compute all 12 Round Metrics)
    const roleFamilyDistribution: Record<string, number> = {};
    const sourceDistribution: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};
    const locationWorkModeDistribution: Record<string, number> = {};

    let eligibleResultCount = 0;
    let applyNowCount = 0;
    let prepareFirstCount = 0;
    let totalSkillsScore = 0;

    for (const { opportunity: opp, evaluation: ev } of roundEvaluated) {
      const rf = opp.roleFamily || "General";
      roleFamilyDistribution[rf] = (roleFamilyDistribution[rf] || 0) + 1;

      const src = opp.sourceName || "Unknown";
      sourceDistribution[src] = (sourceDistribution[src] || 0) + 1;

      categoryDistribution[opp.category] =
        (categoryDistribution[opp.category] || 0) + 1;

      locationWorkModeDistribution[opp.workMode] =
        (locationWorkModeDistribution[opp.workMode] || 0) + 1;

      totalSkillsScore += ev.scoreBreakdown.skills;

      if (ev.hardBlockers.length === 0 && !opp.isExpired) {
        eligibleResultCount++;
      }
      if (ev.recommendation === "APPLY_NOW") applyNowCount++;
      if (ev.recommendation === "PREPARE_FIRST") prepareFirstCount++;
    }

    const averageCompatibilityScore =
      roundEvaluated.length > 0
        ? Number((totalSkillsScore / roundEvaluated.length).toFixed(1))
        : 0;

    const roundMetrics: AdaptiveRoundMetrics = {
      roundId: plan.roundId,
      roundNumber,
      queriesPlanned: plan.queryGroups.map((q) => q.query),
      providersChecked: Object.keys(roundProviderStatuses),
      providerStatuses: roundProviderStatuses,
      totalRawResults: normalizedRoundList.length,
      uniqueNormalizedResults: deduped.unique.length,
      duplicateRate,
      eligibleResultCount,
      applyNowCount,
      prepareFirstCount,
      roleFamilyDistribution,
      sourceDistribution,
      categoryDistribution,
      locationWorkModeDistribution,
      averageCompatibilityScore,
      marginalNewUniqueOpportunities: marginalNewUnique,
      marginalYieldRate,
      diagnosticCasesTriggered: [],
      expansionDecisions: [],
      warnings: Array.from(new Set(roundWarnings)),
    };

    // STATE 8: DECIDE WHETHER TO EXPAND SEARCH
    const { casesTriggered, decisions } = analyzeRoundCoverageAndExpansionCases({
      roundMetrics,
      cumulativeEligibleCount: eligibleResultCount,
      cumulativeCategories,
      expandedRoles,
      capabilityMap,
      config,
    });

    roundMetrics.diagnosticCasesTriggered = casesTriggered;
    roundMetrics.expansionDecisions = decisions;
    rounds.push(roundMetrics);
    pendingExpansionCases = casesTriggered;

    await emitLiveEvent(
      "ELIGIBILITY_CHECKED",
      "Eligibility checked",
      `Checked graduation window, degree level, and work authorization across ${roundEvaluated.length} unique listing(s): ${eligibleResultCount} eligible.`,
      {
        round: roundNumber,
        uniqueResults: roundEvaluated.length,
      }
    );

    await emitLiveEvent(
      "OPPORTUNITIES_RANKED",
      "Opportunities ranked",
      `Hybrid semantic + skill ranking complete for Round ${roundNumber}: ${applyNowCount} Apply Now, ${prepareFirstCount} Prepare First.`,
      {
        round: roundNumber,
        uniqueResults: roundEvaluated.length,
      }
    );

    if (casesTriggered.length > 0 && roundNumber < config.maxRounds) {
      await emitLiveEvent(
        "SEARCH_EXPANDED",
        "Search expanded",
        `Expanding search for Round ${roundNumber + 1} due to [${casesTriggered.join(", ")}]: ${decisions[0] || "Broadening role families and career boards."}`,
        {
          round: roundNumber,
        }
      );
    }

    await onStep?.({
      toolName: `adaptive_round_${roundNumber}_evaluation`,
      status:
        Object.values(roundProviderStatuses).every((s) => s === "FAILED")
          ? "FAILED"
          : "SUCCESS",
      inputSummary: `Executed ${callsExecuted} provider call(s) across [${Object.keys(roundProviderStatuses).join(", ")}]`,
      outputSummary: `Raw: ${normalizedRoundList.length} | New Unique: +${marginalNewUnique} (Total: ${deduped.unique.length}) | Eligible: ${eligibleResultCount} | APPLY_NOW: ${applyNowCount} | PREPARE_FIRST: ${prepareFirstCount} | Cases: [${casesTriggered.join(", ") || "None"}]`,
      sourceReferences: roundSourcesChecked.slice(0, 6),
    });

    // STATE 9 & 10: NEXT ROUND OR STOP CHECKS
    const isLowYieldRound =
      marginalNewUnique < config.minUniqueNewOpportunities ||
      marginalYieldRate < config.minMarginalYield;

    if (isLowYieldRound) {
      consecutiveLowYieldRounds++;
    } else {
      consecutiveLowYieldRounds = 0;
    }

    if (consecutiveLowYieldRounds >= 2) {
      stopReason = "CONSECUTIVE_LOW_YIELD_ROUNDS";
      break;
    }

    if (budgetUsed >= config.searchBudgetPerRun) {
      stopReason = "SEARCH_BUDGET_EXHAUSTED";
      break;
    }

    // If we have completed at least 2 rounds (so adjacent/project/research expansions ran)
    // and we already meet the eligible result threshold with diverse categories, stop cleanly.
    if (
      roundNumber >= 2 &&
      eligibleResultCount >= config.minEligibleToStopEarly &&
      cumulativeCategories.size >= 2
    ) {
      stopReason = "SUFFICIENT_ELIGIBLE_RESULTS";
      break;
    }
  }

  // ------------------------------------------------------------------
  // STATE 11: FINAL RANKING AND SHORTLIST
  // ------------------------------------------------------------------
  const recommendationRank: Record<string, number> = {
    APPLY_NOW: 1,
    PREPARE_FIRST: 2,
    KEEP_WATCHING: 3,
    SKIP: 4,
  };

  const allEvaluated = Array.from(cumulativeEvaluatedMap.values()).sort(
    (a, b) => {
      const rankDiff =
        (recommendationRank[a.evaluation.recommendation] || 9) -
        (recommendationRank[b.evaluation.recommendation] || 9);
      if (rankDiff !== 0) return rankDiff;
      return b.evaluation.overallScore - a.evaluation.overallScore;
    }
  );

  // Runtime safeguard: Verify zero demo/fixture records leaked into LIVE mode
  assertNoDemoDataInLiveMode(
    config.mode,
    allEvaluated.map((x) => x.opportunity)
  );

  // Shortlist excludes SKIP (hard-blocked or expired) opportunities
  const shortlist = allEvaluated.filter(
    (item) => item.evaluation.recommendation !== "SKIP"
  );

  // Generate preparation recommendations when Case G or PREPARE_FIRST items exist
  const preparationRecommendations: string[] = [];
  for (const item of shortlist
    .filter((x) => x.evaluation.recommendation === "PREPARE_FIRST")
    .slice(0, 3)) {
    const gapPlan = generateGapActionPlan(
      item.opportunity,
      profile,
      item.evaluation
    );
    if (gapPlan.items.length > 0) {
      preparationRecommendations.push(
        `For ${item.opportunity.title} (${item.opportunity.organization}): ${gapPlan.items[0].concreteAction} -> Deliverable: ${gapPlan.items[0].deliverable}`
      );
    }
  }

  const totalRawFound = rounds.reduce((acc, r) => acc + r.totalRawResults, 0);
  const applyNowCount = allEvaluated.filter(
    (x) => x.evaluation.recommendation === "APPLY_NOW"
  ).length;
  const prepareFirstCount = allEvaluated.filter(
    (x) => x.evaluation.recommendation === "PREPARE_FIRST"
  ).length;
  const keepWatchingCount = allEvaluated.filter(
    (x) => x.evaluation.recommendation === "KEEP_WATCHING"
  ).length;
  const skipCount = allEvaluated.filter(
    (x) => x.evaluation.recommendation === "SKIP"
  ).length;
  const eligibleCount = allEvaluated.filter(
    (x) => x.evaluation.hardBlockers.length === 0 && !x.opportunity.isExpired
  ).length;

  const providersFailed = Object.entries(globalProviderStatuses)
    .filter(([, st]) => st === "FAILED" || st === "RATE_LIMITED")
    .map(([p]) => p);

  const coverageStatement = `Checked ${allSourcesChecked.size} source endpoint(s) across ${rounds.length} adaptive round(s) in ${config.mode} mode (Providers: ${Object.keys(globalProviderStatuses).join(", ") || "none"}). Found ${totalRawFound} raw listing(s), removed ${duplicatesRemovedTotal} duplicate(s), and evaluated ${allEvaluated.length} unique opportunity record(s). This reflects only the sources checked above—not the entire global job market.`;

  await emitLiveEvent(
    "SEARCH_COMPLETED",
    "Search completed",
    `Completed ${rounds.length} round(s) in ${Date.now() - loopStartTime}ms (Stop reason: ${stopReason}). Ranked ${allEvaluated.length} unique opportunities (${applyNowCount} Apply Now, ${prepareFirstCount} Prepare First).`,
    {
      round: rounds.length,
      resultsRetrieved: totalRawFound,
      uniqueResults: allEvaluated.length,
      duplicatesRemoved: duplicatesRemovedTotal,
      failedProviders: providersFailed,
    }
  );

  return {
    mode: config.mode,
    capabilityMap,
    expandedRoles,
    plans,
    rounds,
    shortlist,
    allEvaluated,
    duplicatesRemovedTotal,
    stopReason,
    budgetUsed,
    budgetLimit: config.searchBudgetPerRun,
    preparationRecommendations,
    liveEvents,
    coverageSummary: {
      sourcesChecked: Array.from(allSourcesChecked),
      providersFailed,
      providerStatuses: globalProviderStatuses,
      totalRawFound,
      totalUniqueEvaluated: allEvaluated.length,
      duplicatesRemoved: duplicatesRemovedTotal,
      eligibleCount,
      applyNowCount,
      prepareFirstCount,
      keepWatchingCount,
      skipCount,
      coverageStatement,
    },
  };
}

