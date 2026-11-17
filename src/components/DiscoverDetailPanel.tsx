"use client";

import React, { useState, useEffect, useId } from "react";
import { EvaluationResult, Opportunity } from "@/types";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Info,
  Laptop,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

export type DetailTabKey = "match" | "details" | "requirements" | "company";

interface DiscoverDetailPanelProps {
  opportunity: Opportunity;
  evaluation: EvaluationResult;
  hasPrepPlan?: boolean;
  isSaved: boolean;
  candidateSkills?: string[];
  onInspect: (
    opp: Opportunity,
    evalResult: EvaluationResult,
    initialTab?: "overview" | "eligibility" | "evidence" | "why" | "prep_plan" | "studio"
  ) => void;
  onSaveToTracker: (opp: Opportunity) => void;
  onFeedback?: (
    opp: Opportunity,
    signalType: "MARK_RELEVANT" | "MARK_NOT_RELEVANT" | "HIDE_EMPLOYER"
  ) => void;
}

/** Formats location string concisely for compact headers. */
export function formatShortLocation(loc: string | undefined | null): string {
  if (!loc) return "Location Flexible";
  const firstSegment = loc.split("|")[0]?.trim() || loc.trim();
  return firstSegment.length > 36 ? `${firstSegment.slice(0, 34)}...` : firstSegment;
}

/** Extracts real positive alignment bullets and gap advisories without inventing claims. */
function buildMatchHighlights(
  opportunity: Opportunity,
  evaluation: EvaluationResult,
  candidateSkills: string[]
) {
  const positives: string[] = [];
  const lowerCandidateSkills = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const missingSet = new Set(
    (evaluation.missingQualifications || []).map((m) => m.toLowerCase())
  );

  // 1. Explicit positive evidence strings if provided by evaluator
  if (evaluation.positiveEvidence && evaluation.positiveEvidence.length > 0) {
    for (const ev of evaluation.positiveEvidence) {
      if (ev && positives.length < 3 && !positives.includes(ev)) {
        positives.push(ev);
      }
    }
  }

  // 2. Real skill overlap between opportunity requirements and confirmed candidate skills
  const overlappingSkills = opportunity.requiredSkills.filter((sk) => {
    const lower = sk.toLowerCase();
    return (
      !missingSet.has(lower) &&
      (lowerCandidateSkills.size === 0 || lowerCandidateSkills.has(lower))
    );
  });

  if (positives.length < 3 && overlappingSkills.length > 0) {
    positives.push(`Verified skill alignment: ${overlappingSkills.slice(0, 3).join(", ")}`);
  }

  // 3. Passed eligibility checks
  if (positives.length < 3 && evaluation.eligibilityChecks?.length) {
    const passedRule = evaluation.eligibilityChecks.find((c) => c.status === "MET");
    if (passedRule) {
      positives.push(`${passedRule.rule}: ${passedRule.reason}`);
    }
  }

  // 4. AI or deterministic rationale summary sentence if still under 3 items
  if (positives.length < 3) {
    const rawExplanation = evaluation.aiMatchExplanation || evaluation.rationale || "";
    const sentences = rawExplanation
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 14);
    for (const sentence of sentences) {
      if (positives.length >= 3) break;
      if (!positives.some((p) => p.toLowerCase() === sentence.toLowerCase())) {
        positives.push(sentence);
      }
    }
  }

  if (positives.length === 0) {
    positives.push(`Hybrid compatibility score: ${Math.round(evaluation.overallScore)}%`);
  }

  // Advisory / gap line
  const gapNames = Array.from(
    new Set([
      ...(evaluation.skillGapAnalysis?.map((g) => g.skill) || []),
      ...(evaluation.missingQualifications || []),
    ])
  ).filter(Boolean);

  let advisory: string | null = null;
  if (evaluation.hardBlockers.length > 0) {
    advisory = `Eligibility blocker: ${evaluation.hardBlockers[0]}`;
  } else if (gapNames.length > 0) {
    advisory = `Consider strengthening ${gapNames.slice(0, 2).join(", ")} experience`;
  }

  return { positives: positives.slice(0, 3), advisory, gapNames };
}

export function DiscoverDetailPanel({
  opportunity,
  evaluation,
  hasPrepPlan = false,
  isSaved,
  candidateSkills = [],
  onInspect,
  onSaveToTracker,
  onFeedback,
}: DiscoverDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>("match");
  const ringGradId = useId();

  // Reset to AI Match view when switching selected opportunity
  useEffect(() => {
    setActiveTab("match");
  }, [opportunity.id]);

  const matchPercent = Math.max(0, Math.min(100, Math.round(evaluation.overallScore)));
  const semanticPercent = Math.round(
    (evaluation.scoreBreakdown?.rawCosineSimilarity ?? 0) * 100
  );

  // SVG Radial progress geometry
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchPercent / 100) * circumference;

  const { positives, advisory, gapNames } = buildMatchHighlights(
    opportunity,
    evaluation,
    candidateSkills
  );

  const missingSet = new Set(
    (evaluation.missingQualifications || []).map((m) => m.toLowerCase())
  );

  const deadlineText = opportunity.deadlineRaw
    ? opportunity.deadlineRaw
    : opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Rolling / Unlisted";

  const hasValidApplyUrl =
    Boolean(opportunity.applyUrl) && opportunity.applyUrl.startsWith("http");

  const tabs: Array<{ key: DetailTabKey; label: string }> = [
    { key: "match", label: "AI Match" },
    { key: "details", label: "Job Details" },
    { key: "requirements", label: "Requirements" },
    { key: "company", label: "Company" },
  ];

  return (
    <section
      aria-label="Selected Opportunity Detail"
      className="rounded-[22px] border border-black/[0.07] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.045)] space-y-5"
    >
      {/* Top Header: Logo + Title + Quick Modal / Save Controls */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <CompanyLogo
            name={opportunity.organization}
            size={48}
            className="h-12 w-12 shrink-0 rounded-2xl border border-black/[0.07]"
          />
          <div className="min-w-0">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-[#101214] leading-snug">
              {opportunity.title}
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-[#6B7280] truncate">
              {opportunity.organization} • {formatShortLocation(opportunity.location)} •{" "}
              {opportunity.employmentType || opportunity.workMode || opportunity.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onInspect(opportunity, evaluation, "overview")}
            title="Open Full Opportunity Dossier"
            aria-label="Open Full Opportunity Dossier"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.09] bg-white hover:bg-[#F7F7F3] text-[#101214] shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-colors cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onSaveToTracker(opportunity)}
            title={isSaved ? "Saved to Tracker" : "Save to Tracker"}
            aria-label={isSaved ? "Saved to Tracker" : "Save to Tracker"}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer ${
              isSaved
                ? "bg-[#E3FC6D] border-[#C6E832] text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)]"
                : "bg-white border-black/[0.09] hover:bg-[#F7F7F3] text-[#101214] shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-[#0E1012]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Pill Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.07] pb-3.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-3.5 py-1.5 font-heading text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-[#E3FC6D] text-[#0E1012] font-semibold border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)]"
                  : "bg-white text-[#4B5563] font-medium border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {semanticPercent > 0 && (
          <span className="ml-auto hidden sm:inline-flex items-center gap-1 rounded-full bg-[#F7F8F4] border border-black/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#4B5563]">
            <Sparkles className="h-3 w-3 text-[#65B811]" />
            <span>Semantic {semanticPercent}%</span>
          </span>
        )}
      </div>

      {/* ===================================================== */}
      {/* TAB 1: AI MATCH (Radial Ring + Why This Matches You)  */}
      {/* ===================================================== */}
      {activeTab === "match" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-1">
            {/* Radial Progress Gauge */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center relative py-1">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 124 124">
                  <defs>
                    <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9CE21B" />
                      <stop offset="100%" stopColor="#65B811" />
                    </linearGradient>
                  </defs>
                  {/* Track */}
                  <circle
                    cx="62"
                    cy="62"
                    r={radius}
                    fill="none"
                    stroke="#E6E8E2"
                    strokeWidth="10"
                  />
                  {/* Electric Lime Progress Arc */}
                  <circle
                    cx="62"
                    cy="62"
                    r={radius}
                    fill="none"
                    stroke={`url(#${ringGradId})`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-heading text-3xl font-extrabold text-[#101214] leading-none">
                    {matchPercent}%
                  </span>
                  <span className="mt-1 text-xs font-medium text-[#6B7280]">
                    Match
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Why This Matches You Evidence Checklist */}
            <div className="sm:col-span-8 space-y-2.5">
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#101214]">
                Why this matches you
              </h3>

              <ul className="space-y-2">
                {positives.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#101214]">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#F3FCDA] border border-[#C7E938]/70">
                      <CheckCircle2 className="h-3 w-3 text-[#4D7C0F]" />
                    </span>
                    <span className="leading-snug font-medium text-[#1F2937]">{reason}</span>
                  </li>
                ))}

                {advisory && (
                  <li className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4B5563]">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#F4F5F0] border border-black/[0.08]">
                      <Info className="h-3 w-3 text-[#4B5563]" />
                    </span>
                    <span className="leading-snug font-medium">{advisory}</span>
                  </li>
                )}
              </ul>

              {evaluation.scoringBreakdownDetails &&
                evaluation.scoringBreakdownDetails.length > 0 && (
                  <div className="pt-2.5 border-t border-black/[0.06] flex flex-wrap gap-1.5">
                    {evaluation.scoringBreakdownDetails.map((detail, dIdx) => (
                      <span
                        key={dIdx}
                        className="rounded-full bg-[#F7F8F4] border border-black/[0.06] px-2.5 py-0.5 text-[10.5px] font-medium text-[#4B5563]"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Soft Violet Next Step Callout Banner */}
          <div className="rounded-2xl border border-[#D9CCF8] bg-[#F5F2FF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-[#D9CCF8] text-[#5B21B6] shadow-2xs">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-heading text-xs font-bold text-[#101214]">
                  Next Step
                </div>
                <p className="text-xs font-medium text-[#4B5563] leading-snug mt-0.5">
                  {gapNames.length > 0
                    ? `Bridge ${gapNames.length} key skill${
                        gapNames.length > 1 ? "s" : ""
                      } (${gapNames.slice(0, 2).join(", ")}) to strengthen your match.`
                    : evaluation.nextAction ||
                      "Verified alignment across listed criteria — inspect evidence or apply directly."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onInspect(
                  opportunity,
                  evaluation,
                  gapNames.length > 0 || hasPrepPlan ? "prep_plan" : "why"
                )
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-4 py-2 font-heading text-xs font-semibold transition-all shrink-0 cursor-pointer"
            >
              <span>{gapNames.length > 0 || hasPrepPlan ? "View Skill Plan" : "Inspect Match"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Clean Footer Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/[0.07]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onInspect(opportunity, evaluation, "evidence")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3.5 py-1.5 font-heading text-xs font-semibold transition cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#4D7C0F]" />
                <span>View Evidence</span>
              </button>

              {onFeedback && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onFeedback(opportunity, "MARK_RELEVANT")}
                    title="Boost similar roles"
                    className="rounded-full border border-black/[0.08] bg-white hover:bg-[#F3FCDA] p-1.5 text-[#4B5563] hover:text-[#101214] transition cursor-pointer"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback(opportunity, "MARK_NOT_RELEVANT")}
                    title="Show fewer like this"
                    className="rounded-full border border-black/[0.08] bg-white hover:bg-rose-50 p-1.5 text-[#4B5563] hover:text-rose-600 transition cursor-pointer"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {hasValidApplyUrl ? (
              <a
                href={opportunity.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 px-4 py-2 font-heading text-xs transition-all cursor-pointer"
              >
                <span>
                  {evaluation.recommendation === "PREPARE_FIRST"
                    ? "Open & Prepare"
                    : "Apply Now"}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-[#E3FC6D]" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => onInspect(opportunity, evaluation, "overview")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 px-4 py-2 font-heading text-xs transition-all cursor-pointer"
              >
                <span>Open Dossier</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#E3FC6D]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 2: JOB DETAILS                                    */}
      {/* ===================================================== */}
      {activeTab === "details" && (
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
                <MapPin className="h-3.5 w-3.5 text-[#101214]" />
                <span>Location</span>
              </div>
              <div className="mt-1 font-semibold text-[#101214] truncate" title={opportunity.location}>
                {opportunity.location || "Flexible"}
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
                <Laptop className="h-3.5 w-3.5 text-[#101214]" />
                <span>Work Mode</span>
              </div>
              <div className="mt-1 font-semibold text-[#101214]">
                {opportunity.workMode || "Not specified"}
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-3.5 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
                <Calendar className="h-3.5 w-3.5 text-[#101214]" />
                <span>Deadline</span>
              </div>
              <div className="mt-1 font-semibold text-[#101214]">{deadlineText}</div>
            </div>
          </div>

          {typeof opportunity.distanceKm === "number" && !isNaN(opportunity.distanceKm) && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F3FCDA]/80 border border-[#C7E938]/50 px-3.5 py-1 text-xs font-semibold text-[#0E1012]">
              <Navigation className="h-3.5 w-3.5" />
              <span>
                {opportunity.distanceKm === 0
                  ? "In your city (<5 km)"
                  : `${opportunity.distanceKm} km from your saved city centroid`}
              </span>
            </div>
          )}

          {opportunity.compensation &&
            !opportunity.compensation.toLowerCase().includes("unlisted") &&
            !opportunity.compensation.toLowerCase().includes("see") && (
              <div className="rounded-2xl border border-[#F5DFA0] bg-[#FEF9E7] px-4 py-2.5 text-xs font-semibold text-[#7A5908]">
                Compensation: {opportunity.compensation}
              </div>
            )}

          <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-4 max-h-56 overflow-y-auto">
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
              Verified Role Summary
            </h3>
            <p className="text-xs sm:text-sm text-[#1F2937] leading-relaxed whitespace-pre-line">
              {opportunity.description || "No extended description supplied by source feed."}
            </p>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 3: REQUIREMENTS                                   */}
      {/* ===================================================== */}
      {activeTab === "requirements" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
              Required Skills ({opportunity.requiredSkills.length})
            </h3>
            {opportunity.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {opportunity.requiredSkills.map((sk) => {
                  const isMissing = missingSet.has(sk.toLowerCase());
                  return (
                    <span
                      key={sk}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${
                        isMissing
                          ? "bg-[#FEF9E7] text-[#7A5908] border-[#F5DFA0]"
                          : "bg-[#F3FCDA]/80 text-[#0E1012] border-[#C7E938]/50"
                      }`}
                    >
                      <span>{isMissing ? "Gap:" : "✓"}</span>
                      <span>{sk}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280]">No explicit required skills parsed from listing.</p>
            )}
          </div>

          {opportunity.preferredSkills.length > 0 && (
            <div>
              <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Preferred / Bonus Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.preferredSkills.map((sk) => (
                  <span
                    key={sk}
                    className="rounded-full bg-[#F7F8F4] border border-black/[0.06] px-3 py-1 text-xs font-medium text-[#374151]"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {evaluation.eligibilityChecks?.length > 0 && (
            <div>
              <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Eligibility Verification
              </h3>
              <ul className="space-y-2">
                {evaluation.eligibilityChecks.slice(0, 4).map((chk, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 rounded-2xl border border-black/[0.06] bg-[#FAFBF7] px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#101214]">{chk.rule}</div>
                      <div className="text-[#6B7280] mt-0.5">{chk.reason}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        chk.status === "MET"
                          ? "bg-[#E3FC6D] border-[#C6E832] text-[#0E1012]"
                          : chk.status === "NOT MET"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-white border-black/[0.08] text-[#4B5563]"
                      }`}
                    >
                      {chk.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* TAB 4: COMPANY & PROVENANCE                           */}
      {/* ===================================================== */}
      {activeTab === "company" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-[#101214]">
                {opportunity.organization}
              </span>
              <span className="rounded-full bg-[#F3FCDA]/80 border border-[#C7E938]/50 px-2.5 py-0.5 text-[10px] font-semibold text-[#0E1012]">
                {opportunity.verificationStatus.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Primary Feed: <strong className="text-[#101214]">{opportunity.sourceName}</strong>
              {opportunity.roleFamily ? ` • Track: ${opportunity.roleFamily}` : ""}
            </p>
            {opportunity.sourceUrl && opportunity.sourceUrl.startsWith("http") && (
              <a
                href={opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#101214] hover:underline"
              >
                <span>Visit Source Listing</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {opportunity.multiSourceProvenance &&
            opportunity.multiSourceProvenance.length > 0 && (
              <div>
                <h3 className="font-heading text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                  Cross-Source Verification ({opportunity.multiSourceProvenance.length})
                </h3>
                <div className="space-y-1.5">
                  {opportunity.multiSourceProvenance.slice(0, 3).map((prov, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-semibold text-[#101214]">{prov.sourceName}</span>
                      {prov.applicationUrl && prov.applicationUrl.startsWith("http") && (
                        <a
                          href={prov.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#101214] hover:underline"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          <button
            type="button"
            onClick={() => onInspect(opportunity, evaluation, "overview")}
            className="w-full rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Open Full Dossier Modal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}
