import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { loadActiveUserProfile } from "@/lib/agent/orchestrator";
import { extractCandidateCapabilityMap } from "@/lib/candidate-intelligence";
import { expandCandidateRoleFamilies } from "@/lib/role-expansion";
import { evaluateOpportunity } from "@/lib/scoring-engine";
import {
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL_ID,
  computeCosineSimilarity,
  evaluateRankingPerformance,
  generateCandidateEmbedding,
  generateOpportunityEmbedding,
} from "@/lib/ai/semantic-embeddings";
import {
  extractStructuredJobIntelligence,
  generateCandidateJobMatchIntelligence,
} from "@/lib/ai/job-intelligence";
import { modelRouter } from "@/lib/ai/model-router";
import {
  EvaluationResult,
  FeedbackSignalType,
  Opportunity,
  SkillGapIntelligenceItem,
  UserFeedbackRecord,
  UserProfile,
} from "@/types";

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const rawModeParam = searchParams.get("mode")?.toUpperCase();
    if (rawModeParam === "DEMO") {
      return NextResponse.json(
        {
          error:
            "NO_MOCK_DATA_POLICY_VIOLATION: Demo/mock mode is disabled. AI intelligence runs exclusively on live records.",
        },
        { status: 422 }
      );
    }
    const modeParam = "LIVE" as const;

    const loadedProfile =
      (await loadActiveUserProfile(user.userId)) ||
      (await loadActiveUserProfile());

    const profileConfigured = Boolean(
      loadedProfile &&
        ((loadedProfile.skills && loadedProfile.skills.length > 0) ||
          (loadedProfile.targetRoles && loadedProfile.targetRoles.length > 0) ||
          (loadedProfile.projects && loadedProfile.projects.length > 0))
    );

    const profile: UserProfile = loadedProfile || {
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
    const aiConfigured = modelRouter.isAnyAiConfigured();
    const activeProvider = modelRouter.getActiveProviderName();
    const unavailableReason = modelRouter.getAiUnavailableReason();

    const candidateSkillMap = extractCandidateCapabilityMap(profile);
    const capabilityExpansion = expandCandidateRoleFamilies(
      profile,
      candidateSkillMap
    );
    const candidateVec =
      profile.embedding && profile.embedding.length > 0
        ? profile.embedding
        : generateCandidateEmbedding(profile);

    const dbOpps = await prisma.opportunity.findMany({
      where: { isDemo: false },
      include: {
        evaluations: {
          orderBy: { evaluatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { discoveredAt: "desc" },
      take: 60,
    });

    const filteredDbOpps = dbOpps.filter(
      (o) => !o.isDemo && o.verificationStatus !== "DEMO_DATA" && !o.id.startsWith("demo-")
    );

    const evaluatedBundles: Array<{
      opportunity: Opportunity;
      evaluation: EvaluationResult;
      cosineSimilarity: number;
    }> = [];
    const evaluationsByOppId = new Map<string, EvaluationResult>();

    for (const item of filteredDbOpps) {
      const oppVec: number[] = (() => {
        try {
          const parsed = JSON.parse((item as any).embeddingJson || "[]");
          return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
        } catch {
          return [];
        }
      })();

      const opp: Opportunity = {
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
        multiSourceProvenance: JSON.parse(item.multiSourceProvenance || "[]"),
        guardVerdict: (item.guardVerdict as any) || "CLEAN",
        embedding: oppVec.length > 0 ? oppVec : undefined,
        isExpired: Boolean(item.isExpired),
        fetchedAt: item.fetchedAt.toISOString(),
        discoveredAt: item.discoveredAt.toISOString(),
        lastCheckedAt: item.lastCheckedAt.toISOString(),
        isDemo: item.isDemo,
      };

      if (!opp.embedding || opp.embedding.length === 0) {
        opp.embedding = generateOpportunityEmbedding(opp);
      }

      const cosineSimilarity = computeCosineSimilarity(candidateVec, opp.embedding);
      const evaluation = evaluateOpportunity(opp, profile);
      if (item.evaluations && item.evaluations[0]) {
        const storedEv = item.evaluations[0];
        if ((storedEv as any).aiMatchExplanation) {
          evaluation.aiMatchExplanation = (storedEv as any).aiMatchExplanation;
        }
        try {
          const parsedGaps = JSON.parse((storedEv as any).skillGapAnalysisJson || "[]");
          if (Array.isArray(parsedGaps) && parsedGaps.length > 0) {
            evaluation.skillGapAnalysis = parsedGaps;
          }
        } catch {
          // keep fresh evaluation gaps
        }
      }

      evaluationsByOppId.set(opp.id, evaluation);
      evaluatedBundles.push({
        opportunity: opp,
        evaluation,
        cosineSimilarity,
      });
    }

    // Sort by hybrid score first, with semantic similarity exposed
    evaluatedBundles.sort(
      (a, b) => b.evaluation.overallScore - a.evaluation.overallScore
    );

    // Aggregate Skill Gap Intelligence across top 15 relevant opportunities
    const gapMap = new Map<
      string,
      SkillGapIntelligenceItem & { frequency: number; targetRoles: string[] }
    >();
    for (const bundle of evaluatedBundles
      .filter((b) => b.evaluation.recommendation !== "SKIP")
      .slice(0, 15)) {
      for (const gap of bundle.evaluation.skillGapAnalysis || []) {
        const key = gap.skill.toLowerCase();
        const existing = gapMap.get(key);
        if (existing) {
          existing.frequency += 1;
          if (!existing.targetRoles.includes(bundle.opportunity.title)) {
            existing.targetRoles.push(bundle.opportunity.title);
          }
        } else {
          gapMap.set(key, {
            ...gap,
            frequency: 1,
            targetRoles: [bundle.opportunity.title],
          });
        }
      }
    }

    const skillGapSummary = Array.from(gapMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 8);

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

    const rankingMetrics = evaluateRankingPerformance({
      rankedOpportunities: evaluatedBundles.map((b) => b.opportunity),
      evaluationsByOppId,
      feedbackRecords: fbRecords,
      applications: appRows as any,
      profile,
    });

    return NextResponse.json({
      ok: true,
      mode: modeParam,
      profileConfigured,
      aiConfigured,
      activeProvider,
      unavailableReason,
      embeddingModel: {
        id: EMBEDDING_MODEL_ID,
        dimensions: EMBEDDING_DIMENSION,
        candidateVectorNorm: Math.round(
          Math.sqrt(candidateVec.reduce((acc, v) => acc + v * v, 0)) * 100
        ) / 100,
      },
      candidateSkillMap,
      capabilityExpansion,
      semanticMatches: evaluatedBundles.slice(0, 12).map((b) => ({
        opportunityId: b.opportunity.id,
        title: b.opportunity.title,
        organization: b.opportunity.organization,
        location: b.opportunity.location,
        workMode: b.opportunity.workMode,
        category: b.opportunity.category,
        cosineSimilarity: b.cosineSimilarity,
        overallScore: b.evaluation.overallScore,
        recommendation: b.evaluation.recommendation,
        scoreBreakdown: b.evaluation.scoreBreakdown,
        positiveEvidence: b.evaluation.positiveEvidence || [],
        missingQualifications: b.evaluation.missingQualifications || [],
        hardBlockers: b.evaluation.hardBlockers || [],
        eligibilityChecks: b.evaluation.eligibilityChecks || [],
        aiMatchExplanation: b.evaluation.aiMatchExplanation || b.evaluation.rationale,
        skillGaps: b.evaluation.skillGapAnalysis || [],
      })),
      skillGapSummary,
      rankingMetrics,
      methodologyExplanation: {
        pipelineStages: [
          "1. Candidate Resume & Capability Extraction (Direct vs. Inferred Adjacent Skills + Project Provenance)",
          "2. 128-D Semantic Embedding Generation (48 Latent Technical Domain Axes + 80 Hashed N-Gram Subword Projections, L2-Normalized)",
          "3. Hard Eligibility Gate (Graduation Window, Degree Level, Citizenship/Visa Sponsorship, Seniority Blockers)",
          "4. Explainable Hybrid Scoring (Eligibility 35 + Skills & Semantic Alignment 30 + Source Quality 15 + Location & Preferences 10 + Freshness & Deadline 10)",
          "5. Evidence-Grounded LLM Matching & Skill Gap Preparation Path Generation via Central ModelRouter",
        ],
        honestMlNote: rankingMetrics.modelFramingNote,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to compute AI Intelligence state",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const opportunityId = String(body.opportunityId || "").trim();

    if (!opportunityId) {
      return NextResponse.json(
        { ok: false, error: "opportunityId is required" },
        { status: 400 }
      );
    }

    const [profile, dbOpp] = await Promise.all([
      loadActiveUserProfile(user.userId),
      prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: {
          evaluations: {
            orderBy: { evaluatedAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    if (!dbOpp || !profile) {
      return NextResponse.json(
        { ok: false, error: "Opportunity or candidate profile not found" },
        { status: 404 }
      );
    }

    const opp: Opportunity = {
      id: dbOpp.id,
      title: dbOpp.title,
      organization: dbOpp.organization,
      category: dbOpp.category as any,
      employmentType: (dbOpp as any).employmentType || dbOpp.category,
      roleFamily: dbOpp.roleFamily || "General Technical",
      seniority: dbOpp.seniority || "Intern / Early-Career",
      description: dbOpp.description,
      location: dbOpp.location,
      workMode: dbOpp.workMode as any,
      compensation: dbOpp.compensation,
      eligibilityRequirements: JSON.parse(dbOpp.eligibilityRequirements || "[]"),
      requiredSkills: JSON.parse(dbOpp.requiredSkills || "[]"),
      preferredSkills: JSON.parse(dbOpp.preferredSkills || "[]"),
      publishedAt: dbOpp.publishedAt ? dbOpp.publishedAt.toISOString() : null,
      deadline: dbOpp.deadline ? dbOpp.deadline.toISOString() : null,
      deadlineRaw: dbOpp.deadlineRaw,
      applyUrl: dbOpp.applyUrl,
      sourceName: dbOpp.sourceName,
      sourceUrl: dbOpp.sourceUrl,
      sourceConfidence: dbOpp.sourceConfidence,
      verificationStatus: dbOpp.verificationStatus as any,
      sourceEvidence: JSON.parse(dbOpp.sourceEvidence || "[]"),
      discoveredAt: dbOpp.discoveredAt.toISOString(),
      lastCheckedAt: dbOpp.lastCheckedAt.toISOString(),
      isDemo: dbOpp.isDemo,
    };

    const evaluation = evaluateOpportunity(opp, profile);

    const [structuredJob, aiMatch] = await Promise.all([
      extractStructuredJobIntelligence(opp, true),
      generateCandidateJobMatchIntelligence({
        opportunity: opp,
        profile,
        evaluation,
        useLiveAi: true,
      }),
    ]);

    // Persist enriched structured job intelligence and AI match analysis
    await prisma.opportunity.update({
      where: { id: opp.id },
      data: {
        aiStructuredJson: JSON.stringify(structuredJob),
      },
    });

    if (dbOpp.evaluations && dbOpp.evaluations[0]) {
      await prisma.evaluation.update({
        where: { id: dbOpp.evaluations[0].id },
        data: {
          aiMatchExplanation: aiMatch.whyCandidateMatches,
          skillGapAnalysisJson: JSON.stringify(aiMatch.skillGaps),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      opportunityId: opp.id,
      structuredJob,
      aiMatch,
      provider: aiMatch.provider,
      model: aiMatch.model,
      isAiGenerated: aiMatch.isAiGenerated,
      unavailableReason: aiMatch.unavailableReason || null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to run deep AI job analysis",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
