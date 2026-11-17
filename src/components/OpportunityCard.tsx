"use client";

import React, { useId } from "react";
import { Opportunity, EvaluationResult, RecommendationAction } from "@/types";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  MapPin,
  Laptop,
  Calendar,
  Rocket,
  BookOpen,
  Eye,
  Bookmark,
  Sparkles,
  Navigation,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface OpportunityCardProps {
  opportunity: Opportunity;
  evaluation: EvaluationResult;
  hasPrepPlan?: boolean;
  isSaved?: boolean;
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

function MatchScoreRing({ score, title }: { score: number; title?: string }) {
  const gradId = useId();
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className="relative inline-flex h-10 w-10 items-center justify-center shrink-0"
      title={title || `Overall Fit ${pct}%`}
    >
      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 38 38" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CE21B" />
            <stop offset="100%" stopColor="#65B811" />
          </linearGradient>
        </defs>
        <circle
          cx="19"
          cy="19"
          r={r}
          fill="none"
          stroke="#E6E8E2"
          strokeWidth="3.2"
        />
        <circle
          cx="19"
          cy="19"
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3.2"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-heading text-[10px] font-extrabold text-[#101214] leading-none">
        {pct}%
      </span>
    </div>
  );
}

export function OpportunityCard({
  opportunity,
  evaluation,
  isSaved = false,
  onInspect,
  onSaveToTracker,
  onFeedback,
}: OpportunityCardProps) {
  const getRecommendationStyle = (action: RecommendationAction) => {
    switch (action) {
      case "APPLY_NOW":
        return {
          stripColor: "bg-gradient-to-b from-[#DDFB4B] to-[#9CE21B]",
          buttonBg:
            "bg-[#E3FC6D] hover:bg-[#D7F54D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)]",
          buttonLabel: "Apply Now",
          icon: Rocket,
          iconColor: "text-[#0E1012]",
        };
      case "PREPARE_FIRST":
        return {
          stripColor: "bg-gradient-to-b from-[#FDE68A] to-[#F59E0B]",
          buttonBg:
            "bg-[#FEF9E7] hover:bg-[#FDF2CC] text-[#7A5908] border border-[#F5DFA0]",
          buttonLabel: "Prepare First",
          icon: BookOpen,
          iconColor: "text-[#7A5908]",
        };
      case "KEEP_WATCHING":
        return {
          stripColor: "bg-gradient-to-b from-[#BAE0FD] to-[#60A5FA]",
          buttonBg:
            "bg-white hover:bg-[#F7F7F3] text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)]",
          buttonLabel: "Keep Watching",
          icon: Eye,
          iconColor: "text-[#101214]",
        };
      case "SKIP":
      default:
        return {
          stripColor: "bg-[#E5E7EB]",
          buttonBg:
            "bg-[#F7F7F3] hover:bg-[#ECEEE7] text-[#6B7280] border border-black/[0.07]",
          buttonLabel: "Skip",
          icon: null,
          iconColor: "text-[#6B7280]",
        };
    }
  };

  const style = getRecommendationStyle(evaluation.recommendation);
  const ActionIcon = style.icon;

  // Format deadline
  let deadlineDisplay = "";
  if (opportunity.deadlineRaw) {
    deadlineDisplay = opportunity.deadlineRaw.startsWith("Apply")
      ? opportunity.deadlineRaw
      : `Apply by ${opportunity.deadlineRaw}`;
  } else if (opportunity.deadline) {
    const d = new Date(opportunity.deadline);
    if (!isNaN(d.getTime())) {
      deadlineDisplay = `Apply by ${d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
    }
  }

  // Freshness calculation (New vs Updated)
  const discoveredMs = opportunity.discoveredAt
    ? new Date(opportunity.discoveredAt).getTime()
    : opportunity.fetchedAt
    ? new Date(opportunity.fetchedAt).getTime()
    : 0;
  const ageHours =
    discoveredMs > 0 ? (Date.now() - discoveredMs) / (1000 * 60 * 60) : 999;
  const isNew = ageHours <= 48;
  const isUpdated =
    !isNew &&
    Boolean(
      opportunity.multiSourceProvenance &&
        opportunity.multiSourceProvenance.length > 1
    );

  const rawCosine = evaluation.scoreBreakdown.rawCosineSimilarity ?? 0;
  const semanticPercent = Math.round(rawCosine * 100);
  const hasDistance =
    typeof opportunity.distanceKm === "number" && !isNaN(opportunity.distanceKm);

  return (
    <article
      onClick={() => onInspect(opportunity, evaluation, "overview")}
      className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:px-5 sm:py-3.5 cursor-pointer overflow-hidden gap-3 rounded-[22px] bg-white border border-black/[0.07] shadow-[0_8px_30px_rgba(15,23,42,0.045)] hover:shadow-[0_12px_34px_rgba(15,23,42,0.075)] hover:border-black/[0.12] hover:-translate-y-0.5 transition-all"
    >
      {/* Left semantic colored accent strip */}
      <div
        className={`absolute left-1.5 top-3 bottom-3 w-1 rounded-full ${style.stripColor} transition-colors`}
      />

      {/* Left block: Compact Logo + Title/Company + Inline Metadata Row */}
      <div className="flex items-center space-x-3 pl-2.5 min-w-0 flex-1">
        <CompanyLogo
          name={opportunity.organization}
          size={38}
          className="h-9.5 w-9.5 shrink-0 rounded-xl border border-black/[0.07]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-heading text-sm sm:text-[15px] font-bold text-[#101214] leading-snug group-hover:text-black truncate max-w-full">
              {opportunity.title}
            </h3>

            <span className="text-xs font-medium text-[#6B7280] truncate">
              · {opportunity.organization}
            </span>

            {isNew && (
              <span className="rounded-full bg-[#E3FC6D] border border-[#C6E832] px-2 py-0.5 font-heading text-[9.5px] font-semibold uppercase tracking-wide text-[#0E1012]">
                New
              </span>
            )}
            {isUpdated && (
              <span className="rounded-full bg-[#FEF9E7] border border-[#F5DFA0] px-2 py-0.5 font-heading text-[9.5px] font-semibold uppercase tracking-wide text-[#7A5908]">
                Updated
              </span>
            )}
          </div>

          {/* Single Compact Metadata & Skills Row */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#6B7280]">
            {opportunity.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#6B7280] shrink-0" />
                <span className="truncate max-w-[180px]">{opportunity.location}</span>
              </span>
            )}

            {hasDistance && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-[#F3FCDA]/80 border border-[#C7E938]/50 px-2 py-0.5 text-[10px] font-semibold text-[#101214]"
                title="Verified Haversine distance from your city"
              >
                <Navigation className="h-2.5 w-2.5" />
                <span>
                  {opportunity.distanceKm === 0
                    ? "Local (<5 km)"
                    : `${opportunity.distanceKm} km`}
                </span>
              </span>
            )}

            {opportunity.workMode && (
              <span className="inline-flex items-center gap-1">
                <Laptop className="h-3 w-3 text-[#6B7280] shrink-0" />
                <span>{opportunity.workMode}</span>
              </span>
            )}

            {deadlineDisplay && (
              <span className="hidden md:inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#6B7280] shrink-0" />
                <span>{deadlineDisplay}</span>
              </span>
            )}

            {opportunity.compensation &&
              !opportunity.compensation.toLowerCase().includes("unlisted") &&
              !opportunity.compensation.toLowerCase().includes("see") &&
              opportunity.compensation !== "Unknown" && (
                <span className="px-2 py-0.5 rounded-full bg-[#FEF9E7] border border-[#F5DFA0] text-[10px] font-semibold text-[#7A5908]">
                  {opportunity.compensation}
                </span>
              )}

            {opportunity.sourceName && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-[#6B7280]">
                • {opportunity.sourceName.replace("Real-Time Web Index", "Live Web").replace(" (Web Index)", "")}
              </span>
            )}

            {opportunity.requiredSkills.slice(0, 2).map((sk) => (
              <span
                key={sk}
                className="hidden lg:inline-flex rounded-full bg-[#F7F8F4] px-2 py-0.5 text-[10px] font-medium text-[#4B5563] border border-black/[0.06]"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right block: Circular SVG Match Ring + Action Pill + Inspect/Feedback/Save */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-2.5 sm:pl-3">
        <div className="flex items-center gap-2">
          <MatchScoreRing
            score={evaluation.overallScore}
            title={
              semanticPercent > 0
                ? `Overall Fit ${evaluation.overallScore}% (128-D Semantic: ${semanticPercent}%)`
                : `Overall Fit ${evaluation.overallScore}%`
            }
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(opportunity, evaluation, "why");
            }}
            className="hidden md:inline-flex items-center gap-1 rounded-full border border-black/[0.09] bg-white hover:bg-[#F7F7F3] px-2.5 py-1 text-[11px] font-semibold text-[#101214] shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition cursor-pointer"
            title="Inspect AI match & evidence details"
          >
            <Sparkles className="h-2.5 w-2.5 text-[#65B811]" />
            <span>Why</span>
          </button>

          {onFeedback && (
            <div className="hidden xl:flex items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(opportunity, "MARK_RELEVANT");
                }}
                className="p-1.5 rounded-full hover:bg-[#F3FCDA] text-[#6B7280] hover:text-[#101214] transition cursor-pointer"
                title="Mark Relevant"
                aria-label="Mark relevant"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(opportunity, "MARK_NOT_RELEVANT");
                }}
                className="p-1.5 rounded-full hover:bg-rose-50 text-[#6B7280] hover:text-rose-600 transition cursor-pointer"
                title="Mark Not Relevant"
                aria-label="Mark not relevant"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(opportunity, evaluation, "overview");
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-heading text-xs font-semibold transition-all shrink-0 cursor-pointer ${style.buttonBg}`}
        >
          {ActionIcon && <ActionIcon className={`h-3.5 w-3.5 ${style.iconColor}`} />}
          <span>{style.buttonLabel}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSaveToTracker(opportunity);
          }}
          className="p-1.5 text-[#4B5563] hover:text-[#101214] hover:bg-[#F4F5F0] rounded-full border border-transparent hover:border-black/[0.07] transition-colors shrink-0 cursor-pointer"
          title={isSaved ? "Saved in Tracker" : "Save to Tracker"}
          aria-label="Save to tracker"
        >
          <Bookmark
            className={`h-4 w-4 ${
              isSaved ? "fill-[#101214] text-[#101214]" : "text-[#4B5563]"
            }`}
          />
        </button>
      </div>
    </article>
  );
}
