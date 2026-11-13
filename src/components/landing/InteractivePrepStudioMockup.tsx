"use strict";
"use client";

import React, { useState } from "react";
import {
  Clock,
  Sparkles,
  Target,
  Flame,
  FileCheck,
  Check,
} from "lucide-react";

interface PrepTask {
  id: string;
  title: string;
  skill: string;
  estimatedHours: number;
  category: "Code Deliverable" | "Architecture Benchmark" | "Portfolio Proof";
  completed: boolean;
  resumeBullet: string;
}

const INITIAL_TASKS: PrepTask[] = [
  {
    id: "task-1",
    title: "Implement Triton GPU Kernel for FlashAttention Benchmark",
    skill: "Triton / CUDA",
    estimatedHours: 6,
    category: "Code Deliverable",
    completed: false,
    resumeBullet: "Engineered fused Triton attention kernel reducing GPU memory bandwidth overhead by 32% on A100 testbed.",
  },
  {
    id: "task-2",
    title: "Build Distributed Vector Search Engine with Raft Consensus",
    skill: "Distributed Systems",
    estimatedHours: 4,
    category: "Architecture Benchmark",
    completed: false,
    resumeBullet: "Constructed distributed vector index in C++ using Raft replication for sub-15ms P99 query latency.",
  },
  {
    id: "task-3",
    title: "Dockerize Microservices Architecture & Publish Reproducible GitHub Repo",
    skill: "Docker / CI",
    estimatedHours: 2,
    category: "Portfolio Proof",
    completed: true,
    resumeBullet: "Containerized multi-node evaluation service with automated GitHub Actions CI & Docker Compose reproducibility.",
  },
];

export function InteractivePrepStudioMockup() {
  const [tasks, setTasks] = useState<PrepTask[]>(INITIAL_TASKS);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isFullyPrepared = completedCount === totalCount;

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="w-full rounded-3xl border-2 border-[#080808] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#080808] text-[#080808]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#080808] pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FEF189] px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808] mb-2">
            <Target className="h-3.5 w-3.5" />
            <span>Interactive Gap-to-Action Studio</span>
          </div>
          <h3 className="font-heading text-2xl font-extrabold tracking-tight">
            Turn Rejection Gaps Into Verified Action Items
          </h3>
          <p className="text-xs sm:text-sm text-[#777777] mt-1">
            Prospect doesn’t just say “no” — it generates actionable engineering milestones with estimated hours and grounded resume bullets.
          </p>
        </div>

        {/* Readiness Meter & Status Pill */}
        <div className="flex items-center gap-4 bg-[#FDF9F3] border-2 border-[#080808] p-3.5 rounded-2xl shadow-[3px_3px_0px_#080808]">
          <div>
            <div className="text-[11px] font-heading font-extrabold text-[#777777] uppercase tracking-wider">
              Status Upgrade
            </div>
            <div
              className={`mt-1 inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] px-3 py-1 font-heading text-xs font-extrabold shadow-[2px_2px_0px_#080808] transition-all ${
                isFullyPrepared
                  ? "bg-[#E0FB66] text-[#080808] scale-105"
                  : "bg-[#FEF189] text-[#080808]"
              }`}
            >
              {isFullyPrepared ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#080808] animate-bounce" />
                  <span>APPLY NOW READY</span>
                </>
              ) : (
                <>
                  <Flame className="h-3.5 w-3.5 text-[#080808]" />
                  <span>PREPARE FIRST ({progressPercent}%)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Task Cards */}
      <div className="space-y-3.5">
        <div className="text-xs font-heading font-extrabold text-[#777777] uppercase tracking-wider flex items-center justify-between">
          <span>Click to complete milestones for Stripe Machine Learning Intern:</span>
          <span>{completedCount} of {totalCount} completed</span>
        </div>

        {tasks.map((task) => {
          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`rounded-2xl border-2 border-[#080808] p-4 sm:p-5 transition-all cursor-pointer select-none ${
                task.completed
                  ? "bg-[#E0FB66]/20 border-[#080808] shadow-[3px_3px_0px_#080808]"
                  : "bg-[#FDF9F3] hover:bg-white border-[#080808] shadow-[3px_3px_0px_#080808]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-[#080808] transition-all ${
                    task.completed
                      ? "bg-[#080808] text-[#E0FB66] shadow-[1px_1px_0px_#080808]"
                      : "bg-white text-transparent hover:border-[#080808]"
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`font-heading text-sm font-extrabold ${
                        task.completed ? "line-through text-[#777777]" : "text-[#080808]"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="rounded-md border border-[#080808] bg-white px-2 py-0.5 font-mono text-[10px] font-bold">
                      {task.skill}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-[#777777]">
                      <Clock className="h-3 w-3" />
                      ~{task.estimatedHours} hrs
                    </span>
                  </div>

                  {/* Grounded Bullet Preview */}
                  <div className="mt-2 rounded-xl border border-[#D8D5CE] bg-white p-2.5 text-xs text-[#080808]/90">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-heading font-extrabold text-[#777777] mb-0.5">
                      <FileCheck className="h-3 w-3 text-[#080808]" />
                      <span>Resume Evidence Bullet (Auto-Generated from verified code):</span>
                    </div>
                    <p className="font-mono text-[11px] leading-relaxed">
                      &quot;{task.resumeBullet}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Footer */}
      <div className="mt-6 pt-5 border-t border-[#D8D5CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-md">
          <div className="flex justify-between font-heading font-bold text-[11px] mb-1.5">
            <span>Overall Opportunity Readiness</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#EAE6DC] overflow-hidden border border-[#080808]">
            <div
              className="h-full bg-[#080808] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="text-[#777777] font-heading text-xs font-semibold">
          💡 Verified against confirmed student projects — zero fabricated claims.
        </div>
      </div>
    </div>
  );
}

