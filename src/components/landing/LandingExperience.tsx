"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Menu, X, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { NavTab } from "../Sidebar";
import { ProspectLogo } from "./ProspectLogo";
import { ProspectPortal3D } from "./ProspectPortal3D";
import { HeroFloatingOverlay } from "./HeroFloatingOverlay";
import { FeatureStrip } from "./FeatureStrip";
import { ThreeFeaturesCards } from "./ThreeFeaturesCards";
import { HowItWorksWorkflow } from "./HowItWorksWorkflow";
import { ProductDashboardPreview } from "./ProductDashboardPreview";
import { FinalCtaSection } from "./FinalCtaSection";
import { ProspectFooter } from "./ProspectFooter";
import { CursorTrail } from "./CursorTrail";
import { FallingGoodies, GoofyEyeCompanion } from "./FallingGoodies";
import { ScrollProgressBar } from "./ScrollEnhancements";
import { InfiniteMarquee } from "./InfiniteMarquee";
import {
  useScrollAnimationEngine,
  ScrollParallax,
  ScrollReveal,
} from "./ScrollAnimationEngine";
import { AuthModal } from "../auth/AuthModal";

interface LandingExperienceProps {
  onLaunchApp?: (tab?: NavTab) => void;
  onOpenAuth?: (mode?: "signin" | "signup", targetTab?: NavTab) => void;
  isAuthenticated?: boolean;
}

export function LandingExperience({
  onLaunchApp,
  onOpenAuth,
  isAuthenticated = false,
}: LandingExperienceProps = {}) {
  // Initialize master GSAP ScrollTrigger animation engine
  useScrollAnimationEngine({ refreshOnResize: true });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalAuthOpen, setInternalAuthOpen] = useState(false);
  const [internalAuthMode, setInternalAuthMode] = useState<"signin" | "signup">("signin");
  const [internalAuthPrompt, setInternalAuthPrompt] = useState<string | undefined>(undefined);
  const [pendingTargetTab, setPendingTargetTab] = useState<NavTab>("discover");

  const heroLeftRef = useRef<HTMLDivElement>(null);
  const heroPortalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const handleLaunch = (tab: NavTab = "discover") => {
    if (onLaunchApp) {
      onLaunchApp(tab);
    } else {
      window.location.href = `/?tab=${tab}`;
    }
  };

  const triggerAuthOrLaunch = (
    mode: "signin" | "signup",
    targetTab: NavTab = "discover",
    promptMsg?: string
  ) => {
    if (isAuthenticated) {
      handleLaunch(targetTab);
      return;
    }

    if (onOpenAuth) {
      onOpenAuth(mode, targetTab);
    } else {
      setInternalAuthMode(mode);
      setPendingTargetTab(targetTab);
      setInternalAuthPrompt(promptMsg);
      setInternalAuthOpen(true);
    }
  };

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Gentle entrance for header
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          y: -12,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      // Smooth entrance for Hero left column
      if (heroLeftRef.current) {
        gsap.from(heroLeftRef.current.children, {
          y: 16,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
        });
      }

      // Entrance for 3D portal container
      if (heroPortalRef.current) {
        gsap.from(heroPortalRef.current, {
          scale: 0.96,
          duration: 0.7,
          ease: "power2.out",
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF9F3] text-[#080808] selection:bg-[#E0FB66] selection:text-[#080808] font-body relative overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 0. GLOBAL MOTION & INTERACTIVE OVERLAYS                       */}
      {/* ------------------------------------------------------------- */}
      {/* Sleek Hardware-Accelerated Scroll Progress Bar fixed to viewport top */}
      <ScrollProgressBar zIndex={100} />

      {/* Lightweight Canvas Cursor Trail with Glow & Click Sparkle Bursts */}
      <CursorTrail />

      {/* Playful Neo-Brutalist Falling Goodies with Gentle Physics */}
      <FallingGoodies autoDrift={true} />

      {/* Interactive Goofy Mascot Sticker with Real-time Googly Eyes */}
      <GoofyEyeCompanion position="bottom-right" />

      {/* ------------------------------------------------------------- */}
      {/* 0.5 FLOATING SCROLL-PARALLAX NEO-BRUTALIST BACKGROUND SHAPES  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
        {/* Shape 1: Electric Lime Asterisk Badge (Hero/Under Marquee - Left) */}
        <ScrollParallax
          speed={0.25}
          rotate={45}
          className="absolute top-[380px] left-2 lg:left-6 xl:left-12 hidden lg:block"
        >
          <div className="w-12 h-12 bg-[#E0FB66] border-2 border-[#080808] rounded-2xl shadow-[4px_4px_0px_#080808] flex items-center justify-center font-heading font-black text-2xl text-[#080808]">
            ✦
          </div>
        </ScrollParallax>

        {/* Shape 2: Neo-Brutalist Pill "0% Ghost Jobs" (Upper Right) */}
        <ScrollParallax
          speed={-0.18}
          rotate={-10}
          className="absolute top-[540px] right-3 lg:right-8 xl:right-16 hidden md:block"
        >
          <div className="bg-white border-2 border-[#080808] rounded-full px-4 py-1.5 shadow-[3.5px_3.5px_0px_#080808] flex items-center gap-2 font-technical text-xs font-bold text-[#080808] uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0FB66] border border-black animate-pulse" />
            0% Ghost Jobs
          </div>
        </ScrollParallax>

        {/* Shape 3: Soft Grid Dots Matrix (Features Section - Left) */}
        <ScrollParallax
          speed={0.14}
          className="absolute top-[1080px] left-3 lg:left-8 opacity-40 hidden sm:block"
        >
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none" className="text-[#080808]">
            <pattern id="grid-dots-features" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="2" fill="currentColor" />
            </pattern>
            <rect width="88" height="88" fill="url(#grid-dots-features)" />
          </svg>
        </ScrollParallax>

        {/* Shape 4: Neo-Brutalist Pill "✦ Match Engine 99%" (Features Section - Right) */}
        <ScrollParallax
          speed={-0.22}
          rotate={15}
          className="absolute top-[1340px] right-2 lg:right-6 xl:right-12 hidden md:block"
        >
          <div className="bg-[#E0FB66] border-2 border-[#080808] rounded-full px-4 py-1.5 shadow-[4px_4px_0px_#080808] flex items-center gap-1.5 font-heading font-extrabold text-xs text-[#080808]">
            <span>✦</span> Match Engine 99%
          </div>
        </ScrollParallax>

        {/* Shape 5: Neo-Brutalist Pill "🛡️ Seniority Shield Active" (Workflow Section - Left) */}
        <ScrollParallax
          speed={0.2}
          rotate={-8}
          className="absolute top-[1840px] left-3 lg:left-8 xl:left-14 hidden lg:block"
        >
          <div className="bg-white border-2 border-[#080808] rounded-2xl px-4 py-2 shadow-[4px_4px_0px_#080808] flex items-center gap-2 font-technical text-xs font-bold text-[#080808]">
            <span>🛡️</span> SENIORITY SHIELD ACTIVE
          </div>
        </ScrollParallax>

        {/* Shape 6: Soft Grid Dots Matrix (Workflow Section - Right) */}
        <ScrollParallax
          speed={-0.16}
          className="absolute top-[2080px] right-3 lg:right-8 opacity-35 hidden sm:block"
        >
          <svg width="104" height="104" viewBox="0 0 104 104" fill="none" className="text-[#080808]">
            <pattern id="grid-dots-workflow" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="2" fill="currentColor" />
            </pattern>
            <rect width="104" height="104" fill="url(#grid-dots-workflow)" />
          </svg>
        </ScrollParallax>

        {/* Shape 7: Electric Lime Asterisk Badge (Dashboard Preview - Left) */}
        <ScrollParallax
          speed={-0.24}
          rotate={25}
          className="absolute top-[2620px] left-2 lg:left-6 xl:left-12 hidden md:block"
        >
          <div className="w-11 h-11 bg-[#E0FB66] border-2 border-[#080808] rounded-xl shadow-[3.5px_3.5px_0px_#080808] flex items-center justify-center font-black text-xl text-[#080808]">
            ✦
          </div>
        </ScrollParallax>

        {/* Shape 8: Neo-Brutalist Pill "⚡ Explainable Fit" (Dashboard Preview - Right) */}
        <ScrollParallax
          speed={0.18}
          rotate={-6}
          className="absolute top-[2880px] right-3 lg:right-8 xl:right-14 hidden lg:block"
        >
          <div className="bg-white border-2 border-[#080808] rounded-full px-4 py-2 shadow-[4px_4px_0px_#E0FB66] flex items-center gap-2 font-heading font-extrabold text-xs text-[#080808]">
            <span className="text-[#080808] font-technical">⚡</span> EXPLAINABLE FIT
          </div>
        </ScrollParallax>

        {/* Shape 9: Neo-Brutalist Pill "🚀 1-Click Prep" (Final CTA - Left) */}
        <ScrollParallax
          speed={0.16}
          rotate={12}
          className="absolute top-[3420px] left-3 lg:left-10 hidden md:block"
        >
          <div className="bg-[#EAE2FA] border-2 border-[#080808] rounded-2xl px-3.5 py-1.5 shadow-[3px_3px_0px_#080808] font-technical text-xs font-bold text-[#080808] flex items-center gap-1.5">
            <span>🚀</span> 1-CLICK PREP
          </div>
        </ScrollParallax>

        {/* Shape 10: Soft Grid Dots Matrix (Final CTA - Right) */}
        <ScrollParallax
          speed={-0.2}
          className="absolute top-[3620px] right-3 lg:right-8 opacity-30 hidden sm:block"
        >
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none" className="text-[#080808]">
            <pattern id="grid-dots-cta" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="2" fill="currentColor" />
            </pattern>
            <rect width="88" height="88" fill="url(#grid-dots-cta)" />
          </svg>
        </ScrollParallax>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. FLOATING STICKY HEADER                                      */}
      {/* ------------------------------------------------------------- */}
      <header
        ref={headerRef}
        className="sticky top-3 sm:top-5 z-50 w-full max-w-6xl mx-auto px-4 sm:px-6"
      >
        <div className="bg-[#FDF9F3] border-2 border-[#080808] rounded-full py-2 px-4 sm:px-6 shadow-[4px_4px_0px_#080808] flex items-center justify-between">
          {/* Left: Brand Logo & Wordmark - Links cleanly to top of landing page */}
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
            aria-label="Prospect Landing Page"
          >
            <ProspectLogo size={30} />
            <span className="font-heading font-black text-xl text-[#080808] tracking-tight group-hover:opacity-90 transition-opacity">
              Prospect
            </span>
          </Link>

          <div className="hidden md:block w-px h-6 bg-black/15 mx-2" />

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-heading font-bold text-[#444444]">
            <a
              href="#features"
              className="hover:text-[#080808] transition-colors"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#080808] transition-colors"
            >
              How it works
            </a>
            <button
              onClick={() => triggerAuthOrLaunch("signin", "discover", "Please sign in to explore live opportunities.")}
              className="hover:text-[#080808] transition-colors font-bold"
            >
              Opportunities
            </button>
            <button
              onClick={() => triggerAuthOrLaunch("signup", "profile", "Please sign in to access student intelligence & profiles.")}
              className="hover:text-[#080808] transition-colors font-bold"
            >
              For students
            </button>
          </nav>

          <div className="hidden md:block w-px h-6 bg-black/15 mx-2" />

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => triggerAuthOrLaunch("signin", "discover")}
              className="text-sm font-heading font-bold text-[#080808] hover:underline px-3 py-1.5 transition-all"
            >
              Log in
            </button>
            <button
              onClick={() => triggerAuthOrLaunch("signup", "profile")}
              className="bg-[#E0FB66] text-[#080808] font-heading font-extrabold text-sm px-4 py-2 rounded-full border-2 border-[#080808] shadow-[2.5px_2.5px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              Get started <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_#080808]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-black" /> : <Menu className="w-5 h-5 text-black" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white border-2 border-[#080808] rounded-2xl p-4 shadow-[4px_4px_0px_#080808] flex flex-col gap-3 font-heading font-bold text-sm">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 border-b border-black/10 text-[#080808]"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 border-b border-black/10 text-[#080808]"
            >
              How it works
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                triggerAuthOrLaunch("signin", "discover", "Please sign in to explore live opportunities.");
              }}
              className="text-left py-1.5 border-b border-black/10 text-[#080808]"
            >
              Opportunities
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                triggerAuthOrLaunch("signup", "profile", "Please sign in to access student intelligence & profiles.");
              }}
              className="text-left py-1.5 border-b border-black/10 text-[#080808]"
            >
              For students
            </button>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerAuthOrLaunch("signup", "profile");
                }}
                className="w-full bg-[#E0FB66] text-[#080808] py-2.5 rounded-full border-2 border-black font-extrabold shadow-[2px_2px_0px_#080808] text-center"
              >
                Get started →
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerAuthOrLaunch("signin", "discover");
                }}
                className="w-full bg-white text-[#080808] py-2 rounded-full border border-black/20 font-bold text-center"
              >
                Log in
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN HERO SECTION                                           */}
      {/* ------------------------------------------------------------- */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 md:pt-16 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* LEFT COLUMN: Editorial Text & CTAs */}
          <div ref={heroLeftRef} className="lg:col-span-6 text-left">
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="font-technical text-xs font-bold uppercase tracking-widest text-[#666666]">
                CAREER INTELLIGENCE, REIMAGINED
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-[62px] text-[#080808] leading-[1.08] tracking-tight">
              Your next
              <br />
              opportunity
              <br />
              <span className="inline-block bg-[#E0FB66] text-[#080808] px-3 sm:px-4 py-0.5 rounded-2xl border-2 border-[#080808] shadow-[4px_4px_0px_#080808] mt-1.5 transform -rotate-1">
                starts with you.
              </span>
            </h1>

            {/* Supporting Subhead */}
            <p className="mt-5 text-base sm:text-lg text-[#555555] font-body max-w-lg leading-relaxed">
              Understand your strengths. Discover roles that fit. Build the career you want.
            </p>

            {/* Buttons Row */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => triggerAuthOrLaunch("signup", "profile")}
                className="bg-[#080808] text-white px-7 py-3.5 rounded-full font-heading font-bold text-sm sm:text-base border-2 border-[#080808] shadow-[4px_4px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
              >
                Discover your path <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#how-it-works"
                className="bg-white text-[#080808] px-6 py-3.5 rounded-full font-heading font-bold text-sm sm:text-base border-2 border-[#080808] shadow-[4px_4px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all inline-block"
              >
                See how it works
              </a>
            </div>

            {/* Eyebrow below buttons */}
            <div className="mt-6 flex items-center gap-2 text-xs sm:text-sm font-technical font-semibold text-[#555555]">
              <div className="w-6 h-6 rounded-md bg-[#E0FB66] border border-black flex items-center justify-center text-black">
                <GraduationCap className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[#080808]">|</span>
              <span>Built for students, freshers & ambitious professionals.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: CENTRAL 3D GEOMETRIC PORTAL & FLOATING OVERLAY */}
          <div
            ref={heroPortalRef}
            className="lg:col-span-6 relative w-full aspect-square max-w-[540px] mx-auto flex items-center justify-center select-none"
          >
            {/* The 3D Three.js Extruded P Portal */}
            <ProspectPortal3D className="w-full h-full relative z-0" />

            {/* Floating Opportunity Cards & Skill Chips Overlay */}
            <HeroFloatingOverlay onSelectRole={() => triggerAuthOrLaunch("signin", "discover")} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FEATURE STRIP                                              */}
      {/* ------------------------------------------------------------- */}
      <ScrollReveal direction="up" distance={20} duration={0.6}>
        <FeatureStrip onFeatureClick={(tab) => triggerAuthOrLaunch("signin", tab as NavTab)} />
      </ScrollReveal>

      {/* ------------------------------------------------------------- */}
      {/* 3.5 INFINITE NEO-BRUTALIST TICKER MARQUEE                     */}
      {/* ------------------------------------------------------------- */}
      <ScrollReveal direction="none" duration={0.7} className="w-full my-6 md:my-10">
        <InfiniteMarquee speed="normal" pauseOnHover={true} />
      </ScrollReveal>

      {/* ------------------------------------------------------------- */}
      {/* 4. FEATURES SECTION: "A smarter way to find your fit"        */}
      {/* ------------------------------------------------------------- */}
      <ThreeFeaturesCards onExploreFeature={(tab) => triggerAuthOrLaunch("signin", tab as NavTab)} />

      {/* ------------------------------------------------------------- */}
      {/* 5. HOW IT WORKS SECTION                                       */}
      {/* ------------------------------------------------------------- */}
      <HowItWorksWorkflow onStageClick={(tab) => triggerAuthOrLaunch("signin", tab as NavTab)} />

      {/* ------------------------------------------------------------- */}
      {/* 6. PRODUCT PREVIEW SECTION: Large Dashboard Composition       */}
      {/* ------------------------------------------------------------- */}
      <ProductDashboardPreview onOpenWorkspace={(tab) => triggerAuthOrLaunch("signin", tab as NavTab)} />

      {/* ------------------------------------------------------------- */}
      {/* 7. FINAL CTA BILLBOARD SECTION                                */}
      {/* ------------------------------------------------------------- */}
      <FinalCtaSection
        onGetStarted={() => triggerAuthOrLaunch("signup", "profile")}
        onExploreRoles={() => triggerAuthOrLaunch("signin", "discover")}
      />

      {/* ------------------------------------------------------------- */}
      {/* 8. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <ProspectFooter onNavTab={(tab) => triggerAuthOrLaunch("signin", tab as NavTab)} />

      {/* Standalone Fallback AuthModal */}
      <AuthModal
        isOpen={internalAuthOpen}
        onClose={() => setInternalAuthOpen(false)}
        onSuccess={(session) => {
          setInternalAuthOpen(false);
          handleLaunch(pendingTargetTab);
        }}
        initialMode={internalAuthMode}
        promptMessage={internalAuthPrompt}
      />
    </div>
  );
}
