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
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3.5 py-1 text-xs font-bold text-[#080808] mb-4">
          <Sparkles className="h-3.5 w-3.5 text-[#080808]" />
          <span>Opportunity Discovery Agent</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#080808]">
          Finding opportunities for you.
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#777777]">
          Searching across verified career boards and live web sources for{" "}
          <strong className="text-[#080808]">{targetRoles.slice(0, 3).join(", ")}</strong>.
        </p>
      </div>

      {/* Main Execution Card */}
      <div className="neo-card-lg bg-white p-6 sm:p-8">
        {/* Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#080808] pb-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#E0FB66] border border-[#080808] animate-pulse" />
            <span className="font-bold text-[#080808]">
              Mode: Live Web Intelligence
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#777777]">
            <span>Sources: {sourcesSearched.length} checked</span>
            {isCompleted && (
              <span className="font-bold text-[#080808] rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5">
                ✓ {totalOpportunitiesFound} Discovered
              </span>
            )}
          </div>
        </div>

        {/* 10 Real Execution Stages List */}
        <div className="space-y-3.5">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className={`flex items-start gap-3.5 rounded-2xl p-3.5 transition-all ${
                stage.status === "running"
                  ? "border-2 border-[#080808] bg-[#E0FB66]/45 shadow-[2px_2px_0px_#080808]"
                  : stage.status === "completed"
                  ? "border border-[#D8D5CE] bg-[#FDF9F3]"
                  : "bg-transparent opacity-45"
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {stage.status === "completed" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#080808] text-[#E0FB66]">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : stage.status === "running" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FEF189] border border-[#080808] text-[#080808]">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#080808] border-t-transparent" />
                  </div>
                ) : stage.status === "failed" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#D8D5CE] text-[#777777]">
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-bold ${
                      stage.status === "running" || stage.status === "completed"
                        ? "text-[#080808]"
                        : "text-[#777777]"
                    }`}
                  >
                    {stage.name}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
                    {stage.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#777777] line-clamp-1">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Error Handling */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-[#080808] bg-red-50 p-4 text-xs text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Search encountered an issue</p>
              <p className="mt-0.5 text-red-700">{error}</p>
              <button
                onClick={onComplete}
                className="mt-2 text-xs font-bold underline underline-offset-2 text-red-800 hover:text-red-900"
              >
                Proceed to results with partial findings →
              </button>
            </div>
          </div>
        )}

        {/* Completed CTA */}
        {isCompleted && !error && (
          <div className="mt-8 border-t-2 border-[#080808] pt-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-[#FEF189] px-4 py-1.5 text-xs font-bold text-[#080808] mb-4">
              <CheckCircle2 className="h-4 w-4 text-[#080808]" />
              <span>Discovery complete — {totalOpportunitiesFound} opportunities evaluated</span>
            </div>
            <div>
              <button
                type="button"
                onClick={onComplete}
                className="neo-btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm cursor-pointer"
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

