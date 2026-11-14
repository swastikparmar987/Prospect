"use client";

import React from "react";
import { FileSpreadsheet, Search, Target, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface ThreeFeaturesCardsProps {
  onExploreFeature?: (tab: string) => void;
}

export function ThreeFeaturesCards({ onExploreFeature }: ThreeFeaturesCardsProps) {
  return (
    <section id="features" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      {/* Section Header */}
      <div className="mb-10 md:mb-14 text-left">
        <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-[#080808] tracking-tight leading-[1.15]">
          A smarter way to find{" "}
          <span className="inline-block bg-[#E0FB66] text-[#080808] px-3 py-1 rounded-xl border-2 border-[#080808] shadow-[3px_3px_0px_#080808] transform -rotate-1">
            your fit
          </span>
          .
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#555555] max-w-2xl font-body">
          Traditional job boards match blindly on title strings. Prospect builds an explainable
          intelligence model of what you can do today and what you can master next.
        </p>
      </div>

      {/* 3 Large Neo-Brutalist Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* CARD 1: Understand your profile */}
        <div
          className="group relative bg-white border-2 border-[#080808] rounded-2xl p-6 sm:p-7 shadow-[5px_5px_0px_#E0FB66] transition-all duration-300 hover:-translate-y-1 hover:shadow-[7px_7px_0px_#080808] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center shadow-[3px_3px_0px_#080808]">
                <FileSpreadsheet className="w-6 h-6 text-[#080808] stroke-[2.2]" />
              </div>
              <button
                onClick={() => onExploreFeature?.("profile")}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-black/5"
                title="Open Profile Workspace"
              >
                <ArrowUpRight className="w-5 h-5 text-[#080808]" />
              </button>
            </div>

            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#080808] mb-2.5">
              Understand your profile
            </h3>
            <p className="text-sm sm:text-base text-[#666666] font-body leading-relaxed mb-6">
              Turn your resume into a structured profile with verified skills, project evidence and
              authentic focus areas.
            </p>
          </div>

          {/* Visual: Mini floating resume document with extracted skill chips */}
          <div className="mt-2 bg-[#FDF9F3] border-2 border-[#080808] rounded-xl p-4 shadow-[2px_2px_0px_#080808]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E0FB66] border border-black" />
                <span className="font-technical text-xs font-bold text-black uppercase tracking-wider">
                  Resume Extractor
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#080808] bg-[#EAE2FA] px-2 py-0.5 rounded-full border border-black/10">
                Parsed
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-black/20 text-[#080808] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  TypeScript
                </span>
                <span className="bg-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-black/20 text-[#080808] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Next.js
                </span>
                <span className="bg-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-black/20 text-[#080808] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  PostgreSQL
                </span>
              </div>
              <div className="text-[11px] text-[#777777] font-medium pt-1">
                Extracted from projects & work experience
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Discover beyond job titles */}
        <div
          className="group relative bg-white border-2 border-[#080808] rounded-2xl p-6 sm:p-7 shadow-[5px_5px_0px_#E0FB66] transition-all duration-300 hover:-translate-y-1 hover:shadow-[7px_7px_0px_#080808] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center shadow-[3px_3px_0px_#080808]">
                <Search className="w-6 h-6 text-[#080808] stroke-[2.2]" />
              </div>
              <button
                onClick={() => onExploreFeature?.("discover")}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-black/5"
                title="Open Discovery Workspace"
              >
                <ArrowUpRight className="w-5 h-5 text-[#080808]" />
              </button>
            </div>

            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#080808] mb-2.5">
              Discover beyond job titles
            </h3>
            <p className="text-sm sm:text-base text-[#666666] font-body leading-relaxed mb-6">
              Find relevant roles across related skills, domains and opportunities with strict
              Seniority Shield protection.
            </p>
          </div>

          {/* Visual: Connected career role nodes with search animation */}
          <div className="mt-2 bg-[#FDF9F3] border-2 border-[#080808] rounded-xl p-4 shadow-[2px_2px_0px_#080808]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E0FB66] border border-black" />
                <span className="font-technical text-xs font-bold text-black uppercase tracking-wider">
                  Role Graph
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#080808] bg-[#E0FB66] px-2 py-0.5 rounded-full border border-black/20">
                Seniority Shield ON
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-black/15">
                <span className="text-xs font-bold text-[#080808]">AI Systems Engineer</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                  APPLY NOW
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/70 p-2 rounded-lg border border-black/10">
                <span className="text-xs font-medium text-[#555555]">Backend Infra Intern</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300">
                  PREPARE FIRST
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Know what to improve */}
        <div
          className="group relative bg-white border-2 border-[#080808] rounded-2xl p-6 sm:p-7 shadow-[5px_5px_0px_#E0FB66] transition-all duration-300 hover:-translate-y-1 hover:shadow-[7px_7px_0px_#080808] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center shadow-[3px_3px_0px_#080808]">
                <Target className="w-6 h-6 text-[#080808] stroke-[2.2]" />
              </div>
              <button
                onClick={() => onExploreFeature?.("prep")}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-black/5"
                title="Open Preparation Studio"
              >
                <ArrowUpRight className="w-5 h-5 text-[#080808]" />
              </button>
            </div>

            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#080808] mb-2.5">
              Know what to improve
            </h3>
            <p className="text-sm sm:text-base text-[#666666] font-body leading-relaxed mb-6">
              See the exact skill gaps for your target roles and get clear milestone projects to
              close them fast.
            </p>
          </div>

          {/* Visual: Skill progression graphic with connected skill indicators */}
          <div className="mt-2 bg-[#FDF9F3] border-2 border-[#080808] rounded-xl p-4 shadow-[2px_2px_0px_#080808]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E0FB66] border border-black" />
                <span className="font-technical text-xs font-bold text-black uppercase tracking-wider">
                  Gap Roadmap
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#080808] bg-[#EAE2FA] px-2 py-0.5 rounded-full border border-black/10">
                1 Weekend
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#080808]">
                <span>Docker Containerization</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#E0FB66] border border-black/20 h-full w-[90%] rounded-full" />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[#080808] pt-1">
                <span>Distributed Caching (Redis)</span>
                <span className="text-amber-800 font-bold text-[11px]">+3 Days Prep</span>
              </div>
              <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#E0FB66]/70 border border-black/20 h-full w-[55%] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
