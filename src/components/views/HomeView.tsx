"use client";

import React from "react";
import {
  ApplicationRecord,
  CareerOutlook,
  EvaluationResult,
  Opportunity,
  PreparationPlan,
  UserProfile,
} from "@/types";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  ArrowRight,
  BarChart2,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  ChevronRight,
  Compass,
  GraduationCap,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { NavTab } from "@/components/Navbar";

interface HomeViewProps {
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
  // 1. Real Profile Completeness Computation (matches ProfileView criteria)
  const hasAcademic = Boolean(profile?.degree && profile?.major);
  const hasSkills = Boolean(profile?.skills && profile.skills.length > 0);
  const hasExperience = Boolean(profile?.experiences && profile.experiences.length > 0);
  const hasProjects = Boolean(profile?.projects && profile.projects.length >= 2);
  const hasPreferences = Boolean(profile?.targetRoles && profile.targetRoles.length > 0);

  const checksCompleted = [
    hasAcademic,
    hasSkills,
    hasExperience,
    hasProjects,
    hasPreferences,
  ].filter(Boolean).length;
  const profileCompletenessPct = profile ? Math.round((checksCompleted / 5) * 100) : 0;

  // 2. Real Opportunity & Recent New Metrics
  const nowMs = Date.now();
  const recentNewCount = opportunities.filter(({ opportunity }) => {
    const t = opportunity.discoveredAt ? new Date(opportunity.discoveredAt).getTime() : 0;
    return t > 0 && (nowMs - t) / (1000 * 60 * 60) <= 48;
  }).length;

  // 3. Real Skill Gaps Count across top evaluated opportunities & prep plans
  const uniqueGapSet = new Set<string>();
  for (const item of opportunities.slice(0, 10)) {
    for (const gap of item.evaluation.skillGapAnalysis || []) {
      uniqueGapSet.add(gap.skill.toLowerCase());
    }
    for (const missing of item.evaluation.missingQualifications || []) {
      uniqueGapSet.add(missing.toLowerCase());
    }
  }
  for (const plan of preparationPlans) {
    for (const step of plan.items || []) {
      if (!step.isCompleted && (step.skillTag || step.gap)) {
        uniqueGapSet.add((step.skillTag || step.gap || "").toLowerCase());
      }
    }
  }
  const skillGapsCount = uniqueGapSet.size;

  // 4. Real Active Applications Count
  const applicationsInProgressCount = applications.filter(
    (app) =>
      app.stage !== "REJECTED" &&
      app.stage !== "WITHDRAWN" &&
      app.stage !== "ARCHIVED"
  ).length;

  const topOpportunities = opportunities.slice(0, 3);
  const topHeroItem = topOpportunities[0] || null;

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-14 pt-2">
      {/* ===================================================== */}
      {/* 1. HERO SECTION + TILTED MATCHED ROLE FOLDER CARD     */}
      {/* ===================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Headline & CTAs */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 text-[11px] font-heading font-extrabold tracking-[0.14em] uppercase text-[#777777]">
            <span>CAREER INTELLIGENCE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#080808]" />
            <span className="text-[#080808]">LIVE VERIFIED</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.05] text-[#080808]">
            Discover
            <br />
            opportunities
            <br />
            built for{" "}
            <span className="relative inline-block">
              you.
              <svg
                className="absolute -bottom-2 left-0 w-full h-4 text-[#E0FB66] pointer-events-none"
                viewBox="0 0 180 18"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M4 13.5C44 9.5 128 5.5 176 4.5"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="text-sm sm:text-base font-medium text-[#777777] max-w-md leading-relaxed">
            AI-powered search, personalized matches, and a clear path to your next role.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate("discover")}
              className="neo-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm cursor-pointer"
            >
              <span>Find Opportunities</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => (profile ? onNavigate("profile") : onUploadResume())}
              className="neo-btn-outline inline-flex items-center gap-2 px-6 py-3 text-sm cursor-pointer"
            >
              <span>{profile ? "Analyze My Profile" : "Upload & Analyze Resume"}</span>
            </button>
          </div>
        </div>

        {/* Right Tilted Matched Role Folder Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div
            onClick={() => {
              if (topHeroItem) {
                onInspectOpportunity(
                  topHeroItem.opportunity,
                  topHeroItem.evaluation,
                  "overview"
                );
              } else {
                onNavigate("discover");
              }
            }}
            className="relative w-full max-w-[340px] py-4 px-2 cursor-pointer group"
          >
            {/* Playful ink burst ticks at top right */}
            <svg
              className="absolute -top-2 right-1 w-9 h-9 text-[#080808] pointer-events-none"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 16L8 6M22 14L23 3M30 20L37 13"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>

            {/* Peeking Electric Lime Folder Sheet Behind */}
            <div className="absolute inset-x-6 top-2 h-24 rounded-2xl border-2 border-[#080808] bg-[#E0FB66] -rotate-2 transform transition-transform group-hover:-rotate-1" />

            {/* Front White Tilted Folder Dossier Card */}
            <div className="relative rounded-[20px] border-2 border-[#080808] bg-white p-6 -rotate-3 shadow-[-5px_7px_0px_#080808] transition-transform duration-200 group-hover:-rotate-1">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#080808] bg-[#FDF9F3]">
                <BriefcaseBusiness className="h-5 w-5 text-[#080808] stroke-[2]" />
              </div>

              <div className="text-xs font-semibold text-[#777777]">
                {topHeroItem ? "Matched Role" : "Live Discovery Ready"}
              </div>

              <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-[#080808] leading-snug line-clamp-2">
                {loadingOpportunities
                  ? "Scanning live feeds..."
                  : topHeroItem
                  ? topHeroItem.opportunity.title
                  : profile
                  ? "Run Live Search"
                  : "Upload Resume First"}
              </h2>

              <p className="mt-1 text-xs font-medium text-[#777777] truncate">
                {topHeroItem
                  ? `${topHeroItem.opportunity.organization} • ${topHeroItem.opportunity.workMode}`
                  : "Run a search or upload your resume to discover matches"}
              </p>

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-[#E0FB66] border-2 border-[#080808] px-3.5 py-1 font-heading text-xs font-extrabold text-[#080808]">
                  {topHeroItem
                    ? `${Math.round(topHeroItem.evaluation.overallScore)}% Match`
                    : `${profileCompletenessPct}% Profile Ready`}
                </span>
                <span className="text-[11px] font-heading font-bold text-[#080808] inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>{topHeroItem ? "Inspect" : "Open"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* 2. YOUR CAREER SNAPSHOT (4 NEO-EDITORIAL METRIC CARDS)*/}
      {/* ===================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-[#080808]">
            Your Career Snapshot
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-heading font-bold text-[#080808] hover:underline cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Profile Completeness */}
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="neo-card-interactive p-5 text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#080808] bg-[#FDF9F3]">
                <Target className="h-4 w-4 text-[#080808]" />
              </div>
              {!profile && (
                <span className="rounded-full bg-[#FEF189] border-2 border-[#080808] px-2 py-0.5 font-heading text-[10px] font-bold">
                  Setup
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="font-heading text-3xl font-extrabold tracking-tight text-[#080808]">
                {profileCompletenessPct}%
              </div>
              <div className="text-xs font-medium text-[#777777] mt-0.5">
                Profile Completeness
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FDF9F3] px-2 py-1">
              <div className="relative h-2 flex-1 rounded-full bg-[#D8D5CE] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E0FB66] transition-all duration-500"
                  style={{ width: `${Math.max(4, profileCompletenessPct)}%` }}
                />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[#080808] shrink-0" />
            </div>
          </button>

          {/* Card 2: Relevant Opportunities */}
          <button
            type="button"
            onClick={() => onNavigate("discover")}
            className="neo-card-interactive p-5 text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#080808] bg-[#FDF9F3]">
                <Layers className="h-4 w-4 text-[#080808]" />
              </div>
              {recentNewCount > 0 && (
                <span className="rounded-full bg-[#E0FB66] border-2 border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold text-[#080808]">
                  +{recentNewCount} new
                </span>
              )}
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="font-heading text-3xl font-extrabold tracking-tight text-[#080808]">
                  {opportunities.length}
                </div>
                <div className="text-xs font-medium text-[#777777] mt-0.5">
                  Relevant Opportunities
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#777777] mb-1" />
            </div>
          </button>

          {/* Card 3: Skill Gaps */}
          <button
            type="button"
            onClick={() => onNavigate("prep")}
            className="neo-card-interactive p-5 text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#080808] bg-[#FDF9F3]">
                <TrendingUp className="h-4 w-4 text-[#080808]" />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="font-heading text-3xl font-extrabold tracking-tight text-[#080808]">
                  {skillGapsCount}
                </div>
                <div className="text-xs font-medium text-[#777777] mt-0.5">
                  Skill Gaps
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#777777] mb-1" />
            </div>
          </button>

          {/* Card 4: Applications in Progress */}
          <button
            type="button"
            onClick={() => onNavigate("tracker")}
            className="neo-card-interactive p-5 text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#080808] bg-[#FDF9F3]">
                <Calendar className="h-4 w-4 text-[#080808]" />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="font-heading text-3xl font-extrabold tracking-tight text-[#080808]">
                  {applicationsInProgressCount}
                </div>
                <div className="text-xs font-medium text-[#777777] mt-0.5">
                  Applications in Progress
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#777777] mb-1" />
            </div>
          </button>
        </div>
      </section>

      {/* ===================================================== */}
      {/* 3. TOP OPPORTUNITIES FOR YOU + CAREER INTELLIGENCE    */}
      {/* ===================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Top Verified Opportunities */}
        <div className="lg:col-span-8 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-[#080808]">
              Top Opportunities for You
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("discover")}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-heading font-bold text-[#080808] hover:underline cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingOpportunities ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="neo-card p-4 animate-pulse flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#D8D5CE]/50" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 rounded bg-[#D8D5CE]/50" />
                      <div className="h-3 w-36 rounded bg-[#D8D5CE]/30" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded-full bg-[#D8D5CE]/50" />
                </div>
              ))}
            </div>
          ) : topOpportunities.length === 0 ? (
            <div className="neo-card p-8 text-center flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="h-11 w-11 rounded-full border-2 border-[#080808] bg-[#E0FB66] flex items-center justify-center">
                <Compass className="h-5 w-5 text-[#080808]" />
              </div>
              <p className="font-heading text-sm font-bold text-[#080808]">
                {searchMode === "LIVE"
                  ? "No verified opportunities found from the currently available sources."
                  : "No matching opportunities loaded."}
              </p>
              <button
                type="button"
                onClick={() => onNavigate("discover")}
                className="neo-btn-primary inline-flex items-center gap-1.5 px-5 py-2 text-xs cursor-pointer"
              >
                <span>Open Live Discovery</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {topOpportunities.map(({ opportunity, evaluation }) => {
                const isSaved = savedOpportunityIds.includes(opportunity.id);
                return (
                  <div
                    key={opportunity.id}
                    onClick={() =>
                      onInspectOpportunity(opportunity, evaluation, "overview")
                    }
                    className="neo-card-interactive px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <CompanyLogo
                        name={opportunity.organization}
                        size={38}
                        className="h-[38px] w-[38px] shrink-0 rounded-xl border border-[#D8D5CE]"
                      />
                      <div className="min-w-0">
                        <h3 className="font-heading text-sm sm:text-base font-extrabold text-[#080808] truncate">
                          {opportunity.title}
                        </h3>
                        <p className="text-xs font-medium text-[#777777] truncate">
                          {opportunity.organization} • {opportunity.location} •{" "}
                          {opportunity.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="rounded-full bg-[#E0FB66] border-2 border-[#080808] px-3 py-1 font-heading text-xs font-extrabold text-[#080808]">
                        {Math.round(evaluation.overallScore)}% Match
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveToTracker(opportunity);
                        }}
                        aria-label={isSaved ? "Saved in Tracker" : "Save to Tracker"}
                        title={isSaved ? "Saved in Tracker" : "Save to Tracker"}
                        className="p-1.5 rounded-lg hover:bg-[#FDF9F3] text-[#080808] transition-colors cursor-pointer"
                      >
                        <Bookmark
                          className={`h-4 w-4 ${
                            isSaved
                              ? "fill-[#080808] text-[#080808]"
                              : "text-[#080808]"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Warm Soft Yellow Career Intelligence Card */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="rounded-[20px] border-2 border-[#080808] bg-[#FEF189] p-6 shadow-[5px_5px_0px_#080808] flex flex-col justify-between h-full min-h-[210px]">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-6 w-6 text-[#080808] shrink-0 mt-0.5 stroke-[2]" />
                <h3 className="font-heading text-2xl font-extrabold tracking-tight leading-tight text-[#080808]">
                  Career
                  <br />
                  Intelligence
                </h3>
              </div>

              <p className="text-sm font-medium text-[#080808]/85 leading-relaxed">
                {profile && (profile.skills?.length || 0) > 0
                  ? `AI analysis of your ${profile.skills.length} skills across ${
                      careerOutlook?.directions?.length || 0
                    } tailored career paths.`
                  : "AI analysis of your skills, roles and growth path once your resume is uploaded."}
              </p>
            </div>

            <div className="pt-5">
              <button
                type="button"
                onClick={() => onNavigate("outlook")}
                className="neo-btn-outline inline-flex items-center gap-2 px-5 py-2.5 text-xs cursor-pointer w-fit"
              >
                <span>Explore Insights</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* 4. BOTTOM 3-CARD WORKFLOW SHORTCUTS                   */}
      {/* ===================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigate("outlook")}
          className="neo-card-interactive p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#080808] bg-[#FDF9F3] shrink-0">
              <BarChart2 className="h-4 w-4 text-[#080808]" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-extrabold text-[#080808]">
                Role Insights
              </h3>
              <p className="text-xs font-medium text-[#777777] mt-0.5">
                Explore in-demand roles for your skills.
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#080808] shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("prep")}
          className="neo-card-interactive p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#080808] bg-[#FDF9F3] shrink-0">
              <GraduationCap className="h-4 w-4 text-[#080808]" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-extrabold text-[#080808]">
                Skill Plan
              </h3>
              <p className="text-xs font-medium text-[#777777] mt-0.5">
                Close gaps with a personalized upskill path.
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#080808] shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("prep")}
          className="neo-card-interactive p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#080808] bg-[#FDF9F3] shrink-0">
              <Target className="h-4 w-4 text-[#080808]" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-extrabold text-[#080808]">
                Interview Prep
              </h3>
              <p className="text-xs font-medium text-[#777777] mt-0.5">
                Practice with role-specific questions.
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#080808] shrink-0" />
        </button>
      </section>
    </div>
  );
}
