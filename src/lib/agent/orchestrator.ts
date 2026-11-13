import { prisma } from "../db";
import {
  AdaptiveRoundMetrics,
  AgentStepRecord,
  CandidateCapabilityMap,
  EvaluationResult,
  ExpandedRole,
  FeedbackSignalType,
  LiveDiscoveryEvent,
  Opportunity,
  SearchConfig,
  SearchPlan,
  StopReasonCode,
  UserFeedbackRecord,
  UserProfile,
} from "../../types";
import {
  EMBEDDING_MODEL_ID,
  generateCandidateEmbedding,
  generateOpportunityEmbedding,
} from "../ai/semantic-embeddings";
import { extractStructuredJobIntelligence } from "../ai/job-intelligence";
import {
  assertNoDemoDataInLiveMode,
  isDemoOrFixtureRecord,
} from "../search-config";
import { executeAdaptiveSearchLoop } from "./adaptive-search-loop";
import {
  toolCreatePreparationPlan,
  toolInspectPublicSource,
} from "./tools";

export interface AgentExecutionOptions {
  query: string;
  category?: any;
  workMode?: any;
  location?: string;
  mode?: "DEMO" | "LIVE";
  maxRounds?: number;
  userProfile?: UserProfile | null;
  configOverrides?: Partial<SearchConfig>;
  signal?: AbortSignal;
}

export interface OrchestratorResult {
  runId: string;
  query: string;
  mode: "DEMO" | "LIVE";
  status: "COMPLETED" | "PARTIAL_FAILURE" | "FAILED";
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan: boolean;
  }>;
  summary: string;
  steps: AgentStepRecord[];
  liveEvents?: LiveDiscoveryEvent[];
  capabilityMap?: CandidateCapabilityMap;
  expandedRoles?: ExpandedRole[];
  searchPlans?: SearchPlan[];
  rounds?: AdaptiveRoundMetrics[];
  stopReason?: StopReasonCode;
  budgetUsed?: number;
  budgetLimit?: number;
  coverageSummary?: {
    sourcesChecked: string[];
    providersFailed: string[];
    providerStatuses: Record<string, string>;
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

/**
 * Loads the active user profile from SQLite and parses JSON columns safely.
 */
export async function loadActiveUserProfile(userId?: string): Promise<UserProfile | null> {
  try {
    const where = userId ? { userId } : undefined;
    const dbProfile = await prisma.userProfile.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
    });
    if (!dbProfile) return null;
    const base: UserProfile = {
      ...dbProfile,
      targetRoles: JSON.parse(dbProfile.targetRoles || "[]"),
      preferredWorkModes: JSON.parse(dbProfile.preferredWorkModes || "[]"),
      preferredLocations: JSON.parse(dbProfile.preferredLocations || "[]"),
      skills: JSON.parse(dbProfile.skills || "[]"),
      experiences: JSON.parse(dbProfile.experiences || "[]"),
      projects: JSON.parse(dbProfile.projects || "[]"),
      portfolioLinks: JSON.parse(dbProfile.portfolioLinks || "[]"),
      factProvenance: JSON.parse(dbProfile.factProvenance || "{}"),
      careerDirections: JSON.parse(dbProfile.careerDirections || "[]"),
      adjacentRoles: JSON.parse(dbProfile.adjacentRoles || "[]"),
      excludedRoleFamilies: JSON.parse(dbProfile.excludedRoleFamilies || "[]"),
      hiddenEmployers: JSON.parse(dbProfile.hiddenEmployers || "[]"),
      locationPreference: (() => {
        try {
          const parsed = JSON.parse(dbProfile.locationPreferenceJson || "{}");
          return parsed && typeof parsed === "object" && parsed.source ? parsed : undefined;
        } catch {
          return undefined;
        }
      })(),
      embedding: (() => {
        try {
          const parsed = JSON.parse(dbProfile.embeddingJson || "[]");
          return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
        } catch {
          return undefined;
        }
      })(),
      embeddingModel: dbProfile.embeddingModel || EMBEDDING_MODEL_ID,
      createdAt: dbProfile.createdAt.toISOString(),
      updatedAt: dbProfile.updatedAt.toISOString(),
    };
    if (!base.embedding || base.embedding.length === 0) {
      base.embedding = generateCandidateEmbedding(base);
    }
    return base;
  } catch {
    return null;
  }
}

/**
 * Multi-Step Adaptive Opportunity Discovery & Verification Orchestrator.
 * Executes:
 * PLAN → SEARCH → COLLECT → NORMALIZE → DEDUPLICATE → EVALUATE →
 * IDENTIFY GAPS → EXPAND SEARCH → REPEAT → RANK → SHORTLIST.
 */
export async function runOpportunityDiscoveryAgent(
  options: AgentExecutionOptions
): Promise<OrchestratorResult> {
  const runId = `run-${Date.now()}`;
  const steps: AgentStepRecord[] = [];
  let stepIndex = 1;

  function recordStep(
    toolName: string,
    status: "SUCCESS" | "SKIPPED" | "RETRYING" | "FAILED",
    inputSummary: string,
    outputSummary: string,
    sourceReferences: string[] = [],
    errorDetails?: string | null
  ): AgentStepRecord {
    const step: AgentStepRecord = {
      id: `step-${runId}-${stepIndex}`,
      stepNumber: stepIndex++,
      toolName,
      status,
      inputSummary,
      outputSummary,
      sourceReferences,
      errorDetails,
      executedAt: new Date().toISOString(),
    };
    steps.push(step);
    return step;
  }

  // STEP 1: Parse user intent and search parameters
  recordStep(
    "parse_user_intent",
    "SUCCESS",
    `Query: "${options.query || "adaptive"}", Category: ${options.category || "Any"}, Mode: ${options.workMode || "Any"}`,
    "Normalized query parameters into typed adaptive search intent."
  );

  // STEP 2: Load user profile & feedback signals
  let profile = options.userProfile || (await loadActiveUserProfile());
  if (profile) {
    recordStep(
      "load_profile",
      "SUCCESS",
      `Profile ID: ${profile.id}`,
      `Loaded profile for ${profile.fullName || "Candidate"} (${profile.major || "CS"}, Class of ${profile.graduationYear || "?"}) with ${profile.skills.length} skills and ${profile.projects.length} projects.`
    );
  } else {
    profile = {
      id: "unconfigured-profile",
      fullName: "",
      email: "",
      headline: "",
      university: "",
      degree: "",
      major: "",
      graduationYear: null,
      graduationMonth: "",
      gpa: null,
      location: options.location || "",
      targetRoles: [],
      preferredWorkModes: options.workMode ? [options.workMode] : [],
      preferredLocations: options.location ? [options.location] : [],
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
    recordStep(
      "load_profile",
      "SKIPPED",
      "No saved candidate profile",
      "No candidate profile configured in database; running discovery without fabricating candidate skills or projects."
    );
  }

  let feedbackRecords: UserFeedbackRecord[] = [];
  try {
    const rawFeedback = await prisma.userFeedback.findMany({
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    feedbackRecords = rawFeedback.map((r) => ({
      id: r.id,
      profileId: r.profileId,
      opportunityId: r.opportunityId,
      organization: r.organization,
      roleFamily: r.roleFamily,
      signalType: r.signalType as FeedbackSignalType,
      outcome: (r.outcome as UserFeedbackRecord["outcome"]) ?? null,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    // Ignore if table not queried in standalone test
  }

  // STEP 3: Execute Adaptive Search Loop
  const loopResult = await executeAdaptiveSearchLoop({
    profile,
    userQuery: options.query,
    signal: options.signal,
    configOverrides: {
      ...options.configOverrides,
      mode: options.mode ?? options.configOverrides?.mode,
      maxRounds: options.maxRounds ?? options.configOverrides?.maxRounds,
    },
    feedbackRecords,
    onStep: (s) => {
      recordStep(
        s.toolName,
        s.status,
        s.inputSummary,
        s.outputSummary,
        s.sourceReferences || [],
        s.errorDetails || null
      );
    },
  });

  // STEP 4: Sample source inspection
  const sampleToInspect = loopResult.allEvaluated.slice(0, 2);
  for (const item of sampleToInspect) {
    const inspection = await toolInspectPublicSource({
      url: item.opportunity.applyUrl || item.opportunity.sourceUrl,
    });
    recordStep(
      "inspect_public_source",
      inspection.isReachable ? "SUCCESS" : "RETRYING",
      `URL: ${item.opportunity.applyUrl}`,
      `Inspected source: ${inspection.statusText}`,
      [item.opportunity.applyUrl]
    );
  }

  // STEP 5: Persist newly discovered LIVE opportunities & evaluations to SQLite
  // PERMANENT NO-MOCK-DATA POLICY: Never insert demo opportunities into the production database.
  assertNoDemoDataInLiveMode(
    loopResult.mode,
    loopResult.allEvaluated.map((b) => b.opportunity)
  );

  const processedResults: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan: boolean;
  }> = [];

  for (const bundle of loopResult.allEvaluated) {
    const { opportunity: opp, evaluation } = bundle;
    if (loopResult.mode === "LIVE" && isDemoOrFixtureRecord(opp)) {
      continue;
    }

    const hasPrepPlan = evaluation.recommendation === "PREPARE_FIRST";

    processedResults.push({
      opportunity: opp,
      evaluation,
      hasPrepPlan,
    });

    // Only persist to SQLite when executing in LIVE mode and the opportunity is not a demo fixture.
    if (loopResult.mode !== "LIVE" || isDemoOrFixtureRecord(opp)) {
      continue;
    }

    if (hasPrepPlan) {
      toolCreatePreparationPlan(opp, profile);
    }

    try {
      const oppEmbedding =
        opp.embedding && opp.embedding.length > 0
          ? opp.embedding
          : generateOpportunityEmbedding(opp);
      const structuredJob =
        opp.aiStructured || (await extractStructuredJobIntelligence(opp, false));

      await prisma.opportunity.upsert({
        where: { id: opp.id },
        update: {
          title: opp.title,
          organization: opp.organization,
          category: opp.category,
          employmentType: opp.employmentType || opp.category,
          roleFamily: opp.roleFamily || "General Technical",
          seniority: opp.seniority || "Intern / Early-Career",
          description: opp.description,
          location: opp.location,
          latitude: opp.latitude ?? null,
          longitude: opp.longitude ?? null,
          workMode: opp.workMode,
          compensation: opp.compensation,
          eligibilityRequirements: JSON.stringify(opp.eligibilityRequirements || []),
          requiredSkills: JSON.stringify(opp.requiredSkills || []),
          preferredSkills: JSON.stringify(opp.preferredSkills || []),
          publishedAt: opp.publishedAt ? new Date(opp.publishedAt) : null,
          deadline: opp.deadline ? new Date(opp.deadline) : null,
          deadlineRaw: opp.deadlineRaw || null,
          applyUrl: opp.applyUrl,
          canonicalUrl: opp.canonicalUrl || opp.applyUrl,
          providerId: opp.providerId || null,
          sourceName: opp.sourceName,
          sourceUrl: opp.sourceUrl,
          sourceSnippet: opp.sourceSnippet || "",
          sourceConfidence: opp.sourceConfidence,
          verificationStatus: opp.verificationStatus,
          sourceEvidence: JSON.stringify(opp.sourceEvidence || []),
          multiSourceProvenance: JSON.stringify(opp.multiSourceProvenance || []),
          guardVerdict: opp.guardVerdict || "CLEAN",
          embeddingJson: JSON.stringify(oppEmbedding),
          aiStructuredJson: JSON.stringify(structuredJob),
          isExpired: Boolean(opp.isExpired),
          fetchedAt: opp.fetchedAt ? new Date(opp.fetchedAt) : new Date(),
          lastCheckedAt: new Date(opp.lastCheckedAt || Date.now()),
          isDemo: opp.isDemo,
        },
        create: {
          id: opp.id,
          title: opp.title,
          organization: opp.organization,
          category: opp.category,
          employmentType: opp.employmentType || opp.category,
          roleFamily: opp.roleFamily || "General Technical",
          seniority: opp.seniority || "Intern / Early-Career",
          description: opp.description,
          location: opp.location,
          latitude: opp.latitude ?? null,
          longitude: opp.longitude ?? null,
          workMode: opp.workMode,
          compensation: opp.compensation,
          eligibilityRequirements: JSON.stringify(opp.eligibilityRequirements || []),
          requiredSkills: JSON.stringify(opp.requiredSkills || []),
          preferredSkills: JSON.stringify(opp.preferredSkills || []),
          publishedAt: opp.publishedAt ? new Date(opp.publishedAt) : null,
          deadline: opp.deadline ? new Date(opp.deadline) : null,
          deadlineRaw: opp.deadlineRaw || null,
          applyUrl: opp.applyUrl,
          canonicalUrl: opp.canonicalUrl || opp.applyUrl,
          providerId: opp.providerId || null,
          sourceName: opp.sourceName,
          sourceUrl: opp.sourceUrl,
          sourceSnippet: opp.sourceSnippet || "",
          sourceConfidence: opp.sourceConfidence,
          verificationStatus: opp.verificationStatus,
          sourceEvidence: JSON.stringify(opp.sourceEvidence || []),
          multiSourceProvenance: JSON.stringify(opp.multiSourceProvenance || []),
          guardVerdict: opp.guardVerdict || "CLEAN",
          embeddingJson: JSON.stringify(oppEmbedding),
          aiStructuredJson: JSON.stringify(structuredJob),
          isExpired: Boolean(opp.isExpired),
          fetchedAt: opp.fetchedAt ? new Date(opp.fetchedAt) : new Date(),
          discoveredAt: new Date(opp.discoveredAt || Date.now()),
          lastCheckedAt: new Date(opp.lastCheckedAt || Date.now()),
          isDemo: opp.isDemo,
        },
      });

      // Upsert latest evaluation with semantic score & skill gap intelligence
      await prisma.evaluation.deleteMany({ where: { opportunityId: opp.id } });
      await prisma.evaluation.create({
        data: {
          opportunityId: opp.id,
          recommendation: evaluation.recommendation,
          overallScore: evaluation.overallScore,
          semanticScore: evaluation.semanticScore ?? 0,
          scoreBreakdown: JSON.stringify(evaluation.scoreBreakdown),
          hardBlockers: JSON.stringify(evaluation.hardBlockers || []),
          rationale: evaluation.rationale,
          nextAction: evaluation.nextAction,
          aiMatchExplanation: evaluation.aiMatchExplanation || "",
          skillGapAnalysisJson: JSON.stringify(evaluation.skillGapAnalysis || []),
          uncertainties: JSON.stringify(evaluation.uncertainties || []),
          eligibilityChecks: JSON.stringify(evaluation.eligibilityChecks || []),
        },
      });
    } catch {
      // Ignore persistence errors during read-only or isolated unit tests
    }
  }

  recordStep(
    "evaluate_and_rank",
    "SUCCESS",
    `Evaluated ${processedResults.length} unique opportunities across ${loopResult.rounds.length} adaptive round(s) (Stop reason: ${loopResult.stopReason})`,
    `Generated recommendations: Apply Now (${loopResult.coverageSummary.applyNowCount}), Prepare First (${loopResult.coverageSummary.prepareFirstCount}), Keep Watching (${loopResult.coverageSummary.keepWatchingCount}), Skip (${loopResult.coverageSummary.skipCount}).`
  );

  const summary =
    processedResults.length === 0 && loopResult.mode === "LIVE"
      ? "No verified opportunities found from the currently available sources."
      : `Adaptive search completed ${loopResult.rounds.length} round(s) in ${loopResult.mode} mode (Stop reason: ${loopResult.stopReason}). Checked ${loopResult.coverageSummary.sourcesChecked.length} source(s), deduplicated ${loopResult.duplicatesRemovedTotal} overlap(s), and ranked ${processedResults.length} unique opportunities (${loopResult.coverageSummary.applyNowCount} Apply Now, ${loopResult.coverageSummary.prepareFirstCount} Prepare First).`;

  try {
    await prisma.agentRun.create({
      data: {
        id: runId,
        trigger: "ADAPTIVE_SEARCH",
        query: options.query || "adaptive-capability-search",
        mode: loopResult.mode,
        status:
          loopResult.coverageSummary.providersFailed.length > 0
            ? "PARTIAL_FAILURE"
            : "COMPLETED",
        summary,
        roundsJson: JSON.stringify(loopResult.rounds),
        searchPlanJson: JSON.stringify(loopResult.plans),
        coverageSummaryJson: JSON.stringify(loopResult.coverageSummary),
        stopReason: loopResult.stopReason,
        budgetUsed: loopResult.budgetUsed,
        budgetLimit: loopResult.budgetLimit,
        completedAt: new Date(),
        steps: {
          create: steps.map((s) => ({
            id: s.id,
            stepNumber: s.stepNumber,
            toolName: s.toolName,
            status: s.status,
            inputSummary: s.inputSummary.slice(0, 300),
            outputSummary: s.outputSummary.slice(0, 500),
            sourceReferences: JSON.stringify(s.sourceReferences),
            errorDetails: s.errorDetails || null,
            executedAt: new Date(s.executedAt),
          })),
        },
      },
    });
  } catch (err) {
    console.error("Failed to persist AgentRun in SQLite:", err);
  }

  return {
    runId,
    query: options.query || "",
    mode: loopResult.mode,
    status: "COMPLETED",
    opportunities: processedResults,
    summary,
    steps,
    liveEvents: loopResult.liveEvents,
    capabilityMap: loopResult.capabilityMap,
    expandedRoles: loopResult.expandedRoles,
    searchPlans: loopResult.plans,
    rounds: loopResult.rounds,
    stopReason: loopResult.stopReason,
    budgetUsed: loopResult.budgetUsed,
    budgetLimit: loopResult.budgetLimit,
    coverageSummary: loopResult.coverageSummary,
  };
}
