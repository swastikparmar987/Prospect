"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import {
  ApplicationRecord,
  CareerOutlook,
  EvaluationResult,
  Opportunity,
  PreparationPlan,
  UserProfile,
} from "@/types";
import { CompanyLogo } from "@/components/CompanyLogo";
import { NavTab } from "@/components/Sidebar";
import { SkillRadarChart } from "@/components/views/SkillRadarChart";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  ChevronRight,
  Compass,
  FolderGit2,
  Layers,
  Star,
  Target,
  TrendingUp,
  Upload,
  UserRound,
} from "lucide-react";

const Prospect3DVisual = dynamic(
  () =>
    import("@/components/workspace/Prospect3DVisual").then(
      (m) => m.Prospect3DVisual
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] sm:h-[245px] w-full rounded-3xl bg-[#F1FFC7]/35 animate-pulse border border-[#E9E6DF]" />
    ),
  }
);

export interface HomeViewProps {
  profile: UserProfile | null;
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>;
  applications: ApplicationRecord[];
  preparationPlans: PreparationPlan[];
  careerOutlook: CareerOutlook | null;
  savedOpportunityIds: string[];
  searchMode: "LIVE" | "DEMO";
  loadingOpportunities: boolean;
  onNavigate: (tab: NavTab) => void;
  onInspectOpportunity: (
    opp: Opportunity,
    evalResult?: EvaluationResult,
    initialTab?: "overview" | "eligibility" | "evidence" | "why" | "prep_plan" | "studio"
  ) => void;
  onSaveToTracker: (opp: Opportunity) => void;
  onUploadResume: () => void;
}

type HomeFilterChip = "All" | "Internships" | "Full-time" | "Remote" | "My Skills";

const FILTER_CHIPS: HomeFilterChip[] = [
  "All",
  "Internships",
  "Full-time",
  "Remote",
  "My Skills",
];

function getInitials(fullName?: string | null): string | null {
  if (!fullName || !fullName.trim()) return null;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function formatGapDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return trimmed;
}

function skillAppearsInText(skill: string, corpus: string): boolean {
  const needle = skill.trim().toLowerCase();
  if (!needle || !corpus) return false;
  if (needle.length <= 2) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9_+#])${escaped}($|[^a-z0-9_+#])`, "i").test(corpus);
  }
  return corpus.toLowerCase().includes(needle);
}

export function HomeView({
  profile,
  opportunities,
  applications,
  preparationPlans,
  careerOutlook,
  savedOpportunityIds,
  searchMode,
  loadingOpportunities,
  onNavigate,
  onInspectOpportunity,
  onSaveToTracker,
  onUploadResume,
}: HomeViewProps) {
  const [activeFilter, setActiveFilter] = useState<HomeFilterChip>("All");
  const rootRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLElement>(null);

  const handleSelectVisualCategory = (
    category: "ALL" | "INTERNSHIP" | "FULL_TIME"
  ) => {
    if (category === "FULL_TIME") {
      setActiveFilter("Full-time");
    } else if (category === "INTERNSHIP") {
      setActiveFilter("Internships");
    } else {
      setActiveFilter("All");
    }

    if (typeof window !== "undefined") {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      recommendedRef.current?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  // Subtle staggered entrance polish with reduced-motion guard
  useEffect(() => {
    if (typeof window === "undefined" || !rootRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(".home-animate-block", {
        opacity: 0,
        y: 14,
        duration: 0.45,
        stagger: 0.06,
        ease: "power2.out",
        clearProps: "opacity,transform",
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // 1. Real Profile Completeness Computation
  const profileCompletenessPct = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.degree && profile.major),
      Boolean(profile.skills && profile.skills.length > 0),
      Boolean(profile.experiences && profile.experiences.length > 0),
      Boolean(profile.projects && profile.projects.length >= 2),
      Boolean(profile.targetRoles && profile.targetRoles.length > 0),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / 5) * 100);
  }, [profile]);

  // 2. Average Match Score of Top Opportunities (strictly requires configured profile!)
  const avgMatchOrCompleteness = useMemo(() => {
    if (!profile) return 0;
    if (opportunities.length > 0) {
      const slice = opportunities.slice(0, 5);
      const sum = slice.reduce(
        (acc, item) => acc + (item.evaluation?.overallScore || 0),
        0
      );
      return Math.round(sum / slice.length);
    }
    return profileCompletenessPct;
  }, [profile, opportunities, profileCompletenessPct]);

  const hasMeaningfulProfileMatch = Boolean(profile);
  const profileMatchBadge =
    profile && opportunities.length > 0
      ? `Top ${Math.min(5, opportunities.length)} avg`
      : profile
      ? `${profile.skills?.length || 0} skills`
      : "Upload resume";

  // 3. Real Unique Skill Gaps Across Top Opportunities & Prep Plans
  const { skillGapsCount, topGapLabel, topGapOccurrences } = useMemo(() => {
    const uniqueGapSet = new Set<string>();
    const counts = new Map<string, { label: string; count: number }>();

    const registerGap = (rawSkill?: string) => {
      if (!rawSkill) return;
      const clean = rawSkill.trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      uniqueGapSet.add(key);
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { label: formatGapDisplay(clean), count: 1 });
      }
    };

    for (const item of opportunities.slice(0, 10)) {
      for (const gap of item.evaluation.skillGapAnalysis || []) {
        registerGap(gap.skill);
      }
      for (const missing of item.evaluation.missingQualifications || []) {
        registerGap(missing);
      }
    }

    for (const plan of preparationPlans) {
      for (const step of plan.items || []) {
        if (!step.isCompleted && (step.skillTag || step.gap)) {
          registerGap(step.skillTag || step.gap);
        }
      }
    }

    let bestGap: { label: string; count: number } | null = null;
    for (const entry of counts.values()) {
      if (!bestGap || entry.count > bestGap.count) {
        bestGap = entry;
      }
    }

    return {
      skillGapsCount: uniqueGapSet.size,
      topGapLabel: bestGap?.label || null,
      topGapOccurrences: bestGap?.count || 0,
    };
  }, [opportunities, preparationPlans]);

  // 4. Filter Recommended Opportunities Interactively
  const filteredOpportunities = useMemo(() => {
    if (activeFilter === "All") return opportunities;

    if (activeFilter === "Internships") {
      return opportunities.filter(
        ({ opportunity }) =>
          opportunity.category === "Internship" ||
          /\bintern(ship)?\b/i.test(opportunity.employmentType || "") ||
          /\bintern(ship)?\b/i.test(opportunity.title)
      );
    }

    if (activeFilter === "Full-time") {
      return opportunities.filter(({ opportunity }) => {
        const isIntern =
          opportunity.category === "Internship" ||
          /\bintern(ship)?\b/i.test(opportunity.employmentType || "") ||
          /\bintern(ship)?\b/i.test(opportunity.title);
        if (isIntern) return false;
        return (
          opportunity.category === "Entry-level" ||
          /full[\s-]?time|new[\s-]?grad|early[\s-]?career|permanent/i.test(
            opportunity.employmentType || ""
          ) ||
          (opportunity.category !== "Hackathon" && opportunity.category !== "Research")
        );
      });
    }

    if (activeFilter === "Remote") {
      return opportunities.filter(
        ({ opportunity }) =>
          opportunity.workMode === "Remote" ||
          /\bremote\b/i.test(opportunity.location || "")
      );
    }

    // "My Skills"
    const userSkills = (profile?.skills || [])
      .map((s) => s.trim())
      .filter(Boolean);
    if (userSkills.length === 0) return [];

    return opportunities.filter(({ opportunity, evaluation }) => {
      const oppSkills = [
        ...(opportunity.requiredSkills || []),
        ...(opportunity.preferredSkills || []),
      ]
        .join(" ")
        .toLowerCase();
      const oppText = `${opportunity.title} ${opportunity.description || ""}`;

      const hasDirectSkillMatch = userSkills.some(
        (skill) =>
          skillAppearsInText(skill, oppSkills) || skillAppearsInText(skill, oppText)
      );
      if (hasDirectSkillMatch) return true;

      return (
        (evaluation.positiveEvidence?.length || 0) > 0 &&
        (evaluation.scoreBreakdown?.skills || 0) >= 14
      );
    });
  }, [activeFilter, opportunities, profile?.skills]);

  const displayedOpportunities = filteredOpportunities.slice(0, 4);
  const candidateInitials = getInitials(profile?.fullName);
  const mappedDirectionsCount = careerOutlook?.directions?.length || 0;

  return (
    <div ref={rootRef} className="mx-auto max-w-[1320px] pb-12 pt-1">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* =============================================================== */}
        {/* MAIN LEFT / CENTER CANVAS (8 Columns on xl)                     */}
        {/* =============================================================== */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* ------------------------------------------------------------- */}
          {/* A. HERO BANNER CARD                                           */}
          {/* ------------------------------------------------------------- */}
          <section className="home-animate-block relative rounded-[22px] bg-gradient-to-br from-white via-[#FDFBF8] to-[#F1FFC7]/75 border border-[#E9E6DF] p-6 sm:p-8 shadow-[0_12px_36px_rgba(17,17,17,0.05)] overflow-hidden">
            {/* Soft ambient radial lime & lavender glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 right-6 h-72 w-72 rounded-full bg-[#DFFF43]/28 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#EAE3FF]/35 blur-3xl"
            />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Headline, Subhead, Buttons */}
              <div className="md:col-span-7 space-y-4">
                <h1 className="font-heading text-3xl sm:text-[36px] lg:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.12] text-[#111111]">
                  Discover opportunities built{" "}
                  <span className="inline-block bg-[#DFFF43] rounded-xl px-2 py-0.5 text-[#111111]">
                    around you.
                  </span>
                </h1>

                <p className="text-sm sm:text-[15px] text-[#777777] font-normal leading-relaxed max-w-md">
                  AI-powered career discovery that understands your skills,
                  experience and goals.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate("discover")}
                    className="inline-flex items-center gap-2 bg-[#111111] text-white rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-[0_6px_18px_rgba(17,17,17,0.16)] hover:bg-[#222222] hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <span>Find Opportunities</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      profile ? onNavigate("outlook") : onUploadResume()
                    }
                    className="inline-flex items-center gap-2 bg-white text-[#111111] border border-[#E9E6DF] rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-[0_2px_10px_rgba(17,17,17,0.04)] hover:bg-[#FDFBF8] hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <span>{profile ? "Career Intelligence" : "How it Works"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive 3D Lime Glass "P" Visual */}
              <div className="md:col-span-5 relative flex items-center justify-center">
                <Prospect3DVisual
                  className="h-[230px] sm:h-[250px] w-full"
                  onSelectCategory={handleSelectVisualCategory}
                />
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* B. 4 KPI METRIC CARDS GRID (HONEST REAL-STATE BADGES)         */}
          {/* ------------------------------------------------------------- */}
          <section
            aria-label="Key career metrics"
            className="home-animate-block grid grid-cols-2 sm:grid-cols-4 gap-3.5"
          >
            {/* Card 1: Featured Lime Opportunities Found */}
            <button
              type="button"
              onClick={() => onNavigate("discover")}
              className="group rounded-[20px] bg-gradient-to-br from-[#F6FFE0] to-[#F1FFC7] border border-[#D7ED93] p-4 shadow-[0_8px_24px_rgba(166,217,75,0.14)] hover:shadow-[0_12px_28px_rgba(166,217,75,0.22)] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 border border-[#D7ED93] text-[#111111] shrink-0">
                  <BriefcaseBusiness className="h-4 w-4" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/85 border border-[#D7ED93] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#111111]">
                  {searchMode === "LIVE" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#70B93F]" />
                  )}
                  <span>{searchMode === "LIVE" ? "Live feed" : "Preview"}</span>
                </span>
              </div>
              <div className="mt-3.5">
                <div className="font-heading text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#111111] leading-none">
                  {opportunities.length.toLocaleString()}
                </div>
                <div className="mt-1.5 text-xs font-medium text-[#111111]/75">
                  Opportunities Found
                </div>
              </div>
            </button>

            {/* Card 2: Profile Match */}
            <button
              type="button"
              onClick={() => (profile ? onNavigate("profile") : onUploadResume())}
              className="group rounded-[20px] bg-white border border-[#E9E6DF] p-4 shadow-[0_6px_22px_rgba(17,17,17,0.04)] hover:shadow-[0_10px_28px_rgba(17,17,17,0.07)] hover:border-[#D7ED93] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F1FFC7] border border-[#D7ED93] text-[#70B93F] shrink-0">
                  <Target className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-[#FDFBF8] border border-[#E9E6DF] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#777777] truncate">
                  {profileMatchBadge}
                </span>
              </div>
              <div className="mt-3.5">
                <div className="font-heading text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#111111] leading-none">
                  {hasMeaningfulProfileMatch ? `${avgMatchOrCompleteness}%` : "—"}
                </div>
                <div className="mt-1.5 text-xs font-medium text-[#777777]">
                  Profile Match
                </div>
              </div>
            </button>

            {/* Card 3: Skill Gaps */}
            <button
              type="button"
              onClick={() => onNavigate("upskill")}
              className="group rounded-[20px] bg-white border border-[#E9E6DF] p-4 shadow-[0_6px_22px_rgba(17,17,17,0.04)] hover:shadow-[0_10px_28px_rgba(17,17,17,0.07)] hover:border-[#D7CCF8] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAE3FF] border border-[#D7CCF8] text-[#111111] shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-[#EAE3FF]/65 border border-[#D7CCF8] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#111111] truncate">
                  {topGapOccurrences > 0 ? "Target roles" : "Up to date"}
                </span>
              </div>
              <div className="mt-3.5">
                <div className="font-heading text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#111111] leading-none">
                  {skillGapsCount}
                </div>
                <div className="mt-1.5 text-xs font-medium text-[#777777]">
                  Skill Gaps
                </div>
              </div>
            </button>

            {/* Card 4: Saved & Applied */}
            <button
              type="button"
              onClick={() => onNavigate("tracker")}
              className="group rounded-[20px] bg-white border border-[#E9E6DF] p-4 shadow-[0_6px_22px_rgba(17,17,17,0.04)] hover:shadow-[0_10px_28px_rgba(17,17,17,0.07)] hover:border-[#D7ED93] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDFBF8] border border-[#E9E6DF] text-[#111111] shrink-0">
                  <Star className="h-4 w-4 text-[#A6D94B]" />
                </div>
                <span className="rounded-full bg-[#FDFBF8] border border-[#E9E6DF] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#777777] truncate">
                  {applications.length} tracked
                </span>
              </div>
              <div className="mt-3.5">
                <div className="font-heading text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#111111] leading-none">
                  {applications.length}
                </div>
                <div className="mt-1.5 text-xs font-medium text-[#777777]">
                  Saved &amp; Applied
                </div>
              </div>
            </button>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* C. RECOMMENDED OPPORTUNITIES CARD                             */}
          {/* ------------------------------------------------------------- */}
          <section
            ref={recommendedRef}
            className="home-animate-block scroll-mt-20 rounded-[22px] bg-white border border-[#E9E6DF] p-5 sm:p-6 shadow-[0_8px_28px_rgba(17,17,17,0.04)] space-y-4"
          >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#111111]">
                Recommended Opportunities
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("discover")}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#111111] hover:text-[#70B93F] transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Interactive Filter Chips */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="tablist"
              aria-label="Filter recommended opportunities"
            >
              {FILTER_CHIPS.map((chip) => {
                const isActive = activeFilter === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(chip)}
                    className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#DFFF43] text-[#111111] border border-[#C6E832] font-semibold shadow-[0_2px_8px_rgba(223,255,67,0.3)]"
                        : "bg-[#FDFBF8] text-[#777777] border border-[#E9E6DF] font-medium hover:bg-[#F8F6F1] hover:text-[#111111]"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* Opportunity Rows */}
            {loadingOpportunities ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((skeletonIdx) => (
                  <div
                    key={skeletonIdx}
                    className="rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] p-4 animate-pulse flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-[#E9E6DF]" />
                      <div className="space-y-2">
                        <div className="h-4 w-48 rounded-md bg-[#E9E6DF]" />
                        <div className="h-3 w-36 rounded-md bg-[#E9E6DF]/70" />
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-[#E9E6DF]" />
                  </div>
                ))}
              </div>
            ) : displayedOpportunities.length === 0 ? (
              <div className="rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] p-8 text-center flex flex-col items-center justify-center space-y-3">
                <div className="h-11 w-11 rounded-2xl bg-[#F1FFC7] border border-[#D7ED93] flex items-center justify-center text-[#111111]">
                  <Compass className="h-5 w-5" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className="font-heading text-sm font-bold text-[#111111]">
                    {!profile
                      ? "Upload your resume first to unlock live matches"
                      : activeFilter === "My Skills" &&
                        (!profile.skills?.length)
                      ? "Add skills or re-upload your resume to filter by skill stack"
                      : opportunities.length === 0
                      ? "No relevant opportunities found yet."
                      : `No ${activeFilter} roles in your top loaded feed.`}
                  </p>
                  <p className="text-xs text-[#777777]">
                    {!profile
                      ? "Prospect never displays pre-baked or mock match scores — upload your resume to discover and score real-time roles dynamically."
                      : opportunities.length === 0
                      ? "Run live discovery to pull verified roles matched to your profile."
                      : "Switch filter chips or explore the full live discovery feed."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {activeFilter !== "All" && profile && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("All")}
                      className="rounded-2xl bg-white text-[#111111] border border-[#E9E6DF] px-4 py-2 text-xs font-semibold hover:bg-[#F8F6F1] transition-colors cursor-pointer"
                    >
                      Show All Roles
                    </button>
                  )}
                  {!profile ||
                  (activeFilter === "My Skills" && !profile.skills?.length) ? (
                    <button
                      type="button"
                      onClick={onUploadResume}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-[#111111] text-white px-4 py-2 text-xs font-semibold shadow-[0_6px_18px_rgba(17,17,17,0.16)] hover:bg-[#222222] transition-all cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Resume Now</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate("discover")}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-[#111111] text-white px-4 py-2 text-xs font-semibold shadow-[0_6px_18px_rgba(17,17,17,0.16)] hover:bg-[#222222] transition-all cursor-pointer"
                    >
                      <span>Open Live Discovery</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedOpportunities.map(({ opportunity, evaluation }, index) => {
                  const isSaved = savedOpportunityIds.includes(opportunity.id);
                  const score = Math.max(
                    0,
                    Math.min(100, Math.round(evaluation.overallScore || 0))
                  );
                  const radius = 17;
                  const circumference = 2 * Math.PI * radius;
                  const dashOffset = circumference * (1 - score / 100);
                  const gradientId = `matchRing-${index}-${opportunity.id.replace(
                    /[^a-zA-Z0-9_-]/g,
                    ""
                  )}`;

                  const realSkillTags = Array.from(
                    new Set([
                      ...(opportunity.requiredSkills || []),
                      ...(opportunity.preferredSkills || []),
                    ])
                  )
                    .filter((s) => s && s.trim().length > 0)
                    .slice(0, 3);

                  const isFeaturedRow = index === 0;

                  return (
                    <div
                      key={opportunity.id}
                      onClick={() =>
                        onInspectOpportunity(opportunity, evaluation, "overview")
                      }
                      className={`group rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer transition-all ${
                        isFeaturedRow
                          ? "bg-[#F1FFC7]/65 border border-[#D7ED93] hover:bg-[#F1FFC7]/90"
                          : "bg-[#FDFBF8] hover:bg-[#F8F6F1] border border-[#E9E6DF]"
                      }`}
                    >
                      {/* Left Block: Logo, Title, Org/Location, Skill Tags */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <CompanyLogo
                          name={opportunity.organization}
                          size={42}
                          className="h-[42px] w-[42px] shrink-0 rounded-xl !border !border-[#E9E6DF] shadow-[0_2px_8px_rgba(17,17,17,0.05)]"
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="font-heading font-bold text-sm sm:text-[15px] text-[#111111] truncate">
                            {opportunity.title}
                          </h3>
                          <p className="text-xs font-medium text-[#777777] truncate mt-0.5">
                            {opportunity.organization} • {opportunity.workMode} •{" "}
                            {opportunity.location}
                          </p>

                          {realSkillTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {realSkillTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-white text-[#111111]/80 border border-[#E9E6DF] rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Block: Circular Match Ring + Bookmark + Action Arrow */}
                      <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0 self-end sm:self-center">
                        {/* Circular SVG Match Progress Ring */}
                        <div className="flex items-center gap-2 pr-0.5">
                          <div className="relative h-11 w-11 flex items-center justify-center shrink-0">
                            <svg
                              viewBox="0 0 44 44"
                              className="h-11 w-11 -rotate-90"
                              aria-hidden="true"
                            >
                              <defs>
                                <linearGradient
                                  id={gradientId}
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#A6D94B" />
                                  <stop offset="100%" stopColor="#70B93F" />
                                </linearGradient>
                              </defs>
                              <circle
                                cx="22"
                                cy="22"
                                r={radius}
                                fill="none"
                                stroke="#E9E6DF"
                                strokeWidth="3.5"
                              />
                              <circle
                                cx="22"
                                cy="22"
                                r={radius}
                                fill="none"
                                stroke={`url(#${gradientId})`}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center font-heading text-[11px] font-extrabold text-[#111111]">
                              {score}%
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#777777] hidden sm:inline">
                            Match
                          </span>
                        </div>

                        {/* Bookmark Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveToTracker(opportunity);
                          }}
                          aria-label={isSaved ? "Saved in Tracker" : "Save to Tracker"}
                          title={isSaved ? "Saved in Tracker" : "Save to Tracker"}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all cursor-pointer ${
                            isSaved
                              ? "bg-[#DFFF43] border-[#C6E832] text-[#111111]"
                              : "bg-white border-[#E9E6DF] text-[#777777] hover:text-[#111111]"
                          }`}
                        >
                          <Bookmark
                            className={`h-3.5 w-3.5 ${
                              isSaved ? "fill-[#111111] text-[#111111]" : ""
                            }`}
                          />
                        </button>

                        {/* Circular Arrow Button */}
                        <span
                          aria-hidden="true"
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                            isFeaturedRow
                              ? "bg-[#111111] text-white shadow-[0_4px_12px_rgba(17,17,17,0.16)] group-hover:translate-x-0.5"
                              : "bg-white border border-[#E9E6DF] text-[#111111] group-hover:bg-[#111111] group-hover:text-white group-hover:border-[#111111]"
                          }`}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* =============================================================== */}
        {/* RIGHT RAIL (4 Columns on xl)                                    */}
        {/* =============================================================== */}
        <aside className="xl:col-span-4 space-y-5 min-w-0">
          {/* ------------------------------------------------------------- */}
          {/* A. CANDIDATE PROFILE MINI-CARD                                */}
          {/* ------------------------------------------------------------- */}
          <button
            type="button"
            onClick={() => (profile ? onNavigate("profile") : onUploadResume())}
            className="home-animate-block group w-full rounded-[20px] bg-white border border-[#E9E6DF] p-4 shadow-[0_8px_28px_rgba(17,17,17,0.04)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#D7ED93] hover:shadow-[0_12px_32px_rgba(17,17,17,0.07)] transition-all text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="bg-gradient-to-br from-[#DFFF43] to-[#A6D94B] p-[2.5px] rounded-full shrink-0 shadow-[0_4px_14px_rgba(166,217,75,0.28)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-white font-heading text-sm font-bold ring-2 ring-white">
                  {candidateInitials ? (
                    <span>{candidateInitials}</span>
                  ) : (
                    <UserRound className="h-5 w-5 text-[#DFFF43]" />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="font-heading text-[15px] font-bold text-[#111111] truncate">
                  {profile?.fullName || "Complete Your Profile"}
                </div>
                <div className="text-xs font-medium text-[#777777] truncate mt-0.5">
                  {profile?.major || "Add Resume"} •{" "}
                  {profile?.graduationYear
                    ? `Class of ${profile.graduationYear}`
                    : "Setup"}
                </div>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-[#777777] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* ------------------------------------------------------------- */}
          {/* B & C. SKILL PROFILE RADAR + NEXT STEPS FOR YOU               */}
          {/* ------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5">
            {/* B. "YOUR SKILL PROFILE" 5-AXIS RADAR CHART */}
            <div className="home-animate-block">
              <SkillRadarChart
                profile={profile}
                onUploadResume={onUploadResume}
                onNavigateProfile={() => onNavigate("profile")}
              />
            </div>

            {/* C. "NEXT STEPS FOR YOU" ACTION CARD */}
            <div className="home-animate-block rounded-[20px] bg-white border border-[#E9E6DF] p-5 shadow-[0_8px_28px_rgba(17,17,17,0.04)] space-y-3">
              <h3 className="font-heading text-[15px] font-bold tracking-tight text-[#111111]">
                Next Steps for You
              </h3>

              <div className="space-y-2.5">
                {/* Step 1: Upload Resume or Improve Top Skill Gap */}
                {!profile ? (
                  <button
                    type="button"
                    onClick={onUploadResume}
                    className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] hover:bg-[#F1FFC7]/60 hover:border-[#D7ED93] p-3 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1FFC7] text-[#111111] shrink-0 group-hover:bg-[#DFFF43] transition-colors">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#111111] truncate">
                          Upload Your Resume
                        </div>
                        <div className="text-[11px] text-[#777777] truncate mt-0.5">
                          Unlock skill radar &amp; tailored match scores
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#777777] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate("upskill")}
                    className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] hover:bg-[#F1FFC7]/60 hover:border-[#D7ED93] p-3 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAE3FF] text-[#111111] shrink-0 group-hover:bg-[#DFFF43] transition-colors">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#111111] truncate">
                          {topGapLabel ? `Improve ${topGapLabel}` : "Explore Upskill Paths"}
                        </div>
                        <div className="text-[11px] text-[#777777] truncate mt-0.5">
                          {topGapOccurrences > 1
                            ? `Appears in ${topGapOccurrences} target roles`
                            : "Required in similar target roles"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#777777] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                )}

                {/* Step 2: Validate a Project */}
                <button
                  type="button"
                  onClick={() => onNavigate("projects")}
                  className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] hover:bg-[#F1FFC7]/60 hover:border-[#D7ED93] p-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1FFC7] text-[#111111] shrink-0 group-hover:bg-[#DFFF43] transition-colors">
                      <FolderGit2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#111111] truncate">
                        Validate a Project
                      </div>
                      <div className="text-[11px] text-[#777777] truncate mt-0.5">
                        {profile?.projects?.length
                          ? `${profile.projects.length} project${
                              profile.projects.length === 1 ? "" : "s"
                            } • Boost technical fit`
                          : "Boosts technical fit for target roles"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#777777] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Step 3: Explore Related Roles */}
                <button
                  type="button"
                  onClick={() => onNavigate("outlook")}
                  className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] hover:bg-[#F1FFC7]/60 hover:border-[#D7ED93] p-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1FFC7] text-[#111111] shrink-0 group-hover:bg-[#DFFF43] transition-colors">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#111111] truncate">
                        Explore Related Roles
                      </div>
                      <div className="text-[11px] text-[#777777] truncate mt-0.5">
                        {mappedDirectionsCount > 0
                          ? `${mappedDirectionsCount} career direction${
                              mappedDirectionsCount === 1 ? "" : "s"
                            } mapped`
                          : "Explore career directions"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#777777] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
