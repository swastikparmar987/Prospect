"use client";

import React, { useState, useEffect, useRef } from "react";
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

interface LandingExperienceProps {
  onLaunchApp?: (tab?: NavTab) => void;
}

export function LandingExperience({ onLaunchApp }: LandingExperienceProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      {/* 1. FLOATING STICKY HEADER                                      */}
      {/* ------------------------------------------------------------- */}
      <header
        ref={headerRef}
        className="sticky top-3 sm:top-5 z-50 w-full max-w-6xl mx-auto px-4 sm:px-6"
      >
        <div className="bg-[#FDF9F3] border-2 border-[#080808] rounded-full py-2 px-4 sm:px-6 shadow-[4px_4px_0px_#080808] flex items-center justify-between">
          {/* Left: Brand Logo & Wordmark */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <ProspectLogo size={30} />
            <span className="font-heading font-black text-xl text-[#080808] tracking-tight group-hover:opacity-90 transition-opacity">
              Prospect
            </span>
          </div>

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
              onClick={() => handleLaunch("discover")}
              className="hover:text-[#080808] transition-colors font-bold"
            >
              Opportunities
            </button>
            <button
              onClick={() => handleLaunch("profile")}
              className="hover:text-[#080808] transition-colors font-bold"
            >
              For students
            </button>
          </nav>

          <div className="hidden md:block w-px h-6 bg-black/15 mx-2" />

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => handleLaunch("discover")}
              className="text-sm font-heading font-bold text-[#080808] hover:underline px-3 py-1.5 transition-all"
            >
              Log in
            </button>
            <button
              onClick={() => handleLaunch("profile")}
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
                handleLaunch("discover");
              }}
              className="text-left py-1.5 border-b border-black/10 text-[#080808]"
            >
              Opportunities
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLaunch("profile");
              }}
              className="text-left py-1.5 border-b border-black/10 text-[#080808]"
            >
              For students
            </button>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLaunch("profile")}
                }
                className="w-full bg-[#E0FB66] text-[#080808] py-2.5 rounded-full border-2 border-black font-extrabold shadow-[2px_2px_0px_#080808] text-center"
              >
                Get started →
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLaunch("discover")}
                }
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
                onClick={() => handleLaunch("profile")}
                className="bg-[#080808] text-white px-7 py-3.5 rounded-full font-heading font-bold text-sm sm:text-base border-2 border-[#080808] shadow-[4px_4px_0px_#080808] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2 group"
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
            <HeroFloatingOverlay onSelectRole={() => handleLaunch("discover")} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FEATURE STRIP                                              */}
      {/* ------------------------------------------------------------- */}
      <FeatureStrip onFeatureClick={(tab) => handleLaunch(tab as NavTab)} />

      {/* ------------------------------------------------------------- */}
      {/* 4. FEATURES SECTION: "A smarter way to find your fit"        */}
      {/* ------------------------------------------------------------- */}
      <ThreeFeaturesCards onExploreFeature={(tab) => handleLaunch(tab as NavTab)} />

      {/* ------------------------------------------------------------- */}
      {/* 5. HOW IT WORKS SECTION                                       */}
      {/* ------------------------------------------------------------- */}
      <HowItWorksWorkflow onStageClick={(tab) => handleLaunch(tab as NavTab)} />

      {/* ------------------------------------------------------------- */}
      {/* 6. PRODUCT PREVIEW SECTION: Large Dashboard Composition       */}
      {/* ------------------------------------------------------------- */}
      <ProductDashboardPreview onOpenWorkspace={(tab) => handleLaunch(tab as NavTab)} />

      {/* ------------------------------------------------------------- */}
      {/* 7. FINAL CTA BILLBOARD SECTION                                */}
      {/* ------------------------------------------------------------- */}
      <FinalCtaSection
        onGetStarted={() => handleLaunch("profile")}
        onExploreRoles={() => handleLaunch("discover")}
      />

      {/* ------------------------------------------------------------- */}
      {/* 8. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <ProspectFooter onNavTab={(tab) => handleLaunch(tab as NavTab)} />
    </div>
  );
}
