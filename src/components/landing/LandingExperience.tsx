"use strict";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  GraduationCap,
  ChevronDown,
  Lock,
  Zap,
  Building,
  Check,
  Award,
  Clock,
} from "lucide-react";
import { ThreeCanvas } from "./ThreeCanvas";
import { InteractiveOpportunitySimulator } from "./InteractiveOpportunitySimulator";
import { InteractivePrepStudioMockup } from "./InteractivePrepStudioMockup";
import { InteractiveTrackerMockup } from "./InteractiveTrackerMockup";
import { InteractiveResumeMockup } from "./InteractiveResumeMockup";
import { useScrollReveal } from "./useScrollReveal";

const HIRING_COMPANIES = [
  { name: "OpenAI", logo: "/logo_openai.png" },
  { name: "Stripe", logo: "/logo_stripe.png" },
  { name: "Databricks", logo: "/brand_drawer_openai.png" },
  { name: "Figma", logo: "/logo_figma.png" },
  { name: "Google", logo: "/logo_google.png" },
  { name: "Meta", logo: "/logo_meta.png" },
  { name: "Microsoft", logo: "/logo_microsoft.png" },
  { name: "Notion", logo: "/logo_notion.png" },
  { name: "Adobe", logo: "/logo_adobe.png" },
  { name: "Amazon", logo: "/logo_amazon.png" },
];

const STUDENT_STORIES = [
  {
    quote:
      "Instead of sending 250 blind applications on LinkedIn, I applied to 9 roles Prospect recommended as APPLY NOW. Got 4 first-rounds and accepted my Summer ML Systems internship at Databricks.",
    author: "Alex C.",
    school: "UC Berkeley '26",
    role: "ML Systems Intern @ Databricks",
    highlight: "4 First-Rounds from 9 Applications",
  },
  {
    quote:
      "The Seniority Shield is a lifesaver. Traditional boards kept recommending Engineering Manager roles because I have Python listed. Prospect filtered out the noise and showed me real junior systems roles.",
    author: "Maya P.",
    school: "Stanford University '25",
    role: "Backend Infrastructure Intern @ Stripe",
    highlight: "Zero Wasted Senior Applications",
  },
  {
    quote:
      "The Preparation Studio gave me 3 concrete project tasks to turn a PREPARE FIRST into an APPLY NOW. I built the recommended Triton benchmark in one weekend and discussed it in my technical interview.",
    author: "Rahul S.",
    school: "Carnegie Mellon '25",
    role: "AI Research Fellow @ Adobe",
    highlight: "Bridged Skill Gaps in 1 Weekend",
  },
];

const FAQS = [
  {
    q: "What makes Prospect different from LinkedIn or Handshake?",
    a: "Standard job boards match keywords blindly — dumping Staff Engineer and Manager roles onto college sophomores. Prospect acts as your autonomous career agent: it analyzes your verified projects, generates 3 distinct career pathways, filters out senior roles with a strict Seniority Shield, and gives you clear 4-way decisions (Apply Now, Prepare First, Keep Watching, Skip) with actionable prep steps.",
  },
  {
    q: "How does the 4-Way Decision Engine work?",
    a: "Prospect doesn't just show a list of jobs. For every discovered opportunity, it calculates your readiness and assigns one of four outcomes: APPLY NOW (high match, active link), PREPARE FIRST (promising match with concrete missing skills to learn), KEEP WATCHING (great upcoming cycles or bookmarks), or SKIP (roles that require managerial tenure or misaligned skills).",
  },
  {
    q: "How does Prospect protect me from fake or ghost jobs?",
    a: "Prospect indexes direct company applicant portals (Greenhouse, Lever, Ashby, official career boards) and verifies links live. When an employer does not specify a hard deadline, Prospect preserves it cleanly as 'Rolling' rather than fabricating a cutoff date.",
  },
  {
    q: "Is Prospect free for college students and recent graduates?",
    a: "Yes. Prospect is built specifically to level the playing field for students and early-career engineers. You can upload your resume, receive your Career Outlook, discover opportunities, use the Preparation Studio, and track applications completely free.",
  },
  {
    q: "Can I track applications I find outside of Prospect?",
    a: "Absolutely. The built-in Kanban Application Tracker allows you to track both opportunities discovered through Prospect and external applications with custom notes, stages, deadlines, and salary insights.",
  },
];

export function LandingExperience() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Initialize the smooth IntersectionObserver scroll reveal system
  useScrollReveal();

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
      {/* 3D WebGL Background Canvas (Interactive Spline) */}
      <ThreeCanvas scrollProgress={scrollProgress} />

      {/* Floating Glass Navigation Header */}
      <header className="sticky top-4 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-2xl border-2 border-[#080808] bg-[#FDF9F3]/90 backdrop-blur-md px-4 py-3 shadow-[4px_4px_0px_#080808]">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            {/* Custom Logo Door Portal */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66] group-hover:-translate-y-0.5 transition-transform overflow-hidden">
              <div className="absolute inset-y-1.5 left-2 right-2 rounded-sm border border-[#E0FB66] bg-[#080808] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#E0FB66] animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-extrabold tracking-tight text-[#080808]">
                Prospect
              </span>
              <span className="text-[10px] font-heading font-extrabold text-[#777777] -mt-1 hidden sm:inline uppercase tracking-wider">
                Your AI Career Companion
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-heading font-extrabold text-[#080808]">
            <a href="#how-it-works" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              How It Works
            </a>
            <a href="#decision-matrix" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              4-Way Decision Engine
            </a>
            <a href="#prep-studio" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              Preparation Studio
            </a>
            <a href="#tracker" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              Application Tracker
            </a>
            <a href="#stories" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              Student Stories
            </a>
            <a href="#faq" className="hover:text-[#080808] hover:underline underline-offset-4 transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <Link
              href="/?tab=discover"
              className="hidden sm:inline-flex rounded-xl border-2 border-[#080808] bg-white px-3.5 py-1.5 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] transition-all"
            >
              Explore Live Roles
            </Link>
            <Link
              href="/?tab=profile"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-4 py-2 font-heading text-xs font-extrabold text-[#080808] shadow-[3px_3px_0px_#080808] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#080808] transition-all"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-14 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-white px-4 py-1.5 font-heading text-xs font-extrabold shadow-[3px_3px_0px_#080808] reveal-init">
            <span className="h-2 w-2 rounded-full bg-[#E0FB66] animate-pulse" />
            <span>THE ALL-IN-ONE CAREER DISCOVERY AGENT FOR STUDENTS & NEW GRADS</span>
          </div>

          {/* Display Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#080808] leading-[1.08] reveal-init delay-150">
            Stop blind-applying.{" "}
            <span className="inline-block rounded-2xl border-3 border-[#080808] bg-[#E0FB66] px-4 py-1 shadow-[5px_5px_0px_#080808] mt-2 rotate-[-1deg]">
              Discover your true direction.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-[#080808]/85 font-medium max-w-3xl mx-auto leading-relaxed pt-2 reveal-init delay-225">
            Generic job boards spam students with hundreds of ghost jobs and mistagged manager roles.
            Prospect parses your real coursework and projects, models 3 tailored career pathways, evaluates live postings with 4-way decision clarity, and provides guaranteed seniority protection.
          </p>

          {/* Primary Action Button Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 reveal-init delay-300">
            <Link
              href="/?tab=profile"
              className="inline-flex items-center gap-2.5 rounded-2xl border-3 border-[#080808] bg-[#080808] px-8 py-4 font-heading text-base font-extrabold text-white shadow-[5px_5px_0px_#E0FB66] hover:-translate-y-1 hover:shadow-[7px_7px_0px_#E0FB66] transition-all cursor-pointer"
            >
              <span>Upload Resume & Start Free</span>
              <ArrowRight className="h-5 w-5 text-[#E0FB66]" />
            </Link>

            <a
              href="#decision-matrix"
              className="inline-flex items-center gap-2 rounded-2xl border-3 border-[#080808] bg-white px-6 py-4 font-heading text-base font-extrabold text-[#080808] shadow-[5px_5px_0px_#080808] hover:bg-[#FEF189] hover:-translate-y-1 transition-all cursor-pointer"
            >
              <Zap className="h-5 w-5 text-[#080808]" />
              <span>Try Decision Simulator</span>
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="pt-8 reveal-scale-init delay-375">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  100%
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Verified Active Links
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  3 Pathways
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Tailored Trajectories
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  4 Decisions
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Apply • Prep • Watch • Skip
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808] text-center">
                <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
                  0 Fake
                </div>
                <div className="text-[11px] font-heading font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                  Hallucinated Cutoffs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Logos Continuous Marquee */}
        <div className="mt-16 pt-8 border-t-2 border-[#080808] reveal-init">
          <div className="text-center mb-5">
            <span className="font-heading text-xs font-extrabold text-[#777777] uppercase tracking-widest">
              Indexing Live Student & New Grad Roles At Industry Leaders
            </span>
          </div>

          <div className="relative overflow-hidden w-full py-3">
            <div className="animate-marquee flex items-center gap-10">
              {[...HIRING_COMPANIES, ...HIRING_COMPANIES].map((company, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border-2 border-[#080808] bg-white px-5 py-2.5 shadow-[3px_3px_0px_#080808] shrink-0 hover:bg-[#FEF189] transition-colors"
                >
                  <div className="h-6 w-6 relative flex items-center justify-center">
                    <span className="font-heading font-extrabold text-sm">{company.name[0]}</span>
                  </div>
                  <span className="font-heading text-sm font-extrabold text-[#080808]">
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: The Broken College Search vs Prospect */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3 reveal-init">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FEF189] px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>The Reality of College Recruiting</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#080808]">
            The 300-Application Grind Is Broken
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            Why spraying random resumes into automated ATS filters wastes months of your time, and how Prospect gives you an unfair advantage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* The Broken Way */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-7 shadow-[5px_5px_0px_#080808] space-y-5 reveal-left-init">
            <div className="flex items-center gap-3 border-b-2 border-[#080808] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#FFE4E6] text-[#991B1B] font-extrabold text-lg">
                ✕
              </div>
              <div>
                <h3 className="font-heading text-xl font-extrabold text-[#080808]">
                  The Traditional College Job Hunt
                </h3>
                <span className="text-xs text-[#777777] font-medium">LinkedIn, Indeed & Keyword Job Boards</span>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm">
              <li className="flex items-start gap-3 text-[#080808]/85">
                <span className="text-red-500 font-extrabold mt-0.5 text-base">✕</span>
                <span>
                  <strong>Blind Spray-and-Pray:</strong> Submitting 200+ applications without knowing if you actually fit the team&apos;s real requirements.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]/85">
                <span className="text-red-500 font-extrabold mt-0.5 text-base">✕</span>
                <span>
                  <strong>Mistagged Senior Roles:</strong> Staff and Manager listings tagged as &quot;Entry Level&quot;, getting students auto-rejected.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]/85">
                <span className="text-red-500 font-extrabold mt-0.5 text-base">✕</span>
                <span>
                  <strong>Ghost Postings & Dead Links:</strong> Stale aggregator listings that are already filled or expired months ago.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]/85">
                <span className="text-red-500 font-extrabold mt-0.5 text-base">✕</span>
                <span>
                  <strong>Zero Actionable Guidance:</strong> Generic automated rejections that never explain what project or skill would make you qualified.
                </span>
              </li>
            </ul>
          </div>

          {/* The Prospect Solution */}
          <div className="rounded-3xl border-2 border-[#080808] bg-[#E0FB66]/20 p-7 shadow-[5px_5px_0px_#080808] space-y-5 reveal-right-init">
            <div className="flex items-center gap-3 border-b-2 border-[#080808] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]">
                <Check className="h-5 w-5 text-[#080808] stroke-[3]" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-extrabold text-[#080808]">
                  The Prospect Intelligence Experience
                </h3>
                <span className="text-xs text-[#163824] font-bold">Your Personal AI Career Companion</span>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm">
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span>
                  <strong>Evidence-Backed Matching:</strong> Analyzes your verified GitHub code and coursework to surface roles where you genuinely stand out.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span>
                  <strong>Guaranteed Seniority Protection:</strong> Automatically flags and blocks executive and management roles from early-talent feeds.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span>
                  <strong>Direct Verified Postings Only:</strong> Live feeds from Greenhouse, Lever, Ashby, and company portals. No ghost jobs.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[#080808]">
                <Check className="h-4 w-4 text-[#163824] shrink-0 mt-0.5 stroke-[3]" />
                <span>
                  <strong>Concrete Preparation Roadmaps:</strong> Bridges skill gaps with 4-hour weekend projects and tailored resume bullet points.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works — Step-by-Step Interactive Product Tour */}
      <section id="how-it-works" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3 reveal-init">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <Layers className="h-3.5 w-3.5" />
            <span>Complete Candidate Journey</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#080808]">
            How Prospect Powers Your Career Search
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            From resume upload to interview offer — explore the exact interactive tools students use to land top internships and new grad offers.
          </p>
        </div>

        {/* STEP 1: Smart Resume Superpower Extraction */}
        <div className="mb-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto reveal-init">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#080808] text-[#E0FB66] font-heading font-extrabold text-sm shadow-[2px_2px_0px_#E0FB66]">
                01
              </span>
              <div>
                <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#080808]">
                  Smart Resume Superpower Extraction
                </h3>
                <p className="text-xs sm:text-sm text-[#777777]">
                  Extract verified capabilities, separate coursework from GitHub projects, and isolate real technical strengths.
                </p>
              </div>
            </div>

            <Link
              href="/?tab=profile"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-white px-3.5 py-1.5 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] transition-all self-start sm:self-auto"
            >
              <span>Test with Your Resume</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="max-w-5xl mx-auto reveal-scale-init delay-150">
            <InteractiveResumeMockup />
          </div>
        </div>

        {/* STEP 2: The 3-Dimensional Career Outlook */}
        <div className="mb-20 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto reveal-init">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#080808] text-[#E0FB66] font-heading font-extrabold text-sm shadow-[2px_2px_0px_#E0FB66]">
                02
              </span>
              <div>
                <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#080808]">
                  3-Dimensional Career Outlook
                </h3>
                <p className="text-xs sm:text-sm text-[#777777]">
                  Prospect models your background into 3 clear trajectories so you target high-yield roles instead of random titles.
                </p>
              </div>
            </div>

            <Link
              href="/?tab=outlook"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-white px-3.5 py-1.5 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] transition-all self-start sm:self-auto"
            >
              <span>View Career Outlook</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Pathway 1 */}
            <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] flex flex-col justify-between reveal-init delay-100">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#777777]">Pathway 01</span>
                  <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold">
                    94% Confidence
                  </span>
                </div>
                <h4 className="font-heading text-lg font-extrabold text-[#080808]">
                  ML Systems / AI Research
                </h4>
                <p className="text-xs text-[#777777] mt-1">
                  Optimizing deep learning training throughput, custom CUDA kernels, and LLM inference engines.
                </p>
                <div className="mt-4 pt-3 border-t border-[#D8D5CE] space-y-1.5 text-xs">
                  <div className="font-heading font-extrabold text-[#080808]">Top Target Roles:</div>
                  <div className="text-[#080808]/80 text-[11px]">AI Research Fellow, ML Infrastructure Intern</div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[#D8D5CE] flex items-center justify-between text-xs font-heading font-bold text-[#080808]">
                <span>Sample: OpenAI, Adobe Research</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Pathway 2 */}
            <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] flex flex-col justify-between reveal-init delay-200">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#777777]">Pathway 02</span>
                  <span className="rounded-full bg-[#FEF189] border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold">
                    89% Confidence
                  </span>
                </div>
                <h4 className="font-heading text-lg font-extrabold text-[#080808]">
                  Distributed Systems & Storage
                </h4>
                <p className="text-xs text-[#777777] mt-1">
                  High-throughput distributed storage, consensus protocols (Raft, Paxos), and low-latency network engines.
                </p>
                <div className="mt-4 pt-3 border-t border-[#D8D5CE] space-y-1.5 text-xs">
                  <div className="font-heading font-extrabold text-[#080808]">Top Target Roles:</div>
                  <div className="text-[#080808]/80 text-[11px]">Systems Intern, Cloud Infrastructure Intern</div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[#D8D5CE] flex items-center justify-between text-xs font-heading font-bold text-[#080808]">
                <span>Sample: Databricks, Stripe</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Pathway 3 */}
            <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] flex flex-col justify-between reveal-init delay-300">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#777777]">Pathway 03</span>
                  <span className="rounded-full bg-white border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold">
                    82% Confidence
                  </span>
                </div>
                <h4 className="font-heading text-lg font-extrabold text-[#080808]">
                  Full-Stack AI Application Eng
                </h4>
                <p className="text-xs text-[#777777] mt-1">
                  Interactive real-time user interfaces, streaming completions, agent orchestration, and API services.
                </p>
                <div className="mt-4 pt-3 border-t border-[#D8D5CE] space-y-1.5 text-xs">
                  <div className="font-heading font-extrabold text-[#080808]">Top Target Roles:</div>
                  <div className="text-[#080808]/80 text-[11px]">Product SWE Intern, AI Application Engineer</div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[#D8D5CE] flex items-center justify-between text-xs font-heading font-bold text-[#080808]">
                <span>Sample: Figma, Notion</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: The 4-Way Decision Matrix (Interactive Simulator) */}
        <div id="decision-matrix" className="mb-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-6xl mx-auto reveal-init">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#080808] text-[#E0FB66] font-heading font-extrabold text-sm shadow-[2px_2px_0px_#E0FB66]">
                03
              </span>
              <div>
                <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#080808]">
                  The 4-Way Decision Matrix
                </h3>
                <p className="text-xs sm:text-sm text-[#777777]">
                  Test the live simulator below: toggle between roles to see how Prospect protects candidates and generates instant decisions.
                </p>
              </div>
            </div>

            <Link
              href="/?tab=discover"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-4 py-2 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:-translate-y-0.5 transition-all self-start sm:self-auto"
            >
              <span>Explore 5,000+ Real Postings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="max-w-6xl mx-auto reveal-scale-init delay-150">
            <InteractiveOpportunitySimulator />
          </div>
        </div>

        {/* STEP 4: Gap-to-Action Preparation Studio */}
        <div id="prep-studio" className="mb-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto reveal-init">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#080808] text-[#E0FB66] font-heading font-extrabold text-sm shadow-[2px_2px_0px_#E0FB66]">
                04
              </span>
              <div>
                <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#080808]">
                  Gap-to-Action Preparation Studio
                </h3>
                <p className="text-xs sm:text-sm text-[#777777]">
                  Check off prep milestones to see how your readiness score climbs from 72% to 100% and unlocks proven resume bullets.
                </p>
              </div>
            </div>

            <Link
              href="/?tab=prep"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-white px-3.5 py-1.5 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] transition-all self-start sm:self-auto"
            >
              <span>Launch Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="max-w-5xl mx-auto reveal-scale-init delay-150">
            <InteractivePrepStudioMockup />
          </div>
        </div>

        {/* STEP 5: Student Kanban Application Tracker */}
        <div id="tracker" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto reveal-init">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#080808] text-[#E0FB66] font-heading font-extrabold text-sm shadow-[2px_2px_0px_#E0FB66]">
                05
              </span>
              <div>
                <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#080808]">
                  Built-In Student Application Tracker
                </h3>
                <p className="text-xs sm:text-sm text-[#777777]">
                  Manage all active opportunities across Saved, Applied, Interviewing, and Offers with custom notes and deadlines.
                </p>
              </div>
            </div>

            <Link
              href="/?tab=tracker"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-white px-3.5 py-1.5 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] transition-all self-start sm:self-auto"
            >
              <span>Open My Tracker</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="max-w-5xl mx-auto reveal-scale-init delay-150">
            <InteractiveTrackerMockup />
          </div>
        </div>
      </section>

      {/* Section 3: The 4 Non-Negotiable Student Safeguards */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3 reveal-init">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FFE4E6] px-3 py-0.5 text-xs font-heading font-extrabold text-[#991B1B] shadow-[2px_2px_0px_#080808]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Built For Student Peace of Mind</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#080808]">
            Four Guardrails That Protect Your Time
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            College students have exams, project deadlines, and classes. You should never waste precious hours applying to misleading postings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Safeguard 1 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] space-y-3 flex flex-col justify-between reveal-init delay-100">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#FFE4E6] text-[#991B1B] mb-4">
                <Lock className="h-5 w-5 stroke-[2.2]" />
              </div>
              <h3 className="font-heading text-lg font-extrabold text-[#080808]">
                Seniority Shield
              </h3>
              <p className="text-xs text-[#080808]/85 leading-relaxed mt-1">
                Hard-blocks Manager, Director, Staff, and 6+ YOE roles. Never get deceived by a high keyword match on an executive listing.
              </p>
            </div>
            <div className="pt-3 border-t border-[#D8D5CE] text-[11px] font-heading font-extrabold text-[#991B1B]">
              🛡️ Zero False Hope
            </div>
          </div>

          {/* Safeguard 2 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] space-y-3 flex flex-col justify-between reveal-init delay-200">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#FEF189] text-[#080808] mb-4">
                <Clock className="h-5 w-5 stroke-[2.2]" />
              </div>
              <h3 className="font-heading text-lg font-extrabold text-[#080808]">
                Real Deadlines Only
              </h3>
              <p className="text-xs text-[#080808]/85 leading-relaxed mt-1">
                If a company omits a deadline, Prospect marks it as Rolling — never fabricating fake cutoffs or hallucinating dates.
              </p>
            </div>
            <div className="pt-3 border-t border-[#D8D5CE] text-[11px] font-heading font-extrabold text-[#163824]">
              ✓ Verified Timelines
            </div>
          </div>

          {/* Safeguard 3 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] space-y-3 flex flex-col justify-between reveal-init delay-300">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] mb-4">
                <Building className="h-5 w-5 stroke-[2.2]" />
              </div>
              <h3 className="font-heading text-lg font-extrabold text-[#080808]">
                Employer Diversity
              </h3>
              <p className="text-xs text-[#080808]/85 leading-relaxed mt-1">
                Strict limits prevent any single employer from monopolizing search results, giving you balanced exposure to diverse teams.
              </p>
            </div>
            <div className="pt-3 border-t border-[#D8D5CE] text-[11px] font-heading font-extrabold text-[#163824]">
              ✓ Broad Exposure
            </div>
          </div>

          {/* Safeguard 4 */}
          <div className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[5px_5px_0px_#080808] space-y-3 flex flex-col justify-between reveal-init delay-400">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#080808] bg-white text-[#080808] mb-4">
                <Award className="h-5 w-5 stroke-[2.2]" />
              </div>
              <h3 className="font-heading text-lg font-extrabold text-[#080808]">
                Actionable Feedback
              </h3>
              <p className="text-xs text-[#080808]/85 leading-relaxed mt-1">
                When a role isn&apos;t an instant APPLY NOW, Prospect creates a concrete 3-step action roadmap to turn that gap into a qualified offer.
              </p>
            </div>
            <div className="pt-3 border-t border-[#D8D5CE] text-[11px] font-heading font-extrabold text-[#163824]">
              ✓ Gaps to Offers
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Student Success Stories & Social Proof */}
      <section id="stories" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3 reveal-init">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-white px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Proven Student Outcomes</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#080808]">
            Loved by Students Across Top Universities
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            Real stories from candidates who cut through the noise and landed competitive internships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {STUDENT_STORIES.map((story, idx) => (
            <div
              key={idx}
              className="rounded-3xl border-2 border-[#080808] bg-white p-7 shadow-[5px_5px_0px_#080808] flex flex-col justify-between space-y-5 reveal-init"
              style={{ transitionDelay: `${(idx + 1) * 120}ms` }}
            >
              <div className="space-y-4">
                <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-3 py-1 font-heading text-xs font-extrabold inline-block">
                  {story.highlight}
                </span>
                <p className="text-xs sm:text-sm text-[#080808]/85 leading-relaxed italic">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8D5CE] flex items-center justify-between">
                <div>
                  <div className="font-heading text-sm font-extrabold text-[#080808]">
                    {story.author}
                  </div>
                  <div className="text-xs font-bold text-[#777777]">{story.school}</div>
                  <div className="text-[11px] font-semibold text-[#163824] mt-0.5">{story.role}</div>
                </div>
                <div className="h-9 w-9 rounded-xl border border-[#080808] bg-[#FDF9F3] flex items-center justify-center font-heading font-extrabold text-sm">
                  {story.author[0]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Student FAQ */}
      <section id="faq" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t-2 border-[#080808]">
        <div className="text-center mb-12 space-y-2 reveal-init">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-white px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#080808]">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border-2 border-[#080808] bg-white shadow-[3px_3px_0px_#080808] overflow-hidden reveal-init"
                style={{ transitionDelay: `${index * 80}ms` }}
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

      {/* Section 6: Grand Finale Billboard Call to Action */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl border-3 border-[#080808] bg-[#E0FB66] p-8 sm:p-14 text-center shadow-[8px_8px_0px_#080808] space-y-6 reveal-scale-init">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-white px-4 py-1 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>START DISCOVERING OPPORTUNITIES WORTH PURSUING</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#080808] tracking-tight max-w-3xl mx-auto leading-tight">
            Stop guessing keywords. Start discovering direction.
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
              <span>Explore Live Opportunities</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-[#080808] bg-[#FDF9F3] py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#777777]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#080808] text-white font-heading font-extrabold text-sm shadow-[1.5px_1.5px_0px_#E0FB66]">
              P
            </div>
            <div>
              <span className="font-heading font-extrabold text-[#080808] text-sm">PROSPECT</span>
              <p className="text-[11px] text-[#777777]">
                Your AI Career Companion — Discover • Match • Prepare • Track
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-heading font-bold text-[#080808]">
            <Link href="/?tab=profile" className="hover:underline">Resume & Profile</Link>
            <Link href="/?tab=outlook" className="hover:underline">Career Outlook</Link>
            <Link href="/?tab=discover" className="hover:underline">Opportunity Discovery</Link>
            <Link href="/?tab=prep" className="hover:underline">Preparation Studio</Link>
            <Link href="/?tab=tracker" className="hover:underline">Application Tracker</Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-[#777777]">
            © {new Date().getFullYear()} Prospect • Evidence-Backed Student Career Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}
