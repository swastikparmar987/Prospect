"use strict";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Briefcase,
  Layers,
  GraduationCap,
  Cpu,
  Database,
  ExternalLink,
  ChevronDown,
  Terminal,
  Clock,
  Target,
  Search,
  Lock,
  Zap,
  BarChart3,
  Calendar,
  Building,
  Check,
  Flame,
} from "lucide-react";
import { ThreeCanvas } from "./ThreeCanvas";
import { InteractiveOpportunitySimulator } from "./InteractiveOpportunitySimulator";
import { InteractivePrepStudioMockup } from "./InteractivePrepStudioMockup";
import { SystemArchitecture3DViewer } from "./SystemArchitecture3DViewer";

export function LandingExperience() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Track page scroll percentage for 3D camera spline travel
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(1, Math.max(0, currentScroll / totalScroll)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FDF9F3] text-[#080808] selection:bg-[#E0FB66] selection:text-[#080808] overflow-x-hidden font-body">
      {/* 3D WebGL Background Canvas */}
      <ThreeCanvas scrollProgress={scrollProgress} />

      {/* Floating Glass Navigation Header */}
      <header className="sticky top-4 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-2xl border-2 border-[#080808] bg-[#FDF9F3]/90 backdrop-blur-md px-4 py-3 shadow-[4px_4px_0px_#080808]">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#080808] text-white font-heading font-extrabold text-lg shadow-[2px_2px_0px_#E0FB66] group-hover:-translate-y-0.5 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-extrabold tracking-tight text-[#080808]">
                Prospect
              </span>
              <span className="text-[10px] font-heading font-bold text-[#777777] -mt-1 hidden sm:inline">
                Career Opportunity Discovery Agent
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-heading font-bold text-[#080808]">
            <a href="#problem" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              The Dilemma
            </a>
            <a href="#outlook" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              Career Outlook
            </a>
            <a href="#simulator" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              4-Way Decision Matrix
            </a>
            <a href="#guardrails" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              Seniority Protection
            </a>
            <a href="#prep-studio" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              Prep Studio
            </a>
            <a href="#architecture" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              Architecture
            </a>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <a
              href="#simulator"
              className="hidden sm:inline-flex rounded-xl border-2 border-[#080808] bg-white px-3.5 py-1.5 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] transition-all"
            >
              ⚡ Simulator
            </a>
            <Link
              href="/?tab=discover"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-4 py-2 font-heading text-xs font-extrabold text-[#080808] shadow-[3px_3px_0px_#080808] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#080808] transition-all"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-white px-4 py-1.5 font-heading text-xs font-extrabold shadow-[3px_3px_0px_#080808] animate-in fade-in duration-300">
            <span className="h-2 w-2 rounded-full bg-[#E0FB66] animate-pulse" />
            <span>EVIDENCE-BACKED CAREER INTELLIGENCE FOR STUDENTS & GRADUATES</span>
          </div>

          {/* Massive Display Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#080808] leading-[1.08]">
            Understand your strengths.{" "}
            <span className="inline-block rounded-2xl border-3 border-[#080808] bg-[#E0FB66] px-4 py-1 shadow-[5px_5px_0px_#080808] mt-2 rotate-[-1deg]">
              Discover your direction.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-[#080808]/85 font-medium max-w-3xl mx-auto leading-relaxed pt-2">
            Generic job boards dump thousands of keyword-stuffed ghost jobs and manager roles on students.
            Prospect replaces blind spraying with verified skill matching, 4-way actionable recommendations,
            and guaranteed seniority protection.
          </p>

          {/* Primary Action Button Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/?tab=discover"
              className="inline-flex items-center gap-2.5 rounded-2xl border-3 border-[#080808] bg-[#080808] px-7 py-4 font-heading text-base font-extrabold text-white shadow-[5px_5px_0px_#E0FB66] hover:-translate-y-1 hover:shadow-[7px_7px_0px_#E0FB66] transition-all cursor-pointer"
            >
              <span>🚀 Launch Opportunity Discovery</span>
              <ArrowRight className="h-5 w-5 text-[#E0FB66]" />
            </Link>

            <a
              href="#simulator"
              className="inline-flex items-center gap-2 rounded-2xl border-3 border-[#080808] bg-white px-6 py-4 font-heading text-base font-extrabold text-[#080808] shadow-[5px_5px_0px_#080808] hover:bg-[#FEF189] hover:-translate-y-1 transition-all cursor-pointer"
            >
              <Zap className="h-5 w-5 text-[#080808]" />
              <span>Test Decision Simulator</span>
            </a>
          </div>

          {/* Live System Vitals Strip */}
          <div className="pt-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  5,677+
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Indexed Opportunities
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  11 Feeds
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Verified Data Sources
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  208 / 208
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Verified Test Passes
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  0% Fake
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Hallucinated Deadlines
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Interactive 3D Opportunity Cards Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Databricks */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] hover:-translate-y-1.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="rounded-xl border border-[#080808] bg-[#E0FB66] px-2.5 py-1 font-heading text-xs font-extrabold text-[#080808]">
                APPLY NOW
              </span>
              <span className="font-mono text-xs font-bold text-[#080808]">
                88% Readiness
              </span>
            </div>
            <h4 className="font-heading text-lg font-extrabold text-[#080808] leading-snug">
              Distributed Systems Intern
            </h4>
            <p className="text-xs font-semibold text-[#777777] mt-0.5">Databricks • San Francisco, CA</p>
            <div className="mt-3 text-xs text-[#080808]/85 leading-relaxed">
              Grounded in student&apos;s verified C++ Raft consensus engine and network systems coursework.
            </div>
            <div className="mt-4 pt-3 border-t border-[#D8D5CE] flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold text-[#163824]">✓ Active Official Link</span>
              <span className="font-mono text-[11px] text-[#777777]">Rolling Deadline</span>
            </div>
          </div>

          {/* Card 2: Adobe Fellow */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] hover:-translate-y-1.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="rounded-xl border border-[#080808] bg-[#FEF189] px-2.5 py-1 font-heading text-xs font-extrabold text-[#080808]">
                PREPARE FIRST
              </span>
              <span className="font-mono text-xs font-bold text-[#080808]">
                72% Readiness
              </span>
            </div>
            <h4 className="font-heading text-lg font-extrabold text-[#080808] leading-snug">
              India AI Research Fellowship
            </h4>
            <p className="text-xs font-semibold text-[#777777] mt-0.5">Adobe Research • Bengaluru / Remote</p>
            <div className="mt-3 text-xs text-[#080808]/85 leading-relaxed">
              Strong PyTorch and computer vision projects. Gap-to-action generated: add 1 conference pre-print.
            </div>
            <div className="mt-4 pt-3 border-t border-[#D8D5CE] flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold text-[#163824]">✓ Research Portal</span>
              <span className="font-mono text-[11px] text-[#777777]">3 Action Items</span>
            </div>
          </div>

          {/* Card 3: Seniority Blocker Card */}
          <div className="rounded-3xl border-2 border-[#080808] bg-[#FFE4E6]/40 p-6 shadow-[5px_5px_0px_#080808] hover:-translate-y-1.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="rounded-xl border border-[#991B1B] bg-[#FFE4E6] px-2.5 py-1 font-heading text-xs font-extrabold text-[#991B1B]">
                SKIP (Hard Blocked)
              </span>
              <span className="font-mono text-xs font-bold text-[#991B1B]">
                0% Eligibility
              </span>
            </div>
            <h4 className="font-heading text-lg font-extrabold text-[#080808] leading-snug">
              Engineering Manager, ML
            </h4>
            <p className="text-xs font-semibold text-[#777777] mt-0.5">Stripe • Remote</p>
            <div className="mt-3 text-xs text-[#080808]/85 leading-relaxed">
              Requires 6+ years people management. Student seniority guardrail drops score to prevent wasted effort.
            </div>
            <div className="mt-4 pt-3 border-t border-[#991B1B]/30 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold text-[#991B1B]">🛡️ Student Protected</span>
              <span className="font-mono text-[11px] text-[#777777]">Zero False Hopes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The Core Problem vs. The Prospect Paradigm */}
      <section id="problem" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FEF189] px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Why College Job Hunting Is Broken</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#080808]">
            The Conventional Search Trap vs. Prospect
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            Students submit hundreds of blind applications into ATS black holes. Here is why keyword matching fails, and how evidence-based intelligence solves it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card Left: The Broken Status Quo */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-7 shadow-[5px_5px_0px_#080808] space-y-5">
            <div className="flex items-center gap-3 border-b-2 border-[#080808] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#FFE4E6] text-[#991B1B]">
                ✕
              </div>
              <div>
                <h3 className="font-heading text-xl font-extrabold text-[#080808]">
                  Conventional Job Boards
                </h3>
                <span className="text-xs text-[#777777] font-medium">LinkedIn, Indeed, Handshake keyword spam</span>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-start gap-3 text-[#080808]/80">
                <span className="text-red-500 font-extrabold mt-0.5">✕</span>
                <span><strong>Blind Keyword Spraying:</strong> Ranks jobs by buzzword frequency, matching senior architectures to sophomores.</span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]/80">
                <span className="text-red-500 font-extrabold mt-0.5">✕</span>
                <span><strong>Ghost Jobs & Expired Links:</strong> 35% of listings are already closed, dead, or scraping third-party clickbait.</span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]/80">
                <span className="text-red-500 font-extrabold mt-0.5">✕</span>
                <span><strong>Mistagged Senior Roles:</strong> Staff and Director roles dumped into &quot;Entry Level&quot; search filters.</span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]/80">
                <span className="text-red-500 font-extrabold mt-0.5">✕</span>
                <span><strong>Zero Actionability:</strong> Rejections give zero feedback on what skills or projects would actually turn a &quot;No&quot; into a &quot;Yes&quot;.</span>
              </li>
            </ul>
          </div>

          {/* Card Right: Prospect Intelligence */}
          <div className="rounded-3xl border-2 border-[#080808] bg-[#E0FB66]/20 p-7 shadow-[5px_5px_0px_#080808] space-y-5">
            <div className="flex items-center gap-3 border-b-2 border-[#080808] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]">
                ✓
              </div>
              <div>
                <h3 className="font-heading text-xl font-extrabold text-[#080808]">
                  Prospect Career Agent
                </h3>
                <span className="text-xs text-[#163824] font-bold">Evidence-backed student decision intelligence</span>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span><strong>Verified Fact Extraction:</strong> Separates direct academic code repositories from coursework, isolating real demonstrated skills.</span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span><strong>Seniority Hard Blockers:</strong> Multi-factor classifier automatically filters out senior and management roles for students.</span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span><strong>Zero Hallucination Guarantee:</strong> Real verified URLs only. Unknown deadlines stay marked as Rolling — never invented.</span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span><strong>Grounded Prep Roadmaps:</strong> Generates concrete engineering milestones and verified resume bullets to bridge missing skills.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: Career Outlook — 3 Dimensional Pathways */}
      <section id="outlook" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <Compass className="h-3.5 w-3.5" />
            <span>Directional Intelligence</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#080808]">
            The Career Outlook Experience
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            Before spraying applications, students must understand what roles their verified work actually supports. Prospect synthesizes your background into 3 distinct trajectories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Pathway 1 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#777777]">Pathway 01</span>
                <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold">
                  Strong Evidence
                </span>
              </div>
              <h3 className="font-heading text-xl font-extrabold text-[#080808]">
                ML Systems / AI Research
              </h3>
              <p className="text-xs text-[#777777] mt-1">
                Optimizing neural network training throughput, CUDA kernels, and model distillation.
              </p>

              <div className="mt-5 space-y-2 text-xs">
                <div className="font-heading font-extrabold text-[#080808]">Demonstrated Evidence:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">PyTorch</span>
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">CUDA</span>
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">Transformers</span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs">
                <div className="font-heading font-extrabold text-[#777777]">Prerequisite Gaps:</div>
                <p className="text-[#080808]/80 text-[11px]">Triton flash-attention kernels, distributed DP/TP scaling.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D8D5CE] flex items-center justify-between">
              <span className="font-heading text-xs font-bold text-[#080808]">Targeting: Fellowships & Labs</span>
              <ArrowRight className="h-4 w-4 text-[#080808]" />
            </div>
          </div>

          {/* Pathway 2 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#777777]">Pathway 02</span>
                <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold">
                  Strong Evidence
                </span>
              </div>
              <h3 className="font-heading text-xl font-extrabold text-[#080808]">
                Distributed Systems / Backend
              </h3>
              <p className="text-xs text-[#777777] mt-1">
                High-throughput distributed storage, consensus protocols, and low-latency RPC APIs.
              </p>

              <div className="mt-5 space-y-2 text-xs">
                <div className="font-heading font-extrabold text-[#080808]">Demonstrated Evidence:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">Go / C++</span>
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">Raft Consensus</span>
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">Docker</span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs">
                <div className="font-heading font-extrabold text-[#777777]">Prerequisite Gaps:</div>
                <p className="text-[#080808]/80 text-[11px]">Kafka event streaming, production observability with OpenTelemetry.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D8D5CE] flex items-center justify-between">
              <span className="font-heading text-xs font-bold text-[#080808]">Targeting: Infrastructure Interns</span>
              <ArrowRight className="h-4 w-4 text-[#080808]" />
            </div>
          </div>

          {/* Pathway 3 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#777777]">Pathway 03</span>
                <span className="rounded-full bg-[#FEF189] border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold">
                  Moderate Evidence
                </span>
              </div>
              <h3 className="font-heading text-xl font-extrabold text-[#080808]">
                Full-Stack AI Application Eng
              </h3>
              <p className="text-xs text-[#777777] mt-1">
                Modern reactive user interfaces, streaming LLM completions, and vector database retrieval.
              </p>

              <div className="mt-5 space-y-2 text-xs">
                <div className="font-heading font-extrabold text-[#080808]">Demonstrated Evidence:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">TypeScript</span>
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">Next.js</span>
                  <span className="rounded-md border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 font-mono text-[11px]">PostgreSQL</span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs">
                <div className="font-heading font-extrabold text-[#777777]">Prerequisite Gaps:</div>
                <p className="text-[#080808]/80 text-[11px]">LangChain or LlamaIndex RAG pipelines, evaluations harness.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D8D5CE] flex items-center justify-between">
              <span className="font-heading text-xs font-bold text-[#080808]">Targeting: Product & AI Roles</span>
              <ArrowRight className="h-4 w-4 text-[#080808]" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The 4-Way Decision Matrix (Interactive Simulator) */}
      <section id="simulator" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="max-w-6xl mx-auto">
          <InteractiveOpportunitySimulator />
        </div>
      </section>

      {/* Section 5: Anti-Hallucination & Seniority Protection System */}
      <section id="guardrails" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FFE4E6] px-3 py-0.5 text-xs font-heading font-extrabold text-[#991B1B] shadow-[2px_2px_0px_#080808]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Strict Operational Invariants</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#080808]">
            Three Non-Negotiable System Guardrails
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            Engineered from day one to protect student candidates from false hope, wasted applications, and hallucinated data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Guardrail 1 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#FFE4E6] text-[#991B1B]">
              <Lock className="h-6 w-6 stroke-[2.2]" />
            </div>
            <h3 className="font-heading text-xl font-extrabold text-[#080808]">
              Seniority Hard Blocker
            </h3>
            <p className="text-xs sm:text-sm text-[#080808]/85 leading-relaxed">
              If an opportunity requires Manager, Director, Principal, or Staff seniority, eligibility drops to <strong>0%</strong>, capping the score at 35 and enforcing <strong>SKIP</strong>. Students are never deceived by 90% skill matches on executive roles.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-[#991B1B] flex items-center gap-1.5">
              <span>✓ Verified in seniority-scoring.test.ts</span>
            </div>
          </div>

          {/* Guardrail 2 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#FEF189] text-[#080808]">
              <Clock className="h-6 w-6 stroke-[2.2]" />
            </div>
            <h3 className="font-heading text-xl font-extrabold text-[#080808]">
              Zero-Hallucination Deadlines
            </h3>
            <p className="text-xs sm:text-sm text-[#080808]/85 leading-relaxed">
              When an employer posting omits an explicit application deadline, Prospect preserves it cleanly as <strong>Rolling / Unknown</strong>. The LLM is strictly prohibited from guessing or fabricating application cutoff dates.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-[#163824] flex items-center gap-1.5">
              <span>✓ Verified across 145+ live postings</span>
            </div>
          </div>

          {/* Guardrail 3 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808]">
              <Building className="h-6 w-6 stroke-[2.2]" />
            </div>
            <h3 className="font-heading text-xl font-extrabold text-[#080808]">
              Search Diversity Capping
            </h3>
            <p className="text-xs sm:text-sm text-[#080808]/85 leading-relaxed">
              No single organization (e.g. Stripe, Amazon) is permitted to occupy more than <strong>3 slots in the top 10 search results</strong>. Concentration metrics guarantee candidate exposure to diverse company stages and sectors.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-[#163824] flex items-center gap-1.5">
              <span>✓ Verified in diversity-concentration.test.ts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Gap-to-Action Preparation Studio */}
      <section id="prep-studio" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="max-w-5xl mx-auto">
          <InteractivePrepStudioMockup />
        </div>
      </section>

      {/* Section 7: Deep Architecture & Engineering Pillars */}
      <section id="architecture" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="max-w-6xl mx-auto">
          <SystemArchitecture3DViewer />
        </div>
      </section>

      {/* Section 8: FAQ & Technical Integrity */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-white px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <span>Frequently Answered Architecture Questions</span>
          </div>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#080808]">
            Built with Engineering Rigor
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How does Prospect prevent LLM hallucinations when evaluating matches?",
              a: "Prospect uses a strict hybrid decision engine. LLM calls are bounded by deterministic rule verifiers, schema validation with Zod, and explicit evidence checks. Missing skills, deadlines, and requirements are never filled in by generative speculation.",
            },
            {
              q: "Can unauthenticated callers impersonate user accounts or steal sessions?",
              a: "No. The session exchange route (/api/auth/session) strictly rejects client-supplied userIds unless accompanied by an authorized server exchange secret. Public self-registration mints unguessable usr_... UUIDs, and token revocation persists to disk across restarts.",
            },
            {
              q: "How does the durable worker recover if the server crashes mid-search?",
              a: "The durable worker uses 60-second atomic leases backed by database task rows. If a worker process dies, a successor worker claims expired leases and resumes execution directly from the last recorded step checkpoint without creating duplicate applications.",
            },
            {
              q: "Does Prospect work with both local development and production cloud databases?",
              a: "Yes. src/lib/db.ts dynamically selects the appropriate Prisma Client at runtime: @prisma/client-postgresql for live PostgreSQL staging and production databases, and @prisma/client for local SQLite development.",
            },
          ].map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border-2 border-[#080808] bg-white shadow-[3px_3px_0px_#080808] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-heading text-sm sm:text-base font-extrabold text-[#080808] hover:bg-[#FDF9F3] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#080808]/85 leading-relaxed border-t border-[#D8D5CE]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Grand Finale Billboard Call to Action */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl border-3 border-[#080808] bg-[#E0FB66] p-8 sm:p-14 text-center shadow-[8px_8px_0px_#080808] space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-white px-4 py-1 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>START DISCOVERING OPPORTUNITIES WORTH PURSUING</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#080808] tracking-tight max-w-3xl mx-auto leading-tight">
            Stop guessing keywords. Start evidencing direction.
          </h2>

          <p className="text-sm sm:text-lg text-[#080808]/85 font-semibold max-w-2xl mx-auto">
            Upload your resume once. Receive your personalized Career Outlook, 4-way decision intelligence, and verified live opportunities in seconds.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/?tab=profile"
              className="inline-flex items-center gap-2.5 rounded-2xl border-3 border-[#080808] bg-[#080808] px-8 py-4 font-heading text-base font-extrabold text-white shadow-[4px_4px_0px_#FFFFFF] hover:-translate-y-1 transition-all"
            >
              <span>Upload Resume & Start Free</span>
              <ArrowRight className="h-5 w-5 text-[#E0FB66]" />
            </Link>

            <Link
              href="/?tab=discover"
              className="inline-flex items-center gap-2.5 rounded-2xl border-3 border-[#080808] bg-white px-7 py-4 font-heading text-base font-extrabold text-[#080808] shadow-[4px_4px_0px_#080808] hover:bg-[#FEF189] hover:-translate-y-1 transition-all"
            >
              <span>Explore Live Opportunities Index</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-[#080808] bg-[#FDF9F3] py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#777777]">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#080808] text-white font-heading font-extrabold text-sm">
              P
            </div>
            <div>
              <span className="font-heading font-extrabold text-[#080808] text-sm">PROSPECT</span>
              <p className="text-[11px] text-[#777777]">
                Evidence-Based Career Opportunity Discovery Agent for Students
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-heading font-bold text-[#080808]">
            <Link href="/?tab=discover" className="hover:underline">Discover</Link>
            <Link href="/?tab=outlook" className="hover:underline">Career Outlook</Link>
            <Link href="/?tab=tracker" className="hover:underline">Tracker</Link>
            <Link href="/?tab=prep" className="hover:underline">Prep Studio</Link>
            <Link href="/?tab=agent" className="hover:underline">Agent Activity</Link>
            <Link href="/api/status" className="font-mono text-xs hover:underline text-[#163824]">
              ● System Status API
            </Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-[#777777]">
            208 / 208 Automated Tests Verified • Zero Hallucinations Guaranteed
          </div>
        </div>
      </footer>
    </div>
  );
}
