"use client";

import React, { useState } from "react";
import { Opportunity, EvaluationResult, PreparationPlan, ApplicationMaterials } from "@/types";
import {
  X,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  RefreshCw,
  Building,
  MapPin,
} from "lucide-react";

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  initialEvaluation: EvaluationResult | null;
  initialTab?: TabType;
  isOpen: boolean;
  onClose: () => void;
  onSaveToTracker: (opp: Opportunity) => void;
  onPlanUpdated?: () => void;
}

export type TabType = "overview" | "eligibility" | "evidence" | "why" | "prep_plan" | "studio";

export function OpportunityDetailModal({
  opportunity,
  initialEvaluation,
  initialTab = "overview",
  isOpen,
  onClose,
  onSaveToTracker,
  onPlanUpdated,
}: OpportunityDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(initialEvaluation);
  const [prepPlan, setPrepPlan] = useState<PreparationPlan | null>(null);
  const [studioMaterials, setStudioMaterials] = useState<ApplicationMaterials | null>(null);
  const [loadingStudio, setLoadingStudio] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deepAiLoading, setDeepAiLoading] = useState(false);
  const [deepAiResult, setDeepAiResult] = useState<any>(null);

  const handleGeneratePlan = async () => {
    if (!opportunity) return;
    setGeneratingPlan(true);
    try {
      const res = await fetch("/api/preparation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      const data = await res.json();
      if (data.preparationPlan) {
        setPrepPlan(data.preparationPlan);
        onPlanUpdated?.();
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Sync initial evaluation when modal opens
  React.useEffect(() => {
    setEvaluation(initialEvaluation);
    setActiveTab(initialTab);
    setVerificationFeedback(null);
    setDeepAiResult(null);
    if (opportunity) {
      // Fetch fresh detail and prep plan if exists
      fetch(`/api/opportunities/${opportunity.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.evaluation) setEvaluation(data.evaluation);
          if (data.preparationPlan) setPrepPlan(data.preparationPlan);
        })
        .catch(console.error);
    }
  }, [opportunity, initialEvaluation, initialTab]);

  const handleRunDeepAi = async () => {
    if (!opportunity) return;
    setDeepAiLoading(true);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      const data = await res.json();
      setDeepAiResult(data);
    } catch (err) {
      console.error("Failed to run deep AI analysis:", err);
    } finally {
      setDeepAiLoading(false);
    }
  };

  // Load Studio materials on demand
  const handleLoadStudio = async () => {
    if (!opportunity) return;
    setLoadingStudio(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/prep-studio`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.materials) {
        setStudioMaterials(data.materials);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudio(false);
    }
  };

  // Run Live Verification Tool
  const handleRunVerification = async () => {
    if (!opportunity) return;
    setVerifying(true);
    setVerificationFeedback(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.message) {
        setVerificationFeedback(data.message);
      }
      // Reload fresh opportunity
      const refreshRes = await fetch(`/api/opportunities/${opportunity.id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.evaluation) setEvaluation(refreshData.evaluation);
      if (onPlanUpdated) onPlanUpdated();
    } catch {
      setVerificationFeedback("Verification tool encountered a network or timeout error.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle plan item
  const handleTogglePlanItem = async (itemId: string, currentStatus: boolean) => {
    if (!prepPlan) return;
    try {
      const res = await fetch("/api/preparation-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: prepPlan.id,
          itemId,
          isCompleted: !currentStatus,
        }),
      });
      const data = await res.json();
      if (data.items) {
        setPrepPlan({ ...prepPlan, items: data.items });
      }
      if (data.newEvaluation) {
        setEvaluation(data.newEvaluation);
      }
      if (onPlanUpdated) onPlanUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !opportunity || !evaluation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border-2 border-[#080808] bg-white shadow-[6px_6px_0px_#080808]">
        {/* Modal Header */}
        <div className="border-b-2 border-[#080808] bg-[#FDF9F3] px-6 py-4 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[#080808] bg-[#E0FB66] px-2 py-0.5 text-xs font-bold uppercase text-[#080808]">
                  {opportunity.category}
                </span>
                <span className="rounded-md border border-[#080808] bg-white px-2 py-0.5 text-xs font-semibold text-[#080808]">
                  {opportunity.workMode}
                </span>
                {opportunity.isDemo && (
                  <span className="rounded border border-[#080808] bg-[#FEF189] px-2 py-0.5 text-[10px] font-bold text-[#080808]">
                    DEMO RECORD
                  </span>
                )}
                <span className="text-xs font-semibold text-[#777777]">
                  {opportunity.compensation}
                </span>
              </div>
              <h2 className="mt-1.5 text-xl font-extrabold text-[#080808] sm:text-2xl">
                {opportunity.title}
              </h2>
              <div className="mt-1 flex items-center space-x-2 text-sm text-[#777777]">
                <Building className="h-4 w-4 text-[#080808]" />
                <span className="font-bold text-[#080808]">{opportunity.organization}</span>
                <span>•</span>
                <MapPin className="h-4 w-4 text-[#080808]" />
                <span>{opportunity.location}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border-2 border-[#080808] bg-white p-1.5 text-[#080808] transition-colors hover:bg-[#FEF189] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex space-x-1.5 overflow-x-auto text-xs sm:text-sm pb-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "eligibility", label: `Eligibility (${evaluation.eligibilityChecks.length})` },
              { id: "evidence", label: "Evidence & Verification" },
              { id: "why", label: `Why ${evaluation.recommendation.replace("_", " ")} (${evaluation.overallScore}/100)` },
              { id: "prep_plan", label: "Preparation Plan" },
              { id: "studio", label: "Prep Studio Drafts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  if (tab.id === "studio" && !studioMaterials) {
                    handleLoadStudio();
                  }
                }}
                className={`rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                    : "bg-white text-[#777777] hover:text-[#080808]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-slate-700">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Opportunity Summary
                </h3>
                <p className="mt-1.5 leading-relaxed text-slate-800">
                  {opportunity.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                  <span className="text-xs font-semibold text-slate-500">Compensation</span>
                  <p className="mt-0.5 text-base font-bold text-slate-900">{opportunity.compensation}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                  <span className="text-xs font-semibold text-slate-500">Application Deadline</span>
                  <p className="mt-0.5 text-base font-bold text-slate-900">
                    {opportunity.deadline
                      ? new Date(opportunity.deadline).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : opportunity.deadlineRaw || "Rolling Review"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Required Competencies
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {opportunity.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-medium text-slate-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {opportunity.preferredSkills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Preferred Competencies
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {opportunity.preferredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Human Control Principle Notice */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <p className="font-semibold text-amber-950">Human Control Policy:</p>
                <p className="mt-0.5">
                  Prospect generates tailored draft materials and decision support, but will never automatically apply, submit personal information, or accept terms on your behalf.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ELIGIBILITY BREAKDOWN */}
          {activeTab === "eligibility" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Deterministic evaluation of stating requirements against your active profile facts.
                </p>
                <span className="text-xs font-semibold text-slate-700">
                  {evaluation.eligibilityChecks.filter((c) => c.status === "MET").length} of {evaluation.eligibilityChecks.length} Requirements Met
                </span>
              </div>

              <div className="space-y-2.5">
                {evaluation.eligibilityChecks.map((check, idx) => {
                  const isMet = check.status === "MET";
                  const isNotMet = check.status === "NOT MET";
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3.5 transition-colors ${
                        isMet
                          ? "border-emerald-200 bg-emerald-50/50"
                          : isNotMet
                          ? "border-rose-200 bg-rose-50/50"
                          : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2">
                          {isMet ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : isNotMet ? (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                          ) : (
                            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                          )}
                          <div>
                            <span className="font-semibold text-slate-900">{check.rule}</span>
                            {check.isHardBlocker && (
                              <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 uppercase">
                                Hard Blocker
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            isMet
                              ? "bg-emerald-100 text-emerald-800"
                              : isNotMet
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {check.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-700">{check.reason}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        Evidence checked: {check.evidence}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE & SOURCE VERIFICATION */}
          {activeTab === "evidence" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Source Verification Status</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-bold text-slate-900">{opportunity.verificationStatus}</span>
                    <span className="text-xs text-slate-500">
                      (Confidence: {Math.round(opportunity.sourceConfidence * 100)}%)
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRunVerification}
                  disabled={verifying}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${verifying ? "animate-spin" : ""}`} />
                  <span>{verifying ? "Checking Source..." : "Run Source Verification Tool"}</span>
                </button>
              </div>

              {verificationFeedback && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                  {verificationFeedback}
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Origin & Canonical URL
                </h3>
                <div className="mt-2 flex items-center justify-between rounded border border-slate-100 bg-slate-50 p-2.5 text-xs">
                  <div className="truncate font-mono text-slate-700">
                    {opportunity.applyUrl}
                  </div>
                  <a
                    href={opportunity.applyUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ml-2 inline-flex items-center space-x-1 font-medium text-[#064e3b] hover:underline shrink-0"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cited Source Snippets & Claims
                </h3>
                <div className="mt-2 space-y-2">
                  {opportunity.sourceEvidence.map((ev, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{ev.claim}</span>
                        <span className="text-[10px] text-slate-400">
                          Observed: {new Date(ev.observedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <blockquote className="mt-1.5 border-l-2 border-slate-300 pl-2.5 italic text-slate-600">
                        &quot;{ev.excerpt}&quot;
                      </blockquote>
                      <div className="mt-1.5 font-mono text-[10px] text-slate-400 truncate">
                        Citation URL: {ev.url}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {opportunity.multiSourceProvenance && opportunity.multiSourceProvenance.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Multi-Source Provenance ({opportunity.multiSourceProvenance.length} Source Record(s))
                  </h3>
                  <div className="mt-2 space-y-2">
                    {opportunity.multiSourceProvenance.map((prov, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-slate-900">{prov.sourceName}</span>
                          <span className="ml-2 rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                            {prov.provider}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Fetched: {new Date(prov.fetchedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WHY THIS RECOMMENDATION */}
          {activeTab === "why" && (
            <div className="space-y-5">
              {/* Decision Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Recommendation</span>
                    <h3 className="font-serif text-lg font-bold text-slate-900">
                      {evaluation.recommendation.replace("_", " ")}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRunDeepAi}
                      disabled={deepAiLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#064e3b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#053d2e] disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {deepAiLoading ? "Running Live AI..." : "Run Deep AI Matching"}
                      </span>
                    </button>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-500">Total Fit Score</span>
                      <p className="text-2xl font-bold text-slate-900">{evaluation.overallScore}/100</p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-700">
                  {deepAiResult?.matchIntelligence?.whyCandidateMatches ||
                    evaluation.aiMatchExplanation ||
                    evaluation.rationale}
                </p>
              </div>

              {/* Live LLM Deep Extraction Result if executed */}
              {deepAiResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span>
                      Live AI Structured Job & Match Analysis ({deepAiResult.aiStatus?.modelUsed || "Groq LLM"})
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 border border-emerald-200">
                      Eligibility: {deepAiResult.matchIntelligence?.eligibilityStatus || "ELIGIBLE"}
                    </span>
                  </div>
                  {deepAiResult.matchIntelligence?.eligibilityExplanation && (
                    <p className="text-emerald-900">
                      <strong>Eligibility Details: </strong>
                      {deepAiResult.matchIntelligence.eligibilityExplanation}
                    </p>
                  )}
                  {deepAiResult.matchIntelligence?.preparationNeeded && (
                    <p className="text-emerald-900">
                      <strong>Recommended Preparation: </strong>
                      {deepAiResult.matchIntelligence.preparationNeeded}
                    </p>
                  )}
                </div>
              )}

              {/* Positive Evidence & Missing Qualifications */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {evaluation.positiveEvidence && evaluation.positiveEvidence.length > 0 && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
                    <span className="font-bold text-emerald-900">Positive Supporting Evidence:</span>
                    <ul className="mt-1.5 list-disc list-inside space-y-1 text-emerald-800">
                      {evaluation.positiveEvidence.map((pe, i) => (
                        <li key={i}>{pe}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.missingQualifications && evaluation.missingQualifications.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs">
                    <span className="font-bold text-amber-900">Missing Qualifications to Address:</span>
                    <ul className="mt-1.5 list-disc list-inside space-y-1 text-amber-800">
                      {evaluation.missingQualifications.map((mq, i) => (
                        <li key={i}>{mq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Skill Gap Intelligence Cards (Priority 4E) */}
              {((deepAiResult?.matchIntelligence?.skillGapAnalysis &&
                deepAiResult.matchIntelligence.skillGapAnalysis.length > 0) ||
                (evaluation.skillGapAnalysis && evaluation.skillGapAnalysis.length > 0)) && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Personalized Skill Gap Intelligence & Preparation Path
                  </h3>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {(
                      deepAiResult?.matchIntelligence?.skillGapAnalysis ||
                      evaluation.skillGapAnalysis ||
                      []
                    ).map((gap: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Missing Skill: {gap.skill}
                          </span>
                          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            {gap.estimatedEffort || "1–2 weeks"}
                          </span>
                        </div>
                        <p className="text-slate-700">
                          <strong>Why it matters:</strong> {gap.whyItMatters}
                        </p>
                        <p className="text-slate-700">
                          <strong>Preparation path:</strong> {gap.preparationPath}
                        </p>
                        {gap.recommendedResources && gap.recommendedResources.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {gap.recommendedResources.map((r: any, rIdx: number) => (
                              <a
                                key={rIdx}
                                href={r.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-[#064e3b]"
                              >
                                <span>{r.title}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hard Blockers Callout */}
              {evaluation.hardBlockers.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900">
                  <div className="flex items-center space-x-2 font-bold text-rose-950">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Hard Blockers Detected (Score Overridden):</span>
                  </div>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {evaluation.hardBlockers.map((hb, i) => (
                      <li key={i}>{hb}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Transparent Mathematical Breakdown */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transparent Hybrid Score Breakdown (0–100)
                </h3>
                <div className="mt-2 space-y-2 text-xs">
                  {[
                    { label: "Eligibility Compatibility", val: evaluation.scoreBreakdown.eligibility, max: 35 },
                    { label: "Skill & Experience Fit", val: evaluation.scoreBreakdown.skills, max: 30 },
                    {
                      label: `Semantic Vector Similarity (${Math.round(
                        (evaluation.scoreBreakdown.rawCosineSimilarity ?? 0) * 100
                      )}% cosine)`,
                      val: evaluation.scoreBreakdown.semantic ?? 0,
                      max: 10,
                    },
                    { label: "Opportunity Quality & Source Evidence", val: evaluation.scoreBreakdown.quality, max: 15 },
                    { label: "Location & Preference Compatibility", val: evaluation.scoreBreakdown.preferences, max: 10 },
                    { label: "Deadline & Freshness Feasibility", val: evaluation.scoreBreakdown.deadline, max: 10 },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/50 p-2.5">
                      <span className="font-medium text-slate-700">{row.label}</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-24 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-[#064e3b]"
                            style={{ width: `${Math.min(100, (row.val / row.max) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 w-12 text-right">
                          {row.val} / {row.max}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncertainties list */}
              {evaluation.uncertainties.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Identified Uncertainties & Assumptions
                  </h3>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-600">
                    {evaluation.uncertainties.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PREPARATION PLAN */}
          {activeTab === "prep_plan" && (
            <div className="space-y-4">
              {prepPlan ? (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">{prepPlan.title}</p>
                    <p className="mt-1">{prepPlan.summary}</p>
                  </div>

                  <div className="space-y-3">
                    {prepPlan.items.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 transition-all ${
                          item.isCompleted
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => handleTogglePlanItem(item.id, item.isCompleted)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#064e3b] focus:ring-[#064e3b]"
                            />
                            <div>
                              <p className={`font-semibold text-slate-900 ${item.isCompleted ? "line-through text-slate-500" : ""}`}>
                                {item.concreteAction}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                <strong>Requirement:</strong> {item.requirement}
                              </p>
                            </div>
                          </label>

                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 shrink-0">
                            {item.estimatedEffort}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600 sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-slate-800">Deliverable: </span>
                            {item.deliverable}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">Portfolio Proof: </span>
                            {item.portfolioProof}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  <p>No active preparation plan generated for this opportunity.</p>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="mt-3 inline-flex items-center space-x-1.5 rounded-lg bg-[#064e3b] px-3.5 py-1.5 font-semibold text-white shadow-sm hover:bg-[#064e3b]/90 disabled:opacity-50"
                  >
                    {generatingPlan && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>{generatingPlan ? "Generating Plan..." : "Generate Preparation Plan"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PREPARATION STUDIO DRAFTS */}
          {activeTab === "studio" && (
            <div className="space-y-5">
              {loadingStudio ? (
                <div className="flex flex-col items-center justify-center p-10 text-center text-xs text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#064e3b]" />
                  <p className="mt-2 font-medium">Grounding drafts in verified profile facts...</p>
                </div>
              ) : studioMaterials ? (
                <div className="space-y-6">
                  {/* Resume Bullets Section */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 className="font-semibold text-slate-900">Tailored Resume Bullets</h4>
                      <button
                        onClick={() => handleCopy(studioMaterials.resumeBulletsDraft || "", "bullets")}
                        className="inline-flex items-center space-x-1 text-xs text-[#064e3b] font-medium hover:underline"
                      >
                        {copiedKey === "bullets" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "bullets" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-2.5 whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                      {studioMaterials.resumeBulletsDraft}
                    </pre>
                  </div>

                  {/* Cover Letter Section */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 className="font-semibold text-slate-900">Tailored Cover Letter Draft</h4>
                      <button
                        onClick={() => handleCopy(studioMaterials.coverLetterDraft || "", "coverLetter")}
                        className="inline-flex items-center space-x-1 text-xs text-[#064e3b] font-medium hover:underline"
                      >
                        {copiedKey === "coverLetter" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "coverLetter" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-2.5 whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                      {studioMaterials.coverLetterDraft}
                    </pre>
                  </div>

                  {/* Application Questions Section */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 className="font-semibold text-slate-900">Application Questions & Talking Points</h4>
                      <button
                        onClick={() => handleCopy(studioMaterials.questionsDraft || "", "questions")}
                        className="inline-flex items-center space-x-1 text-xs text-[#064e3b] font-medium hover:underline"
                      >
                        {copiedKey === "questions" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "questions" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-2.5 whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                      {studioMaterials.questionsDraft}
                    </pre>
                  </div>

                  {/* Interview Preparation Checklist */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 className="font-semibold text-slate-900">Strategic Interview Checklist</h4>
                      <button
                        onClick={() => handleCopy(studioMaterials.interviewChecklist || "", "checklist")}
                        className="inline-flex items-center space-x-1 text-xs text-[#064e3b] font-medium hover:underline"
                      >
                        {copiedKey === "checklist" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "checklist" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-2.5 whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                      {studioMaterials.interviewChecklist}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  <p>Generate tailored drafts grounded strictly in your verified profile facts.</p>
                  <button
                    onClick={handleLoadStudio}
                    className="mt-3 inline-flex items-center space-x-1 rounded-lg bg-[#064e3b] px-3 py-1.5 font-semibold text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Application Drafts</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              Source: <span className="font-medium text-slate-700">{opportunity.sourceName}</span>
            </span>
            <span className="text-slate-300">|</span>
            <button
              onClick={async () => {
                await fetch("/api/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    opportunityId: opportunity.id,
                    organization: opportunity.organization,
                    roleFamily: opportunity.roleFamily,
                    signalType: "MARK_RELEVANT",
                  }),
                });
                setVerificationFeedback("Marked relevant — future search plans will boost this role family.");
              }}
              className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
            >
              + Relevant
            </button>
            <button
              onClick={async () => {
                await fetch("/api/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    opportunityId: opportunity.id,
                    organization: opportunity.organization,
                    roleFamily: opportunity.roleFamily,
                    signalType: "MARK_NOT_RELEVANT",
                  }),
                });
                setVerificationFeedback("Marked not relevant — future search plans will deprioritize this role family.");
              }}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            >
              Not Relevant
            </button>
            <button
              onClick={async () => {
                await fetch("/api/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    opportunityId: opportunity.id,
                    organization: opportunity.organization,
                    roleFamily: opportunity.roleFamily,
                    signalType: "HIDE_EMPLOYER",
                  }),
                });
                onPlanUpdated?.();
                onClose();
              }}
              className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
            >
              Hide Employer
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSaveToTracker(opportunity)}
              className="neo-btn-outline inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs cursor-pointer"
            >
              <BookmarkPlus className="h-4 w-4" />
              <span>Save to Tracker</span>
            </button>

            <a
              href={opportunity.applyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center space-x-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-4 py-2 text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] transition-colors hover:bg-[#FEF189]"
            >
              <span>Apply on Official Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
