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
    <div className="space-y-6 text-[#111111]">
      {/* Header & Mode Switcher */}
      <div className="bg-white border border-[#E9E6DF] rounded-[22px] shadow-[0_8px_28px_rgba(17,17,17,0.04)] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">
            Search Intelligence & Adaptive Loop Trace
          </h1>
          <p className="mt-1 text-xs text-[#777777]">
            Capability extraction, role-family expansion, multi-source provider status, round-by-round adaptive search metrics, and tool trace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D7ED93] bg-[#F1FFC7] px-3.5 py-1.5 text-xs font-semibold text-[#111111]">
            <span className="h-2 w-2 rounded-full bg-[#70B93F] animate-pulse" />
            <span>LIVE Mode (Public APIs)</span>
          </div>

          <button
            onClick={handleRunAdaptiveLoop}
            disabled={runningAdaptive}
            className="rounded-full bg-[#111111] text-white font-semibold shadow-[0_6px_18px_rgba(17,17,17,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all inline-flex items-center space-x-1.5 px-4 py-2 text-xs disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-[#DFFF43]" />
            <span>
              {runningAdaptive ? "Running Adaptive Loop..." : "Run Adaptive Search (LIVE)"}
            </span>
          </button>

          <button
            onClick={() => {
              loadIntelligenceState(mode);
              onRefresh();
            }}
            className="rounded-full bg-white text-[#111111] border border-[#E9E6DF] shadow-[0_2px_10px_rgba(17,17,17,0.04)] hover:bg-[#FDFBF8] font-medium transition inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Section 0: Interactive ML / RAG Pipeline Walkthrough (Presentation View) */}
      <div className="bg-[#FDFBF8] border border-[#E9E6DF] rounded-[22px] shadow-[0_8px_28px_rgba(17,17,17,0.04)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D7CCF5] bg-[#EAE3FF] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3B1D8E]">
              <Sparkles className="h-3 w-3" />
              <span>END-TO-END ML & RAG ARCHITECTURE WALKTHROUGH</span>
            </div>
            <h2 className="mt-1.5 text-base sm:text-lg font-extrabold text-[#111111]">
              How Prospect Computes Matches in 6 Deterministic + AI Stages
            </h2>
          </div>
          <span className="rounded-full border border-[#E9E6DF] bg-white px-3 py-1 text-[11px] font-medium text-[#777777]">
            Click any stage to inspect math & modules
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {mlPipelineStages.map((stage, idx) => {
            const active = selectedArchitectureStage === idx;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setSelectedArchitectureStage(idx)}
                className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                  active
                    ? "bg-[#DFFF43] border-[#B8E135] shadow-[0_4px_14px_rgba(223,255,67,0.30)] -translate-y-0.5"
                    : "bg-white border-[#E9E6DF] hover:bg-[#F1FFC7]/45 hover:border-[#D7ED93]"
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
                  STAGE {stage.step}
                </div>
                <div className="mt-0.5 text-xs font-bold text-[#111111] leading-snug">
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>

        {mlPipelineStages[selectedArchitectureStage] && (
          <div className="rounded-[20px] border border-[#E9E6DF] bg-white p-4 sm:p-5 space-y-2.5 shadow-[0_4px_16px_rgba(17,17,17,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#111111]">
                Stage {mlPipelineStages[selectedArchitectureStage].step}:{" "}
                {mlPipelineStages[selectedArchitectureStage].title}
              </span>
              <span className="rounded-full border border-[#D7CCF5] bg-[#EAE3FF] px-3 py-0.5 text-[11px] font-semibold text-[#3B1D8E]">
                {mlPipelineStages[selectedArchitectureStage].liveMetric}
              </span>
            </div>
            <div className="rounded-xl bg-[#FDFBF8] border border-[#E9E6DF] px-3 py-2 font-mono text-[11px] text-[#111111]">
              {mlPipelineStages[selectedArchitectureStage].formula}
            </div>
            <p className="text-xs text-[#777777] leading-relaxed">
              {mlPipelineStages[selectedArchitectureStage].detail}
            </p>
            <div className="text-[11px] font-medium text-[#777777]">
              Implementation: {mlPipelineStages[selectedArchitectureStage].module}
            </div>
          </div>
        )}
      </div>

      {/* Section 1: Candidate Capability Intelligence & Role Expansion */}
      {capabilityMap && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Capability Map Card */}
          <div className="bg-white border border-[#E9E6DF] rounded-[22px] shadow-[0_8px_28px_rgba(17,17,17,0.04)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-[#70B93F]" />
                <h2 className="text-sm font-bold text-[#111111]">
                  Candidate Capability Extraction
                </h2>
              </div>
              <span className="rounded-full border border-[#D7ED93] bg-[#F1FFC7] px-2.5 py-0.5 text-[10px] font-semibold text-[#111111]">
                {capabilityMap.demonstratedCapabilities.length} Direct ·{" "}
                {capabilityMap.inferredAdjacentCapabilities.length} Adjacent
              </span>
            </div>

            <p className="text-xs text-[#777777] leading-relaxed">
              {capabilityMap.summary}
            </p>

            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Demonstrated Capabilities & Provenance
              </h3>
              {capabilityMap.demonstratedCapabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] p-3.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-semibold text-[#111111]">
                      {cap.capability}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="rounded-full bg-white border border-[#E9E6DF] px-2 py-0.5 text-[10px] font-mono text-[#777777]">
                        {cap.provenance}
                      </span>
                      <span className="rounded-full bg-[#DFFF43] border border-[#C7E938] px-2 py-0.5 text-[10px] font-semibold text-[#111111]">
                        {cap.evidenceStrength}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#777777]">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>

            {capabilityMap.missingDetailsPrompts.length > 0 && (
              <div className="rounded-2xl border border-[#F5DFA0] bg-[#FEF9E7] p-3.5 text-xs text-[#111111]">
                <div className="font-bold text-[#111111] flex items-center space-x-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#9A7400]" />
                  <span>Profile Details Awaiting Confirmation</span>
                </div>
                <ul className="mt-1.5 list-disc list-inside space-y-1 text-[11px] text-[#423A20]">
                  {capabilityMap.missingDetailsPrompts.map((p, idx) => (
                    <li key={idx}>
                      <strong className="text-[#111111]">{p.field}:</strong> {p.question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Role Expansion Families Card */}
          <div className="bg-white border border-[#E9E6DF] rounded-[22px] shadow-[0_8px_28px_rgba(17,17,17,0.04)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-[#70B93F]" />
                <h2 className="text-sm font-bold text-[#111111]">
                  Capability-Based Role Families (/expand)
                </h2>
              </div>
              {personalization &&
                (personalization.excludedRoleFamilies.length > 0 ||
                  personalization.hiddenEmployers.length > 0 ||
                  personalization.totalSignalsRecorded > 0) && (
                  <button
                    onClick={handleResetPersonalization}
                    className="inline-flex items-center space-x-1 rounded-full border border-[#E9E6DF] bg-[#FDFBF8] px-3 py-1 text-[11px] font-semibold text-[#111111] hover:bg-[#F1FFC7] hover:border-[#D7ED93] transition cursor-pointer"
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
                  className={`rounded-2xl border p-3.5 text-xs transition-all ${
                    role.excludedByUser
                      ? "bg-[#F4F2EC] border-[#E9E6DF] opacity-60"
                      : "bg-[#FDFBF8] border-[#E9E6DF]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-[#111111]">
                          {role.title}
                        </span>
                        <span className="rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-2 py-0.5 text-[10px] font-semibold text-[#111111]">
                          {role.roleFamily}
                        </span>
                        <span className="text-[10px] font-mono text-[#777777]">
                          Est. Fit: {role.relevanceEstimate}% (Conf: {Math.round(role.confidence * 100)}%)
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#777777]">
                        {role.expansionRationale}
                      </p>
                      {role.missingSkills.length > 0 && (
                        <p className="mt-1 text-[10px] text-[#856404]">
                          <strong>Missing skills:</strong> {role.missingSkills.join(", ")}
                        </p>
                      )}
                    </div>

                    {!role.excludedByUser ? (
                      <button
                        onClick={() => handleDismissRoleFamily(role.title)}
                        title="Exclude this role family from future adaptive search plans"
                        className="rounded-full border border-[#E9E6DF] bg-white px-2.5 py-1 text-[10px] font-medium text-[#777777] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 shrink-0 transition cursor-pointer"
                      >
                        Exclude
                      </button>
                    ) : (
                      <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-800 shrink-0">
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
        <div className="rounded-[22px] border border-[#E9E6DF] bg-white p-5 sm:p-6 shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
          <div className="flex items-center space-x-2 mb-3.5">
            <Compass className="h-4 w-4 text-[#70B93F]" />
            <h2 className="text-sm font-bold text-[#111111]">
              Multi-Source Provider Status ({mode} Mode)
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] p-3.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-[#111111]">
                    {p.id}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                      p.enabled
                        ? "bg-[#F1FFC7] border-[#D7ED93] text-[#111111]"
                        : "bg-white border-[#E9E6DF] text-[#777777]"
                    }`}
                  >
                    {p.enabled ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>
                <div className="mt-1.5 font-semibold text-[#111111]">
                  {p.displayName}
                </div>
                <p className="mt-1 text-[11px] text-[#777777] leading-relaxed">
                  {p.scopeNote}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Adaptive Search Runs & Round-by-Round Metrics */}
      {runs.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#E9E6DF] bg-white p-12 text-center text-xs text-[#777777] shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
          <Activity className="mx-auto h-8 w-8 text-[#777777]" />
          <h3 className="mt-2.5 text-sm font-bold text-[#111111]">
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
                className="overflow-hidden rounded-[22px] border border-[#E9E6DF] bg-white shadow-[0_8px_28px_rgba(17,17,17,0.04)] transition-all"
              >
                {/* Run Card Header */}
                <div
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className="flex cursor-pointer items-center justify-between p-5 hover:bg-[#FDFBF8] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        isCompleted
                          ? "bg-[#F1FFC7] border-[#D7ED93] text-[#111111]"
                          : "bg-[#FEF9E7] border-[#F5DFA0] text-[#856404]"
                      }`}
                    >
                      <Terminal className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#111111]">
                          {run.id}
                        </span>
                        <span className="rounded-full border border-[#E9E6DF] bg-[#FDFBF8] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#111111]">
                          {run.trigger}
                        </span>
                        {run.mode && (
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                              run.mode === "DEMO"
                                ? "bg-[#FEF9E7] border-[#F5DFA0] text-[#856404]"
                                : "bg-[#EAE3FF] border-[#D7CCF5] text-[#3B1D8E]"
                            }`}
                          >
                            {run.mode} MODE
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                            isCompleted
                              ? "bg-[#DFFF43] border-[#C7E938] text-[#111111]"
                              : "bg-[#FEF9E7] border-[#F5DFA0] text-[#856404]"
                          }`}
                        >
                          {run.status}
                        </span>
                        {run.stopReason && (
                          <span className="rounded-full border border-[#E9E6DF] bg-[#FDFBF8] px-2.5 py-0.5 font-mono text-[10px] text-[#777777]">
                            Stop: {run.stopReason}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#777777] line-clamp-2">
                        {run.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:block text-right text-xs text-[#777777]">
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
                      <ChevronDown className="h-5 w-5 text-[#777777]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#777777]" />
                    )}
                  </div>
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                  <div className="border-t border-[#E9E6DF] bg-[#FDFBF8] p-5 space-y-6">
                    {/* Coverage Statement Banner */}
                    {run.coverageSummary && (
                      <div className="rounded-2xl border border-[#D7ED93] bg-[#F1FFC7]/75 p-4 text-xs text-[#111111] space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold flex items-center space-x-1.5">
                            <ShieldCheck className="h-4 w-4 text-[#70B93F]" />
                            <span>Verified Search Coverage & Deduplication Summary</span>
                          </span>
                          <span className="font-mono text-[11px] font-semibold">
                            Raw: {run.coverageSummary.totalRawFound} → Unique:{" "}
                            {run.coverageSummary.totalUniqueEvaluated} (-
                            {run.coverageSummary.duplicatesRemoved} duplicates) |
                            Eligible: {run.coverageSummary.eligibleCount}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#4B5563]">
                          {run.coverageSummary.coverageStatement}
                        </p>
                      </div>
                    )}

                    {/* Round-by-Round Adaptive Metrics */}
                    {run.rounds && run.rounds.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#777777] mb-3">
                          Adaptive Search Loop Rounds ({run.rounds.length} Rounds)
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {run.rounds.map((r) => (
                            <div
                              key={r.roundId}
                              className="rounded-2xl border border-[#E9E6DF] bg-white p-4 text-xs space-y-2.5 shadow-[0_4px_16px_rgba(17,17,17,0.03)]"
                            >
                              <div className="flex items-center justify-between border-b border-[#E9E6DF] pb-2">
                                <span className="font-bold text-[#111111] text-sm">
                                  Round {r.roundNumber}
                                </span>
                                <span className="font-mono text-[11px] text-[#70B93F] font-semibold">
                                  +{r.marginalNewUniqueOpportunities} new unique (Yield:{" "}
                                  {Math.round(r.marginalYieldRate * 100)}%)
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase text-[#777777]">
                                  Queries Planned:
                                </span>
                                <ul className="mt-1 space-y-1 font-mono text-[11px] text-[#111111]">
                                  {r.queriesPlanned.map((q, idx) => (
                                    <li
                                      key={idx}
                                      className="rounded-lg bg-[#FDFBF8] border border-[#E9E6DF] px-2.5 py-1 truncate"
                                    >
                                      {q}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center bg-[#FDFBF8] border border-[#E9E6DF] rounded-xl p-2.5">
                                <div>
                                  <div className="text-[10px] text-[#777777]">
                                    Raw / Unique
                                  </div>
                                  <div className="font-bold text-[#111111]">
                                    {r.totalRawResults} / {r.uniqueNormalizedResults}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#777777]">
                                    Apply / Prep
                                  </div>
                                  <div className="font-bold text-[#70B93F]">
                                    {r.applyNowCount} / {r.prepareFirstCount}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#777777]">
                                    Dup Rate
                                  </div>
                                  <div className="font-bold text-[#111111]">
                                    {Math.round(r.duplicateRate * 100)}%
                                  </div>
                                </div>
                              </div>

                              {r.diagnosticCasesTriggered.length > 0 && (
                                <div className="rounded-xl bg-[#FEF9E7] border border-[#F5DFA0] p-2.5 text-[11px] text-[#423A20]">
                                  <div className="font-bold text-[#111111] flex items-center space-x-1">
                                    <Sparkles className="h-3 w-3 text-[#9A7400]" />
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
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#777777] mb-4">
                        Execution Step Timeline ({run.steps.length} Steps)
                      </h3>

                      <div className="relative border-l-2 border-[#E9E6DF] ml-4 space-y-6">
                        {run.steps.map((step) => {
                          const isSuccess = step.status === "SUCCESS";
                          return (
                            <div key={step.id} className="relative pl-6">
                              <span
                                className={`absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                                  isSuccess
                                    ? "bg-[#111111] text-[#DFFF43]"
                                    : "bg-[#FEF9E7] border border-[#F5DFA0] text-[#856404]"
                                }`}
                              >
                                {step.stepNumber}
                              </span>

                              <div className="rounded-2xl border border-[#E9E6DF] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.03)]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs font-bold text-[#111111]">
                                      {step.toolName}()
                                    </span>
                                    <span
                                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                        isSuccess
                                          ? "bg-[#F1FFC7] border-[#D7ED93] text-[#111111]"
                                          : "bg-[#FEF9E7] border-[#F5DFA0] text-[#856404]"
                                      }`}
                                    >
                                      {step.status}
                                    </span>
                                  </div>

                                  <span className="font-mono text-[10px] text-[#777777]">
                                    {new Date(step.executedAt).toLocaleTimeString()}
                                  </span>
                                </div>

                                <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                  <div className="rounded-xl bg-[#FDFBF8] border border-[#E9E6DF] p-2.5">
                                    <strong className="text-[#777777] block text-[10px] uppercase tracking-wider">
                                      Sanitized Inputs
                                    </strong>
                                    <p className="mt-0.5 text-[#111111] font-mono text-[11px] break-words">
                                      {step.inputSummary}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-[#FDFBF8] border border-[#E9E6DF] p-2.5">
                                    <strong className="text-[#777777] block text-[10px] uppercase tracking-wider">
                                      Tool Observation
                                    </strong>
                                    <p className="mt-0.5 text-[#111111] text-[11px] leading-relaxed">
                                      {step.outputSummary}
                                    </p>
                                  </div>
                                </div>

                                {step.sourceReferences.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[#E9E6DF] pt-2 text-[11px]">
                                    <span className="font-semibold text-[#777777]">
                                      Cited URLs:
                                    </span>
                                    {step.sourceReferences.map((url, i) => (
                                      <span
                                        key={i}
                                        className="rounded-full bg-[#FDFBF8] border border-[#E9E6DF] px-2.5 py-0.5 font-mono text-[#777777] truncate max-w-xs"
                                      >
                                        {url}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {step.errorDetails && (
                                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
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
