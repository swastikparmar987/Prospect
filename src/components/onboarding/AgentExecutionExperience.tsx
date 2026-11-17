"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Search,
  Globe,
  Database,
  ShieldCheck,
  Check,
} from "lucide-react";
import { AgentStepRecord } from "@/types";

export interface AgentExecutionStage {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
}

interface AgentExecutionExperienceProps {
  onComplete: () => void;
  targetRoles: string[];
  searchMode: "LIVE" | "DEMO";
  steps?: AgentStepRecord[];
  isCompleted?: boolean;
  totalOpportunitiesFound?: number;
  sourcesSearched?: string[];
  error?: string | null;
}

const DEFAULT_STAGES: AgentExecutionStage[] = [
  {
    id: "read_profile",
    name: "Reading confirmed profile",
    description: "Extracting skills, academic standing, and constraints from confirmed profile.",
    status: "running",
  },
  {
    id: "career_paths",
    name: "Identifying suitable career paths",
    description: "Mapping demonstrated capabilities to target roles and adjacent role families.",
    status: "pending",
  },
  {
    id: "prepare_queries",
    name: "Preparing search queries",
    description: "Formulating focused multi-source search plans without leaking candidate identifiers.",
    status: "pending",
  },
  {
    id: "search_sources",
    name: "Searching opportunity sources",
    description: "Querying live web index, official company boards, and university lab repositories.",
    status: "pending",
  },
  {
    id: "collect_listings",
    name: "Collecting relevant listings",
    description: "Normalizing feeds, filtering irrelevant spam/articles, and deduplicating cross-provider.",
    status: "pending",
  },
  {
    id: "source_evidence",
    name: "Checking source evidence",
    description: "Validating domain authenticity, reachability, and official application portals.",
    status: "pending",
  },
  {
    id: "evaluate_eligibility",
    name: "Evaluating eligibility",
    description: "Matching academic requirements, graduation year, and work authorization.",
    status: "pending",
  },
  {
    id: "calculate_fit",
    name: "Calculating opportunity fit",
    description: "Scoring technical skill overlap, project deliverables, and feasibility.",
    status: "pending",
  },
  {
    id: "generate_recommendations",
    name: "Generating personalized recommendations",
    description: "Classifying into Apply Now, Prepare First, Keep Watching, and Skip.",
    status: "pending",
  },
  {
    id: "save_results",
    name: "Saving search results",
    description: "Persisting verified opportunities, evidence records, and execution trace to database.",
    status: "pending",
  },
];

export function AgentExecutionExperience({
  onComplete,
  targetRoles,
  searchMode,
  steps = [],
  isCompleted = false,
  totalOpportunitiesFound = 0,
  sourcesSearched = ["Tavily Real-Time Web Index", "Verified Company Boards", "Research Lab Portals"],
  error = null,
}: AgentExecutionExperienceProps) {
  const [stages, setStages] = useState<AgentExecutionStage[]>(DEFAULT_STAGES);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  // Derive stage progression strictly from real backend execution steps (never fake timers)
  useEffect(() => {
    if (isCompleted) {
      setStages((prev) =>
        prev.map((s) => ({ ...s, status: "completed" }))
      );
      setCurrentStageIdx(DEFAULT_STAGES.length - 1);
      return;
    }

    const completedStepCount = Math.min(steps.length, DEFAULT_STAGES.length - 1);
    setCurrentStageIdx(completedStepCount);

    if (error) {
      setStages((prev) =>
        prev.map((s, idx) => {
          if (idx < completedStepCount) return { ...s, status: "completed" };
          if (idx === completedStepCount) return { ...s, status: "failed" };
          return { ...s, status: "pending" };
        })
      );
      return;
    }

    setStages((sList) =>
      sList.map((stage, idx) => {
        if (idx < completedStepCount) return { ...stage, status: "completed" };
        if (idx === completedStepCount) return { ...stage, status: "running" };
        return { ...stage, status: "pending" };
      })
    );
  }, [isCompleted, error, steps.length]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Editorial Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-1 text-xs font-semibold text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] mb-4">
          <Sparkles className="h-3.5 w-3.5 text-[#0E1012]" />
          <span>Opportunity Discovery Agent</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#101214]">
          Finding opportunities for you.
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#64748B]">
          Searching across verified career boards and live web sources for{" "}
          <strong className="text-[#101214]">{targetRoles.slice(0, 3).join(", ")}</strong>.
        </p>
      </div>

      {/* Main Execution Card */}
      <div className="bg-white border border-black/[0.07] rounded-[26px] shadow-[0_12px_38px_rgba(15,23,42,0.06)] p-6 sm:p-8">
        {/* Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] pb-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#94D814] ring-4 ring-[#E3FC6D]/50 animate-pulse" />
            <span className="font-semibold text-[#101214]">
              Mode: Live Web Intelligence
            </span>
          </div>

          <div className="flex items-center gap-3 text-[#64748B]">
            <span className="font-medium">Sources: {sourcesSearched.length} checked</span>
            {isCompleted && (
              <span className="font-semibold text-[#0E1012] rounded-full bg-[#E3FC6D] border border-[#C6E832] shadow-[0_2px_8px_rgba(205,238,54,0.25)] px-3 py-0.5">
                ✓ {totalOpportunitiesFound} Discovered
              </span>
            )}
          </div>
        </div>

        {/* 10 Real Execution Stages List */}
        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className={`flex items-start gap-3.5 rounded-2xl p-3.5 transition-all ${
                stage.status === "running"
                  ? "border border-[#C7E938]/70 bg-[#F3FCDA]/80 shadow-[0_4px_16px_rgba(205,238,54,0.18)]"
                  : stage.status === "completed"
                  ? "border border-black/[0.07] bg-[#FAFBF7]"
                  : "border border-transparent bg-transparent opacity-50"
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {stage.status === "completed" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#101214] text-[#E3FC6D]">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : stage.status === "running" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E3FC6D] border border-[#C6E832] text-[#0E1012]">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0E1012] border-t-transparent" />
                  </div>
                ) : stage.status === "failed" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.12] bg-white text-[#64748B]">
                    <span className="text-[10px] font-semibold">{idx + 1}</span>
                  </div>
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      stage.status === "running" || stage.status === "completed"
                        ? "text-[#101214]"
                        : "text-[#64748B]"
                    }`}
                  >
                    {stage.name}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    {stage.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#64748B] line-clamp-1">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Error Handling */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Search encountered an issue</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
              <button
                onClick={onComplete}
                className="mt-2 text-xs font-semibold underline underline-offset-2 text-rose-800 hover:text-rose-900 cursor-pointer"
              >
                Proceed to results with partial findings →
              </button>
            </div>
          </div>
        )}

        {/* Completed CTA */}
        {isCompleted && !error && (
          <div className="mt-8 border-t border-black/[0.07] pt-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5DFA0] bg-[#FEF9E7] px-4 py-1.5 text-xs font-semibold text-[#101214] mb-4">
              <CheckCircle2 className="h-4 w-4 text-[#65B811]" />
              <span>Discovery complete — {totalOpportunitiesFound} opportunities evaluated</span>
            </div>
            <div>
              <button
                type="button"
                onClick={onComplete}
                className="inline-flex items-center gap-2 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all px-8 py-3.5 text-sm cursor-pointer"
              >
                <span>View Personalized Opportunities</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

