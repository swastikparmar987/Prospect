"use strict";
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AgentRunRecord,
  CandidateCapabilityMap,
  ExpandedRole,
} from "@/types";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Compass,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

interface AgentActivityViewProps {
  runs: AgentRunRecord[];
  onRefresh: () => void;
  onRunCompleted?: (summary: string) => void;
}

interface ProviderInfo {
  id: string;
  displayName: string;
  description: string;
  scopeNote: string;
  enabled: boolean;
}

export function AgentActivityView({
  runs,
  onRefresh,
  onRunCompleted,
}: AgentActivityViewProps) {
  const [expandedRunId, setExpandedRunId] = useState<string | null>(
    runs.length > 0 ? runs[0].id : null
  );
  const mode = "LIVE" as const;
  const [capabilityMap, setCapabilityMap] =
    useState<CandidateCapabilityMap | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<ExpandedRole[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [personalization, setPersonalization] = useState<{
    boostedRoleFamilies: string[];
    penalizedRoleFamilies: string[];
    excludedRoleFamilies: string[];
    hiddenEmployers: string[];
    totalSignalsRecorded: number;
  } | null>(null);
  const [runningAdaptive, setRunningAdaptive] = useState(false);
  const [selectedArchitectureStage, setSelectedArchitectureStage] = useState<number>(0);

  const mlPipelineStages = [
    {
      step: "01",
      title: "Resume & Project Extraction",
      module: "src/lib/resume-parser.ts • candidate-intelligence.ts",
      formula: "NER + LLM Structured Extraction -> Skills, Experiences, Projects, City Centroid",
      detail:
        "Parses any uploaded PDF/DOCX/TXT resume, anchors Haversine coordinates directly from the candidate's current city (e.g., Delhi, Gurugram, Bengaluru), and builds a typed Capability Map.",
      liveMetric: capabilityMap
        ? `${capabilityMap.demonstratedCapabilities.length} direct + ${capabilityMap.inferredAdjacentCapabilities.length} adjacent capabilities`
        : "Upload resume to inspect live vector",
    },
    {
      step: "02",
      title: "Hybrid RAG Indexing (128-D + BM25)",
      module: "src/lib/ai/semantic-embeddings.ts",
      formula: "48 Latent Concept Clusters + 80 Signed Hashed Bigrams + BM25 (k1=1.5, b=0.75)",
      detail:
        "Encodes candidate resumes, evaluated projects, and live job postings into L2-normalized 128-D vectors and pairs dense cosine similarity with sparse BM25 exact-term matching.",
      liveMetric: `${expandedRoles.length} expanded role families active`,
    },
    {
      step: "03",
      title: "Multi-Platform Live Ingestion",
      module: "src/lib/providers/* • sync-worker.ts",
      formula: "ATS Boards (Greenhouse/Lever/Ashby) + Remotive/Arbeitnow/Himalayas + Tavily Portal Index",
      detail:
        "Aggregates live jobs across verified ATS boards, open remote JSON APIs, and targeted real-time web queries (LinkedIn, Naukri, Indeed, Wellfound, Internshala) while filtering out SEO blog listicles.",
      liveMetric: `${providers.filter((p) => p.enabled).length} active live providers`,
    },
    {
      step: "04",
      title: "Resume-Vicinity & Hard Gate",
      module: "src/lib/location-intelligence.ts • eligibility-engine.ts",
      formula: "Haversine(lat1, lon1, lat2, lon2) <= radiusKm OR Same-Country Remote + Seniority Gate",
      detail:
        "Dynamically filters listings around the uploaded resume's city centroid (80 km metro radius + eligible Remote) and blocks Senior/Manager/Director/Staff requisitions with SKIP override.",
      liveMetric: "Zero foreign on-site leakage in Vicinity Mode",
    },
    {
      step: "05",
      title: "Domain-Calibrated Scoring Engine",
      module: "src/lib/scoring-engine.ts",
      formula: "Eligibility(35) + HybridSkills(30) + Quality(15) + Pref(10) + Deadline(10) + Prox(-15..+4) + Fresh(+0..3)",
      detail:
        "Detects non-technical role domains (Finance, Sales, HR, Legal) for engineering profiles, capping cross-domain mismatches <= 42% (SKIP) so Corporate Finance never equals Research Scientist.",
      liveMetric: "Domain mismatch cap active (SCORING_ENGINE_VERSION=2)",
    },
    {
      step: "06",
      title: "Diversity Re-Ranking & SSE Auto-Sync",
      module: "src/lib/search-diversity.ts • api/opportunities/stream",
      formula: "applyMultiPlatformDiversity(capEmployer=2, capSource=4) + EventSource Push",
      detail:
        "Balances top results across employers and job boards, computes Precision@K / Recall@K / nDCG@K, and streams live DB/profile updates automatically to the browser via Server-Sent Events (SSE).",
      liveMetric: `${runs.length} recorded agent telemetry runs`,
    },
  ];

  const loadIntelligenceState = useCallback(async (selectedMode: "DEMO" | "LIVE") => {
    try {
      const res = await fetch(`/api/search/intelligence?mode=${selectedMode}`);
      const data = await res.json();
      if (data.capabilityMap) setCapabilityMap(data.capabilityMap);
      if (data.expandedRoles) setExpandedRoles(data.expandedRoles);
      if (data.providers) setProviders(data.providers);
      if (data.personalization) setPersonalization(data.personalization);
    } catch (err) {
      console.error("Failed to load search intelligence:", err);
    }
  }, []);

  useEffect(() => {
    loadIntelligenceState(mode);
  }, [mode, loadIntelligenceState]);

  useEffect(() => {
    if (runs.length > 0 && !expandedRunId) {
      setExpandedRunId(runs[0].id);
    }
  }, [runs, expandedRunId]);

  const handleRunAdaptiveLoop = async () => {
    setRunningAdaptive(true);
    try {
      const res = await fetch("/api/search/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, maxRounds: 3 }),
      });
      const data = await res.json();
      if (data.runId) {
        setExpandedRunId(data.runId);
      }
      await loadIntelligenceState(mode);
      onRefresh();
      if (onRunCompleted && data.summary) {
        onRunCompleted(data.summary);
      }
    } catch (err) {
      console.error("Adaptive search run failed:", err);
    } finally {
      setRunningAdaptive(false);
    }
  };

  const handleDismissRoleFamily = async (roleTitle: string) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalType: "DISMISS_ROLE_FAMILY",
          roleFamily: roleTitle,
          notes: `Excluded role family "${roleTitle}" from Search Intelligence view.`,
        }),
      });
      await loadIntelligenceState(mode);
      if (onRunCompleted) {
        onRunCompleted(`Excluded role family "${roleTitle}" from future adaptive search plans.`);
      }
    } catch (err) {
      console.error("Failed to exclude role family:", err);
    }
  };

  const handleResetPersonalization = async () => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalType: "RESET_PERSONALIZATION",
          notes: "User reset search personalization and role family exclusions.",
        }),
      });
      await loadIntelligenceState(mode);
      if (onRunCompleted) {
        onRunCompleted("Reset search personalization and role exclusions.");
      }
    } catch (err) {
      console.error("Failed to reset personalization:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="neo-card-lg bg-white p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#080808]">
            Search Intelligence & Adaptive Loop Trace
          </h1>
          <p className="mt-1 text-xs text-[#777777]">
            Capability extraction, role-family expansion, multi-source provider status, round-by-round adaptive search metrics, and tool trace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-3 py-1.5 text-xs font-bold text-[#080808]">
            <span className="h-2 w-2 rounded-full bg-[#080808] animate-pulse" />
            <span>LIVE Mode (Public APIs)</span>
          </div>

          <button
            onClick={handleRunAdaptiveLoop}
            disabled={runningAdaptive}
            className="neo-btn-primary inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-[#E0FB66]" />
            <span>
              {runningAdaptive ? "Running Adaptive Loop..." : "Run Adaptive Search (LIVE)"}
            </span>
          </button>

          <button
            onClick={() => {
              loadIntelligenceState(mode);
              onRefresh();
            }}
            className="neo-btn-outline inline-flex items-center space-x-1.5 px-3 py-2 text-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Section 0: Interactive ML / RAG Pipeline Walkthrough (Presentation View) */}
      <div className="neo-card-lg bg-[#FDF9F3] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#080808] bg-[#EAE2FE] px-2.5 py-0.5 text-[10px] font-extrabold text-[#080808]">
              <Sparkles className="h-3 w-3" />
              <span>END-TO-END ML & RAG ARCHITECTURE WALKTHROUGH</span>
            </div>
            <h2 className="mt-1 text-base sm:text-lg font-extrabold text-[#080808]">
              How Prospect Computes Matches in 6 Deterministic + AI Stages
            </h2>
          </div>
          <span className="rounded-lg border border-[#080808] bg-white px-2.5 py-1 text-[11px] font-bold text-[#080808]">
            Click any stage to inspect math & modules
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {mlPipelineStages.map((stage, idx) => {
            const active = selectedArchitectureStage === idx;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setSelectedArchitectureStage(idx)}
                className={`rounded-xl border-2 border-[#080808] p-3 text-left transition cursor-pointer ${
                  active
                    ? "bg-[#E0FB66] shadow-[3px_3px_0px_#080808] -translate-y-0.5"
                    : "bg-white hover:bg-[#FEF189]/40"
                }`}
              >
                <div className="text-[10px] font-extrabold text-[#080808]/70">
                  STAGE {stage.step}
                </div>
                <div className="mt-0.5 font-heading text-xs font-extrabold text-[#080808] leading-snug">
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>

        {mlPipelineStages[selectedArchitectureStage] && (
          <div className="rounded-xl border-2 border-[#080808] bg-white p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-heading text-sm font-extrabold text-[#080808]">
                Stage {mlPipelineStages[selectedArchitectureStage].step}:{" "}
                {mlPipelineStages[selectedArchitectureStage].title}
              </span>
              <span className="rounded-full border border-[#080808] bg-[#EAE2FE] px-2.5 py-0.5 text-[11px] font-bold text-[#080808]">
                {mlPipelineStages[selectedArchitectureStage].liveMetric}
              </span>
            </div>
            <div className="rounded-lg bg-[#FDF9F3] border border-[#D8D5CE] px-3 py-1.5 font-mono text-[11px] text-[#080808]">
              {mlPipelineStages[selectedArchitectureStage].formula}
            </div>
            <p className="text-xs text-[#555555] leading-relaxed">
              {mlPipelineStages[selectedArchitectureStage].detail}
            </p>
            <div className="text-[11px] font-semibold text-[#777777]">
              Implementation: {mlPipelineStages[selectedArchitectureStage].module}
            </div>
          </div>
        )}
      </div>

      {/* Section 1: Candidate Capability Intelligence & Role Expansion */}
      {capabilityMap && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Capability Map Card */}
          <div className="neo-card bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-[#080808]" />
                <h2 className="text-sm font-extrabold text-[#080808]">
                  Candidate Capability Extraction
                </h2>
              </div>
              <span className="rounded-md border border-[#080808] bg-[#E0FB66] px-2 py-0.5 text-[10px] font-bold text-[#080808]">
                {capabilityMap.demonstratedCapabilities.length} Direct ·{" "}
                {capabilityMap.inferredAdjacentCapabilities.length} Adjacent
              </span>
            </div>

            <p className="text-xs text-[#777777] leading-relaxed">
              {capabilityMap.summary}
            </p>

            <div className="space-y-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#777777]">
                Demonstrated Capabilities & Provenance
              </h3>
              {capabilityMap.demonstratedCapabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="rounded-xl border border-[#080808] bg-[#FDF9F3] p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-[#080808]">
                      {cap.capability}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="rounded bg-white border border-[#080808] px-1.5 py-0.5 text-[10px] font-mono text-[#080808]">
                        {cap.provenance}
                      </span>
                      <span className="rounded bg-[#E0FB66] border border-[#080808] px-1.5 py-0.5 text-[10px] font-bold text-[#080808]">
                        {cap.evidenceStrength}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-[#777777]">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>

            {capabilityMap.missingDetailsPrompts.length > 0 && (
              <div className="rounded-xl border-2 border-[#080808] bg-[#FEF189] p-3 text-xs text-[#080808]">
                <div className="font-extrabold text-[#080808] flex items-center space-x-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#080808]" />
                  <span>Profile Details Awaiting Confirmation</span>
                </div>
                <ul className="mt-1.5 list-disc list-inside space-y-1 text-[11px]">
                  {capabilityMap.missingDetailsPrompts.map((p, idx) => (
                    <li key={idx}>
                      <strong>{p.field}:</strong> {p.question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Role Expansion Families Card */}
          <div className="neo-card bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-[#080808]" />
                <h2 className="text-sm font-extrabold text-[#080808]">
                  Capability-Based Role Families (/expand)
                </h2>
              </div>
              {personalization &&
                (personalization.excludedRoleFamilies.length > 0 ||
                  personalization.hiddenEmployers.length > 0 ||
                  personalization.totalSignalsRecorded > 0) && (
                  <button
                    onClick={handleResetPersonalization}
                    className="inline-flex items-center space-x-1 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] px-2 py-1 text-[11px] font-bold text-[#080808] hover:bg-[#FEF189] cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Exclusions</span>
                  </button>
                )}
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {expandedRoles.map((role) => (
                <div
                  key={role.id}
                  className={`rounded-xl border border-[#080808] p-3 text-xs transition-all ${
                    role.excludedByUser
                      ? "bg-[#D8D5CE]/50 opacity-60"
                      : "bg-[#FDF9F3]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-[#080808]">
                          {role.title}
                        </span>
                        <span className="rounded bg-[#E0FB66] border border-[#080808] px-1.5 py-0.5 text-[10px] font-bold text-[#080808]">
                          {role.roleFamily}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Est. Fit: {role.relevanceEstimate}% (Conf: {Math.round(role.confidence * 100)}%)
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {role.expansionRationale}
                      </p>
                      {role.missingSkills.length > 0 && (
                        <p className="mt-1 text-[10px] text-amber-800">
                          <strong>Missing skills:</strong> {role.missingSkills.join(", ")}
                        </p>
                      )}
                    </div>

                    {!role.excludedByUser ? (
                      <button
                        onClick={() => handleDismissRoleFamily(role.title)}
                        title="Exclude this role family from future adaptive search plans"
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 shrink-0"
                      >
                        Exclude
                      </button>
                    ) : (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                        Excluded
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Multi-Source Provider Registry & Compliance Status */}
      {providers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <Compass className="h-4 w-4 text-[#064e3b]" />
            <h2 className="text-sm font-bold text-slate-900">
              Multi-Source Provider Status ({mode} Mode)
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">
                    {p.id}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      p.enabled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {p.enabled ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>
                <div className="mt-1 font-semibold text-slate-800">
                  {p.displayName}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  {p.scopeNote}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Adaptive Search Runs & Round-by-Round Metrics */}
      {runs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
          <Activity className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-800">
            No agent runs recorded yet
          </h3>
          <p className="mt-1">
            Click &quot;Run Adaptive Search&quot; above or trigger a scan on the Discover tab to inspect round-by-round search expansion here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => {
            const isExpanded = expandedRunId === run.id;
            const isCompleted = run.status === "COMPLETED";

            return (
              <div
                key={run.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all"
              >
                {/* Run Card Header */}
                <div
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className="flex cursor-pointer items-center justify-between p-5 hover:bg-slate-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <Terminal className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {run.id}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                          {run.trigger}
                        </span>
                        {run.mode && (
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              run.mode === "DEMO"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-sky-100 text-sky-900"
                            }`}
                          >
                            {run.mode} MODE
                          </span>
                        )}
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {run.status}
                        </span>
                        {run.stopReason && (
                          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                            Stop: {run.stopReason}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {run.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:block text-right text-xs text-slate-400">
                      <div>
                        Started: {new Date(run.startedAt).toLocaleTimeString()}
                      </div>
                      <div>
                        {run.rounds?.length
                          ? `${run.rounds.length} adaptive rounds · Budget ${run.budgetUsed ?? 0}/${run.budgetLimit ?? 12}`
                          : `${run.steps.length} tool steps executed`}
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-6">
                    {/* Coverage Statement Banner */}
                    {run.coverageSummary && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold flex items-center space-x-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-700" />
                            <span>Verified Search Coverage & Deduplication Summary</span>
                          </span>
                          <span className="font-mono text-[11px] font-semibold">
                            Raw: {run.coverageSummary.totalRawFound} → Unique:{" "}
                            {run.coverageSummary.totalUniqueEvaluated} (-
                            {run.coverageSummary.duplicatesRemoved} duplicates) |
                            Eligible: {run.coverageSummary.eligibleCount}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-emerald-900">
                          {run.coverageSummary.coverageStatement}
                        </p>
                      </div>
                    )}

                    {/* Round-by-Round Adaptive Metrics */}
                    {run.rounds && run.rounds.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Adaptive Search Loop Rounds ({run.rounds.length} Rounds)
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {run.rounds.map((r) => (
                            <div
                              key={r.roundId}
                              className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-serif font-bold text-slate-900 text-sm">
                                  Round {r.roundNumber}
                                </span>
                                <span className="font-mono text-[11px] text-[#064e3b] font-semibold">
                                  +{r.marginalNewUniqueOpportunities} new unique (Yield:{" "}
                                  {Math.round(r.marginalYieldRate * 100)}%)
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                  Queries Planned:
                                </span>
                                <ul className="mt-1 space-y-1 font-mono text-[11px] text-slate-700">
                                  {r.queriesPlanned.map((q, idx) => (
                                    <li
                                      key={idx}
                                      className="rounded bg-slate-50 px-2 py-1 truncate"
                                    >
                                      {q}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-lg p-2">
                                <div>
                                  <div className="text-[10px] text-slate-400">
                                    Raw / Unique
                                  </div>
                                  <div className="font-bold text-slate-800">
                                    {r.totalRawResults} / {r.uniqueNormalizedResults}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-400">
                                    Apply / Prep
                                  </div>
                                  <div className="font-bold text-emerald-700">
                                    {r.applyNowCount} / {r.prepareFirstCount}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-400">
                                    Dup Rate
                                  </div>
                                  <div className="font-bold text-slate-800">
                                    {Math.round(r.duplicateRate * 100)}%
                                  </div>
                                </div>
                              </div>

                              {r.diagnosticCasesTriggered.length > 0 && (
                                <div className="rounded bg-amber-50/80 border border-amber-200/80 p-2 text-[11px] text-amber-900">
                                  <div className="font-bold flex items-center space-x-1">
                                    <Sparkles className="h-3 w-3" />
                                    <span>
                                      Adaptive Expansion Triggers:{" "}
                                      {r.diagnosticCasesTriggered.join(", ")}
                                    </span>
                                  </div>
                                  {r.expansionDecisions.map((dec, idx) => (
                                    <p key={idx} className="mt-0.5 text-[10px]">
                                      • {dec}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Execution Step Timeline */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                        Execution Step Timeline ({run.steps.length} Steps)
                      </h3>

                      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                        {run.steps.map((step) => {
                          const isSuccess = step.status === "SUCCESS";
                          return (
                            <div key={step.id} className="relative pl-6">
                              <span
                                className={`absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                                  isSuccess ? "bg-[#064e3b]" : "bg-amber-600"
                                }`}
                              >
                                {step.stepNumber}
                              </span>

                              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs font-bold text-[#064e3b]">
                                      {step.toolName}()
                                    </span>
                                    <span
                                      className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                        isSuccess
                                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                          : "bg-amber-50 text-amber-800 border border-amber-200"
                                      }`}
                                    >
                                      {step.status}
                                    </span>
                                  </div>

                                  <span className="font-mono text-[10px] text-slate-400">
                                    {new Date(step.executedAt).toLocaleTimeString()}
                                  </span>
                                </div>

                                <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                  <div className="rounded bg-slate-50 p-2.5">
                                    <strong className="text-slate-500 block text-[10px] uppercase tracking-wider">
                                      Sanitized Inputs
                                    </strong>
                                    <p className="mt-0.5 text-slate-800 font-mono text-[11px] break-words">
                                      {step.inputSummary}
                                    </p>
                                  </div>

                                  <div className="rounded bg-slate-50 p-2.5">
                                    <strong className="text-slate-500 block text-[10px] uppercase tracking-wider">
                                      Tool Observation
                                    </strong>
                                    <p className="mt-0.5 text-slate-800 text-[11px] leading-relaxed">
                                      {step.outputSummary}
                                    </p>
                                  </div>
                                </div>

                                {step.sourceReferences.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px]">
                                    <span className="font-semibold text-slate-500">
                                      Cited URLs:
                                    </span>
                                    {step.sourceReferences.map((url, i) => (
                                      <span
                                        key={i}
                                        className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-600 truncate max-w-xs"
                                      >
                                        {url}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {step.errorDetails && (
                                  <div className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-800">
                                    <strong>Error details: </strong>
                                    {step.errorDetails}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
