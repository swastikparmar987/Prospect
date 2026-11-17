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
    badgeColor: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    supportedCompanies: "Groww, Rubrik, Anthropic, Databricks, Coinbase, Airbnb, Dropbox, Stripe, Figma, Vercel",
  },
  {
    name: "Lever",
    type: "API",
    status: "ACTIVE",
    description: "Direct real-time ingestion from public postings API.",
    badgeText: "Live Feed Active",
    badgeColor: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    supportedCompanies: "Weights & Biases, Spotify",
  },
  {
    name: "Ashby",
    type: "API",
    status: "ACTIVE",
    description: "Direct real-time ingestion from public job-board API.",
    badgeText: "Live Feed Active",
    badgeColor: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    supportedCompanies: "OpenAI, Cohere, Perplexity, Supabase, Linear, Modal",
  },
  {
    name: "Remotive, Arbeitnow & Himalayas",
    type: "API",
    status: "ACTIVE",
    description: "Real-time multi-platform public JSON job APIs for engineering, AI, and remote roles.",
    badgeText: "Multi-Platform Active",
    badgeColor: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
  },
  {
    name: "FreeHire Open Index",
    type: "API",
    status: "ACTIVE",
    description: "Verified public tech, AI, and remote opportunities index.",
    badgeText: "Connected",
    badgeColor: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
  },
  {
    name: "Tavily Web Search",
    type: "WEB",
    status: "CONNECTED",
    description: "Autonomous real-time web discovery across LinkedIn Jobs, Naukri, Indeed, Wellfound, and university portals.",
    badgeText: "Connected",
    badgeColor: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
  },
  {
    name: "LinkedIn Jobs",
    type: "DEEP_LINK_IMPORT",
    status: "RESTRICTED_BY_TERMS",
    description:
      "Automated scraping restricted by LinkedIn Terms of Service & anti-bot protection. Use one-click search and paste posting links below.",
    badgeText: "Deep-Link & URL Import",
    badgeColor: "bg-[#FEF9E7] text-[#92400E] border-[#F5DFA0]",
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
    badgeColor: "bg-[#FEF9E7] text-[#92400E] border-[#F5DFA0]",
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
    badgeColor: "bg-[#FEF9E7] text-[#92400E] border-[#F5DFA0]",
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
    badgeColor: "bg-[#FEF9E7] text-[#92400E] border-[#F5DFA0]",
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
          ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
          : "bg-[#F4F5F0] text-[#4B5563] border-black/[0.08]",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1113]/55 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#F7F7F3] rounded-[26px] border border-black/[0.08] shadow-[0_24px_60px_rgba(15,23,42,0.16)] flex flex-col overflow-hidden text-[#101214]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4] border border-[#C7E938]/60 flex items-center justify-center text-[#101214] shadow-[0_2px_10px_rgba(205,238,54,0.22)]">
              <Radio className="h-5 w-5 text-[#4D7C0F] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold tracking-tight text-[#101214]">
                  Opportunity Sources &amp; Ingestion Hub
                </h2>
                <span className="hidden sm:inline-flex items-center rounded-full bg-[#E3FC6D] border border-[#C6E832] px-2.5 py-0.5 text-[10px] font-semibold text-[#0E1012]">
                  Live Hub
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Inspect verified employer boards, integration statuses, and ingest direct job posting URLs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full border border-black/[0.08] bg-[#F7F7F3] p-2 text-[#4B5563] hover:bg-[#EAECE4] hover:text-[#101214] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Universal URL Importer */}
          <section className="bg-white rounded-[22px] border border-black/[0.07] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-8 w-8 rounded-xl bg-[#F4F5F0] border border-black/[0.06] flex items-center justify-center text-[#101214]">
                <Link2 className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#101214]">
                Direct Job URL Ingestion &amp; Candidate Analysis
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">
              Encountered a job link on LinkedIn, X, Slack, or a company site? Paste any URL below. Prospect fetches the posting safely, extracts requirements, neutralizes prompt injection, evaluates your fit, and builds your preparation plan.
            </p>

            <form onSubmit={handleImport} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                required
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://boards.greenhouse.io/... or https://www.linkedin.com/jobs/view/..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-black/[0.10] bg-[#FAFBF7] text-sm text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isImporting || !importUrl.trim()}
                className="px-5 py-2.5 rounded-full bg-[#101214] text-white text-xs sm:text-sm font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[#E3FC6D]" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#E3FC6D]" />
                    <span>Import &amp; Analyze</span>
                  </>
                )}
              </button>
            </form>

            {importError && (
              <div className="mt-3 p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#9F1239] flex items-start gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-[#E11D48] shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Ingestion Preview Card */}
            {importResult && (
              <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#F3FCDA]/70 to-[#FAFBF7] border border-[#C7E938]/55 animate-in fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832]">
                        {importResult.opportunity.verificationStatus}
                      </span>
                      {importResult.note && (
                        <span className="text-[11px] text-[#6B7280]">
                          • {importResult.note}
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading text-lg font-bold text-[#101214]">
                      {importResult.opportunity.title}
                    </h4>
                    <p className="text-xs text-[#4B5563] font-medium flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#101214]" />
                      {importResult.opportunity.organization} • {importResult.opportunity.location} ({importResult.opportunity.workMode})
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex flex-col items-end">
                      <span className="text-[11px] font-medium text-[#6B7280]">Fit Score</span>
                      <span className="font-heading text-2xl font-bold text-[#101214]">
                        {Math.round(importResult.evaluation.overallScore)}%
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#E3FC6D] border border-[#C6E832] text-[#0E1012] mt-1">
                        {importResult.evaluation.recommendation.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                  {importResult.opportunity.description}
                </p>

                {importResult.opportunity.requiredSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {importResult.opportunity.requiredSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-0.5 rounded-full bg-white border border-black/[0.08] text-[11px] text-[#101214] font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#6B7280]">
                    {importResult.evaluation.rationale}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {onInspectOpportunity && (
                      <button
                        type="button"
                        onClick={() =>
                          onInspectOpportunity(
                            importResult.opportunity,
                            importResult.evaluation
                          )
                        }
                        className="px-3.5 py-1.5 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] text-xs font-semibold transition-all cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveResult}
                      disabled={isSaved}
                      className="px-4 py-1.5 rounded-full bg-[#101214] text-white text-xs font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#E3FC6D]" />
                          <span>Saved to Tracker</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3.5 w-3.5 text-[#E3FC6D]" />
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
          <section className="bg-white rounded-[22px] border border-black/[0.07] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#F4F5F0] border border-black/[0.06] flex items-center justify-center text-[#101214]">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-[#101214]">
                  One-Click Pre-Filtered Deep Search
                </h3>
              </div>
              <span className="text-[11px] text-[#6B7280] bg-[#F4F5F0] border border-black/[0.06] rounded-full px-3 py-1">
                Target: <strong className="text-[#101214]">{defaultQuery}</strong>
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">
              Direct automated scraping on these platforms is restricted by terms or anti-bot gates. Click any card below to launch a targeted search with your profile preferences, then paste the job URL above.
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
                    className="p-3.5 rounded-2xl border border-black/[0.07] bg-[#FAFBF7] hover:bg-gradient-to-br hover:from-[#F3FCDA]/80 hover:to-white hover:border-[#C7E938]/60 hover:shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-heading font-bold text-xs text-[#101214]">
                          {s.name}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-[#6B7280] group-hover:text-[#101214] transition-colors" />
                      </div>
                      <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                    <span className="mt-3 text-[11px] font-semibold text-[#101214] flex items-center gap-1">
                      Search on {s.name} <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </a>
                );
              })}
            </div>
          </section>

          {/* Section 3: Source Status & Infrastructure Grid */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-heading font-bold uppercase tracking-[0.12em] text-[#6B7280] px-1">
              Ingestion Providers &amp; Board Statuses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicSources.map((s) => (
                <div
                  key={s.name}
                  className="p-4 rounded-[20px] bg-white border border-black/[0.07] shadow-[0_4px_18px_rgba(15,23,42,0.035)] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-sm text-[#101214]">
                        {s.name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s.badgeColor}`}
                      >
                        {s.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{s.description}</p>
                    {s.supportedCompanies && (
                      <p className="text-[11px] text-[#4B5563] font-medium pt-0.5">
                        Supported: <span className="text-[#101214]">{s.supportedCompanies}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.06] bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#4D7C0F] shrink-0" />
            <span>
              All incoming postings are guarded against prompt injection and malicious payloads.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
