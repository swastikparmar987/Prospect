"use strict";
"use client";

import React from "react";
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
          stripColor: "bg-[#E0FB66]",
          buttonBg:
            "bg-[#E0FB66] hover:bg-[#d5f54e] text-[#080808] border-2 border-[#080808] shadow-[3px_3px_0px_#080808]",
          buttonLabel: "Apply Now",
          icon: Rocket,
          iconColor: "text-[#080808]",
        };
      case "PREPARE_FIRST":
        return {
          stripColor: "bg-[#FEF189]",
          buttonBg:
            "bg-[#FEF189] hover:bg-[#fde95e] text-[#080808] border-2 border-[#080808] shadow-[3px_3px_0px_#080808]",
          buttonLabel: "Prepare First",
          icon: BookOpen,
          iconColor: "text-[#080808]",
        };
      case "KEEP_WATCHING":
        return {
          stripColor: "bg-[#C4E7FF]",
          buttonBg:
            "bg-white hover:bg-[#FDF9F3] text-[#080808] border-2 border-[#080808] shadow-[3px_3px_0px_#080808]",
          buttonLabel: "Keep Watching",
          icon: Eye,
          iconColor: "text-[#080808]",
        };
      case "SKIP":
      default:
        return {
          stripColor: "bg-[#D8D5CE]",
          buttonBg:
            "bg-[#FDF9F3] hover:bg-[#D8D5CE]/40 text-[#777777] border-2 border-[#D8D5CE]",
          buttonLabel: "Skip",
          icon: null,
          iconColor: "text-[#777777]",
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
      className="neo-card-interactive group relative flex flex-col sm:flex-row sm:items-center sm:justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 cursor-pointer overflow-hidden gap-2.5"
    >
      {/* Left semantic colored vertical strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 border-r border-[#080808] ${style.stripColor} transition-colors`}
      />

      {/* Left block: Compact Logo + Title/Company + Inline Metadata Row */}
      <div className="flex items-center space-x-3 pl-2 min-w-0 flex-1">
        <CompanyLogo
          name={opportunity.organization}
          size={36}
          className="h-9 w-9 shrink-0 rounded-lg border border-[#D8D5CE]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-heading text-sm sm:text-[15px] font-extrabold text-[#080808] leading-snug group-hover:underline truncate max-w-full">
              {opportunity.title}
            </h3>

            <span className="text-xs font-bold text-[#555555] truncate">
              · {opportunity.organization}
            </span>

            {isNew && (
              <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-1.5 py-0.2 font-heading text-[9px] font-extrabold uppercase text-[#080808]">
                New
              </span>
            )}
            {isUpdated && (
              <span className="rounded-full bg-[#FEF189] border border-[#080808] px-1.5 py-0.2 font-heading text-[9px] font-extrabold uppercase text-[#080808]">
                Updated
              </span>
            )}
          </div>

          {/* Single Compact Metadata & Skills Row */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#666666]">
            {opportunity.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#080808] shrink-0" />
                <span className="truncate max-w-[180px]">{opportunity.location}</span>
              </span>
            )}

            {hasDistance && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-[#E0FB66]/70 border border-[#080808] px-1.5 py-0.2 text-[10px] font-bold text-[#080808]"
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
                <Laptop className="h-3 w-3 text-[#080808] shrink-0" />
                <span>{opportunity.workMode}</span>
              </span>
            )}

            {deadlineDisplay && (
              <span className="hidden md:inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#080808] shrink-0" />
                <span>{deadlineDisplay}</span>
              </span>
            )}

            {opportunity.compensation &&
              !opportunity.compensation.toLowerCase().includes("unlisted") &&
              !opportunity.compensation.toLowerCase().includes("see") &&
              opportunity.compensation !== "Unknown" && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FEF189] border border-[#080808] text-[10px] font-bold text-[#080808]">
                  {opportunity.compensation}
                </span>
              )}

            {opportunity.sourceName && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-[#555555]">
                • {opportunity.sourceName.replace("Real-Time Web Index", "Live Web").replace(" (Web Index)", "")}
              </span>
            )}

            {opportunity.requiredSkills.slice(0, 2).map((sk) => (
              <span
                key={sk}
                className="hidden lg:inline-flex rounded-full bg-[#FDF9F3] px-1.5 py-0.2 text-[10px] font-semibold text-[#080808] border border-[#D8D5CE]"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right block: Compact Match Score + Action Pill + Inspect/Feedback/Save */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-2 sm:pl-3">
        <div className="flex items-center gap-1.5">
          <div
            className="inline-flex items-center rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold text-[#080808]"
            title={
              semanticPercent > 0
                ? `Overall Fit ${evaluation.overallScore}% (128-D Semantic: ${semanticPercent}%)`
                : `Overall Fit ${evaluation.overallScore}%`
            }
          >
            <span>{evaluation.overallScore}%</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(opportunity, evaluation, "why");
            }}
            className="hidden md:inline-flex items-center gap-1 rounded-full border border-[#080808] bg-white hover:bg-[#FDF9F3] px-2 py-0.5 text-[10px] font-bold text-[#080808] transition cursor-pointer"
            title="Inspect AI match & evidence details"
          >
            <Sparkles className="h-2.5 w-2.5" />
            <span>Why</span>
          </button>

          {onFeedback && (
            <div className="hidden xl:flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(opportunity, "MARK_RELEVANT");
                }}
                className="p-1 rounded-full hover:bg-[#E0FB66] text-[#777777] hover:text-[#080808] transition cursor-pointer"
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
                className="p-1 rounded-full hover:bg-red-50 text-[#777777] hover:text-red-700 transition cursor-pointer"
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
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-heading text-xs font-bold transition-all shrink-0 cursor-pointer ${style.buttonBg}`}
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
          className="p-1.5 text-[#080808] hover:bg-[#FDF9F3] rounded-full border border-transparent hover:border-[#080808] transition-colors shrink-0 cursor-pointer"
          title={isSaved ? "Saved in Tracker" : "Save to Tracker"}
          aria-label="Save to tracker"
        >
          <Bookmark
            className={`h-4 w-4 ${
              isSaved ? "fill-[#080808] text-[#080808]" : "text-[#080808]"
            }`}
          />
        </button>
      </div>
    </article>
  );
}
