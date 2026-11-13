"use strict";
"use client";

import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
} from "lucide-react";

interface ExtractedSkill {
  name: string;
  category: "Languages & Core" | "Frameworks & Systems" | "Verified Artifact";
  provenance: string;
  confidence: number;
}

const SAMPLE_SKILLS: ExtractedSkill[] = [
  {
    name: "PyTorch & Transformers",
    category: "Frameworks & Systems",
    provenance: "CS182 Deep Learning Final Project + Vision Transformer implementation",
    confidence: 96,
  },
  {
    name: "C++ (Modern C++20)",
    category: "Languages & Core",
    provenance: "Raft Consensus Replication Engine (GitHub repo with 42 commits)",
    confidence: 94,
  },
  {
    name: "Distributed Key-Value Store",
    category: "Verified Artifact",
    provenance: "CS162 Operating Systems course milestone: sub-5ms latency under churn",
    confidence: 98,
  },
  {
    name: "TypeScript & Next.js",
    category: "Frameworks & Systems",
    provenance: "Full-stack research lab dashboard deployed on Vercel",
    confidence: 91,
  },
];

export function InteractiveResumeMockup() {
  const [activeTab, setActiveTab] = useState<"skills" | "projects" | "pathways">("skills");

  return (
    <div className="w-full rounded-3xl border-3 border-[#080808] bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#080808] text-[#080808]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#080808] pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] shadow-[3px_3px_0px_#080808]">
            <FileText className="h-6 w-6 text-[#080808]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[#080808]">
                Alex_Chen_CS_Resume.pdf
              </h3>
              <span className="rounded-full bg-[#163824] text-[#E0FB66] px-2 py-0.5 text-[10px] font-heading font-extrabold uppercase">
                Verified
              </span>
            </div>
            <p className="text-xs text-[#777777]">
              UC Berkeley • B.S. Computer Science • Expected May 2026
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-[#FDF9F3] border-2 border-[#080808] p-1.5 rounded-2xl shadow-[2px_2px_0px_#080808]">
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`rounded-xl px-3 py-1 font-heading text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "skills"
                ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                : "text-[#080808] hover:bg-white"
            }`}
          >
            Verified Skills
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`rounded-xl px-3 py-1 font-heading text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "projects"
                ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                : "text-[#080808] hover:bg-white"
            }`}
          >
            GitHub Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pathways")}
            className={`rounded-xl px-3 py-1 font-heading text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "pathways"
                ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                : "text-[#080808] hover:bg-white"
            }`}
          >
            Career Trajectories
          </button>
        </div>
      </div>

      {/* Tab 1: Verified Skills with Grounding */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-heading font-extrabold text-[#777777] px-1">
            <span>EXTRACTED TECHNICAL CAPABILITY</span>
            <span>GROUNDED PROVENANCE</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {SAMPLE_SKILLS.map((skill, idx) => (
              <div
                key={idx}
                className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_#080808] hover:-translate-y-0.5 transition-transform"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-extrabold text-[#080808]">
                      {skill.name}
                    </span>
                    <span className="rounded-md border border-[#080808] bg-white px-2 py-0.5 font-mono text-[10px] text-[#777777]">
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#080808]/80">{skill.provenance}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-xs font-extrabold text-[#163824]">
                      {skill.confidence}% Confidence
                    </div>
                    <div className="text-[10px] text-[#777777] font-semibold">Evidence Grounded</div>
                  </div>
                  <div className="h-8 w-8 rounded-xl border border-[#080808] bg-[#E0FB66] flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-[#080808]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Code Projects */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-5 shadow-[4px_4px_0px_#080808] space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 text-[11px] font-heading font-extrabold">
                Systems Project
              </span>
              <span className="font-mono text-xs text-[#777777]">github.com/alex/raft-kv</span>
            </div>
            <h4 className="font-heading text-base font-extrabold text-[#080808]">
              Raft Consensus Distributed Store
            </h4>
            <p className="text-xs text-[#777777] leading-relaxed">
              Engineered leader election, log replication, and persistent state machines in C++20. Tested against network partitions with sub-50ms failover recovery.
            </p>
            <div className="pt-2 border-t border-[#D8D5CE] flex items-center gap-2 font-mono text-[11px]">
              <span className="font-bold text-[#163824]">✓ 42 commits</span>
              <span>•</span>
              <span>Passing 100% stress tests</span>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-5 shadow-[4px_4px_0px_#080808] space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#FEF189] border border-[#080808] px-2.5 py-0.5 text-[11px] font-heading font-extrabold">
                AI / Deep Learning
              </span>
              <span className="font-mono text-xs text-[#777777]">github.com/alex/vit-distill</span>
            </div>
            <h4 className="font-heading text-base font-extrabold text-[#080808]">
              Vision Transformer Knowledge Distillation
            </h4>
            <p className="text-xs text-[#777777] leading-relaxed">
              Trained a lightweight 12M parameter ViT on ImageNet-1K with soft teacher labels, achieving 78.4% top-1 accuracy at 3.2x inference speedup.
            </p>
            <div className="pt-2 border-t border-[#D8D5CE] flex items-center gap-2 font-mono text-[11px]">
              <span className="font-bold text-[#163824]">✓ PyTorch / WandB</span>
              <span>•</span>
              <span>Reproducible README</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Generated Career Trajectories */}
      {activeTab === "pathways" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border-2 border-[#080808] bg-[#E0FB66]/30 p-4 shadow-[3px_3px_0px_#080808] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#777777]">Trajectory 01</span>
              <span className="font-mono text-xs font-extrabold text-[#163824]">92% Match</span>
            </div>
            <h4 className="font-heading text-sm font-extrabold text-[#080808]">
              ML Systems & AI Research
            </h4>
            <p className="text-[11px] text-[#777777]">
              Optimizing inference runtimes, CUDA kernels, and transformer architectures.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[#080808] bg-[#FEF189]/30 p-4 shadow-[3px_3px_0px_#080808] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#777777]">Trajectory 02</span>
              <span className="font-mono text-xs font-extrabold text-[#080808]">88% Match</span>
            </div>
            <h4 className="font-heading text-sm font-extrabold text-[#080808]">
              Distributed Infrastructure
            </h4>
            <p className="text-[11px] text-[#777777]">
              High-throughput backend engines, consensus algorithms, low-latency RPCs.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[#080808] bg-white p-4 shadow-[3px_3px_0px_#080808] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#777777]">Trajectory 03</span>
              <span className="font-mono text-xs font-extrabold text-[#777777]">81% Match</span>
            </div>
            <h4 className="font-heading text-sm font-extrabold text-[#080808]">
              Full-Stack AI Application Eng
            </h4>
            <p className="text-[11px] text-[#777777]">
              Modern reactive web interfaces, LLM agents, and vector database retrieval.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
