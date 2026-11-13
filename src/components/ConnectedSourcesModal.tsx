"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Link2,
  ExternalLink,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Radio,
  Building2,
  Bookmark,
  Check,
} from "lucide-react";
import { Opportunity, EvaluationResult, UserProfile } from "@/types";

interface ConnectedSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  onSaveToTracker?: (opp: Opportunity) => void;
  onInspectOpportunity?: (opp: Opportunity, evalResult: EvaluationResult) => void;
}

interface SourceCardInfo {
  name: string;
  type: "API" | "DEEP_LINK_IMPORT" | "WEB";
  status: "ACTIVE" | "CONNECTED" | "RESTRICTED_BY_TERMS";
  description: string;
  badgeText: string;
  badgeColor: string;
  supportedCompanies?: string;
  searchUrlBuilder?: (query: string, location?: string) => string;
}

const SOURCES: SourceCardInfo[] = [
  {
    name: "Greenhouse",
    type: "API",
    status: "ACTIVE",
    description: "Direct real-time ingestion from public boards API.",
    badgeText: "Live Feed Active",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    supportedCompanies: "Groww, Rubrik, Anthropic, Databricks, Coinbase, Airbnb, Dropbox, Stripe, Figma, Vercel",
  },
  {
    name: "Lever",
    type: "API",
    status: "ACTIVE",
    description: "Direct real-time ingestion from public postings API.",
    badgeText: "Live Feed Active",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    supportedCompanies: "Weights & Biases, Spotify",
  },
  {
    name: "Ashby",
    type: "API",
    status: "ACTIVE",
    description: "Direct real-time ingestion from public job-board API.",
    badgeText: "Live Feed Active",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    supportedCompanies: "OpenAI, Cohere, Perplexity, Supabase, Linear, Modal",
  },
  {
    name: "Remotive, Arbeitnow & Himalayas",
    type: "API",
    status: "ACTIVE",
    description: "Real-time multi-platform public JSON job APIs for engineering, AI, and remote roles.",
    badgeText: "Multi-Platform Active",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    name: "FreeHire Open Index",
    type: "API",
    status: "ACTIVE",
    description: "Verified public tech, AI, and remote opportunities index.",
    badgeText: "Connected",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    name: "Tavily Web Search",
    type: "WEB",
    status: "CONNECTED",
    description: "Autonomous real-time web discovery across LinkedIn Jobs, Naukri, Indeed, Wellfound, and university portals.",
    badgeText: "Connected",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    name: "LinkedIn Jobs",
    type: "DEEP_LINK_IMPORT",
    status: "RESTRICTED_BY_TERMS",
    description:
      "Automated scraping restricted by LinkedIn Terms of Service & anti-bot protection. Use one-click search and paste posting links below.",
    badgeText: "Deep-Link & URL Import",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    searchUrlBuilder: (query, loc) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
        query
      )}${loc ? `&location=${encodeURIComponent(loc)}` : ""}&f_E=1%2C2`,
  },
  {
    name: "Indeed",
    type: "DEEP_LINK_IMPORT",
    status: "RESTRICTED_BY_TERMS",
    description:
      "Automated scraping gated by Cloudflare. Use pre-filtered search and paste posting links below.",
    badgeText: "Deep-Link & URL Import",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    searchUrlBuilder: (query, loc) =>
      `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}${
        loc ? `&l=${encodeURIComponent(loc)}` : ""
      }`,
  },
  {
    name: "Naukri",
    type: "DEEP_LINK_IMPORT",
    status: "RESTRICTED_BY_TERMS",
    description:
      "Direct automated scraping restricted. One-click deep search generates targeted queries for India tech opportunities.",
    badgeText: "Deep-Link & URL Import",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    searchUrlBuilder: (query, loc) =>
      `https://www.naukri.com/${encodeURIComponent(
        query.toLowerCase().replace(/\s+/g, "-")
      )}-jobs${loc ? `-in-${encodeURIComponent(loc.toLowerCase().replace(/\s+/g, "-"))}` : ""}`,
  },
  {
    name: "Internshala",
    type: "DEEP_LINK_IMPORT",
    status: "RESTRICTED_BY_TERMS",
    description:
      "One-click search for internships and student research roles. Paste direct links below for fit evaluation.",
    badgeText: "Deep-Link & URL Import",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    searchUrlBuilder: (query) =>
      `https://internshala.com/internships/keywords-${encodeURIComponent(
        query.toLowerCase().replace(/\s+/g, "-")
      )}/`,
  },
];

export function ConnectedSourcesModal({
  isOpen,
  onClose,
  userProfile,
  onSaveToTracker,
  onInspectOpportunity,
}: ConnectedSourcesModalProps) {
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    note?: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [tavilyConfigured, setTavilyConfigured] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setTavilyConfigured(Boolean(data?.providers?.search?.tavilyConfigured));
      })
      .catch(() => {
        setTavilyConfigured(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const dynamicSources = SOURCES.map((src) => {
    if (src.name === "Tavily Web Search") {
      return {
        ...src,
        status: tavilyConfigured ? ("CONNECTED" as const) : ("RESTRICTED_BY_TERMS" as const),
        badgeText: tavilyConfigured ? "Live API Active" : "API Key Not Configured",
        badgeColor: tavilyConfigured
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-slate-100 text-slate-600 border-slate-200",
      };
    }
    return src;
  });

  const defaultQuery =
    (userProfile?.targetRoles && userProfile.targetRoles[0]) ||
    "Software Engineer Intern";
  const defaultLocation =
    (userProfile?.preferredLocations && userProfile.preferredLocations[0]) ||
    userProfile?.location ||
    "";

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    setIsSaved(false);

    try {
      const res = await fetch("/api/opportunities/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || "Failed to import job posting from this URL.");
      } else {
        setImportResult({
          opportunity: data.opportunity,
          evaluation: data.evaluation,
          note: data.provenanceNote,
        });
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Network error during URL import."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveResult = () => {
    if (importResult && onSaveToTracker) {
      onSaveToTracker(importResult.opportunity);
      setIsSaved(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#FDF9F3] rounded-2xl border-2 border-[#080808] shadow-[6px_6px_0px_#080808] flex flex-col overflow-hidden text-[#080808]">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-[#080808] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center text-[#080808]">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#080808]">
                Connected Sources & Job URL Import
              </h2>
              <p className="text-xs text-[#777777]">
                Transparent source statuses, legal platform integration disclaimers, and universal URL ingestion.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-[#080808] p-2 text-[#080808] hover:bg-[#FEF189] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Universal URL Importer */}
          <section className="bg-white rounded-2xl border-2 border-[#080808] p-5 shadow-[4px_4px_0px_#080808]">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-5 w-5 text-[#080808]" />
              <h3 className="text-base font-extrabold text-[#080808]">
                Direct Job URL Ingestion & Candidate Analysis
              </h3>
            </div>
            <p className="text-xs text-[#777777] mb-4">
              Encountered a job link on LinkedIn, X, Slack, or a company site? Paste any URL below. Prospect fetches the posting safely, extracts requirements, neutralizes prompt injection, evaluates your fit, and builds your preparation plan.
            </p>

            <form onSubmit={handleImport} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                required
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://boards.greenhouse.io/... or https://www.linkedin.com/jobs/view/..."
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm text-[#080808] placeholder-[#777777] focus:outline-none focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={isImporting || !importUrl.trim()}
                className="px-5 py-2.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] text-[#080808] text-sm font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-[2px_2px_0px_#080808]"
              >
                {isImporting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[#080808]" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#080808]" />
                    <span>Import & Analyze</span>
                  </>
                )}
              </button>
            </form>

            {importError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border-2 border-[#080808] text-xs text-rose-900 flex items-start gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Ingestion Preview Card */}
            {importResult && (
              <div className="mt-4 p-4 rounded-xl bg-[#FDF9F3] border-2 border-[#080808] animate-in fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0FB66] text-[#080808] border border-[#080808]">
                        {importResult.opportunity.verificationStatus}
                      </span>
                      {importResult.note && (
                        <span className="text-[11px] text-[#777777]">
                          • {importResult.note}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-extrabold text-[#080808]">
                      {importResult.opportunity.title}
                    </h4>
                    <p className="text-xs text-[#080808] font-semibold flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {importResult.opportunity.organization} • {importResult.opportunity.location} ({importResult.opportunity.workMode})
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex flex-col items-end">
                      <span className="text-xs font-semibold text-[#777777]">Fit Score</span>
                      <span className="text-2xl font-extrabold text-[#080808]">
                        {Math.round(importResult.evaluation.overallScore)}%
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-[#E0FB66] border border-[#080808] text-[#080808] mt-1">
                        {importResult.evaluation.recommendation.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#080808]/85 line-clamp-2">
                  {importResult.opportunity.description}
                </p>

                {importResult.opportunity.requiredSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {importResult.opportunity.requiredSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#080808] text-[11px] text-[#080808] font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-[#D8D5CE] flex items-center justify-between gap-2">
                  <span className="text-xs text-[#777777]">
                    {importResult.evaluation.rationale}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {onInspectOpportunity && (
                      <button
                        onClick={() =>
                          onInspectOpportunity(
                            importResult.opportunity,
                            importResult.evaluation
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs font-bold text-[#080808] hover:bg-[#FEF189] transition-colors"
                      >
                        Inspect Details
                      </button>
                    )}
                    <button
                      onClick={handleSaveResult}
                      disabled={isSaved}
                      className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#080808] text-white text-xs font-bold hover:bg-[#080808]/90 transition-colors disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#E0FB66]" />
                          <span>Saved to Tracker</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3.5 w-3.5 text-[#E0FB66]" />
                          <span>Save to Tracker</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: One-Click Deep-Search Portals */}
          <section className="bg-white rounded-2xl border-2 border-[#080808] p-5 shadow-[4px_4px_0px_#080808]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-[#080808]" />
                <h3 className="text-base font-extrabold text-[#080808]">
                  One-Click Pre-Filtered Deep Search
                </h3>
              </div>
              <span className="text-[11px] text-[#777777]">
                Target: <strong className="text-[#080808]">{defaultQuery}</strong>
              </span>
            </div>
            <p className="text-xs text-[#777777] mb-4">
              Direct automated scraping on these platforms is restricted by terms or anti-bot gates. Click any button below to launch a targeted search with your profile preferences, then paste the job URL into the tool above.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {SOURCES.filter((s) => s.searchUrlBuilder).map((s) => {
                const searchUrl = s.searchUrlBuilder!(defaultQuery, defaultLocation);
                return (
                  <a
                    key={s.name}
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] hover:bg-[#E0FB66]/45 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-xs text-[#080808]">
                          {s.name}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-[#777777] group-hover:text-[#080808] transition-colors" />
                      </div>
                      <p className="text-[11px] text-[#777777] line-clamp-2">
                        {s.description}
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-bold text-[#080808] flex items-center gap-1">
                      Search on {s.name} <ArrowRight className="h-3 w-3" />
                    </span>
                  </a>
                );
              })}
            </div>
          </section>

          {/* Section 3: Source Status & Infrastructure Grid */}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#080808]">
              Ingestion Providers & Architecture Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicSources.map((s) => (
                <div
                  key={s.name}
                  className="p-4 rounded-xl bg-white border-2 border-[#080808] shadow-[3px_3px_0px_#080808] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#080808]">
                        {s.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#080808] ${s.badgeColor}`}
                      >
                        {s.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-[#777777]">{s.description}</p>
                    {s.supportedCompanies && (
                      <p className="text-[11px] text-[#080808] font-semibold pt-1">
                        Supported: {s.supportedCompanies}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-[#080808] bg-white flex items-center justify-between text-xs text-[#777777]">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#080808]" />
            <span>
              All incoming postings are guarded against prompt injection and malicious payloads.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] font-bold hover:bg-[#FEF189] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
