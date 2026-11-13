"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface PresetRole {
  id: string;
  title: string;
  company: string;
  category: string;
  seniority: "INTERN" | "STUDENT" | "EARLY_CAREER" | "MANAGER" | "DIRECTOR";
  baseSkillMatch: number;
  hasActiveUrl: boolean;
  isHardSeniorityBlocked: boolean;
  description: string;
}

const PRESET_ROLES: PresetRole[] = [
  {
    id: "databricks-intern",
    title: "Distributed Systems Intern",
    company: "Databricks",
    category: "Internship",
    seniority: "INTERN",
    baseSkillMatch: 88,
    hasActiveUrl: true,
    isHardSeniorityBlocked: false,
    description: "High alignment with student's verified C++, distributed systems, and Raft consensus projects.",
  },
  {
    id: "stripe-swe",
    title: "Software Engineering Intern",
    company: "Stripe",
    category: "Internship",
    seniority: "INTERN",
    baseSkillMatch: 82,
    hasActiveUrl: true,
    isHardSeniorityBlocked: false,
    description: "Direct match with candidate's TypeScript, API design, and cloud systems background.",
  },
  {
    id: "adobe-fellow",
    title: "India AI Research Fellowship",
    company: "Adobe Research",
    category: "Fellowship",
    seniority: "STUDENT",
    baseSkillMatch: 72,
    hasActiveUrl: true,
    isHardSeniorityBlocked: false,
    description: "Strong PyTorch and computer vision foundations, with minor academic paper gaps.",
  },
  {
    id: "stripe-manager",
    title: "Engineering Manager, ML (Fraud)",
    company: "Stripe",
    category: "Leadership",
    seniority: "MANAGER",
    baseSkillMatch: 90,
    hasActiveUrl: true,
    isHardSeniorityBlocked: true,
    description: "Requires 6+ years people management & production scale. Hard-blocked for students.",
  },
  {
    id: "deepmind-director",
    title: "Director of AI Research",
    company: "Google DeepMind",
    category: "Executive",
    seniority: "DIRECTOR",
    baseSkillMatch: 95,
    hasActiveUrl: true,
    isHardSeniorityBlocked: true,
    description: "Executive leadership role requiring 10+ years tenure. Hard-blocked for early talent.",
  },
];

export function InteractiveOpportunitySimulator() {
  const [selectedRole, setSelectedRole] = useState<PresetRole>(PRESET_ROLES[0]);
  const [isStudentCandidate, setIsStudentCandidate] = useState<boolean>(true);
  const [skillMatchOverride, setSkillMatchOverride] = useState<number>(PRESET_ROLES[0].baseSkillMatch);
  const [hasActiveUrl, setHasActiveUrl] = useState<boolean>(true);
  const [hasEligibleGraduation, setHasEligibleGraduation] = useState<boolean>(true);

  // When changing preset role, sync default settings
  const handleSelectRole = (role: PresetRole) => {
    setSelectedRole(role);
    setSkillMatchOverride(role.baseSkillMatch);
    setHasActiveUrl(role.hasActiveUrl);
  };

  // Evaluate 4-way decision dynamically using Prospect's actual decision rules
  let recommendation: "APPLY NOW" | "PREPARE FIRST" | "KEEP WATCHING" | "SKIP" = "APPLY NOW";
  let overallScore = skillMatchOverride;
  let eligibilityScore = 100;
  let decisionReason = "";
  let isSeniorityBlocked = false;

  // Rule 1: Seniority Hard Blocker
  if (
    isStudentCandidate &&
    (selectedRole.seniority === "MANAGER" || selectedRole.seniority === "DIRECTOR")
  ) {
    recommendation = "SKIP";
    isSeniorityBlocked = true;
    eligibilityScore = 0;
    overallScore = Math.min(skillMatchOverride, 35);
    decisionReason = `Hard Blocker Triggered: ${selectedRole.title} requires executive/managerial tenure not evidenced in college student background. Eligibility dropped to 0%.`;
  }
  // Rule 2: Graduation Mismatch
  else if (!hasEligibleGraduation) {
    recommendation = "SKIP";
    eligibilityScore = 0;
    overallScore = Math.min(skillMatchOverride, 40);
    decisionReason = "Graduation Year Mismatch: Employer strict academic cohort filter excludes student's current completion year.";
  }
  // Rule 3: Broken or Missing URL
  else if (!hasActiveUrl) {
    recommendation = "KEEP WATCHING";
    overallScore = Math.min(skillMatchOverride, 60);
    decisionReason = "Missing Active Apply URL: Opportunity lacks verified live application portal. Flagged for pipeline monitoring.";
  }
  // Rule 4: High Skill Match -> APPLY NOW
  else if (skillMatchOverride >= 78) {
    recommendation = "APPLY NOW";
    overallScore = skillMatchOverride;
    decisionReason = "Optimal Evidence Match: High verified skill density, student-eligible seniority, and verified active employer portal.";
  }
  // Rule 5: Moderate Skill Match -> PREPARE FIRST
  else if (skillMatchOverride >= 55) {
    recommendation = "PREPARE FIRST";
    overallScore = skillMatchOverride;
    decisionReason = "Grounded Potential: Core foundation verified, but key technical deliverables or project evidence should be added before submitting.";
  }
  // Rule 6: Low Skill Match -> SKIP
  else {
    recommendation = "SKIP";
    overallScore = skillMatchOverride;
    decisionReason = "Insufficient Capability Evidence: Candidate lacks demonstrated skills and prerequisite coursework for this domain.";
  }

  const getBadgeStyle = (rec: typeof recommendation) => {
    switch (rec) {
      case "APPLY NOW":
        return "bg-[#E0FB66] text-[#080808] border-[#080808] shadow-[3px_3px_0px_#080808]";
      case "PREPARE FIRST":
        return "bg-[#FEF189] text-[#080808] border-[#080808] shadow-[3px_3px_0px_#080808]";
      case "KEEP WATCHING":
        return "bg-[#E2F1FE] text-[#080808] border-[#080808] shadow-[3px_3px_0px_#080808]";
      case "SKIP":
        return "bg-[#FFE4E6] text-[#991B1B] border-[#080808] shadow-[3px_3px_0px_#080808]";
    }
  };

  return (
    <div className="w-full rounded-3xl border-2 border-[#080808] bg-[#FDF9F3] p-6 sm:p-8 shadow-[6px_6px_0px_#080808] text-[#080808]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#080808] pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-0.5 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808] mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Decision Engine Simulator</span>
          </div>
          <h3 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
            Test Prospect’s 4-Way Decision Intelligence
          </h3>
          <p className="text-sm text-[#777777] mt-1">
            Toggle candidate seniority, select real positions, and observe real-time hard-blocker enforcement.
          </p>
        </div>

        {/* Candidate Profile Persona Toggle */}
        <div className="flex items-center gap-2 rounded-2xl border-2 border-[#080808] bg-white p-1.5 shadow-[3px_3px_0px_#080808]">
          <span className="text-xs font-heading font-bold px-2 text-[#777777]">Persona:</span>
          <button
            type="button"
            onClick={() => setIsStudentCandidate(true)}
            className={`rounded-xl px-3 py-1.5 text-xs font-heading font-bold transition-all cursor-pointer ${
              isStudentCandidate
                ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                : "text-[#080808] hover:bg-[#FDF9F3]"
            }`}
          >
            🎓 College Student (2025)
          </button>
          <button
            type="button"
            onClick={() => setIsStudentCandidate(false)}
            className={`rounded-xl px-3 py-1.5 text-xs font-heading font-bold transition-all cursor-pointer ${
              !isStudentCandidate
                ? "bg-[#080808] text-white shadow-[2px_2px_0px_#E0FB66]"
                : "text-[#080808] hover:bg-[#FDF9F3]"
            }`}
          >
            💼 Experienced Lead (7+ Yrs)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Roles & Inputs */}
        <div className="lg:col-span-7 space-y-4">
          <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#777777]">
            Select Real Market Opportunity:
          </label>

          <div className="space-y-2.5">
            {PRESET_ROLES.map((role) => {
              const isSelected = selectedRole.id === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`w-full text-left rounded-2xl border-2 border-[#080808] p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-[#E0FB66] shadow-[4px_4px_0px_#080808] translate-x-1"
                      : "bg-white hover:bg-[#FEF189]/30 shadow-[2px_2px_0px_#080808]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-extrabold truncate">
                        {role.title}
                      </span>
                      {role.isHardSeniorityBlocked && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-[#FFE4E6] px-1.5 py-0.5 text-[10px] font-extrabold text-[#991B1B] border border-[#991B1B]">
                          Seniority Blocker
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-[#080808]/75 mt-0.5 flex items-center gap-2">
                      <span>{role.company}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] font-semibold">{role.seniority}</span>
                      <span>•</span>
                      <span>Base Match: {role.baseSkillMatch}%</span>
                    </div>
                  </div>

                  <ArrowRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isSelected ? "translate-x-1" : "opacity-40"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Interactive Sliders & Toggles */}
          <div className="rounded-2xl border-2 border-[#080808] bg-white p-4 shadow-[3px_3px_0px_#080808] space-y-4 mt-4">
            <div>
              <div className="flex justify-between items-center text-xs font-heading font-extrabold mb-1">
                <span>Direct Demonstrated Skill Match</span>
                <span className="font-mono bg-[#E0FB66] px-2 py-0.5 rounded-md border border-[#080808]">
                  {skillMatchOverride}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={skillMatchOverride}
                onChange={(e) => setSkillMatchOverride(Number(e.target.value))}
                className="w-full accent-[#080808] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D8D5CE]">
              <label className="flex items-center gap-2 text-xs font-heading font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasActiveUrl}
                  onChange={(e) => setHasActiveUrl(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-[#080808] accent-[#080808] cursor-pointer"
                />
                <span>Active Portal URL</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-heading font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasEligibleGraduation}
                  onChange={(e) => setHasEligibleGraduation(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-[#080808] accent-[#080808] cursor-pointer"
                />
                <span>Graduation Cohort Fit</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Evaluated Decision Output */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border-2 border-[#080808] bg-white p-5 sm:p-6 shadow-[5px_5px_0px_#080808]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#080808] pb-3">
              <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#777777]">
                Engine Verdict
              </span>
              <span className="text-[11px] font-mono font-bold text-[#777777]">
                Live Rule Evaluation
              </span>
            </div>

            {/* Verdict Badge */}
            <div className="text-center py-2">
              <div
                className={`inline-block rounded-2xl border-2 px-6 py-2.5 font-heading text-xl sm:text-2xl font-extrabold tracking-tight ${getBadgeStyle(
                  recommendation
                )}`}
              >
                {recommendation}
              </div>
              <div className="mt-2 text-xs font-heading font-bold text-[#777777]">
                Computed Overall Readiness:{" "}
                <span className="font-mono text-sm text-[#080808] font-extrabold">
                  {overallScore}%
                </span>
              </div>
            </div>

            {/* Seniority Blocker Alert Banner */}
            {isSeniorityBlocked && (
              <div className="rounded-xl border-2 border-[#991B1B] bg-[#FFE4E6] p-3 text-xs text-[#991B1B] font-medium animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">Seniority Invariant Enforced:</span>{" "}
                    College students are never recommended Manager/Staff/Director roles regardless of high skill match.
                  </div>
                </div>
              </div>
            )}

            {/* Metric Gauges */}
            <div className="space-y-2 pt-2">
              <div>
                <div className="flex justify-between text-xs font-heading font-bold mb-1">
                  <span>Eligibility Guardrail</span>
                  <span className="font-mono">{eligibilityScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#EAE6DC] overflow-hidden border border-[#080808]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      eligibilityScore > 0 ? "bg-[#E0FB66]" : "bg-[#EF4444]"
                    }`}
                    style={{ width: `${eligibilityScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-heading font-bold mb-1">
                  <span>Direct Skill Match</span>
                  <span className="font-mono">{skillMatchOverride}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#EAE6DC] overflow-hidden border border-[#080808]">
                  <div
                    className="h-full bg-[#080808] transition-all duration-300"
                    style={{ width: `${skillMatchOverride}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Decision Explanation Box */}
            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3.5 text-xs text-[#080808]">
              <div className="font-heading font-extrabold flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#080808]" />
                <span>Why this recommendation?</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#080808]/85">
                {decisionReason}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#D8D5CE] text-center">
            <span className="text-[11px] font-heading font-bold text-[#777777]">
              Zero Hallucinations • Real Deterministic Rules • Verified Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

