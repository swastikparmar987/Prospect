"use client";

import React, { useMemo, useState } from "react";
import {
  CandidateCapabilityMap,
  CareerOutlook,
  EvaluationResult,
  ExpandedRole,
  Opportunity,
  UserProfile,
} from "@/types";
import { evaluateOpportunity } from "@/lib/scoring-engine";
import { CareerOutlookExperience } from "@/components/onboarding/CareerOutlookExperience";
import {
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Cpu,
  FlaskConical,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";

export interface CareerIntelligenceCommandCenterProps {
  profile: UserProfile | null;
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>;
  capabilityMap: CandidateCapabilityMap | null;
  expandedRoles: ExpandedRole[];
  careerOutlook: CareerOutlook | null;
  initialPreferences?: any;
  isSearching?: boolean;
  onConfirmOutlookAndSearch: (
    selectedDirections: string[],
    prefs: any
  ) => Promise<void>;
  onNavigateDiscover: () => void;
  onUploadResume: () => void;
}

export function CareerIntelligenceCommandCenter({
  profile,
  opportunities,
  capabilityMap,
  expandedRoles,
  careerOutlook,
  initialPreferences,
  isSearching = false,
  onConfirmOutlookAndSearch,
  onNavigateDiscover,
  onUploadResume,
}: CareerIntelligenceCommandCenterProps) {
  const [mode, setMode] = useState<"lab" | "directions">("lab");
  const [simulatedSkills, setSimulatedSkills] = useState<string[]>([]);
  const [inspectedOppId, setInspectedOppId] = useState<string>(
    opportunities[0]?.opportunity.id || ""
  );

  // 1. Classify every candidate skill into Project/Experience Verified vs Declared-only
  const provenanceMatrix = useMemo(() => {
    if (!profile) return { verified: [], declaredOnly: [] };

    const corpusItems: Array<{ label: string; text: string }> = [
      ...(profile.projects || []).map((p) => ({
        label: `Project: ${p.name}`,
        text: `${p.name} ${p.description} ${(p.techStack || []).join(" ")}`.toLowerCase(),
      })),
      ...(profile.experiences || []).map((e) => ({
        label: `Exp: ${e.company}`,
        text: `${e.title} ${e.company} ${(e.bullets || []).join(" ")}`.toLowerCase(),
      })),
    ];

    const verified: Array<{ skill: string; evidenceSources: string[] }> = [];
    const declaredOnly: string[] = [];

    for (const rawSkill of profile.skills || []) {
      const clean = rawSkill.trim();
      if (!clean) continue;
      const needle = clean.toLowerCase();
      const matchedSources = corpusItems
        .filter((item) => item.text.includes(needle))
        .map((item) => item.label);

      if (matchedSources.length > 0) {
        verified.push({ skill: clean, evidenceSources: matchedSources });
      } else {
        declaredOnly.push(clean);
      }
    }

    return { verified, declaredOnly };
  }, [profile]);

  // 2. Top Missing Skills across loaded Opportunities for the Interactive "What-If" Simulator
  const topMissingSkills = useMemo(() => {
    if (!profile || opportunities.length === 0) return [];
    const userSet = new Set(
      (profile.skills || []).map((s) => s.trim().toLowerCase())
    );
    const counts = new Map<string, { skill: string; count: number }>();

    for (const item of opportunities.slice(0, 25)) {
      const oppReqs = [
        ...(item.opportunity.requiredSkills || []),
        ...(item.opportunity.preferredSkills || []),
      ];
      for (const reqSkill of oppReqs) {
        const clean = reqSkill.trim();
        if (!clean) continue;
        const key = clean.toLowerCase();
        if (userSet.has(key)) continue;
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(key, { skill: clean, count: 1 });
        }
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [profile, opportunities]);

  const toggleSimulatedSkill = (skill: string) => {
    setSimulatedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  // 3. Real Counterfactual Re-Scoring using live scoring-engine
  const counterfactualResults = useMemo(() => {
    if (!profile || opportunities.length === 0) {
      return {
        baselineAvg: 0,
        simulatedAvg: 0,
        baselineApplyNow: 0,
        simulatedApplyNow: 0,
        roleDeltas: [],
      };
    }

    const slice = opportunities.slice(0, 15);
    const simulatedProfile: UserProfile = {
      ...profile,
      skills: Array.from(
        new Set([...(profile.skills || []), ...simulatedSkills])
      ),
    };

    const roleDeltas = slice.map((item) => {
      const baseScore = Math.round(item.evaluation.overallScore || 0);
      const baseRec = item.evaluation.recommendation;

      if (simulatedSkills.length === 0) {
        return {
          opportunity: item.opportunity,
          baseScore,
          simScore: baseScore,
          delta: 0,
          baseRec,
          simRec: baseRec,
          unlocked: false,
        };
      }

      const simEval = evaluateOpportunity(item.opportunity, simulatedProfile);
      const simScore = Math.round(simEval.overallScore || 0);
      return {
        opportunity: item.opportunity,
        baseScore,
        simScore,
        delta: simScore - baseScore,
        baseRec,
        simRec: simEval.recommendation,
        unlocked:
          baseRec !== "APPLY_NOW" && simEval.recommendation === "APPLY_NOW",
      };
    });

    const baselineAvg =
      roleDeltas.length > 0
        ? Math.round(
            roleDeltas.reduce((s, r) => s + r.baseScore, 0) / roleDeltas.length
          )
        : 0;
    const simulatedAvg =
      roleDeltas.length > 0
        ? Math.round(
            roleDeltas.reduce((s, r) => s + r.simScore, 0) / roleDeltas.length
          )
        : 0;
    const baselineApplyNow = roleDeltas.filter(
      (r) => r.baseRec === "APPLY_NOW"
    ).length;
    const simulatedApplyNow = roleDeltas.filter(
      (r) => r.simRec === "APPLY_NOW"
    ).length;

    return {
      baselineAvg,
      simulatedAvg,
      baselineApplyNow,
      simulatedApplyNow,
      roleDeltas: [...roleDeltas].sort(
        (a, b) => b.delta - a.delta || b.simScore - a.simScore
      ),
    };
  }, [profile, opportunities, simulatedSkills]);

  const activeInspected =
    opportunities.find((o) => o.opportunity.id === inspectedOppId) ||
    opportunities[0] ||
    null;

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl my-8 text-center space-y-4 rounded-[22px] bg-white border border-[#E9E6DF] p-10 shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1FFC7] border border-[#D7ED93] text-[#111111]">
          <BrainCircuit className="h-7 w-7" />
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111111]">
          Upload Your Resume to Unlock Intelligence Lab
        </h2>
        <p className="text-sm text-[#777777] leading-relaxed">
          Prospect builds your capability provenance matrix, counterfactual skill simulator, and white-box 5-pillar scoring breakdown exclusively from your real uploaded resume.
        </p>
        <button
          type="button"
          onClick={onUploadResume}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#111111] text-white px-6 py-3 text-sm font-semibold shadow-[0_6px_18px_rgba(17,17,17,0.16)] hover:bg-[#222222] transition-all cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Resume Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 pb-14">
      {/* Header Banner + Mode Switcher */}
      <section className="rounded-[22px] bg-white border border-[#E9E6DF] p-6 sm:p-7 shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAE3FF] border border-[#D7CCF8] px-3 py-1 text-[11px] font-heading font-bold text-[#111111]">
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>WHITE-BOX CAREER INTELLIGENCE ENGINE</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
              How Prospect Understands{" "}
              <span className="bg-[#DFFF43] rounded-lg px-2 py-0.5">
                {profile.fullName || "Your Profile"}
              </span>
            </h1>
            <p className="text-sm text-[#777777] max-w-2xl">
              Inspect evidence provenance, simulate counterfactual skill upgrades across live postings, or launch multi-source career discovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMode("lab")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-heading font-semibold transition-all cursor-pointer ${
                mode === "lab"
                  ? "bg-[#DFFF43] text-[#111111] shadow-[0_2px_10px_rgba(223,255,67,0.3)]"
                  : "text-[#777777] hover:text-[#111111]"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Capability &amp; Simulator Lab</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("directions")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-heading font-semibold transition-all cursor-pointer ${
                mode === "directions"
                  ? "bg-[#DFFF43] text-[#111111] shadow-[0_2px_10px_rgba(223,255,67,0.3)]"
                  : "text-[#777777] hover:text-[#111111]"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Career Directions &amp; Search</span>
            </button>
          </div>
        </div>
      </section>

      {mode === "directions" && careerOutlook ? (
        <CareerOutlookExperience
          outlook={careerOutlook}
          userProfile={profile}
          initialPreferences={initialPreferences}
          onConfirm={onConfirmOutlookAndSearch}
          onBackToProfile={onNavigateDiscover}
          backButtonLabel="Back to Discover Opportunities"
          isSearching={isSearching}
        />
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: COUNTERFACTUAL "WHAT-IF" SKILL SIMULATOR */}
          <section className="rounded-[22px] bg-white border border-[#E9E6DF] p-6 shadow-[0_8px_28px_rgba(17,17,17,0.04)] space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#E9E6DF] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-wider text-[#70B93F]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Counterfactual Skill Simulator (Live Math)</span>
                </div>
                <h2 className="mt-1 font-heading text-xl font-bold text-[#111111]">
                  What happens to your match scores if you learn a new skill?
                </h2>
                <p className="text-xs text-[#777777] mt-0.5">
                  Toggle missing market skills below to recompute live eligibility, 128-D vectors, and match percentages in real time.
                </p>
              </div>

              {simulatedSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSimulatedSkills([])}
                  className="self-start rounded-xl border border-[#E9E6DF] bg-[#FDFBF8] px-3.5 py-1.5 text-xs font-semibold text-[#111111] hover:bg-[#F8F6F1] cursor-pointer"
                >
                  Reset Simulation ({simulatedSkills.length})
                </button>
              )}
            </div>

            {opportunities.length === 0 ? (
              <div className="rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] p-6 text-center space-y-2">
                <p className="font-heading text-sm font-bold text-[#111111]">
                  No live opportunities loaded yet for counterfactual simulation.
                </p>
                <p className="text-xs text-[#777777]">
                  Launch live real-time discovery first so Prospect can simulate skill uplift across real job postings.
                </p>
                <button
                  type="button"
                  onClick={onNavigateDiscover}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-2xl bg-[#111111] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  <span>Go to Live Discovery</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* Toggleable Missing Skills */}
                <div className="flex flex-wrap gap-2">
                  {topMissingSkills.map((item) => {
                    const active = simulatedSkills.includes(item.skill);
                    return (
                      <button
                        key={item.skill}
                        type="button"
                        onClick={() => toggleSimulatedSkill(item.skill)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? "bg-[#DFFF43] text-[#111111] border border-[#C6E832] shadow-[0_2px_10px_rgba(223,255,67,0.3)]"
                            : "bg-[#FDFBF8] text-[#111111] border border-[#E9E6DF] hover:border-[#D7ED93] hover:bg-[#F1FFC7]/50"
                        }`}
                      >
                        <span>{active ? "✓" : "+"}</span>
                        <span>{item.skill}</span>
                        <span className="text-[10px] text-[#777777] font-normal">
                          ({item.count} roles)
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Live Impact Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-4">
                    <div className="text-[11px] font-semibold text-[#777777]">
                      Average Top-15 Match
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-heading text-2xl font-extrabold text-[#111111]">
                        {counterfactualResults.simulatedAvg}%
                      </span>
                      {counterfactualResults.simulatedAvg >
                        counterfactualResults.baselineAvg && (
                        <span className="rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-2 py-0.5 text-[11px] font-bold text-[#70B93F]">
                          +
                          {counterfactualResults.simulatedAvg -
                            counterfactualResults.baselineAvg}
                          % boost
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-[#777777]">
                      Baseline: {counterfactualResults.baselineAvg}%
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-4">
                    <div className="text-[11px] font-semibold text-[#777777]">
                      &quot;Apply Now&quot; Ready Roles
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-heading text-2xl font-extrabold text-[#111111]">
                        {counterfactualResults.simulatedApplyNow}
                      </span>
                      {counterfactualResults.simulatedApplyNow >
                        counterfactualResults.baselineApplyNow && (
                        <span className="rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-2 py-0.5 text-[11px] font-bold text-[#70B93F]">
                          +
                          {counterfactualResults.simulatedApplyNow -
                            counterfactualResults.baselineApplyNow}{" "}
                          unlocked
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-[#777777]">
                      Baseline: {counterfactualResults.baselineApplyNow} ready
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F1FFC7]/60 border border-[#D7ED93] p-4">
                    <div className="text-[11px] font-semibold text-[#111111]">
                      Simulated Stack Additions
                    </div>
                    <div className="mt-1.5 font-heading text-sm font-bold text-[#111111]">
                      {simulatedSkills.length > 0
                        ? simulatedSkills.join(", ")
                        : "Select skills above to test impact"}
                    </div>
                    <div className="mt-1 text-[11px] text-[#111111]/70">
                      Runs live deterministic + semantic scoring engine
                    </div>
                  </div>
                </div>

                {/* Per-Role Impact Deltas */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {counterfactualResults.roleDeltas.slice(0, 6).map((row) => (
                    <div
                      key={row.opportunity.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] px-4 py-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-[#111111] truncate">
                          {row.opportunity.title}
                        </div>
                        <div className="text-[11px] text-[#777777]">
                          {row.opportunity.organization} • {row.opportunity.workMode}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[#777777]">
                          {row.baseScore}%
                        </span>
                        <ArrowRight className="h-3 w-3 text-[#777777]" />
                        <span className="font-mono font-bold text-[#111111]">
                          {row.simScore}%
                        </span>
                        {row.delta > 0 && (
                          <span className="rounded-full bg-[#DFFF43] px-2 py-0.5 text-[10.5px] font-bold text-[#111111]">
                            +{row.delta}%
                          </span>
                        )}
                        {row.unlocked && (
                          <span className="rounded-full bg-[#111111] px-2 py-0.5 text-[10px] font-bold text-[#DFFF43]">
                            Unlocked APPLY_NOW
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* SECTION 2: RESUME EVIDENCE PROVENANCE MATRIX & EXPANDED ROLE FAMILIES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-6 rounded-[22px] bg-white border border-[#E9E6DF] p-6 shadow-[0_8px_28px_rgba(17,17,17,0.04)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-wider text-[#777777]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#70B93F]" />
                    <span>Resume Proof Audit</span>
                  </div>
                  <h3 className="mt-1 font-heading text-lg font-bold text-[#111111]">
                    Verified vs. Declared Skills
                  </h3>
                </div>
                <span className="rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-2.5 py-1 text-[11px] font-bold text-[#111111]">
                  {provenanceMatrix.verified.length}/
                  {(profile.skills || []).length} Project-Backed
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-[#111111] mb-2">
                    ✓ Proven by Resume Projects / Work Experience
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {provenanceMatrix.verified.length === 0 ? (
                      <span className="text-xs text-[#777777]">
                        Link your skills directly inside project descriptions to earn proof badges.
                      </span>
                    ) : (
                      provenanceMatrix.verified.map((v) => (
                        <span
                          key={v.skill}
                          title={v.evidenceSources.join(", ")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-3 py-1 text-xs font-semibold text-[#111111]"
                        >
                          <CheckCircle2 className="h-3 w-3 text-[#70B93F]" />
                          <span>{v.skill}</span>
                          <span className="text-[10px] text-[#777777] font-normal">
                            ({v.evidenceSources[0]})
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {provenanceMatrix.declaredOnly.length > 0 && (
                  <div className="pt-2 border-t border-[#E9E6DF]">
                    <div className="text-xs font-semibold text-[#777777] mb-2">
                      Listed Skills Without Project Proof Yet
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {provenanceMatrix.declaredOnly.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#EAE3FF]/65 border border-[#D7CCF8] px-2.5 py-0.5 text-xs font-medium text-[#111111]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Capability Role Expansion & White-Box Formula Inspector */}
            <section className="lg:col-span-6 rounded-[22px] bg-white border border-[#E9E6DF] p-6 shadow-[0_8px_28px_rgba(17,17,17,0.04)] space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-wider text-[#777777]">
                  <Cpu className="h-3.5 w-3.5 text-[#111111]" />
                  <span>White-Box Scoring Formula Inspector</span>
                </div>
                <h3 className="mt-1 font-heading text-lg font-bold text-[#111111]">
                  Why Did Prospect Assign That Exact Match %?
                </h3>
              </div>

              {activeInspected ? (
                <div className="space-y-3">
                  <select
                    value={activeInspected.opportunity.id}
                    onChange={(e) => setInspectedOppId(e.target.value)}
                    aria-label="Select opportunity to audit score formula"
                    className="w-full rounded-xl border border-[#E9E6DF] bg-[#FDFBF8] px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#A6D94B]"
                  >
                    {opportunities.slice(0, 20).map((item) => (
                      <option key={item.opportunity.id} value={item.opportunity.id}>
                        {Math.round(item.evaluation.overallScore)}% —{" "}
                        {item.opportunity.title} ({item.opportunity.organization})
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {[
                      {
                        label: "Eligibility",
                        val: activeInspected.evaluation.scoreBreakdown.eligibility,
                        max: 35,
                      },
                      {
                        label: "Skills & Semantic",
                        val: activeInspected.evaluation.scoreBreakdown.skills,
                        max: 30,
                      },
                      {
                        label: "Source Quality",
                        val: activeInspected.evaluation.scoreBreakdown.quality,
                        max: 15,
                      },
                      {
                        label: "Preferences",
                        val: activeInspected.evaluation.scoreBreakdown.preferences,
                        max: 10,
                      },
                      {
                        label: "Deadline & Freshness",
                        val: activeInspected.evaluation.scoreBreakdown.deadline,
                        max: 10,
                      },
                      {
                        label: "128-D Cosine",
                        val: Math.round(
                          (activeInspected.evaluation.semanticScore || 0) * 100
                        ),
                        max: 100,
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-xl border border-[#E9E6DF] bg-[#FDFBF8] p-2.5"
                      >
                        <div className="text-[10.5px] text-[#777777]">
                          {metric.label}
                        </div>
                        <div className="mt-0.5 font-heading text-sm font-extrabold text-[#111111]">
                          {metric.val}
                          <span className="text-[10px] font-normal text-[#777777]">
                            /{metric.max}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-3 text-xs text-[#111111] leading-relaxed">
                    <span className="font-bold">Engine Rationale: </span>
                    <span className="text-[#555555]">
                      {activeInspected.evaluation.rationale}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#777777]">
                  Run live discovery to inspect individual match equations.
                </p>
              )}

              {expandedRoles.length > 0 && (
                <div className="pt-3 border-t border-[#E9E6DF]">
                  <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#777777] mb-2">
                    Expanded Role Families From Capabilities
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {expandedRoles.slice(0, 6).map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center gap-1 rounded-full bg-[#F1FFC7]/70 border border-[#D7ED93] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]"
                      >
                        <Award className="h-3 w-3 text-[#70B93F]" />
                        <span>{role.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {capabilityMap?.summary && (
            <section className="rounded-[20px] bg-[#FDFBF8] border border-[#E9E6DF] p-4 flex items-start gap-3 text-xs text-[#111111]">
              <Sparkles className="h-4 w-4 text-[#70B93F] shrink-0 mt-0.5" />
              <div>
                <span className="font-heading font-bold">
                  AI Capability Map Synthesis:{" "}
                </span>
                <span className="text-[#555555]">{capabilityMap.summary}</span>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
