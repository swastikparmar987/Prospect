"use strict";
"use client";

import React, { useState, useEffect } from "react";
import {
  Opportunity,
  EvaluationResult,
  CandidateCapabilityMap,
  ExpandedRole,
  RankingEvaluationMetrics,
  UserProfile,
} from "@/types";
import {
  Brain,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  BarChart3,
  Layers,
  Cpu,
  RefreshCw,
  X,
  ArrowUpRight,
} from "lucide-react";

interface AiIntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  capabilityMap?: CandidateCapabilityMap | null;
  expandedRoles?: ExpandedRole[];
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
  }>;
  rankingMetrics?: RankingEvaluationMetrics | null;
  searchMode: "DEMO" | "LIVE";
  onInspectOpportunity: (opp: Opportunity, evalResult: EvaluationResult) => void;
  onDismissRoleFamily?: (roleTitle: string) => void;
}

export function AiIntelligencePanel({
  isOpen,
  onClose,
  userProfile,
  capabilityMap,
  expandedRoles = [],
  opportunities,
  rankingMetrics,
  searchMode,
  onInspectOpportunity,
  onDismissRoleFamily,
}: AiIntelligencePanelProps) {
  const [activeSection, setActiveSection] = useState<
    "overview" | "semantic" | "gaps" | "roles" | "ranking"
  >("overview");
  const [aiData, setAiData] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [deepAnalyzingId, setDeepAnalyzingId] = useState<string | null>(null);
  const [deepResults, setDeepResults] = useState<Record<string, any>>({});

  const fetchAiIntelligence = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch(`/api/ai/intelligence?mode=${searchMode}`);
      const data = await res.json();
      setAiData(data);
    } catch (err) {
      console.error("Failed to load AI Intelligence state:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAiIntelligence();
    }
  }, [isOpen, searchMode, opportunities.length]);

  const handleRunDeepAiAnalysis = async (oppId: string) => {
    setDeepAnalyzingId(oppId);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: oppId }),
      });
      const data = await res.json();
      setDeepResults((prev) => ({ ...prev, [oppId]: data }));
    } catch (err) {
      console.error("Deep AI analysis failed:", err);
    } finally {
      setDeepAnalyzingId(null);
    }
  };

  if (!isOpen) return null;

  const metrics: RankingEvaluationMetrics | null =
    aiData?.rankingMetrics || rankingMetrics || null;
  const isAiConfigured = aiData?.aiStatus?.configured ?? true;
  const aiUnavailableReason = aiData?.aiStatus?.unavailableReason || null;
  const providerName =
    aiData?.aiStatus?.providerName || "Groq Cloud + Semantic Vector Engine";

  // Aggregate skill gaps from current opportunities
  const aggregatedGaps =
    aiData?.aggregatedSkillGaps && aiData.aggregatedSkillGaps.length > 0
      ? aiData.aggregatedSkillGaps
      : (() => {
          const map = new Map<string, any>();
          for (const { evaluation } of opportunities) {
            for (const g of evaluation.skillGapAnalysis || []) {
              const key = g.skill.toLowerCase();
              if (!map.has(key)) {
                map.set(key, { ...g, frequency: 1 });
              } else {
                map.get(key).frequency += 1;
              }
            }
          }
          return Array.from(map.values());
        })();

  return (
    <section
      aria-label="AI Intelligence and Semantic Ranking Panel"
      className="neo-card-lg overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="bg-[#080808] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#080808]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#E0FB66] border-2 border-white flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-[#080808]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg sm:text-xl font-extrabold text-white">
                AI Career Intelligence & Semantic Ranking Lab
              </h2>
              <span
                className={`text-[10px] font-heading font-extrabold px-2.5 py-0.5 rounded-full border ${
                  isAiConfigured
                    ? "bg-[#E0FB66] text-[#080808] border-[#E0FB66]"
                    : "bg-[#FEF189] text-[#080808] border-[#FEF189]"
                }`}
              >
                {isAiConfigured ? `LIVE AI: ${providerName}` : "AI KEY UNAVAILABLE"}
              </span>
            </div>
            <p className="text-xs text-[#D8D5CE] mt-0.5">
              128-D L2-normalized semantic embeddings (`prospect-semantic-embed-v1-128d`) +
              evidence-grounded LLM matching & skill gap synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAiIntelligence}
            disabled={loadingAi}
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#E0FB66] px-3.5 py-1.5 font-heading text-xs font-extrabold text-[#080808] transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingAi ? "animate-spin" : ""}`} />
            <span>Recompute</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
            aria-label="Close AI Intelligence Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Unavailable AI Key Warning if missing */}
      {!isAiConfigured && aiUnavailableReason && (
        <div className="bg-[#FEF189] border-b-2 border-[#080808] px-5 py-2.5 text-xs font-medium text-[#080808] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#080808] shrink-0" />
          <span>{aiUnavailableReason}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#FDF9F3] px-5 py-2.5 border-b-2 border-[#080808] text-xs font-heading font-bold">
        {[
          { id: "overview", label: "Candidate Skill Map & AI Resume", icon: Cpu },
          {
            id: "semantic",
            label: `Semantic Matches & Explanations (${opportunities.length})`,
            icon: Sparkles,
          },
          {
            id: "gaps",
            label: `Skill Gap Intelligence (${aggregatedGaps.length})`,
            icon: BookOpen,
          },
          {
            id: "roles",
            label: `Capability & Role Expansion (${
              expandedRoles.filter((r) => !r.excludedByUser).length
            })`,
            icon: Layers,
          },
          { id: "ranking", label: "ML Ranking & IR Metrics", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition cursor-pointer ${
                activeSection === tab.id
                  ? "bg-[#E0FB66] text-[#080808] border-2 border-[#080808] shadow-[2px_2px_0px_#080808]"
                  : "bg-white text-[#080808] border border-[#D8D5CE] hover:border-[#080808]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content Body */}
      <div className="p-5 space-y-5">
        {/* 1. CANDIDATE SKILL MAP & AI RESUME INSIGHTS */}
        {activeSection === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Direct Skills */}
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 shadow-[3px_3px_0px_#080808]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#080808]">
                    Demonstrated Direct Skills
                  </span>
                  <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2 py-0.5 text-[11px] font-bold text-[#080808]">
                    {capabilityMap?.demonstratedCapabilities?.length ||
                      userProfile?.skills?.length ||
                      0}{" "}
                    verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    capabilityMap?.demonstratedCapabilities?.map((c) => c.capability) ||
                    userProfile?.skills ||
                    []
                  ).length > 0 ? (
                    (
                      capabilityMap?.demonstratedCapabilities?.map((c) => c.capability) ||
                      userProfile?.skills ||
                      []
                    ).map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-white border-2 border-[#080808] px-2.5 py-1 text-xs font-bold text-[#080808]"
                      >
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#777777] italic">
                      No direct skills recorded yet — upload your resume or add skills in Profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Inferred Adjacent Capabilities */}
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 shadow-[3px_3px_0px_#080808]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#080808]">
                    Inferred Adjacent Skills
                  </span>
                  <span className="text-[11px] font-bold text-[#777777]">
                    Transferable Graph
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(capabilityMap?.inferredAdjacentCapabilities || []).length > 0 ? (
                    capabilityMap?.inferredAdjacentCapabilities.map((adj) => (
                      <span
                        key={adj.id || adj.capability}
                        className="rounded-lg bg-[#E0FB66]/55 border border-[#080808] px-2.5 py-1 text-xs font-semibold text-[#080808]"
                        title={adj.description}
                      >
                        + {adj.capability} ({adj.evidenceStrength})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#777777]">
                      Upload or save profile skills to compute adjacent capability graph.
                    </span>
                  )}
                </div>
              </div>

              {/* Career Direction & AI Resume Extraction */}
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 shadow-[3px_3px_0px_#080808]">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#080808] block mb-2">
                  AI Career Direction & Vector Status
                </span>
                <p className="text-xs text-[#080808] leading-relaxed font-medium">
                  {(userProfile?.aiInsights?.careerDirections &&
                  userProfile.aiInsights.careerDirections.length > 0
                    ? userProfile.aiInsights.careerDirections.join(" • ")
                    : null) ||
                    aiData?.candidateSkillMap?.aiInsights
                      ?.careerDirectionSummary ||
                    `Focused on ${(
                      userProfile?.targetRoles || ["Software & AI Engineering"]
                    ).join(", ")} grounded in ${
                      userProfile?.major || "Computer Science"
                    } (${userProfile?.degree || "Student"}).`}
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#D8D5CE] flex items-center justify-between text-[11px] text-[#777777]">
                  <span>
                    Embedding Model:{" "}
                    <strong className="font-mono text-[#080808]">
                      {aiData?.candidateSkillMap?.embeddingModel ||
                        "prospect-semantic-embed-v1-128d"}
                    </strong>
                  </span>
                  <span className="rounded-md bg-[#E0FB66] border border-[#080808] text-[#080808] px-1.5 py-0.5 font-bold text-[10px]">
                    128-D Active
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation Generation Methodology Box */}
            <div className="rounded-2xl border-2 border-[#080808] bg-[#FEF189] p-4 text-xs text-[#080808] space-y-1.5 shadow-[3px_3px_0px_#080808]">
              <div className="font-extrabold text-[#080808] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>How Recommendations & Rankings Are Generated</span>
              </div>
              <p className="leading-relaxed text-[#080808]/90 font-medium">
                Each opportunity is evaluated through a hybrid 100-point pipeline:{" "}
                <strong>Eligibility Compatibility (0–35 pts)</strong> with hard-blocker override,{" "}
                <strong>Skill & Experience Overlap (0–30 pts)</strong>,{" "}
                <strong>128-D Semantic Vector Similarity (0–10 pts)</strong>,{" "}
                <strong>Source Evidence & Quality (0–15 pts)</strong>,{" "}
                <strong>Location & Work-Mode Preferences (0–10 pts)</strong>, and{" "}
                <strong>Deadline Feasibility (0–10 pts)</strong>. No hiring probabilities or unverified claims are ever fabricated.
              </p>
            </div>
          </div>
        )}

        {/* 2. SEMANTIC SEARCH MATCHES & EXPLANATIONS */}
        {activeSection === "semantic" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#777777]">
                Inspect semantic vector similarity, eligibility verdict, and evidence-grounded AI matching explanations for discovered opportunities.
              </p>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {opportunities.slice(0, 12).map(({ opportunity, evaluation }) => {
                const rawCosine =
                  evaluation.scoreBreakdown.rawCosineSimilarity ?? 0;
                const semanticPts = evaluation.scoreBreakdown.semantic ?? 0;
                const deepData = deepResults[opportunity.id];

                return (
                  <div
                    key={opportunity.id}
                    className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 space-y-2.5 shadow-[3px_3px_0px_#080808]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-[#080808]">
                            {opportunity.title}
                          </h4>
                          <span className="text-xs font-semibold text-[#777777]">
                            • {opportunity.organization}
                          </span>
                        </div>
                        <p className="text-xs text-[#777777] mt-0.5">
                          {opportunity.location} ({opportunity.workMode})
                          {typeof opportunity.distanceKm === "number"
                            ? ` • ${opportunity.distanceKm} km away`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-1 text-xs font-bold text-[#080808]">
                          Semantic: {Math.round(rawCosine * 100)}% ({semanticPts}/10 pts)
                        </span>
                        <span className="rounded-full bg-[#080808] px-2.5 py-1 text-xs font-bold text-white">
                          Hybrid Fit: {evaluation.overallScore}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRunDeepAiAnalysis(opportunity.id)}
                          disabled={deepAnalyzingId === opportunity.id}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-[#080808] bg-white hover:bg-[#E0FB66] px-2.5 py-1 text-[11px] font-bold text-[#080808] transition cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>
                            {deepAnalyzingId === opportunity.id
                              ? "Running LLM..."
                              : "Run Live LLM Analysis"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onInspectOpportunity(opportunity, evaluation)
                          }
                          className="inline-flex items-center gap-1 rounded-full bg-[#FEF189] border-2 border-[#080808] hover:bg-[#E0FB66] px-2.5 py-1 text-[11px] font-bold text-[#080808] transition cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Score Component Debug Strip */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px]">
                      <div className="rounded-lg bg-white border-2 border-[#080808] px-2 py-1">
                        <span className="text-[#777777] block text-[10px] font-semibold">
                          Eligibility
                        </span>
                        <strong className="text-[#080808]">
                          {evaluation.scoreBreakdown.eligibility}/35
                        </strong>
                      </div>
                      <div className="rounded-lg bg-white border-2 border-[#080808] px-2 py-1">
                        <span className="text-[#777777] block text-[10px] font-semibold">
                          Skills
                        </span>
                        <strong className="text-[#080808]">
                          {evaluation.scoreBreakdown.skills}/30
                        </strong>
                      </div>
                      <div className="rounded-lg bg-[#E0FB66] border-2 border-[#080808] px-2 py-1">
                        <span className="text-[#080808] block text-[10px] font-bold">
                          Semantic Vec
                        </span>
                        <strong className="text-[#080808]">
                          {semanticPts}/10
                        </strong>
                      </div>
                      <div className="rounded-lg bg-white border-2 border-[#080808] px-2 py-1">
                        <span className="text-[#777777] block text-[10px] font-semibold">
                          Quality
                        </span>
                        <strong className="text-[#080808]">
                          {evaluation.scoreBreakdown.quality}/15
                        </strong>
                      </div>
                      <div className="rounded-lg bg-white border-2 border-[#080808] px-2 py-1">
                        <span className="text-[#777777] block text-[10px] font-semibold">
                          Location/Pref
                        </span>
                        <strong className="text-[#080808]">
                          {evaluation.scoreBreakdown.preferences}/10
                        </strong>
                      </div>
                      <div className="rounded-lg bg-white border-2 border-[#080808] px-2 py-1">
                        <span className="text-[#777777] block text-[10px] font-semibold">
                          Freshness/DL
                        </span>
                        <strong className="text-[#080808]">
                          {evaluation.scoreBreakdown.deadline}/10
                        </strong>
                      </div>
                    </div>

                    {/* AI Match Explanation */}
                    <p className="text-xs text-[#080808] leading-relaxed bg-white rounded-xl border border-[#D8D5CE] p-2.5">
                      <strong className="text-[#080808]">
                        AI Matching Explanation:{" "}
                      </strong>
                      {deepData?.matchIntelligence?.whyCandidateMatches ||
                        evaluation.aiMatchExplanation ||
                        evaluation.rationale}
                    </p>

                    {/* Deep LLM Structured Output (if triggered) */}
                    {deepData && (
                      <div className="rounded-xl border-2 border-[#080808] bg-[#E0FB66]/45 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-[#080808]">
                          <span>
                            Live LLM Structured Extraction (
                            {deepData.aiStatus?.modelUsed || "Groq LLM"})
                          </span>
                          <span>
                            Eligibility:{" "}
                            {deepData.matchIntelligence?.eligibilityStatus ||
                              "ELIGIBLE"}
                          </span>
                        </div>
                        <p className="text-[#080808]">
                          <strong>Preparation Needed:</strong>{" "}
                          {deepData.matchIntelligence?.preparationNeeded}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. SKILL GAP INTELLIGENCE */}
        {activeSection === "gaps" && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#777777]">
              Missing skills identified across your matched opportunities, why they matter for those roles, and concrete preparation paths with learning resources.
            </p>
            {aggregatedGaps.length === 0 ? (
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-6 text-center text-xs text-[#080808]">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-[#080808]" />
                <strong>Strong Skill Coverage!</strong> Your demonstrated profile skills cover the core requirements of the currently displayed opportunities.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aggregatedGaps.map((gap: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 space-y-2 text-xs shadow-[3px_3px_0px_#080808]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-[#080808]">
                        Missing Skill: {gap.skill}
                      </span>
                      <span className="rounded-full bg-[#FEF189] border border-[#080808] px-2.5 py-0.5 text-[10px] font-bold text-[#080808]">
                        {gap.estimatedEffort || "1–2 weeks"}
                      </span>
                    </div>
                    <p className="text-[#080808]/85">
                      <strong className="text-[#080808]">Why it matters: </strong>
                      {gap.whyItMatters}
                    </p>
                    <p className="text-[#080808]/85">
                      <strong className="text-[#080808]">
                        Practical Preparation Path:{" "}
                      </strong>
                      {gap.preparationPath}
                    </p>
                    {gap.recommendedResources &&
                      gap.recommendedResources.length > 0 && (
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
                          {gap.recommendedResources.map((res: any, rIdx: number) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 rounded-lg bg-white border-2 border-[#080808] px-2.5 py-1 text-[11px] font-bold text-[#080808] hover:bg-[#E0FB66]"
                            >
                              <span>{res.title}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CAPABILITY & ROLE EXPANSION */}
        {activeSection === "roles" && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#777777]">
              Adjacent role families inferred from your demonstrated capabilities and transferable skills — avoiding unrelated roles.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expandedRoles
                .filter((r) => !r.excludedByUser)
                .map((role) => (
                  <div
                    key={role.id || role.title}
                    className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-3.5 text-xs flex flex-col justify-between gap-2 shadow-[3px_3px_0px_#080808]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-[#080808]">
                          {role.title}
                        </span>
                        <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2 py-0.5 text-[10px] font-bold text-[#080808]">
                          {role.relevanceEstimate || Math.round(role.confidence * 100)}% match
                        </span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-mono uppercase text-[#777777]">
                        {role.familyLabel || role.roleFamily.replace(/_/g, " ")}
                      </span>
                      <p className="mt-1.5 text-[#080808]/85 leading-relaxed">
                        {role.expansionRationale}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#D8D5CE]">
                      <span className="text-[10px] text-[#777777] truncate">
                        Evidence: {role.supportingEvidence.slice(0, 3).join(", ")}
                      </span>
                      {onDismissRoleFamily && (
                        <button
                          type="button"
                          onClick={() => onDismissRoleFamily(role.title)}
                          className="text-[10px] font-bold text-[#080808] underline hover:opacity-75 shrink-0 cursor-pointer"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 5. ML RANKING & IR EVALUATION METRICS */}
        {activeSection === "ranking" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-3 shadow-[3px_3px_0px_#080808]">
                <span className="text-[10px] font-bold uppercase text-[#777777] block">
                  Precision@5
                </span>
                <span className="text-xl font-extrabold text-[#080808]">
                  {metrics?.precisionAtK?.[5] !== undefined
                    ? `${Math.round(metrics.precisionAtK[5] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-3 shadow-[3px_3px_0px_#080808]">
                <span className="text-[10px] font-bold uppercase text-[#777777] block">
                  Recall@5
                </span>
                <span className="text-xl font-extrabold text-[#080808]">
                  {metrics?.recallAtK?.[5] !== undefined
                    ? `${Math.round(metrics.recallAtK[5] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-2xl border-2 border-[#080808] bg-[#E0FB66] p-3 shadow-[3px_3px_0px_#080808]">
                <span className="text-[10px] font-extrabold uppercase text-[#080808] block">
                  NDCG@5
                </span>
                <span className="text-xl font-extrabold text-[#080808]">
                  {metrics?.ndcgAtK?.[5] !== undefined
                    ? metrics.ndcgAtK[5].toFixed(3)
                    : "—"}
                </span>
              </div>
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-3 shadow-[3px_3px_0px_#080808]">
                <span className="text-[10px] font-bold uppercase text-[#777777] block">
                  Precision@10
                </span>
                <span className="text-xl font-extrabold text-[#080808]">
                  {metrics?.precisionAtK?.[10] !== undefined
                    ? `${Math.round(metrics.precisionAtK[10] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-3 shadow-[3px_3px_0px_#080808]">
                <span className="text-[10px] font-bold uppercase text-[#777777] block">
                  Recall@10
                </span>
                <span className="text-xl font-extrabold text-[#080808]">
                  {metrics?.recallAtK?.[10] !== undefined
                    ? `${Math.round(metrics.recallAtK[10] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-2xl border-2 border-[#080808] bg-[#FEF189] p-3 shadow-[3px_3px_0px_#080808]">
                <span className="text-[10px] font-extrabold uppercase text-[#080808] block">
                  NDCG@10
                </span>
                <span className="text-xl font-extrabold text-[#080808]">
                  {metrics?.ndcgAtK?.[10] !== undefined
                    ? metrics.ndcgAtK[10].toFixed(3)
                    : "—"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-[#080808]">
                  Transparent ML & Ranking Architecture Disclosure
                </span>
                <span className="font-mono font-bold text-[11px] text-[#080808]">
                  Labels evaluated: {metrics?.labeledFeedbackCount || 0} (
                  {metrics?.evaluationMethod || "HYBRID_RELEVANCE_BENCHMARK"})
                </span>
              </div>
              <p className="text-[#777777] leading-relaxed">
                {metrics?.modelFramingNote ||
                  "Semantic embedding model (prospect-semantic-embed-v1-128d) + hybrid multi-factor scoring. Note: This is an unsupervised semantic embedding & evidence-grounded hybrid ranker, not a supervised classifier trained on historical hiring outcomes. User feedback signals (+Relevant / Not Relevant / Saved / Applied) are persisted in FeedbackSignal to evaluate Precision@K, Recall@K, and NDCG@K."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
