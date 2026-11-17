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
      className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="bg-[#101214] text-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#E3FC6D] border border-[#C6E832] shadow-[0_4px_14px_rgba(227,252,109,0.25)] flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-[#0E1012]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
                AI Career Intelligence & Semantic Ranking Lab
              </h2>
              <span
                className={`text-[10px] font-heading font-semibold px-2.5 py-0.5 rounded-full border ${
                  isAiConfigured
                    ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832]"
                    : "bg-[#FEF9E7] text-[#7A5908] border-[#F5DFA0]"
                }`}
              >
                {isAiConfigured ? `LIVE AI: ${providerName}` : "AI KEY UNAVAILABLE"}
              </span>
            </div>
            <p className="text-xs text-white/65 mt-0.5">
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
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#E3FC6D] px-3.5 py-1.5 font-heading text-xs font-semibold text-[#101214] shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingAi ? "animate-spin" : ""}`} />
            <span>Recompute</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close AI Intelligence Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Unavailable AI Key Warning if missing */}
      {!isAiConfigured && aiUnavailableReason && (
        <div className="bg-[#FEF9E7] border-b border-[#F5DFA0] px-5 py-2.5 text-xs font-medium text-[#7A5908] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#7A5908] shrink-0" />
          <span>{aiUnavailableReason}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#FAFBF7] px-5 py-3 border-b border-black/[0.06] text-xs font-heading">
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
                  ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                  : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* 1. CANDIDATE SKILL MAP & AI RESUME INSIGHTS */}
        {activeSection === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Direct Skills */}
              <div className="rounded-[20px] border border-black/[0.06] bg-[#FAFBF7] p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    Demonstrated Direct Skills
                  </span>
                  <span className="rounded-full bg-[#E3FC6D] border border-[#C6E832] px-2.5 py-0.5 text-[11px] font-semibold text-[#0E1012]">
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
                        className="rounded-full bg-white border border-black/[0.07] px-2.5 py-1 text-xs font-medium text-[#101214]"
                      >
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6B7280] italic">
                      No direct skills recorded yet — upload your resume or add skills in Profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Inferred Adjacent Capabilities */}
              <div className="rounded-[20px] border border-black/[0.06] bg-[#FAFBF7] p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    Inferred Adjacent Skills
                  </span>
                  <span className="text-[11px] font-medium text-[#6B7280]">
                    Transferable Graph
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(capabilityMap?.inferredAdjacentCapabilities || []).length > 0 ? (
                    capabilityMap?.inferredAdjacentCapabilities.map((adj) => (
                      <span
                        key={adj.id || adj.capability}
                        className="rounded-full bg-[#F3FCDA]/80 border border-[#C7E938]/50 px-2.5 py-1 text-xs font-medium text-[#0E1012]"
                        title={adj.description}
                      >
                        + {adj.capability} ({adj.evidenceStrength})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6B7280]">
                      Upload or save profile skills to compute adjacent capability graph.
                    </span>
                  )}
                </div>
              </div>

              {/* Career Direction & AI Resume Extraction */}
              <div className="rounded-[20px] border border-black/[0.06] bg-[#FAFBF7] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] block mb-2.5">
                    AI Career Direction & Vector Status
                  </span>
                  <p className="text-xs text-[#1F2937] leading-relaxed font-medium">
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
                </div>
                <div className="mt-3 pt-2.5 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>
                    Embedding Model:{" "}
                    <strong className="font-mono text-[#101214]">
                      {aiData?.candidateSkillMap?.embeddingModel ||
                        "prospect-semantic-embed-v1-128d"}
                    </strong>
                  </span>
                  <span className="rounded-full bg-[#E3FC6D] border border-[#C6E832] text-[#0E1012] px-2 py-0.5 font-semibold text-[10px]">
                    128-D Active
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation Generation Methodology Box */}
            <div className="rounded-[20px] border border-[#F5DFA0] bg-[#FEF9E7] p-4 text-xs text-[#101214] space-y-1.5">
              <div className="font-bold text-[#7A5908] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>How Recommendations & Rankings Are Generated</span>
              </div>
              <p className="leading-relaxed text-[#4B5563] font-medium">
                Each opportunity is evaluated through a hybrid 100-point pipeline:{" "}
                <strong className="text-[#101214]">Eligibility Compatibility (0–35 pts)</strong> with hard-blocker override,{" "}
                <strong className="text-[#101214]">Skill & Experience Overlap (0–30 pts)</strong>,{" "}
                <strong className="text-[#101214]">128-D Semantic Vector Similarity (0–10 pts)</strong>,{" "}
                <strong className="text-[#101214]">Source Evidence & Quality (0–15 pts)</strong>,{" "}
                <strong className="text-[#101214]">Location & Work-Mode Preferences (0–10 pts)</strong>, and{" "}
                <strong className="text-[#101214]">Deadline Feasibility (0–10 pts)</strong>. No hiring probabilities or unverified claims are ever fabricated.
              </p>
            </div>
          </div>
        )}

        {/* 2. SEMANTIC SEARCH MATCHES & EXPLANATIONS */}
        {activeSection === "semantic" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#6B7280]">
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
                    className="rounded-[20px] border border-black/[0.07] bg-white p-4 space-y-3 shadow-[0_4px_18px_rgba(15,23,42,0.03)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-[#101214]">
                            {opportunity.title}
                          </h4>
                          <span className="text-xs font-medium text-[#6B7280]">
                            • {opportunity.organization}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {opportunity.location} ({opportunity.workMode})
                          {typeof opportunity.distanceKm === "number"
                            ? ` • ${opportunity.distanceKm} km away`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-[#F3FCDA]/80 border border-[#C7E938]/50 px-2.5 py-1 text-xs font-semibold text-[#0E1012]">
                          Semantic: {Math.round(rawCosine * 100)}% ({semanticPts}/10 pts)
                        </span>
                        <span className="rounded-full bg-[#101214] px-2.5 py-1 text-xs font-semibold text-white">
                          Hybrid Fit: {evaluation.overallScore}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRunDeepAiAnalysis(opportunity.id)}
                          disabled={deepAnalyzingId === opportunity.id}
                          className="inline-flex items-center gap-1 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3 py-1 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="h-3 w-3 text-[#65B811]" />
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
                          className="inline-flex items-center gap-1 rounded-full bg-[#E3FC6D] border border-[#C6E832] hover:bg-[#D7F54D] px-3 py-1 text-[11px] font-semibold text-[#0E1012] transition cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Score Component Debug Strip */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px]">
                      <div className="rounded-xl bg-[#FAFBF7] border border-black/[0.06] px-2.5 py-1.5">
                        <span className="text-[#6B7280] block text-[10px] font-medium">
                          Eligibility
                        </span>
                        <strong className="text-[#101214]">
                          {evaluation.scoreBreakdown.eligibility}/35
                        </strong>
                      </div>
                      <div className="rounded-xl bg-[#FAFBF7] border border-black/[0.06] px-2.5 py-1.5">
                        <span className="text-[#6B7280] block text-[10px] font-medium">
                          Skills
                        </span>
                        <strong className="text-[#101214]">
                          {evaluation.scoreBreakdown.skills}/30
                        </strong>
                      </div>
                      <div className="rounded-xl bg-[#F3FCDA]/80 border border-[#C7E938]/50 px-2.5 py-1.5">
                        <span className="text-[#0E1012] block text-[10px] font-semibold">
                          Semantic Vec
                        </span>
                        <strong className="text-[#0E1012]">
                          {semanticPts}/10
                        </strong>
                      </div>
                      <div className="rounded-xl bg-[#FAFBF7] border border-black/[0.06] px-2.5 py-1.5">
                        <span className="text-[#6B7280] block text-[10px] font-medium">
                          Quality
                        </span>
                        <strong className="text-[#101214]">
                          {evaluation.scoreBreakdown.quality}/15
                        </strong>
                      </div>
                      <div className="rounded-xl bg-[#FAFBF7] border border-black/[0.06] px-2.5 py-1.5">
                        <span className="text-[#6B7280] block text-[10px] font-medium">
                          Location/Pref
                        </span>
                        <strong className="text-[#101214]">
                          {evaluation.scoreBreakdown.preferences}/10
                        </strong>
                      </div>
                      <div className="rounded-xl bg-[#FAFBF7] border border-black/[0.06] px-2.5 py-1.5">
                        <span className="text-[#6B7280] block text-[10px] font-medium">
                          Freshness/DL
                        </span>
                        <strong className="text-[#101214]">
                          {evaluation.scoreBreakdown.deadline}/10
                        </strong>
                      </div>
                    </div>

                    {/* AI Match Explanation */}
                    <p className="text-xs text-[#1F2937] leading-relaxed bg-[#FAFBF7] rounded-xl border border-black/[0.06] p-3">
                      <strong className="text-[#101214]">
                        AI Matching Explanation:{" "}
                      </strong>
                      {deepData?.matchIntelligence?.whyCandidateMatches ||
                        evaluation.aiMatchExplanation ||
                        evaluation.rationale}
                    </p>

                    {/* Deep LLM Structured Output (if triggered) */}
                    {deepData && (
                      <div className="rounded-xl border border-[#C7E938]/60 bg-[#F3FCDA]/80 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-semibold text-[#0E1012]">
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
                        <p className="text-[#101214]">
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
            <p className="text-xs font-medium text-[#6B7280]">
              Missing skills identified across your matched opportunities, why they matter for those roles, and concrete preparation paths with learning resources.
            </p>
            {aggregatedGaps.length === 0 ? (
              <div className="rounded-[20px] border border-black/[0.07] bg-[#FAFBF7] p-6 text-center text-xs text-[#101214]">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-[#4D7C0F]" />
                <strong>Strong Skill Coverage!</strong> Your demonstrated profile skills cover the core requirements of the currently displayed opportunities.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {aggregatedGaps.map((gap: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-[20px] border border-black/[0.07] bg-white p-4 space-y-2.5 text-xs shadow-[0_4px_18px_rgba(15,23,42,0.03)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-[#101214]">
                        Missing Skill: {gap.skill}
                      </span>
                      <span className="rounded-full bg-[#FEF9E7] border border-[#F5DFA0] px-2.5 py-0.5 text-[10px] font-semibold text-[#7A5908] shrink-0">
                        {gap.estimatedEffort || "1–2 weeks"}
                      </span>
                    </div>
                    <p className="text-[#4B5563]">
                      <strong className="text-[#101214]">Why it matters: </strong>
                      {gap.whyItMatters}
                    </p>
                    <p className="text-[#4B5563]">
                      <strong className="text-[#101214]">
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
                              className="inline-flex items-center gap-1 rounded-full bg-[#FAFBF7] border border-black/[0.08] px-3 py-1 text-[11px] font-semibold text-[#101214] hover:bg-[#F3FCDA] hover:border-[#C7E938]/60 transition"
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
            <p className="text-xs font-medium text-[#6B7280]">
              Adjacent role families inferred from your demonstrated capabilities and transferable skills — avoiding unrelated roles.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {expandedRoles
                .filter((r) => !r.excludedByUser)
                .map((role) => (
                  <div
                    key={role.id || role.title}
                    className="rounded-[20px] border border-black/[0.07] bg-white p-4 text-xs flex flex-col justify-between gap-2.5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#101214]">
                          {role.title}
                        </span>
                        <span className="rounded-full bg-[#E3FC6D] border border-[#C6E832] px-2.5 py-0.5 text-[10px] font-semibold text-[#0E1012] shrink-0">
                          {role.relevanceEstimate || Math.round(role.confidence * 100)}% match
                        </span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-mono uppercase text-[#6B7280]">
                        {role.familyLabel || role.roleFamily.replace(/_/g, " ")}
                      </span>
                      <p className="mt-1.5 text-[#4B5563] leading-relaxed">
                        {role.expansionRationale}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.06]">
                      <span className="text-[10px] text-[#6B7280] truncate">
                        Evidence: {role.supportingEvidence.slice(0, 3).join(", ")}
                      </span>
                      {onDismissRoleFamily && (
                        <button
                          type="button"
                          onClick={() => onDismissRoleFamily(role.title)}
                          className="text-[10px] font-semibold text-[#4B5563] hover:text-[#101214] underline shrink-0 cursor-pointer"
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
              <div className="rounded-[20px] border border-black/[0.07] bg-[#FAFBF7] p-3.5">
                <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">
                  Precision@5
                </span>
                <span className="text-xl font-extrabold text-[#101214] mt-0.5 block">
                  {metrics?.precisionAtK?.[5] !== undefined
                    ? `${Math.round(metrics.precisionAtK[5] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-[20px] border border-black/[0.07] bg-[#FAFBF7] p-3.5">
                <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">
                  Recall@5
                </span>
                <span className="text-xl font-extrabold text-[#101214] mt-0.5 block">
                  {metrics?.recallAtK?.[5] !== undefined
                    ? `${Math.round(metrics.recallAtK[5] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-[20px] border border-[#C7E938]/55 bg-[#F3FCDA]/80 p-3.5">
                <span className="text-[10px] font-bold uppercase text-[#0E1012] block">
                  NDCG@5
                </span>
                <span className="text-xl font-extrabold text-[#0E1012] mt-0.5 block">
                  {metrics?.ndcgAtK?.[5] !== undefined
                    ? metrics.ndcgAtK[5].toFixed(3)
                    : "—"}
                </span>
              </div>
              <div className="rounded-[20px] border border-black/[0.07] bg-[#FAFBF7] p-3.5">
                <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">
                  Precision@10
                </span>
                <span className="text-xl font-extrabold text-[#101214] mt-0.5 block">
                  {metrics?.precisionAtK?.[10] !== undefined
                    ? `${Math.round(metrics.precisionAtK[10] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-[20px] border border-black/[0.07] bg-[#FAFBF7] p-3.5">
                <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">
                  Recall@10
                </span>
                <span className="text-xl font-extrabold text-[#101214] mt-0.5 block">
                  {metrics?.recallAtK?.[10] !== undefined
                    ? `${Math.round(metrics.recallAtK[10] * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="rounded-[20px] border border-[#F5DFA0] bg-[#FEF9E7] p-3.5">
                <span className="text-[10px] font-bold uppercase text-[#7A5908] block">
                  NDCG@10
                </span>
                <span className="text-xl font-extrabold text-[#7A5908] mt-0.5 block">
                  {metrics?.ndcgAtK?.[10] !== undefined
                    ? metrics.ndcgAtK[10].toFixed(3)
                    : "—"}
                </span>
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.07] bg-[#FAFBF7] p-4 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#101214]">
                  Transparent ML & Ranking Architecture Disclosure
                </span>
                <span className="font-mono font-semibold text-[11px] text-[#4B5563]">
                  Labels evaluated: {metrics?.labeledFeedbackCount || 0} (
                  {metrics?.evaluationMethod || "HYBRID_RELEVANCE_BENCHMARK"})
                </span>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
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
