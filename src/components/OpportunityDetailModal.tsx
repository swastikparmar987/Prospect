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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1113]/55 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-[26px] border border-black/[0.08] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] text-[#101214] overflow-hidden">
        {/* Modal Header */}
        <div className="border-b border-black/[0.06] bg-[#FAFBF7] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#C6E832] bg-[#E3FC6D] px-2.5 py-0.5 text-[11px] font-semibold uppercase text-[#0E1012]">
                  {opportunity.category}
                </span>
                <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#4B5563]">
                  {opportunity.workMode}
                </span>
                {opportunity.isDemo && (
                  <span className="rounded-full border border-[#F5DFA0] bg-[#FEF9E7] px-2.5 py-0.5 text-[10px] font-semibold text-[#92400E]">
                    DEMO RECORD
                  </span>
                )}
                <span className="text-xs font-medium text-[#6B7280]">
                  {opportunity.compensation}
                </span>
              </div>
              <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-[#101214] sm:text-2xl">
                {opportunity.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#6B7280]">
                <span className="inline-flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-[#4B5563]" />
                  <span className="font-semibold text-[#101214]">{opportunity.organization}</span>
                </span>
                <span className="text-black/20">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#4B5563]" />
                  <span>{opportunity.location}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/[0.08] bg-white p-2 text-[#4B5563] transition-colors hover:bg-[#F4F5F0] hover:text-[#101214] cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex flex-wrap gap-1.5 overflow-x-auto text-xs pb-0.5">
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
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  if (tab.id === "studio" && !studioMaterials) {
                    handleLoadStudio();
                  }
                }}
                className={`rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                    : "bg-[#F4F5F0] text-[#4B5563] border border-black/[0.06] hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-[#4B5563]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                  Opportunity Summary
                </h3>
                <p className="mt-2 leading-relaxed text-[#101214]/90 text-sm">
                  {opportunity.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-4">
                  <span className="text-xs font-medium text-[#6B7280]">Compensation</span>
                  <p className="mt-1 font-heading text-base font-bold text-[#101214]">
                    {opportunity.compensation}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-4">
                  <span className="text-xs font-medium text-[#6B7280]">Application Deadline</span>
                  <p className="mt-1 font-heading text-base font-bold text-[#101214]">
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
                <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                  Required Competencies
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {opportunity.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-black/[0.07] bg-[#F4F5F0] px-3 py-1 text-xs font-mono font-medium text-[#101214]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {opportunity.preferredSkills.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                    Preferred Competencies
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {opportunity.preferredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-black/[0.06] bg-white px-3 py-1 text-xs font-mono text-[#4B5563]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Human Control Principle Notice */}
              <div className="rounded-2xl border border-[#F5DFA0] bg-[#FEF9E7] p-4 text-xs text-[#78350F]">
                <p className="font-semibold text-[#78350F]">Human Control Policy</p>
                <p className="mt-1 leading-relaxed">
                  Prospect generates tailored draft materials and decision support, but will never automatically apply, submit personal information, or accept terms on your behalf.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ELIGIBILITY BREAKDOWN */}
          {activeTab === "eligibility" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#6B7280]">
                  Deterministic evaluation of stated requirements against your active profile facts.
                </p>
                <span className="rounded-full bg-[#F4F5F0] border border-black/[0.06] px-3 py-1 text-xs font-semibold text-[#101214]">
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
                      className={`rounded-2xl border p-4 transition-colors ${
                        isMet
                          ? "border-[#A7F3D0] bg-[#ECFDF5]/60"
                          : isNotMet
                          ? "border-[#FECDD3] bg-[#FFF1F2]/60"
                          : "border-black/[0.07] bg-[#FAFBF7]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2.5">
                          {isMet ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
                          ) : isNotMet ? (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E11D48]" />
                          ) : (
                            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
                          )}
                          <div>
                            <span className="font-semibold text-[#101214]">{check.rule}</span>
                            {check.isHardBlocker && (
                              <span className="ml-2 rounded-full bg-[#FFE4E6] border border-[#FECDD3] px-2 py-0.5 text-[10px] font-semibold text-[#9F1239] uppercase">
                                Hard Blocker
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${
                            isMet
                              ? "bg-[#D1FAE5] text-[#065F46]"
                              : isNotMet
                              ? "bg-[#FFE4E6] text-[#9F1239]"
                              : "bg-[#EAECE4] text-[#4B5563]"
                          }`}
                        >
                          {check.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[#4B5563] leading-relaxed">{check.reason}</p>
                      <p className="mt-1.5 font-mono text-[11px] text-[#6B7280]">
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
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-4">
                <div>
                  <span className="text-xs font-medium text-[#6B7280]">Source Verification Status</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-heading font-bold text-[#101214]">{opportunity.verificationStatus}</span>
                    <span className="text-xs text-[#6B7280]">
                      (Confidence: {Math.round(opportunity.sourceConfidence * 100)}%)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={verifying}
                  className="inline-flex items-center space-x-1.5 rounded-full bg-[#101214] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(16,18,20,0.16)] transition-all hover:bg-[#1E2226] hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-[#E3FC6D] ${verifying ? "animate-spin" : ""}`} />
                  <span>{verifying ? "Checking Source..." : "Run Source Verification Tool"}</span>
                </button>
              </div>

              {verificationFeedback && (
                <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5 text-xs text-[#065F46] font-medium">
                  {verificationFeedback}
                </div>
              )}

              <div>
                <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                  Origin &amp; Canonical URL
                </h3>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-black/[0.07] bg-[#FAFBF7] p-3 text-xs">
                  <div className="truncate font-mono text-[#4B5563]">
                    {opportunity.applyUrl}
                  </div>
                  <a
                    href={opportunity.applyUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ml-3 inline-flex items-center space-x-1 font-semibold text-[#101214] hover:underline shrink-0"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                  Cited Source Snippets &amp; Claims
                </h3>
                <div className="mt-2 space-y-2.5">
                  {opportunity.sourceEvidence.map((ev, idx) => (
                    <div key={idx} className="rounded-2xl border border-black/[0.07] bg-white p-3.5 text-xs shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#101214]">{ev.claim}</span>
                        <span className="text-[10px] text-[#6B7280]">
                          Observed: {new Date(ev.observedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <blockquote className="mt-1.5 border-l-2 border-[#C6E832] pl-3 italic text-[#4B5563]">
                        &quot;{ev.excerpt}&quot;
                      </blockquote>
                      <div className="mt-1.5 font-mono text-[10px] text-[#6B7280] truncate">
                        Citation URL: {ev.url}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {opportunity.multiSourceProvenance && opportunity.multiSourceProvenance.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                    Multi-Source Provenance ({opportunity.multiSourceProvenance.length} Source Record(s))
                  </h3>
                  <div className="mt-2 space-y-2">
                    {opportunity.multiSourceProvenance.map((prov, idx) => (
                      <div key={idx} className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-[#101214]">{prov.sourceName}</span>
                          <span className="ml-2 rounded-full bg-white border border-black/[0.07] px-2 py-0.5 font-mono text-[10px] text-[#4B5563]">
                            {prov.provider}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#6B7280]">
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
              <div className="rounded-2xl bg-gradient-to-br from-[#F3FCDA]/80 to-[#FAFBF7] border border-[#C7E938]/55 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-[#4B5563]">Recommendation</span>
                    <h3 className="font-heading text-lg font-bold text-[#101214]">
                      {evaluation.recommendation.replace("_", " ")}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRunDeepAi}
                      disabled={deepAiLoading}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#101214] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#E3FC6D]" />
                      <span>
                        {deepAiLoading ? "Running Live AI..." : "Run Deep AI Matching"}
                      </span>
                    </button>
                    <div className="text-right">
                      <span className="text-[11px] font-medium text-[#6B7280]">Total Fit Score</span>
                      <p className="font-heading text-2xl font-bold text-[#101214]">
                        {evaluation.overallScore}/100
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#101214]/85">
                  {deepAiResult?.matchIntelligence?.whyCandidateMatches ||
                    evaluation.aiMatchExplanation ||
                    evaluation.rationale}
                </p>
              </div>

              {/* Live LLM Deep Extraction Result if executed */}
              {deepAiResult && (
                <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5]/80 p-4 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-[#065F46]">
                    <span>
                      Live AI Structured Job &amp; Match Analysis ({deepAiResult.aiStatus?.modelUsed || "Groq LLM"})
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 border border-[#A7F3D0] text-[11px]">
                      Eligibility: {deepAiResult.matchIntelligence?.eligibilityStatus || "ELIGIBLE"}
                    </span>
                  </div>
                  {deepAiResult.matchIntelligence?.eligibilityExplanation && (
                    <p className="text-[#065F46]">
                      <strong>Eligibility Details: </strong>
                      {deepAiResult.matchIntelligence.eligibilityExplanation}
                    </p>
                  )}
                  {deepAiResult.matchIntelligence?.preparationNeeded && (
                    <p className="text-[#065F46]">
                      <strong>Recommended Preparation: </strong>
                      {deepAiResult.matchIntelligence.preparationNeeded}
                    </p>
                  )}
                </div>
              )}

              {/* Positive Evidence & Missing Qualifications */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {evaluation.positiveEvidence && evaluation.positiveEvidence.length > 0 && (
                  <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5]/60 p-4 text-xs">
                    <span className="font-semibold text-[#065F46]">Positive Supporting Evidence</span>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-[#065F46]/90">
                      {evaluation.positiveEvidence.map((pe, i) => (
                        <li key={i}>{pe}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.missingQualifications && evaluation.missingQualifications.length > 0 && (
                  <div className="rounded-2xl border border-[#F5DFA0] bg-[#FEF9E7] p-4 text-xs">
                    <span className="font-semibold text-[#92400E]">Missing Qualifications to Address</span>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-[#92400E]/90">
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
                  <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                    Personalized Skill Gap Intelligence &amp; Preparation Path
                  </h3>
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {(
                      deepAiResult?.matchIntelligence?.skillGapAnalysis ||
                      evaluation.skillGapAnalysis ||
                      []
                    ).map((gap: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.035)] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#101214]">
                            Missing Skill: {gap.skill}
                          </span>
                          <span className="rounded-full bg-[#FEF9E7] border border-[#F5DFA0] px-2.5 py-0.5 text-[10px] font-semibold text-[#92400E]">
                            {gap.estimatedEffort || "1–2 weeks"}
                          </span>
                        </div>
                        <p className="text-[#4B5563]">
                          <strong className="text-[#101214]">Why it matters:</strong> {gap.whyItMatters}
                        </p>
                        <p className="text-[#4B5563]">
                          <strong className="text-[#101214]">Preparation path:</strong> {gap.preparationPath}
                        </p>
                        {gap.recommendedResources && gap.recommendedResources.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {gap.recommendedResources.map((r: any, rIdx: number) => (
                              <a
                                key={rIdx}
                                href={r.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 rounded-full bg-[#F4F5F0] hover:bg-[#EAECE4] border border-black/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-[#101214] transition-colors"
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
                <div className="rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-xs text-[#9F1239]">
                  <div className="flex items-center space-x-2 font-semibold text-[#881337]">
                    <AlertTriangle className="h-4 w-4 text-[#E11D48]" />
                    <span>Hard Blockers Detected (Score Overridden)</span>
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
                <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                  Transparent Hybrid Score Breakdown (0–100)
                </h3>
                <div className="mt-2.5 space-y-2 text-xs">
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
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-3">
                      <span className="font-medium text-[#4B5563]">{row.label}</span>
                      <div className="flex items-center space-x-2.5">
                        <div className="h-2 w-24 rounded-full bg-[#EFEFE9] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#84CC16] to-[#CBEF3B]"
                            style={{ width: `${Math.min(100, (row.val / row.max) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-[#101214] w-12 text-right">
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
                  <h3 className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280]">
                    Identified Uncertainties &amp; Assumptions
                  </h3>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-[#6B7280]">
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
                  <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-4 text-xs text-[#4B5563]">
                    <p className="font-heading font-bold text-sm text-[#101214]">{prepPlan.title}</p>
                    <p className="mt-1 leading-relaxed">{prepPlan.summary}</p>
                  </div>

                  <div className="space-y-3">
                    {prepPlan.items.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          item.isCompleted
                            ? "border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA]/65 to-white"
                            : "border-black/[0.07] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.03)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => handleTogglePlanItem(item.id, item.isCompleted)}
                              className="mt-1 h-4 w-4 rounded border-black/20 text-[#101214] accent-[#101214] focus:ring-[#94D814]"
                            />
                            <div>
                              <p className={`font-semibold text-[#101214] ${item.isCompleted ? "line-through text-[#6B7280]" : ""}`}>
                                {item.concreteAction}
                              </p>
                              <p className="mt-1 text-xs text-[#4B5563]">
                                <strong className="text-[#101214]">Requirement:</strong> {item.requirement}
                              </p>
                            </div>
                          </label>

                          <span className="rounded-full bg-[#F4F5F0] border border-black/[0.06] px-2.5 py-0.5 text-[10px] font-mono text-[#4B5563] shrink-0">
                            {item.estimatedEffort}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-black/[0.06] pt-2.5 text-xs text-[#4B5563] sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-[#101214]">Deliverable: </span>
                            {item.deliverable}
                          </div>
                          <div>
                            <span className="font-semibold text-[#101214]">Portfolio Proof: </span>
                            {item.portfolioProof}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/[0.12] bg-[#FAFBF7] p-8 text-center text-xs text-[#6B7280]">
                  <p>No active preparation plan generated for this opportunity.</p>
                  <button
                    type="button"
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-full bg-[#101214] px-5 py-2 font-semibold text-white shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {generatingPlan && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#E3FC6D]" />}
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
                <div className="flex flex-col items-center justify-center p-10 text-center text-xs text-[#6B7280]">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#4D7C0F]" />
                  <p className="mt-2.5 font-medium">Grounding drafts in verified profile facts...</p>
                </div>
              ) : studioMaterials ? (
                <div className="space-y-4">
                  {/* Resume Bullets Section */}
                  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                      <h4 className="font-heading font-semibold text-[#101214]">Tailored Resume Bullets</h4>
                      <button
                        type="button"
                        onClick={() => handleCopy(studioMaterials.resumeBulletsDraft || "", "bullets")}
                        className="inline-flex items-center space-x-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#EAECE4] border border-black/[0.06] px-3 py-1 text-xs text-[#101214] font-semibold transition-colors cursor-pointer"
                      >
                        {copiedKey === "bullets" ? <Check className="h-3.5 w-3.5 text-[#4D7C0F]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "bullets" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-[#4B5563] leading-relaxed">
                      {studioMaterials.resumeBulletsDraft}
                    </pre>
                  </div>

                  {/* Cover Letter Section */}
                  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                      <h4 className="font-heading font-semibold text-[#101214]">Tailored Cover Letter Draft</h4>
                      <button
                        type="button"
                        onClick={() => handleCopy(studioMaterials.coverLetterDraft || "", "coverLetter")}
                        className="inline-flex items-center space-x-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#EAECE4] border border-black/[0.06] px-3 py-1 text-xs text-[#101214] font-semibold transition-colors cursor-pointer"
                      >
                        {copiedKey === "coverLetter" ? <Check className="h-3.5 w-3.5 text-[#4D7C0F]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "coverLetter" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-[#4B5563] leading-relaxed">
                      {studioMaterials.coverLetterDraft}
                    </pre>
                  </div>

                  {/* Application Questions Section */}
                  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                      <h4 className="font-heading font-semibold text-[#101214]">Application Questions &amp; Talking Points</h4>
                      <button
                        type="button"
                        onClick={() => handleCopy(studioMaterials.questionsDraft || "", "questions")}
                        className="inline-flex items-center space-x-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#EAECE4] border border-black/[0.06] px-3 py-1 text-xs text-[#101214] font-semibold transition-colors cursor-pointer"
                      >
                        {copiedKey === "questions" ? <Check className="h-3.5 w-3.5 text-[#4D7C0F]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "questions" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-[#4B5563] leading-relaxed">
                      {studioMaterials.questionsDraft}
                    </pre>
                  </div>

                  {/* Interview Preparation Checklist */}
                  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                      <h4 className="font-heading font-semibold text-[#101214]">Strategic Interview Checklist</h4>
                      <button
                        type="button"
                        onClick={() => handleCopy(studioMaterials.interviewChecklist || "", "checklist")}
                        className="inline-flex items-center space-x-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#EAECE4] border border-black/[0.06] px-3 py-1 text-xs text-[#101214] font-semibold transition-colors cursor-pointer"
                      >
                        {copiedKey === "checklist" ? <Check className="h-3.5 w-3.5 text-[#4D7C0F]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === "checklist" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-[#4B5563] leading-relaxed">
                      {studioMaterials.interviewChecklist}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/[0.12] bg-[#FAFBF7] p-8 text-center text-xs text-[#6B7280]">
                  <p>Generate tailored drafts grounded strictly in your verified profile facts.</p>
                  <button
                    type="button"
                    onClick={handleLoadStudio}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-full bg-[#101214] px-5 py-2 font-semibold text-white shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#E3FC6D]" />
                    <span>Generate Application Drafts</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-black/[0.06] px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-[#FAFBF7]">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
            <span>
              Source: <span className="font-semibold text-[#101214]">{opportunity.sourceName}</span>
            </span>
            <span className="text-black/15">|</span>
            <button
              type="button"
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
              className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#065F46] hover:bg-[#D1FAE5] transition-colors cursor-pointer"
            >
              + Relevant
            </button>
            <button
              type="button"
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
              className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4B5563] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
            >
              Not Relevant
            </button>
            <button
              type="button"
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
              className="rounded-full border border-[#FECDD3] bg-[#FFF1F2] px-2.5 py-1 text-[11px] font-semibold text-[#9F1239] hover:bg-[#FFE4E6] transition-colors cursor-pointer"
            >
              Hide Employer
            </button>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => onSaveToTracker(opportunity)}
              className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Save to Tracker</span>
            </button>

            <a
              href={opportunity.applyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center space-x-1.5 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all px-4 py-2 text-xs"
            >
              <span>Apply on Official Site</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#E3FC6D]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
