"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
} from "lucide-react";

interface ProductDashboardPreviewProps {
  onOpenWorkspace?: (tab?: string) => void;
}

export function ProductDashboardPreview({ onOpenWorkspace }: ProductDashboardPreviewProps) {
  const [activeTab, setActiveTab] = useState<"discover" | "profile" | "prep">("discover");

  return (
    <section id="product-preview" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#EAE2FA] border-2 border-[#080808] px-3 py-1 rounded-full text-xs font-technical font-bold text-[#080808] uppercase tracking-wider mb-4 shadow-[2px_2px_0px_#080808]">
            Interactive Dashboard Preview
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-[#080808] tracking-tight">
            Inside the Prospect Workspace
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#555555] font-body max-w-2xl">
            A unified system that turns raw resumes into explainable opportunity matches with zero managerial clutter.
          </p>
        </div>

        <button
          onClick={() => onOpenWorkspace?.(activeTab)}
          className="self-start md:self-auto bg-[#080808] text-white px-6 py-3 rounded-full font-heading font-bold text-sm border-2 border-[#080808] shadow-[4px_4px_0px_#E0FB66] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
        >
          Open Live Workspace <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Dashboard Window Mockup */}
      <div className="bg-white border-2 border-[#080808] rounded-2xl md:rounded-3xl shadow-[8px_8px_0px_#080808] overflow-hidden">
        {/* Window Chrome Title Bar */}
        <div className="bg-[#FDF9F3] border-b-2 border-[#080808] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-400 border border-black/40" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-black/40" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-black/40" />
            <span className="ml-3 font-technical text-xs font-semibold text-[#555555]">
              prospect.workspace / career-intelligence-v2
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-technical bg-white px-2 py-0.5 rounded border border-black/20 text-[#666666]">
              Illustrative UI Content
            </span>
            <div className="flex items-center gap-1.5 bg-[#E0FB66] text-[#080808] px-2.5 py-0.5 rounded-full border border-black text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Seniority Shield Active
            </div>
          </div>
        </div>

        {/* Workspace Sub-Nav Bar */}
        <div className="bg-white border-b border-black/10 px-4 py-2 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("discover")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "discover"
                  ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                  : "text-[#666666] hover:bg-black/5"
              }`}
            >
              Opportunity Discovery (24)
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "profile"
                  ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                  : "text-[#666666] hover:bg-black/5"
              }`}
            >
              Extracted Profile & Skills
            </button>
            <button
              onClick={() => setActiveTab("prep")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "prep"
                  ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                  : "text-[#666666] hover:bg-black/5"
              }`}
            >
              Preparation Studio
            </button>
          </div>

          <span className="hidden md:block text-xs text-[#777777] font-medium">
            3 High-Fit Matches • 0 Seniority Mismatches
          </span>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 bg-[#FDF9F3]/60">
          {activeTab === "discover" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Opportunities List (2 Cols) */}
              <div className="lg:col-span-2 space-y-3">
                {/* Opportunity 1 */}
                <div className="bg-white border-2 border-[#080808] rounded-xl p-4 shadow-[3px_3px_0px_#080808] hover:border-black transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-extrabold text-base text-[#080808]">
                          ML Systems Engineer Intern
                        </span>
                        <span className="bg-[#E0FB66] text-[#080808] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-black">
                          APPLY NOW
                        </span>
                      </div>
                      <div className="text-xs text-[#666666] font-medium">
                        Stripe • San Francisco, CA / Remote • Summer 2026
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-technical font-extrabold text-sm text-[#080808]">
                        92% Match
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#555555] line-clamp-2 mb-3">
                    Verified match based on your Triton GPU kernel benchmarking project and PyTorch distributed training experience.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-[#EAE2FA] text-[#080808] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PyTorch
                      </span>
                      <span className="bg-[#EAE2FA] text-[#080808] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        CUDA Kernels
                      </span>
                      <span className="bg-[#EAE2FA] text-[#080808] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Python / C++
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenWorkspace?.("discover")}
                      className="text-xs font-bold text-[#080808] hover:underline flex items-center gap-1"
                    >
                      View Evidence & Apply <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Opportunity 2 */}
                <div className="bg-white border-2 border-[#080808] rounded-xl p-4 shadow-[3px_3px_0px_#080808] hover:border-black transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-extrabold text-base text-[#080808]">
                          Junior AI Platform Engineer
                        </span>
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-amber-300">
                          PREPARE FIRST
                        </span>
                      </div>
                      <div className="text-xs text-[#666666] font-medium">
                        Databricks • Mountain View, CA • Full-Time
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-technical font-extrabold text-sm text-[#080808]">
                        84% Match
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#555555] line-clamp-2 mb-3">
                    Strong foundational alignment. Role prefers Ray cluster scheduling experience — 1 preparation project recommended.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-[#EAE2FA] text-[#080808] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Distributed Systems
                      </span>
                      <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +Ray Clusters (Prep)
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenWorkspace?.("prep")}
                      className="text-xs font-bold text-[#080808] hover:underline flex items-center gap-1"
                    >
                      Open Prep Plan <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Opportunity 3 */}
                <div className="bg-white border-2 border-[#080808] rounded-xl p-4 shadow-[3px_3px_0px_#080808] hover:border-black transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-extrabold text-base text-[#080808]">
                          Frontend Infrastructure Intern
                        </span>
                        <span className="bg-[#E0FB66] text-[#080808] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-black">
                          APPLY NOW
                        </span>
                      </div>
                      <div className="text-xs text-[#666666] font-medium">
                        Figma • San Francisco, CA / Hybrid • Summer 2026
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-technical font-extrabold text-sm text-[#080808]">
                        90% Match
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#555555] line-clamp-2 mb-3">
                    100% stack match on TypeScript, WebGL/Three.js render pipelines, and responsive design architecture.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-[#EAE2FA] text-[#080808] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        TypeScript
                      </span>
                      <span className="bg-[#EAE2FA] text-[#080808] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        React 19
                      </span>
                      <span className="bg-[#EAE2FA] text-[#080808] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        WebGL
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenWorkspace?.("discover")}
                      className="text-xs font-bold text-[#080808] hover:underline flex items-center gap-1"
                    >
                      View Evidence & Apply <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Profile Snapshot & Seniority Shield */}
              <div className="space-y-4">
                {/* Profile Summary Card */}
                <div className="bg-white border-2 border-[#080808] rounded-xl p-4 shadow-[3px_3px_0px_#080808]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#E0FB66] border border-black flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm text-[#080808]">
                        Early Career Profile
                      </div>
                      <div className="text-[11px] text-[#777777]">
                        Undergraduate / New Grad Level
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-black/5">
                      <span className="text-[#666666]">Focus Direction:</span>
                      <span className="font-bold text-[#080808]">AI / ML Infrastructure</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black/5">
                      <span className="text-[#666666]">Verified Skills:</span>
                      <span className="font-bold text-[#080808]">18 Technical Skills</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#666666]">Seniority Shield:</span>
                      <span className="font-bold text-emerald-700">Protected</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenWorkspace?.("profile")}
                    className="w-full mt-4 bg-[#FDF9F3] hover:bg-[#E0FB66] text-[#080808] border-2 border-[#080808] py-2 rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_#080808]"
                  >
                    Manage Profile & Resume
                  </button>
                </div>

                {/* Seniority Shield Notification */}
                <div className="bg-[#EAE2FA] border-2 border-[#080808] rounded-xl p-4 shadow-[3px_3px_0px_#080808]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#080808]" />
                    <span className="font-heading font-extrabold text-xs text-[#080808]">
                      Seniority Shield Audit
                    </span>
                  </div>
                  <p className="text-[11px] text-[#444444] leading-relaxed">
                    Prospect suppressed 14 Engineering Manager and Staff roles that matched your Python keywords but required 8+ years tenure.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white border-2 border-[#080808] rounded-xl p-6 shadow-[3px_3px_0px_#080808]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-heading font-extrabold text-lg text-[#080808]">
                  Extracted Competencies & Evidence Graph
                </h4>
                <span className="text-xs font-technical bg-[#E0FB66] px-2.5 py-1 rounded-md border border-black font-bold">
                  98.4% Parsing Confidence
                </span>
              </div>
              <p className="text-sm text-[#555555] mb-6">
                Skills extracted from your portfolio code, projects, and work history with explicit provenance links.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-[#FDF9F3] border border-black/20 rounded-lg">
                  <div className="text-xs font-bold text-black mb-1">Core Languages</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">TypeScript</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">Python</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">C++</span>
                  </div>
                </div>
                <div className="p-3 bg-[#FDF9F3] border border-black/20 rounded-lg">
                  <div className="text-xs font-bold text-black mb-1">Frameworks & Tools</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">Next.js 15</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">PyTorch</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">Prisma</span>
                  </div>
                </div>
                <div className="p-3 bg-[#FDF9F3] border border-black/20 rounded-lg">
                  <div className="text-xs font-bold text-black mb-1">Infrastructure</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">PostgreSQL</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">Docker</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold border border-black/10">Redis</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "prep" && (
            <div className="bg-white border-2 border-[#080808] rounded-xl p-6 shadow-[3px_3px_0px_#080808]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-heading font-extrabold text-lg text-[#080808]">
                  Targeted Preparation Roadmap
                </h4>
                <span className="text-xs font-technical bg-[#EAE2FA] px-2.5 py-1 rounded-md border border-black font-bold">
                  Bridge to 95% Match
                </span>
              </div>
              <p className="text-sm text-[#555555] mb-6">
                Turn a PREPARE FIRST opportunity into an APPLY NOW with hands-on implementation tasks.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-[#FDF9F3] border-2 border-black rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-black">Benchmark GPU Kernels with Triton</div>
                      <div className="text-[11px] text-[#666666]">Completed • Verified in Github portfolio</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">VERIFIED</span>
                </div>

                <div className="p-3 bg-white border-2 border-black rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-black">Implement Distributed Caching Layer</div>
                      <div className="text-[11px] text-[#666666]">Estimated 3 days • Adds Redis & cluster resilience</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">NEXT UP</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
