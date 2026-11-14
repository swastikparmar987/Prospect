"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface FinalCtaSectionProps {
  onGetStarted?: () => void;
  onExploreRoles?: () => void;
}

export function FinalCtaSection({ onGetStarted, onExploreRoles }: FinalCtaSectionProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <div className="relative bg-[#E0FB66] border-2 md:border-[3px] border-[#080808] rounded-3xl p-8 sm:p-12 md:p-16 shadow-[8px_8px_0px_#080808] overflow-hidden">
        {/* Subtle Isometric Background Portal SVG Pattern */}
        <div className="absolute -right-12 -bottom-16 w-96 h-96 pointer-events-none opacity-20">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path
              d="M100 80C100 68 110 58 122 58H260C315 58 360 102 360 158C360 213 315 258 260 258H180V340C180 351 171 360 160 360H122C110 360 100 351 100 340V80Z"
              stroke="#080808"
              strokeWidth="12"
            />
            <path
              d="M180 120H250C272 120 290 137 290 159C290 181 272 199 250 199H180V120Z"
              stroke="#080808"
              strokeWidth="12"
            />
            <ellipse cx="200" cy="200" rx="180" ry="90" stroke="#080808" strokeWidth="6" strokeDasharray="10 10" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#FDF9F3] border-2 border-[#080808] px-3.5 py-1 rounded-full text-xs font-technical font-bold text-[#080808] uppercase tracking-wider mb-6 shadow-[2px_2px_0px_#080808]">
            <Sparkles className="w-3.5 h-3.5" /> Start Your Exploration
          </div>

          <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-[#080808] tracking-tight leading-[1.1] mb-5">
            Your next chapter starts here.
          </h2>

          <p className="text-base sm:text-lg text-[#080808]/80 font-body mb-8 max-w-xl">
            Discover opportunities that make sense for your skills and ambitions — with real evidence,
            zero seniority clutter, and actionable preparation plans.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onGetStarted}
              className="bg-[#080808] text-white px-8 py-4 rounded-full font-heading font-bold text-base border-2 border-[#080808] shadow-[4px_4px_0px_#FFFFFF] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2 group"
            >
              Get started with Prospect <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onExploreRoles}
              className="bg-[#FDF9F3] text-[#080808] px-7 py-4 rounded-full font-heading font-bold text-base border-2 border-[#080808] shadow-[4px_4px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              Explore live roles
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs font-technical font-bold text-[#080808]">
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ Free for students & early career</span>
            <span>•</span>
            <span>✓ Privacy protected</span>
          </div>
        </div>
      </div>
    </section>
  );
}
