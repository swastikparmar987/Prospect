"use strict";
"use client";

import React, { useState } from "react";
import {
  LiveDiscoveryEvent,
  LiveDiscoveryEventStage,
  AgentRunRecord,
} from "@/types";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Square,
  Play,
  Clock,
  Database,
  Filter,
  Sparkles,
  Layers,
} from "lucide-react";

export interface SearchBudgetSettings {
  maxRounds: number;
  queriesPerRound: number;
  resultsPerProvider: number;
  searchBudgetPerRun: number;
}

interface LiveDiscoveryActivityPanelProps {
  isRunning: boolean;
  liveEvents: LiveDiscoveryEvent[];
  latestRun?: AgentRunRecord | null;
  error?: string | null;
  wasCancelled?: boolean;
  budget: SearchBudgetSettings;
  onChangeBudget: (updated: SearchBudgetSettings) => void;
  onStartLiveDiscovery: (expandRoles?: boolean) => void;
  onCancelDiscovery: () => void;
  searchMode: "DEMO" | "LIVE";
}

const PIPELINE_STAGE_META: Array<{
  stage: LiveDiscoveryEventStage;
  label: string;
}> = [
  { stage: "PROFILE_LOADED", label: "Candidate profile loaded" },
  { stage: "CAPABILITIES_EXTRACTED", label: "Candidate capabilities extracted" },
  { stage: "LOCATION_RESOLVED", label: "Location resolved" },
  { stage: "ROLE_FAMILIES_GENERATED", label: "Role families generated" },
  { stage: "QUERIES_PLANNED", label: "Search queries planned" },
  { stage: "PROVIDERS_CONTACTED", label: "Providers contacted" },
  { stage: "RESULTS_RETRIEVED", label: "Results retrieved" },
  { stage: "DUPLICATES_REMOVED", label: "Duplicates removed" },
  { stage: "ELIGIBILITY_CHECKED", label: "Eligibility checked" },
  { stage: "OPPORTUNITIES_RANKED", label: "Opportunities ranked" },
  { stage: "SEARCH_EXPANDED", label: "Search expanded" },
  { stage: "SEARCH_COMPLETED", label: "Search completed" },
];

export function LiveDiscoveryActivityPanel({
  isRunning,
  liveEvents,
  latestRun,
  error,
  wasCancelled,
  budget,
  onChangeBudget,
  onStartLiveDiscovery,
  onCancelDiscovery,
  searchMode,
}: LiveDiscoveryActivityPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showBudgetControls, setShowBudgetControls] = useState(false);

  React.useEffect(() => {
    if (isRunning || error) {
      setExpanded(true);
    }
  }, [isRunning, error]);

  const latestEvent =
    liveEvents.length > 0 ? liveEvents[liveEvents.length - 1] : null;
  const completedStages = new Set(liveEvents.map((e) => e.stage));

  // Derive telemetry from real backend events and latest AgentRunRecord
  const currentOperation = isRunning
    ? "Executing real-time multi-provider adaptive discovery..."
    : wasCancelled
    ? "Discovery run cancelled by user."
    : error
    ? `Discovery error: ${error}`
    : latestEvent?.detail ||
      latestEvent?.label ||
      latestRun?.summary ||
      "Ready to execute live multi-provider discovery.";

  const providerName =
    latestEvent?.provider ||
    (latestRun?.rounds && latestRun.rounds.length > 0
      ? latestRun.rounds[latestRun.rounds.length - 1].providersChecked.join(", ")
      : "FreeHire, Career Feeds (Greenhouse/Lever/Ashby), Tavily");

  const queryExecuted =
    latestEvent?.query ||
    latestRun?.query ||
    "Adaptive multi-role query plan";

  const resultsRetrieved =
    latestEvent?.resultsRetrieved ??
    (latestRun?.rounds
      ? latestRun.rounds.reduce((s, r) => s + r.totalRawResults, 0)
      : latestRun?.coverageSummary?.totalRawFound || 0);

  const uniqueResults =
    latestEvent?.uniqueResults ??
    (latestRun?.rounds
      ? latestRun.rounds.reduce((s, r) => s + r.uniqueNormalizedResults, 0)
      : latestRun?.coverageSummary?.totalUniqueEvaluated || 0);

  const duplicatesRemoved =
    latestEvent?.duplicatesRemoved ??
    (latestRun?.coverageSummary?.duplicatesRemoved || 0);

  const failedProviders =
    latestEvent?.failedProviders ||
    latestRun?.coverageSummary?.providersFailed ||
    [];
  const roundNumber =
    latestEvent?.round ||
    (latestRun?.rounds ? latestRun.rounds.length : 1);
  const totalRounds = budget.maxRounds;
  const elapsedMs = latestEvent?.elapsedMs ?? 0;
  const stopReason =
    latestRun?.stopReason ||
    (isRunning ? "IN_PROGRESS" : liveEvents.length > 0 ? "COMPLETED" : "IDLE");

  return (
    <section
      aria-label="Live Agent Discovery Activity Panel"
      className="neo-card overflow-hidden"
    >
      {/* Top Header Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 bg-[#FDF9F3] px-4 py-3 ${
          expanded || showBudgetControls ? "border-b-2 border-[#080808]" : ""
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isRunning ? (
            <Loader2 className="h-4 w-4 text-[#080808] animate-spin shrink-0" />
          ) : error ? (
            <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
          ) : wasCancelled ? (
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          ) : (
            <Activity className="h-4 w-4 text-[#080808] shrink-0" />
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs sm:text-sm font-extrabold text-[#080808]">
                Live Discovery Agent Pipeline
              </span>
              <span
                className={`text-[10px] font-heading font-extrabold px-2.5 py-0.5 rounded-full border border-[#080808] ${
                  isRunning
                    ? "bg-[#E0FB66] text-[#080808] animate-pulse"
                    : error
                    ? "bg-rose-100 text-rose-800 border-rose-500"
                    : wasCancelled
                    ? "bg-[#FEF189] text-[#080808]"
                    : "bg-white text-[#080808]"
                }`}
              >
                {isRunning
                  ? "RUNNING LIVE"
                  : error
                  ? "ERROR"
                  : wasCancelled
                  ? "CANCELLED"
                  : liveEvents.length > 0
                  ? "COMPLETED"
                  : "READY"}
              </span>
              <span className="hidden md:inline text-[11px] text-[#777777]">
                • Mode: <strong className="text-[#080808]">{searchMode}</strong>
              </span>
            </div>
            <p className="text-xs text-[#777777] mt-0.5 line-clamp-1">
              {currentOperation}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              type="button"
              onClick={onCancelDiscovery}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 font-heading text-xs font-bold text-white shadow-[2px_2px_0px_#080808] transition cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Cancel Search</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onStartLiveDiscovery(false)}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#080808] hover:-translate-y-0.5 px-3.5 py-1.5 font-heading text-xs font-bold text-white shadow-[2px_2px_0px_#E0FB66] transition cursor-pointer"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Refresh Discovery</span>
              </button>
              <button
                type="button"
                onClick={() => onStartLiveDiscovery(true)}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#d5f54e] px-3.5 py-1.5 font-heading text-xs font-bold text-[#080808] shadow-[2px_2px_0px_#080808] transition cursor-pointer"
                title="Expand search across adjacent role families and additional company boards"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#080808]" />
                <span>Expand Search</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowBudgetControls((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full border-2 border-[#080808] px-3 py-1.5 font-heading text-xs font-bold transition cursor-pointer ${
              showBudgetControls
                ? "bg-[#FEF189] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
            }`}
            title="Configure Search Budgets"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Budgets</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-1.5 rounded-full text-[#080808] hover:bg-white transition cursor-pointer"
            aria-label="Toggle live activity details"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Configurable Search Budgets Drawer (Priority 2) */}
      {showBudgetControls && (
        <div className="bg-[#FDF9F3] border-b-2 border-[#080808] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#080808]">
              Configurable Adaptive Search Budgets
            </span>
            <span className="text-[11px] font-medium text-[#777777]">
              Bounded concurrency, rate-limiting & marginal yield stopping
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#080808]">
                Max Search Rounds ({budget.maxRounds})
              </span>
              <input
                type="range"
                min={1}
                max={4}
                value={budget.maxRounds}
                onChange={(e) =>
                  onChangeBudget({
                    ...budget,
                    maxRounds: Number(e.target.value),
                  })
                }
                className="accent-[#080808]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#080808]">
                Queries / Round ({budget.queriesPerRound})
              </span>
              <input
                type="range"
                min={2}
                max={10}
                value={budget.queriesPerRound}
                onChange={(e) =>
                  onChangeBudget({
                    ...budget,
                    queriesPerRound: Number(e.target.value),
                  })
                }
                className="accent-[#080808]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#080808]">
                Results / Provider ({budget.resultsPerProvider})
              </span>
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={budget.resultsPerProvider}
                onChange={(e) =>
                  onChangeBudget({
                    ...budget,
                    resultsPerProvider: Number(e.target.value),
                  })
                }
                className="accent-[#080808]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#080808]">
                Total Query Budget ({budget.searchBudgetPerRun})
              </span>
              <input
                type="range"
                min={4}
                max={28}
                step={2}
                value={budget.searchBudgetPerRun}
                onChange={(e) =>
                  onChangeBudget({
                    ...budget,
                    searchBudgetPerRun: Number(e.target.value),
                  })
                }
                className="accent-[#080808]"
              />
            </label>
          </div>
        </div>
      )}

      {/* Expanded Body: Telemetry Metrics + 12 Pipeline Stages + Round Trace */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#777777] block">
                Providers Contacted
              </span>
              <span
                className="font-extrabold text-[#080808] truncate block mt-0.5"
                title={providerName}
              >
                {providerName}
              </span>
            </div>

            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#777777] block">
                Active Query
              </span>
              <span
                className="font-extrabold text-[#080808] truncate block mt-0.5"
                title={queryExecuted}
              >
                {queryExecuted}
              </span>
            </div>

            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#777777] flex items-center gap-1">
                <Database className="h-3 w-3" /> Raw Retrieved
              </span>
              <span className="font-extrabold text-sm text-[#080808] block mt-0.5">
                {resultsRetrieved}
              </span>
            </div>

            <div className="rounded-xl border-2 border-[#080808] bg-[#E0FB66] p-2.5">
              <span className="text-[10px] font-extrabold uppercase text-[#080808] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Unique Verified
              </span>
              <span className="font-extrabold text-sm text-[#080808] block mt-0.5">
                {uniqueResults}
              </span>
            </div>

            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#777777] flex items-center gap-1">
                <Filter className="h-3 w-3" /> Duplicates Removed
              </span>
              <span className="font-extrabold text-sm text-[#080808] block mt-0.5">
                {duplicatesRemoved}
              </span>
            </div>

            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#777777] flex items-center gap-1">
                <Layers className="h-3 w-3" /> Search Round
              </span>
              <span className="font-extrabold text-sm text-[#080808] block mt-0.5">
                Round {roundNumber} / {totalRounds}
              </span>
            </div>

            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#777777] flex items-center gap-1">
                <Clock className="h-3 w-3" /> Elapsed Time
              </span>
              <span className="font-extrabold text-sm text-[#080808] block mt-0.5">
                {elapsedMs > 0 ? `${(elapsedMs / 1000).toFixed(2)}s` : "—"}
              </span>
            </div>

            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#777777] block">
                Stop Reason
              </span>
              <span
                className="font-mono font-bold text-[11px] text-[#080808] truncate block mt-0.5"
                title={stopReason}
              >
                {stopReason}
              </span>
            </div>
          </div>

          {/* Failed Providers Alert (if any) */}
          {failedProviders.length > 0 && (
            <div className="rounded-xl border-2 border-[#080808] bg-[#FEF189] px-3 py-2 text-xs text-[#080808] flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 text-[#080808] shrink-0" />
              <span>
                <strong>Provider warnings ({failedProviders.length}):</strong>{" "}
                {failedProviders.join(", ")} (isolated via circuit breaker; remaining providers succeeded)
              </span>
            </div>
          )}

          {/* 12-Stage Pipeline Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#080808]">
                Backend Execution Pipeline Stages
              </span>
              <span className="text-[11px] font-medium text-[#777777]">
                {completedStages.size} of {PIPELINE_STAGE_META.length} stages observed in latest run
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PIPELINE_STAGE_META.map((item) => {
                const isDone = completedStages.has(item.stage);
                const matchingEvt = [...liveEvents]
                  .reverse()
                  .find((e) => e.stage === item.stage);
                return (
                  <div
                    key={item.stage}
                    className={`rounded-xl border-2 px-2.5 py-2 text-xs flex items-start gap-2 transition-colors ${
                      isDone
                        ? "border-[#080808] bg-[#E0FB66]/45 text-[#080808]"
                        : "border-[#D8D5CE] bg-white text-[#777777]"
                    }`}
                    title={matchingEvt?.detail || item.label}
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                        isDone ? "text-[#080808]" : "text-[#D8D5CE]"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] leading-tight truncate">
                        {item.label}
                      </p>
                      {matchingEvt && (
                        <p className="text-[10px] font-semibold text-[#080808] truncate mt-0.5">
                          {matchingEvt.elapsedMs}ms
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Event Log / Round Trace */}
          {liveEvents.length > 0 && (
            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3 max-h-44 overflow-y-auto space-y-1.5 text-xs">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#080808] mb-1">
                Real-Time Pipeline Event Stream ({liveEvents.length} events)
              </div>
              {liveEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D5CE] pb-1 last:border-b-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded-md bg-[#E0FB66] border border-[#080808] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#080808] shrink-0">
                      {ev.stage}
                    </span>
                    <span className="text-[#080808] truncate">{ev.detail || ev.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#777777] shrink-0">
                    {ev.provider && <span>[{ev.provider}]</span>}
                    <span>+{ev.elapsedMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
