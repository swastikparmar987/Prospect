"use client";

import React, { useState } from "react";
import {
  EvaluationResult,
  Opportunity,
  ProjectEvaluationResult,
  UserProfile,
} from "@/types";
import {
  CheckCircle2,
  Clipboard,
  Code2,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Layers,
  Loader2,
  PlusCircle,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { CompanyLogo } from "../CompanyLogo";

interface ProjectEvaluatorViewProps {
  profile: UserProfile | null;
  onInspectOpportunity: (
    opp: Opportunity,
    evalResult: EvaluationResult,
    initialTab?: "overview" | "why" | "prep_plan"
  ) => void;
  onProjectAddedToProfile: () => void;
  onShowToast: (msg: string) => void;
}

export function ProjectEvaluatorView({
  profile,
  onInspectOpportunity,
  onProjectAddedToProfile,
  onShowToast,
}: ProjectEvaluatorViewProps) {
  const [title, setTitle] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [targetRole, setTargetRole] = useState(
    profile?.targetRoles?.[0] || "Machine Learning Engineer"
  );
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const [evaluating, setEvaluating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectEvaluationResult | null>(null);
  const [addedFlag, setAddedFlag] = useState(false);

  const parsedTechStack = techStackInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const runEvaluation = async (addToProfile = false) => {
    if (!title.trim() || description.trim().length < 10) {
      setError("Please enter a project title and at least 10 characters describing what you built.");
      return;
    }

    setError(null);
    if (addToProfile) setAdding(true);
    else setEvaluating(true);

    try {
      const res = await fetch("/api/projects/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          techStack: parsedTechStack,
          repoUrl: repoUrl.trim() || undefined,
          liveUrl: liveUrl.trim() || undefined,
          targetRole: targetRole.trim() || undefined,
          addToProfile,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to evaluate project.");
      } else {
        setResult(data.evaluation);
        if (addToProfile && data.addedToProfile) {
          setAddedFlag(true);
          onProjectAddedToProfile();
          onShowToast(
            `Added "${title.trim()}" to your profile and synced Discover job matches.`
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error evaluating project."
      );
    } finally {
      setEvaluating(false);
      setAdding(false);
    }
  };

  const handleLoadSampleProject = () => {
    setTitle("Hybrid RAG Multi-Source Career Discovery Engine");
    setTechStackInput(
      "Python, TypeScript, Next.js, PyTorch, Embeddings, BM25, SQLite, Prisma, SSE"
    );
    setTargetRole(profile?.targetRoles?.[0] || "Machine Learning / AI Engineer");
    setDescription(
      "Built an end-to-end hybrid RAG pipeline combining 128-D L2-normalized semantic embeddings with BM25 lexical scoring, domain-mismatch classification, Haversine geospatial vicinity filtering, and Server-Sent Events (SSE) for real-time job ingestion across 20+ employer boards."
    );
    setRepoUrl("");
    setLiveUrl("");
    setAddedFlag(false);
  };

  const copyBullet = async (bullet: string) => {
    try {
      await navigator.clipboard.writeText(bullet);
      onShowToast("Resume bullet copied to clipboard.");
    } catch {
      onShowToast("Selected bullet ready to copy.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top Hero */}
      <section className="rounded-2xl border-2 border-[#080808] bg-[#EAE2FE] p-5 sm:p-6 shadow-[4px_4px_0px_#080808] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#080808] bg-white px-3 py-0.5 font-heading text-[11px] font-extrabold text-[#080808]">
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>AI PROJECT LAB & RESUME-WORTHINESS ANALYZER</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808] tracking-tight">
            Test any project before putting it on your resume.
          </h1>
          <p className="text-xs sm:text-sm text-[#080808]/80 max-w-3xl">
            Score technical depth, generate quantified ATS bullets, spot weaknesses, push strong projects straight to your live profile, and see which live jobs match it via 128-D RAG similarity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleProject}
          className="inline-flex items-center gap-2 self-start rounded-xl border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] px-4 py-2 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] cursor-pointer shrink-0"
        >
          <Wand2 className="h-4 w-4" />
          <span>Load Sample ML Project</span>
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Studio */}
        <section className="lg:col-span-5 rounded-2xl border-2 border-[#080808] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#080808] space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-[#080808] flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            <span>Project Details</span>
          </h2>

          <div className="space-y-3.5">
            <div>
              <label className="block font-heading text-xs font-bold text-[#080808] mb-1">
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setAddedFlag(false);
                }}
                placeholder="e.g., Real-Time Multimodal RAG Document Search"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3.5 py-2 text-sm text-[#080808] outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-heading text-xs font-bold text-[#080808] mb-1">
                Target Role for Evaluation
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Machine Learning Engineer / Backend SWE"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3.5 py-2 text-sm text-[#080808] outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-heading text-xs font-bold text-[#080808] mb-1">
                Tech Stack (comma-separated)
              </label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => {
                  setTechStackInput(e.target.value);
                  setAddedFlag(false);
                }}
                placeholder="e.g., Python, PyTorch, FastAPI, Docker, RAG"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3.5 py-2 text-sm text-[#080808] outline-none focus:bg-white"
              />
              {parsedTechStack.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parsedTechStack.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#080808] bg-[#E0FB66] px-2.5 py-0.5 text-[11px] font-bold text-[#080808]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block font-heading text-xs font-bold text-[#080808] mb-1">
                Architecture, Methods & Metrics *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setAddedFlag(false);
                }}
                placeholder="Describe what you engineered, algorithms/models used, benchmarks/accuracy/latency improvements, and deployment details..."
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3.5 py-2 text-sm text-[#080808] outline-none focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-heading text-xs font-bold text-[#080808] mb-1">
                  GitHub URL (Optional)
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-1.5 text-xs text-[#080808] outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-heading text-xs font-bold text-[#080808] mb-1">
                  Live Demo URL (Optional)
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://my-app.vercel.app"
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-1.5 text-xs text-[#080808] outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-[#080808] bg-[#FEF189] p-3 text-xs font-bold text-[#080808] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              disabled={evaluating || adding}
              onClick={() => runEvaluation(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#080808] bg-[#080808] hover:-translate-y-0.5 text-white px-4 py-2.5 font-heading text-xs sm:text-sm font-extrabold shadow-[3px_3px_0px_#E0FB66] transition cursor-pointer disabled:opacity-60"
            >
              {evaluating ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#E0FB66]" />
              ) : (
                <Sparkles className="h-4 w-4 text-[#E0FB66]" />
              )}
              <span>{evaluating ? "Analyzing..." : "Evaluate & Find Jobs"}</span>
            </button>

            <button
              type="button"
              disabled={evaluating || adding || addedFlag}
              onClick={() => runEvaluation(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] text-[#080808] px-4 py-2.5 font-heading text-xs sm:text-sm font-extrabold transition cursor-pointer disabled:opacity-60"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : addedFlag ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              <span>{addedFlag ? "Added to Profile" : "Add to Profile"}</span>
            </button>
          </div>

          {/* Existing Profile Projects Quick Re-Check */}
          {profile?.projects && profile.projects.length > 0 && (
            <div className="pt-3 border-t border-[#D8D5CE] space-y-2">
              <div className="font-heading text-xs font-extrabold uppercase tracking-wider text-[#777777]">
                Or audit a project already on your resume:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.projects.map((p) => (
                  <button
                    key={p.id || p.name}
                    type="button"
                    onClick={() => {
                      setTitle(p.name);
                      setDescription(p.description || "");
                      setTechStackInput((p.techStack || []).join(", "));
                      setRepoUrl(p.link || "");
                      setAddedFlag(true);
                    }}
                    className="rounded-full border border-[#080808] bg-[#FDF9F3] hover:bg-[#EAE2FE] px-3 py-1 text-[11px] font-bold text-[#080808] transition cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right: AI Critique + Resume Decision + Live Jobs Unlocked */}
        <section className="lg:col-span-7 space-y-5">
          {!result ? (
            <div className="rounded-2xl border-2 border-dashed border-[#080808]/40 bg-white p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66]">
                <Target className="h-6 w-6 text-[#080808]" />
              </div>
              <h3 className="font-heading text-lg font-extrabold text-[#080808]">
                Submit any class or hackathon project to analyze its impact
              </h3>
              <p className="text-xs sm:text-sm text-[#777777] max-w-md mx-auto">
                Prospect scores engineering rigor, warns you if a project looks like a generic tutorial, rewrites strong ATS resume bullets, and matches live open jobs aligned with that exact build.
              </p>
            </div>
          ) : (
            <>
              {/* Score & Verdict Card */}
              <div className="rounded-2xl border-2 border-[#080808] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#080808] space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border-2 border-[#080808] px-3 py-0.5 font-heading text-xs font-extrabold ${
                          result.shouldIncludeOnResume
                            ? "bg-[#E0FB66] text-[#080808]"
                            : "bg-[#FEF189] text-[#080808]"
                        }`}
                      >
                        {result.shouldIncludeOnResume
                          ? "RECOMMENDED FOR RESUME"
                          : "STRENGTHEN BEFORE RESUME"}
                      </span>
                      <span className="rounded-full border border-[#D8D5CE] bg-[#FDF9F3] px-2.5 py-0.5 text-[11px] font-semibold text-[#555555]">
                        Engine: {result.provider} ({result.model})
                      </span>
                    </div>
                    <h2 className="font-heading text-xl font-extrabold text-[#080808]">
                      {result.verdictLabel}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#080808]/80 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] px-5 py-3 shadow-[3px_3px_0px_#080808] shrink-0">
                    <span className="font-heading text-3xl font-extrabold text-[#080808] leading-none">
                      {result.overallScore}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#080808]">
                      / 100 Impact
                    </span>
                  </div>
                </div>

                {result.repoInspectNote && (
                  <div className="rounded-xl border border-[#080808] bg-[#FDF9F3] px-3.5 py-2 text-xs font-medium text-[#080808] flex items-center gap-2">
                    <GitBranch className="h-4 w-4 shrink-0" />
                    <span>{result.repoInspectNote}</span>
                  </div>
                )}

                {/* 5-Dimension Rubric Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D8D5CE]">
                  {[
                    {
                      label: "Technical Complexity",
                      val: result.dimensionScores.technicalComplexity,
                      max: 25,
                    },
                    {
                      label: "Target Role Relevance",
                      val: result.dimensionScores.roleRelevance,
                      max: 25,
                    },
                    {
                      label: "Production Engineering",
                      val: result.dimensionScores.engineeringProduction,
                      max: 20,
                    },
                    {
                      label: "Uniqueness vs Clones",
                      val: result.dimensionScores.differentiation,
                      max: 15,
                    },
                    {
                      label: "Quantified Proof",
                      val: result.dimensionScores.impactEvidence,
                      max: 15,
                    },
                  ].map((dim) => {
                    const pct = Math.round((dim.val / dim.max) * 100);
                    return (
                      <div key={dim.label} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#080808]">
                          <span>{dim.label}</span>
                          <span>
                            {dim.val}/{dim.max}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full border border-[#080808] bg-[#FDF9F3] overflow-hidden">
                          <div
                            className="h-full bg-[#E0FB66]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths, Weaknesses & ATS Resume Bullets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-[#080808] bg-white p-4 shadow-[3px_3px_0px_#080808] space-y-2.5">
                  <h3 className="font-heading text-sm font-extrabold text-[#080808] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#080808]" />
                    <span>Strengths & Upgrades</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[#080808]">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#080808] shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-[#D8D5CE]">
                    <div className="font-heading text-[11px] font-extrabold uppercase text-[#777777] mb-1">
                      How to level this up:
                    </div>
                    <ul className="space-y-1 text-xs text-[#080808]/85">
                      {result.upgradeSteps.map((u, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 shadow-[3px_3px_0px_#080808] space-y-2.5">
                  <h3 className="font-heading text-sm font-extrabold text-[#080808] flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#080808]" />
                    <span>ATS-Ready Resume Bullets</span>
                  </h3>
                  <div className="space-y-2">
                    {result.recommendedResumeBullets.map((b, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-[#080808] bg-white p-2.5 text-xs text-[#080808] flex items-start justify-between gap-2"
                      >
                        <span className="leading-relaxed">• {b}</span>
                        <button
                          type="button"
                          onClick={() => copyBullet(b)}
                          title="Copy bullet"
                          className="shrink-0 rounded-lg border border-[#D8D5CE] hover:border-[#080808] hover:bg-[#E0FB66] p-1 text-[#080808] cursor-pointer"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Matching Live Jobs Unlocked by This Project */}
              <div className="rounded-2xl border-2 border-[#080808] bg-white p-5 shadow-[4px_4px_0px_#080808] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-[#080808]">
                      Live Jobs Matching This Project ({result.matchingOpportunitiesCount} found)
                    </h3>
                    <p className="text-xs text-[#777777]">
                      Ranked using 128-D project vector cosine similarity + domain & vicinity calibration.
                    </p>
                  </div>
                </div>

                {result.topMatchingOpportunities.length === 0 ? (
                  <p className="text-xs text-[#777777] py-4">
                    No direct role matches above similarity threshold yet — run a Discover sync or broaden your project tech stack keywords.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.topMatchingOpportunities.map(
                      ({ opportunity, evaluation, projectSimilarity }) => (
                        <div
                          key={opportunity.id}
                          className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3.5 flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-2.5">
                            <CompanyLogo
                              name={opportunity.organization}
                              size={36}
                              className="h-9 w-9 shrink-0 rounded-lg border border-[#D8D5CE]"
                            />
                            <div className="min-w-0">
                              <h4 className="font-heading text-xs sm:text-sm font-extrabold text-[#080808] truncate">
                                {opportunity.title}
                              </h4>
                              <p className="text-[11px] font-medium text-[#777777] truncate">
                                {opportunity.organization} • {opportunity.location}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2 py-0.5 font-heading text-[10px] font-extrabold text-[#080808]">
                                {projectSimilarity}% Project Fit
                              </span>
                              <span className="rounded-full bg-white border border-[#080808] px-2 py-0.5 font-heading text-[10px] font-bold text-[#080808]">
                                {Math.round(evaluation.overallScore)}% Overall
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onInspectOpportunity(opportunity, evaluation, "why")
                              }
                              className="inline-flex items-center gap-1 font-heading text-[11px] font-extrabold text-[#080808] hover:underline cursor-pointer"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
