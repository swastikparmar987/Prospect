"use client";

import React, { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollParallax } from "./ScrollAnimationEngine";

interface FinalCtaSectionProps {
  onGetStarted?: () => void;
  onExploreRoles?: () => void;
}

export function FinalCtaSection({ onGetStarted, onExploreRoles }: FinalCtaSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <section ref={sectionRef} className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <div className="relative bg-[#E0FB66] border-2 md:border-[3px] border-[#080808] rounded-3xl p-8 sm:p-12 md:p-16 shadow-[8px_8px_0px_#080808] overflow-hidden">
        {/* Parallax Rotating Background Isometric 3D Portal Watermark */}
        <ScrollParallax
          triggerRef={sectionRef}
          speed={0.25}
          rotate={50}
          start="top bottom"
          end="bottom top"
          scrub={0.6}
          className="absolute -right-20 -bottom-24 w-[440px] h-[440px] pointer-events-none opacity-25 will-change-transform"
        >
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Outer Isometric Portal Orbit */}
            <ellipse
              cx="200"
              cy="200"
              rx="185"
              ry="92"
              stroke="#080808"
              strokeWidth="6"
              strokeDasharray="12 12"
            />
            {/* Middle Isometric Ring */}
            <ellipse
              cx="200"
              cy="200"
              rx="140"
              ry="70"
              stroke="#080808"
              strokeWidth="4"
              strokeDasharray="6 6"
              opacity="0.8"
            />
            {/* Inner Isometric Portal Core */}
            <ellipse
              cx="200"
              cy="200"
              rx="90"
              ry="45"
              stroke="#080808"
              strokeWidth="4"
              opacity="0.6"
            />
            {/* 3D Isometric Cross-Axis Coordinates */}
            <line x1="20" y1="200" x2="380" y2="200" stroke="#080808" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
            <line x1="200" y1="30" x2="200" y2="370" stroke="#080808" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
            {/* Prospect Monogram 3D Watermark Silhouette */}
            <path
              d="M100 80C100 68 110 58 122 58H260C315 58 360 102 360 158C360 213 315 258 260 258H180V340C180 351 171 360 160 360H122C110 360 100 351 100 340V80Z"
              stroke="#080808"
              strokeWidth="14"
            />
            <path
              d="M180 120H250C272 120 290 137 290 159C290 181 272 199 250 199H180V120Z"
              stroke="#080808"
              strokeWidth="14"
            />
            {/* Neo-brutalist star emblems at orbital vertices */}
            <polygon points="200,20 205,35 220,35 208,44 212,58 200,49 188,58 192,44 180,35 195,35" fill="#080808" />
            <polygon points="200,342 205,357 220,357 208,366 212,380 200,371 188,380 192,366 180,357 195,357" fill="#080808" />
          </svg>
        </ScrollParallax>

        {/* Counter-rotating subtle orbital aura */}
        <ScrollParallax
          triggerRef={sectionRef}
          speed={-0.15}
          rotate={-35}
          start="top bottom"
          end="bottom top"
          scrub={0.5}
          className="absolute -right-8 -bottom-12 w-72 h-72 pointer-events-none opacity-20 will-change-transform"
        >
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="100" cy="100" rx="90" ry="45" stroke="#080808" strokeWidth="4" strokeDasharray="8 8" />
            <circle cx="100" cy="100" r="8" fill="#080808" />
          </svg>
        </ScrollParallax>

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
