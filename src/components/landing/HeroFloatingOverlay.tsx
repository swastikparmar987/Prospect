"use client";

import React, { useEffect, useRef } from "react";
import { Box, PenTool, Database, ChevronRight } from "lucide-react";
import gsap from "gsap";

interface HeroFloatingOverlayProps {
  onSelectRole?: (roleTitle: string) => void;
}

export function HeroFloatingOverlay({ onSelectRole }: HeroFloatingOverlayProps) {
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const chip1Ref = useRef<HTMLDivElement>(null);
  const chip2Ref = useRef<HTMLDivElement>(null);
  const chip3Ref = useRef<HTMLDivElement>(null);
  const chip4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    // Smooth floating counter-motions
    const ctx = gsap.context(() => {
      gsap.to(card1Ref.current, {
        y: -10,
        x: 4,
        rotation: 0.8,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(card2Ref.current, {
        y: 8,
        x: -5,
        rotation: -0.6,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.4,
      });

      gsap.to(card3Ref.current, {
        y: -9,
        x: -4,
        rotation: 0.5,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.8,
      });

      // Gentle floating for skill chips
      [chip1Ref, chip2Ref, chip3Ref, chip4Ref].forEach((ref, index) => {
        if (ref.current) {
          gsap.to(ref.current, {
            y: (index % 2 === 0 ? -6 : 6),
            x: (index % 2 === 0 ? 3 : -3),
            duration: 2.6 + index * 0.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * 0.2,
          });
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
      {/* SVG Connecting Orbital Arc Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="300"
          cy="300"
          rx="250"
          ry="150"
          transform="rotate(-18 300 300)"
          stroke="#E0FB66"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="opacity-70 animate-pulse"
        />
        <ellipse
          cx="300"
          cy="300"
          rx="220"
          ry="130"
          transform="rotate(22 300 300)"
          stroke="#D8D5CE"
          strokeWidth="1.2"
          className="opacity-50"
        />
      </svg>

      {/* Floating Skill Chip: React (Top Center-Left) */}
      <div
        ref={chip1Ref}
        className="absolute top-[8%] left-[28%] md:left-[32%] pointer-events-auto cursor-pointer"
        onClick={() => onSelectRole?.("Frontend Intern")}
      >
        <div className="bg-[#E0FB66] text-[#080808] font-bold text-xs md:text-sm px-3.5 py-1 rounded-full border-2 border-[#080808] shadow-[2.5px_2.5px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
          React
        </div>
      </div>

      {/* Floating Skill Chip: Python (Mid-Right) */}
      <div
        ref={chip2Ref}
        className="absolute top-[32%] right-[6%] md:right-[8%] pointer-events-auto cursor-pointer"
        onClick={() => onSelectRole?.("Data Analyst")}
      >
        <div className="bg-[#E0FB66] text-[#080808] font-bold text-xs md:text-sm px-3.5 py-1 rounded-full border-2 border-[#080808] shadow-[2.5px_2.5px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
          Python
        </div>
      </div>

      {/* Floating Skill Chip: Design (Bottom Left) */}
      <div
        ref={chip3Ref}
        className="absolute bottom-[24%] left-[12%] md:left-[16%] pointer-events-auto cursor-pointer"
        onClick={() => onSelectRole?.("Product Designer")}
      >
        <div className="bg-[#E0FB66] text-[#080808] font-bold text-xs md:text-sm px-3.5 py-1 rounded-full border-2 border-[#080808] shadow-[2.5px_2.5px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
          Design
        </div>
      </div>

      {/* Floating Skill Chip: Data (Bottom Right) */}
      <div
        ref={chip4Ref}
        className="absolute bottom-[16%] right-[14%] md:right-[18%] pointer-events-auto cursor-pointer"
        onClick={() => onSelectRole?.("Data Analyst")}
      >
        <div className="bg-[#E0FB66] text-[#080808] font-bold text-xs md:text-sm px-3.5 py-1 rounded-full border-2 border-[#080808] shadow-[2.5px_2.5px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
          Data
        </div>
      </div>

      {/* CARD 1: Frontend Intern (Top Right) */}
      <div
        ref={card1Ref}
        className="absolute top-[10%] right-[2%] md:right-[6%] pointer-events-auto cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
        onClick={() => onSelectRole?.("Frontend Intern")}
      >
        <div className="bg-white border-2 border-[#080808] rounded-2xl p-3 md:p-3.5 shadow-[4px_4px_0px_#080808] hover:shadow-[2px_2px_0px_#080808] transition-all min-w-[210px] md:min-w-[230px]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EAE2FA] border border-black/10 flex items-center justify-center text-[#080808]">
                <Box className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-heading font-bold text-sm md:text-base text-[#080808]">
                Frontend Intern
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#080808] stroke-[2.5] shrink-0" />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#EAE2FA] text-[#080808] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-black/10">
                React
              </span>
              <span className="bg-[#EAE2FA] text-[#080808] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-black/10">
                TypeScript
              </span>
            </div>
            {/* 5-bar Compatibility Indicator (4 Lime, 1 Muted) */}
            <div className="flex items-center gap-1" title="High Compatibility Fit">
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E5E7EB] border border-black/20 rounded-sm transform -skew-x-12" />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Product Designer (Mid-Left) */}
      <div
        ref={card2Ref}
        className="absolute top-[45%] left-[-2%] md:left-[2%] pointer-events-auto cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
        onClick={() => onSelectRole?.("Product Designer")}
      >
        <div className="bg-white border-2 border-[#080808] rounded-2xl p-3 md:p-3.5 shadow-[4px_4px_0px_#080808] hover:shadow-[2px_2px_0px_#080808] transition-all min-w-[210px] md:min-w-[230px]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#E0FB66]/40 border border-black/10 flex items-center justify-center text-[#080808]">
                <PenTool className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-heading font-bold text-sm md:text-base text-[#080808]">
                Product Designer
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#080808] stroke-[2.5] shrink-0" />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#EAE2FA] text-[#080808] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-black/10">
                Figma
              </span>
              <span className="bg-[#EAE2FA] text-[#080808] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-black/10">
                UX
              </span>
            </div>
            {/* 5-bar Compatibility Indicator */}
            <div className="flex items-center gap-1" title="High Compatibility Fit">
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E5E7EB] border border-black/20 rounded-sm transform -skew-x-12" />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Data Analyst (Bottom Right) */}
      <div
        ref={card3Ref}
        className="absolute bottom-[14%] right-[0%] md:right-[4%] pointer-events-auto cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
        onClick={() => onSelectRole?.("Data Analyst")}
      >
        <div className="bg-white border-2 border-[#080808] rounded-2xl p-3 md:p-3.5 shadow-[4px_4px_0px_#080808] hover:shadow-[2px_2px_0px_#080808] transition-all min-w-[210px] md:min-w-[230px]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 border border-black/10 flex items-center justify-center text-[#080808]">
                <Database className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-heading font-bold text-sm md:text-base text-[#080808]">
                Data Analyst
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#080808] stroke-[2.5] shrink-0" />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#EAE2FA] text-[#080808] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-black/10">
                SQL
              </span>
              <span className="bg-[#EAE2FA] text-[#080808] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-black/10">
                Python
              </span>
            </div>
            {/* 5-bar Compatibility Indicator */}
            <div className="flex items-center gap-1" title="High Compatibility Fit">
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E0FB66] border border-black/30 rounded-sm transform -skew-x-12" />
              <div className="w-1.5 h-3.5 bg-[#E5E7EB] border border-black/20 rounded-sm transform -skew-x-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
