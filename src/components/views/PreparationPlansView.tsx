"use client";

import React, { useState, useEffect } from "react";
import {
  PreparationPlan,
  PreparationPlanItem,
  Opportunity,
  EvaluationResult,
  UserProfile,
} from "@/types";
import { CompanyLogo } from "@/components/CompanyLogo";
import { VoiceMockInterviewStudio } from "@/components/views/VoiceMockInterviewStudio";
import { generateApplicationMaterials } from "@/lib/prep-studio";
import {
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  CircleDashed,
  ArrowRight,
  BookOpen,
  FileText,
  Copy,
  Check,
  CheckSquare,
  Sparkles,
  Compass,
  Code,
  Layers,
  Terminal,
  Database,
  BarChart2,
  Signal,
  Flame,
  Mic,
  BrainCircuit,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface PreparationPlansViewProps {
  plans: PreparationPlan[];
  opportunities?: Opportunity[];
  evaluations?: Array<{
    opportunityId: string;
    evaluation: EvaluationResult;
  }>;
  profile?: UserProfile | null;
  onToggleItem: (
    planId: string,
    itemId: string,
    currentStatus: boolean
  ) => Promise<void> | void;
  onInspectOpportunity: (
    opp: Opportunity,
    evalResult?: EvaluationResult
  ) => void;
  onNavigateDiscover?: () => void;
  onGeneratePlan?: (opportunityId: string) => Promise<void>;
  onUploadResume?: () => void;
  initialStudioTab?: "resume" | "coverLetter" | "answers" | "interview";
}

export function PreparationPlansView({
  plans,
  opportunities = [],
  evaluations = [],
  profile = null,
  onToggleItem,
  onInspectOpportunity,
  onNavigateDiscover,
  onGeneratePlan,
  onUploadResume,
  initialStudioTab,
}: PreparationPlansViewProps) {
  const [studioMode, setStudioMode] = useState<"interview" | "plan">(
    initialStudioTab === "interview" ? "interview" : "plan"
  );
  const [selectedGenOppId, setSelectedGenOppId] = useState<string>(
    opportunities[0]?.id || ""
  );
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Currently selected plan index or opportunity
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans[0]?.id || ""
  );
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    new Set<string>()
  );
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<
    "resume" | "coverLetter" | "answers" | "interview"
  >(initialStudioTab || "resume");

  useEffect(() => {
    if (initialStudioTab) {
      setActiveStudioTab(initialStudioTab);
      if (initialStudioTab === "interview") {
        setStudioMode("interview");
      }
    }
  }, [initialStudioTab]);

  useEffect(() => {
    if (!selectedGenOppId && opportunities[0]?.id) {
      setSelectedGenOppId(opportunities[0].id);
    }
  }, [opportunities, selectedGenOppId]);
  const [isOppDropdownOpen, setIsOppDropdownOpen] = useState(false);

  // Application Studio editable drafts
  const [resumeDraft, setResumeDraft] = useState("");
  const [coverLetterDraft, setCoverLetterDraft] = useState("");
  const [answersDraft, setAnswersDraft] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Synchronize selected plan when plans list changes
  useEffect(() => {
    if (plans.length > 0 && (!selectedPlanId || !plans.some((p) => p.id === selectedPlanId))) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const activeOpp: Opportunity | undefined =
    activePlan?.opportunity ||
    opportunities.find((o) => o.id === activePlan?.opportunityId) ||
    opportunities[0];

  const activeEval: EvaluationResult | undefined = evaluations.find(
    (e) => e.opportunityId === activeOpp?.id
  )?.evaluation;

  // Initialize or regenerate application studio materials when opportunity changes
  useEffect(() => {
    if (activeOpp) {
      const materials = generateApplicationMaterials(activeOpp, profile);
      setResumeDraft(materials.resumeBulletsDraft || "");
      setCoverLetterDraft(materials.coverLetterDraft || "");
      setAnswersDraft(materials.questionsDraft || "");
    }
  }, [activeOpp, profile]);

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleCopyText = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const handleTriggerGeneratePlan = async () => {
    if (!onGeneratePlan || !selectedGenOppId) return;
    setIsGeneratingPlan(true);
    try {
      await onGeneratePlan(selectedGenOppId);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Mode Switcher Bar shown cleanly above both Voice Interview & Prep Plan tabs
  const renderStudioModeBanner = () => (
    <section className="bg-white border border-black/[0.07] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 sm:p-7 select-none">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-[11px] font-heading font-bold tracking-[0.14em] text-[#6B7280] uppercase">
            PREPARATION &amp; VOICE INTERVIEW STUDIO
          </span>
          <h1 className="mt-2 font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-[#101214] leading-[1.1]">
            Turn your gaps{" "}
            <span className="bg-[#DFFF43] rounded-xl px-2 py-0.5 text-[#111111]">
              into progress.
            </span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#6B7280] font-medium max-w-xl">
            Inspect exactly how Prospect derives your skill-gap roadmap from your resume, or run a live voice mock interview sourced from the web + your capabilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-1.5 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setStudioMode("interview")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-heading font-semibold transition-all cursor-pointer ${
              studioMode === "interview"
                ? "bg-[#DFFF43] text-[#111111] shadow-[0_2px_10px_rgba(223,255,67,0.3)]"
                : "text-[#6B7280] hover:text-[#111111]"
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>AI Voice Mock Interview</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode("plan")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-heading font-semibold transition-all cursor-pointer ${
              studioMode === "plan"
                ? "bg-[#DFFF43] text-[#111111] shadow-[0_2px_10px_rgba(223,255,67,0.3)]"
                : "text-[#6B7280] hover:text-[#111111]"
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Explainable Prep Plan ({plans.length})</span>
          </button>
        </div>
      </div>
    </section>
  );

  // If user is in Live AI Voice Mock Interview mode, render immediately even before plans exist!
  if (studioMode === "interview") {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {renderStudioModeBanner()}
        <VoiceMockInterviewStudio
          profile={profile}
          opportunities={opportunities}
          selectedOpportunity={activeOpp || opportunities[0] || null}
          onUploadResume={onUploadResume}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // EMPTY STATE (IN PLAN MODE): Offer On-Demand Real Plan Generator
  // -------------------------------------------------------------
  if (!activePlan || plans.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {renderStudioModeBanner()}
        <div className="bg-white border border-black/[0.07] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-10 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 text-[#101214]">
            <Compass className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#101214]">
              {opportunities.length > 0 && profile
                ? "Generate a Resume-Grounded Preparation Plan"
                : "Your next opportunity deserves a plan."}
            </h2>
            <p className="mt-2 text-sm text-[#6B7280] max-w-lg mx-auto leading-relaxed">
              {opportunities.length > 0 && profile
                ? "Select any live opportunity discovered for your profile to synthesize missing required & preferred skill milestones with full explainability trace."
                : "Upload your resume and run live discovery so Prospect can compare your verified skills against target roles and generate tailored milestones."}
            </p>
          </div>

          {opportunities.length > 0 && profile && onGeneratePlan ? (
            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={selectedGenOppId}
                onChange={(e) => setSelectedGenOppId(e.target.value)}
                className="flex-1 rounded-xl border border-[#E9E6DF] bg-[#FDFBF8] px-3 py-2.5 text-xs font-semibold text-[#111111]"
              >
                {opportunities.slice(0, 15).map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} • {opp.organization}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleTriggerGeneratePlan}
                disabled={isGeneratingPlan}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] text-white font-semibold px-5 py-2.5 text-xs cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-[#DFFF43]" />
                    <span>Generate Plan</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {!profile && onUploadResume && (
                <button
                  type="button"
                  onClick={onUploadResume}
                  className="rounded-full bg-[#DFFF43] text-[#111111] border border-[#C6E832] font-bold inline-flex items-center gap-2 px-6 py-2.5 text-sm cursor-pointer"
                >
                  <span>Upload Resume First</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateDiscover}
                className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] transition-all inline-flex items-center space-x-2 px-6 py-2.5 text-sm cursor-pointer"
              >
                <span>Explore Opportunities</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // METRICS & PROGRESS CALCULATIONS (derived from actual data)
  // -------------------------------------------------------------
  const items: PreparationPlanItem[] = activePlan.items || [];
  const totalTasks = items.length;
  const completedTasks = items.filter((i) => i.isCompleted).length;
  const inProgressTasks = items.filter((i) => !i.isCompleted && (i.inProgress || i.id === "task-2")).length;
  const remainingTasks = Math.max(0, totalTasks - completedTasks - inProgressTasks);
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Next Best Move: First incomplete task
  const nextBestTask = items.find((i) => !i.isCompleted) || items[0];

  // What you need to strengthen: Derived skill gap overview from actual evaluation & plan items
  const skillGaps = (activeEval?.skillGapAnalysis && activeEval.skillGapAnalysis.length > 0
    ? activeEval.skillGapAnalysis.slice(0, 4).map((gap, idx) => ({
        name: gap.skill,
        icon: idx % 3 === 0 ? Database : idx % 3 === 1 ? Terminal : BarChart2,
        requirement: gap.whyItMatters,
        status: gap.importance === "CRITICAL" ? "Required Gap" : "Preferred Gap",
        statusColor:
          gap.importance === "CRITICAL"
            ? "bg-[#FEF9E7] text-[#715515] border-[#F5DFA0]"
            : "bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 text-[#101214] border-[#C7E938]/55",
        actionLabel: gap.preparationPath,
        targetTaskId: items[idx]?.id || items[0]?.id || "task-1",
      }))
    : items.slice(0, 3).map((item, idx) => ({
        name: item.skillTag || item.requirement || `Requirement ${idx + 1}`,
        icon: idx % 3 === 0 ? Database : idx % 3 === 1 ? Terminal : BarChart2,
        requirement: item.gap || item.concreteAction,
        status: item.isCompleted ? "Completed" : "In Progress",
        statusColor: item.isCompleted
          ? "bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 text-[#101214] border-[#C7E938]/55"
          : "bg-[#FEF9E7] text-[#715515] border-[#F5DFA0]",
        actionLabel: item.concreteAction,
        targetTaskId: item.id,
      })));

  // Upcoming tasks derived from actual preparation plan items
  const upcomingTasks = items.slice(0, 4).map((item) => ({
    id: item.id,
    concreteAction: item.concreteAction,
    isCompleted: Boolean(item.isCompleted),
    displayDate: item.plannedDate || item.estimatedEffort || "Pending",
    displayPriority: item.priority === "High" || item.priority === "HIGH" ? "High" : "Medium",
  }));

  const candidateSkillSet = new Set(
    (profile?.skills || []).map((s) => s.trim().toLowerCase())
  );
  const reqSkills = activeOpp?.requiredSkills || [];
  const prefSkills = activeOpp?.preferredSkills || [];
  const matchedReqSkills = reqSkills.filter((s) =>
    candidateSkillSet.has(s.trim().toLowerCase())
  );
  const missingReqSkills = reqSkills.filter(
    (s) => !candidateSkillSet.has(s.trim().toLowerCase())
  );
  const missingPrefSkills = prefSkills.filter(
    (s) => !candidateSkillSet.has(s.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {renderStudioModeBanner()}

      {/* ===================================================== */}
      {/* 2. EXPLAINABLE AI SYNTHESIS TRACE (WHY & HOW)         */}
      {/* ===================================================== */}
      <section className="rounded-[22px] bg-white border border-[#E9E6DF] p-5 sm:p-6 shadow-[0_8px_28px_rgba(17,17,17,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E9E6DF]">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAE3FF] border border-[#D7CCF8] px-2.5 py-0.5 text-[10.5px] font-heading font-bold text-[#111111]">
              <BrainCircuit className="h-3 w-3" />
              <span>EXPLAINABLE PLAN PIPELINE • HOW PROSPECT GENERATED THIS PLAN</span>
            </div>
            <h2 className="mt-1.5 font-heading text-lg font-bold text-[#111111]">
              Resume Understanding → Requirement Diff → Personalized Milestones
            </h2>
          </div>
          <span className="rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-3 py-1 text-[11px] font-bold text-[#111111] shrink-0">
            {matchedReqSkills.length}/{reqSkills.length || 0} Required Skills Matched
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Stage 1: What Prospect Understood From Candidate Resume */}
          <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-4 space-y-2">
            <div className="font-heading font-bold text-[#111111] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#70B93F]" />
              <span>1. What Prospect Extracted</span>
            </div>
            <p className="text-[11px] text-[#777777]">
              Candidate:{" "}
              <strong className="text-[#111111]">
                {profile?.fullName || "Unconfigured"}
              </strong>{" "}
              ({profile?.degree || "Degree"} {profile?.major || ""})
            </p>
            <div className="flex flex-wrap gap-1">
              {(profile?.skills || []).slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-white border border-[#E9E6DF] px-2 py-0.5 text-[10.5px] font-medium text-[#111111]"
                >
                  {s}
                </span>
              ))}
            </div>
            {profile?.projects?.[0] && (
              <p className="text-[11px] text-[#777777] pt-1">
                Primary Anchor Project:{" "}
                <strong className="text-[#111111]">
                  {profile.projects[0].name}
                </strong>
              </p>
            )}
          </div>

          {/* Stage 2: Exact Role Requirement Diff */}
          <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-4 space-y-2">
            <div className="font-heading font-bold text-[#111111]">
              2. Target Role Skill Diff
            </div>
            <p className="text-[11px] text-[#777777]">
              Comparing resume against{" "}
              <strong className="text-[#111111]">
                {activeOpp?.organization || "employer"}
              </strong>{" "}
              posting:
            </p>
            <div className="flex flex-wrap gap-1">
              {matchedReqSkills.map((s) => (
                <span
                  key={`m-${s}`}
                  className="rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-2 py-0.5 text-[10.5px] font-semibold text-[#111111]"
                >
                  ✓ {s}
                </span>
              ))}
              {missingReqSkills.map((s) => (
                <span
                  key={`g-${s}`}
                  className="rounded-full bg-[#FEF9E7] border border-[#F5DFA0] px-2 py-0.5 text-[10.5px] font-semibold text-[#715515]"
                >
                  △ Gap: {s}
                </span>
              ))}
              {missingPrefSkills.slice(0, 2).map((s) => (
                <span
                  key={`p-${s}`}
                  className="rounded-full bg-[#EAE3FF] border border-[#D7CCF8] px-2 py-0.5 text-[10.5px] font-semibold text-[#111111]"
                >
                  + Pref: {s}
                </span>
              ))}
            </div>
          </div>

          {/* Stage 3: Deterministic Milestone Generation Rule */}
          <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-4 space-y-2">
            <div className="font-heading font-bold text-[#111111]">
              3. How Tasks Are Synthesized
            </div>
            <p className="text-[11px] text-[#555555] leading-relaxed">
              Each detected gap is paired directly with your strongest project (
              <strong className="text-[#111111]">
                {profile?.projects?.[0]?.name || "core resume repo"}
              </strong>
              ) to generate concrete deliverables, verification criteria, and re-scoring triggers rather than generic study tips.
            </p>
            <button
              type="button"
              onClick={() => setStudioMode("interview")}
              className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#111111] underline underline-offset-2 hover:text-[#70B93F] cursor-pointer"
            >
              <Mic className="h-3 w-3" />
              <span>Practice these gaps in AI Voice Mock Interview →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* 2. CONTEXTUAL OPPORTUNITY SELECTOR ("PREPARING FOR")  */}
      {/* ===================================================== */}
      <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] relative p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Preparing For Label + Opportunity Details */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-[#F4F5F0] px-3 py-1 font-heading text-[11px] font-semibold text-[#101214] uppercase tracking-wider shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-[#4B5563]" />
            <span>Preparing For</span>
          </div>

          <div className="flex items-center space-x-3 min-w-0">
            {activeOpp && (
              <CompanyLogo
                name={activeOpp.organization}
                size={38}
                className="h-9 w-9 shrink-0 rounded-xl border border-black/[0.08]"
              />
            )}

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#101214] truncate">
                  {activeOpp?.title || "Selected Opportunity"}
                </h3>

                {plans.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsOppDropdownOpen(!isOppDropdownOpen)}
                    className="p-1 text-[#4B5563] hover:text-[#101214] hover:bg-[#F4F5F0] rounded-full transition-colors cursor-pointer"
                    title="Switch opportunity plan"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-[#6B7280] font-medium truncate">
                {activeOpp?.organization || "Organization"} •{" "}
                {activeOpp?.category || "Internship"} •{" "}
                {activeOpp?.workMode || "Remote"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Recommendation Badge & Inspect Link */}
        <div className="flex items-center space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.06]">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F5DFA0] bg-[#FEF9E7] px-3.5 py-1 font-heading text-xs font-semibold text-[#715515]">
            <BookOpen className="h-3.5 w-3.5 text-[#715515]" />
            <span>
              {activeEval?.recommendation === "APPLY_NOW"
                ? "Apply Now"
                : activeEval?.recommendation === "KEEP_WATCHING"
                ? "Keep Watching"
                : "Prepare First"}
            </span>
          </div>

          {activeOpp && (
            <button
              type="button"
              onClick={() => onInspectOpportunity(activeOpp, activeEval)}
              className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] inline-flex items-center space-x-1.5 px-3.5 py-1.5 font-heading text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>View Opportunity</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#4B5563]" />
            </button>
          )}
        </div>

        {/* Dropdown to switch opportunity plans */}
        {isOppDropdownOpen && plans.length > 1 && (
          <div className="absolute left-4 top-full mt-2 w-72 rounded-2xl border border-black/[0.08] bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.12)] z-30 space-y-1">
            <span className="block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Active Preparation Plans
            </span>
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlanId(p.id);
                  setIsOppDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  p.id === activePlan.id
                    ? "bg-[#E3FC6D] text-[#0E1012] font-semibold border border-[#C6E832]"
                    : "text-[#101214] hover:bg-[#FAFBF7]"
                }`}
              >
                <div className="font-semibold truncate">
                  {p.opportunity?.title || p.title}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  {p.opportunity?.organization}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================== */}
      {/* 3. MAIN TWO-COLUMN WORKSPACE                          */}
      {/* ===================================================== */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* =================================================== */}
        {/* LEFT COLUMN (~68% width)                            */}
        {/* =================================================== */}
        <div className="w-full lg:w-[67%] xl:w-[68%] space-y-6">
          {/* A. Your Preparation Plan Overview Card */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#101214]">
                  Your preparation plan
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
                  Focused steps based on the requirements you still need to meet.
                </p>
              </div>

              <div className="text-right text-xs sm:text-sm font-semibold text-[#101214] shrink-0 mt-2 sm:mt-0">
                <span>
                  {completedTasks} of {totalTasks} tasks ({progressPct}%)
                </span>
              </div>
            </div>

            {/* Electric Lime progress bar */}
            <div className="mt-4 h-3 w-full rounded-full bg-[#EFEFE9] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#84CC16] to-[#CBEF3B] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* 3 Status Counters */}
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 pt-3.5 border-t border-black/[0.06]">
              {/* Completed */}
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 text-[#4D7C0F]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-sm sm:text-base font-bold text-[#101214] leading-none">
                    {completedTasks}
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-medium">
                    Completed
                  </span>
                </div>
              </div>

              {/* In Progress */}
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#F5DFA0] bg-[#FEF9E7] text-[#715515]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-sm sm:text-base font-bold text-[#101214] leading-none">
                    {inProgressTasks}
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-medium">
                    In Progress
                  </span>
                </div>
              </div>

              {/* Remaining */}
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.06] bg-[#F4F5F0] text-[#6B7280]">
                  <CircleDashed className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-sm sm:text-base font-bold text-[#101214] leading-none">
                    {remainingTasks}
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-medium">
                    Remaining
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* B. Skill Gap Overview: What you need to strengthen */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 sm:p-6">
            <h2 className="text-xl font-bold text-[#101214]">
              What you need to strengthen
            </h2>

            <div className="mt-4 divide-y divide-black/[0.06]">
              {skillGaps.map((gap, i) => {
                const GapIcon = gap.icon;
                return (
                  <div
                    key={i}
                    className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    {/* Left: Skill name & requirement context */}
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAFBF7] border border-black/[0.07] text-[#101214] shrink-0 mt-0.5">
                        <GapIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-[#101214]">
                          {gap.name}
                        </span>
                        <p className="text-xs text-[#6B7280] leading-snug mt-0.5">
                          {gap.requirement}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status badge & Action link */}
                    <div className="flex items-center space-x-3 shrink-0 pl-11 sm:pl-0">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${gap.statusColor}`}
                      >
                        {gap.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleTaskExpansion(gap.targetTaskId)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-[#101214] hover:underline transition-colors cursor-pointer"
                        title={gap.actionLabel}
                      >
                        <span className="max-w-[180px] truncate">{gap.actionLabel}</span>
                        <ArrowRight className="h-3 w-3 text-[#4B5563] shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* C. Actionable Preparation Roadmap: Your next steps */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 sm:p-6">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xl font-bold text-[#101214]">
                Your next steps
              </h2>
              <span className="text-xs font-medium text-[#6B7280]">
                Click checkbox to update progress
              </span>
            </div>

            {/* Vertical Milestone Timeline */}
            <div className="mt-5 space-y-4 relative">
              {(showAllSteps ? items : items.slice(0, 2)).map((item, index, arr) => {
                const isExpanded = expandedTaskIds.has(item.id);
                const hasNext = index < arr.length - 1;

                return (
                  <div key={item.id} id={item.id} className="relative flex items-start space-x-3 sm:space-x-4">
                    {/* Connecting line */}
                    {hasNext && (
                      <div className="absolute left-[13px] sm:left-[15px] top-7 bottom-0 w-px bg-black/[0.12] -mb-4 z-0" />
                    )}

                    {/* Timeline Node Checkbox */}
                    <button
                      type="button"
                      onClick={() =>
                        onToggleItem(activePlan.id, item.id, item.isCompleted)
                      }
                      className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
                        item.isCompleted
                          ? "border-[#101214] bg-[#101214] text-[#E3FC6D] shadow-[0_2px_8px_rgba(16,18,20,0.16)]"
                          : "border-black/[0.14] bg-white text-transparent hover:border-[#94D814] hover:bg-[#F3FCDA]"
                      }`}
                      title={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                      aria-label={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    {/* Task Card Container */}
                    <div
                      className={`flex-1 rounded-2xl border transition-all overflow-hidden ${
                        item.isCompleted
                          ? "border-black/[0.06] bg-[#FAFBF7]"
                          : "border-black/[0.07] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)]"
                      }`}
                    >
                      {/* Main Task Header Bar */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3
                              className={`font-semibold text-sm sm:text-base leading-snug ${
                                item.isCompleted
                                  ? "line-through text-[#6B7280]"
                                  : "text-[#101214]"
                              }`}
                            >
                              {item.concreteAction}
                            </h3>
                          </div>

                          <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                            {item.deliverable}
                          </p>

                          {/* Skill tag and priority chips */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {item.skillTag && (
                              <span className="rounded-full bg-[#F4F5F0] border border-black/[0.06] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#101214]">
                                {item.skillTag}
                              </span>
                            )}

                            {item.priority && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#4B5563] font-semibold">
                                <Signal className="h-3 w-3 text-[#6B7280]" />
                                <span>{item.priority}</span>
                              </span>
                            )}

                            {item.estimatedEffort && (
                              <span className="text-[11px] text-[#6B7280]">
                                • {item.estimatedEffort}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Action or Completed Badge + Chevron */}
                        <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                          {item.isCompleted ? (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 px-3 py-1 text-xs font-semibold text-[#101214]">
                              <Check className="h-3.5 w-3.5 text-[#4D7C0F]" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onToggleItem(activePlan.id, item.id, false)
                              }
                              className="rounded-full bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] hover:bg-[#d9f753] px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Start Task
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleTaskExpansion(item.id)}
                            className="p-1.5 text-[#4B5563] hover:text-[#101214] hover:bg-[#F4F5F0] rounded-full transition-colors cursor-pointer"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Task Breakdown */}
                      {isExpanded && (
                        <div className="border-t border-black/[0.06] bg-[#FAFBF7] p-4 sm:p-5 text-xs space-y-3">
                          <div>
                            <strong className="text-[#101214]">Why this task matters: </strong>
                            <span className="text-[#4B5563]">
                              Directly addresses the verified requirement &quot;{item.requirement}&quot;.
                              Completing it provides tangible evidence for your application.
                            </span>
                          </div>

                          <div>
                            <strong className="text-[#101214]">Completion Criteria: </strong>
                            <span className="text-[#4B5563]">
                              {item.completionCriteria}
                            </span>
                          </div>

                          <div>
                            <strong className="text-[#101214]">Portfolio Proof: </strong>
                            <span className="text-[#4B5563]">
                              {item.portfolioProof}
                            </span>
                          </div>

                          <div className="pt-2 flex items-center justify-between text-[11px] text-[#6B7280]">
                            <span>
                              * Effort is a rough planning estimate. Completing items improves evidence but does not guarantee selection.
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onToggleItem(activePlan.id, item.id, item.isCompleted)
                              }
                              className="font-semibold text-[#101214] hover:underline cursor-pointer shrink-0 ml-3"
                            >
                              {item.isCompleted ? "Reopen task" : "Mark as finished"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {items.length > 2 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllSteps(!showAllSteps)}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#101214] hover:underline transition-colors cursor-pointer"
                  >
                    <span>
                      {showAllSteps
                        ? "Show fewer steps"
                        : `View all ${items.length} preparation steps (${items.length - 2} more)`}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showAllSteps ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* D. Application Preparation Studio (Resume, Cover Letter, Answers, Interview) */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-black/[0.06]">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-[#101214]" />
                <h2 className="text-xl font-bold text-[#101214]">
                  Prepare your application
                </h2>
              </div>

              {/* Segmented Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[#F4F5F0] border border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveStudioTab("resume")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeStudioTab === "resume"
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                      : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Resume</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStudioTab("coverLetter")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeStudioTab === "coverLetter"
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                      : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Cover Letter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStudioTab("answers")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeStudioTab === "answers"
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                      : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Application Answers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStudioTab("interview")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    activeStudioTab === "interview"
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                      : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Interview Preparation</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Resume Bullets */}
            {activeStudioTab === "resume" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>
                    Evidence-grounded resume suggestions tailored for {activeOpp?.organization || "this opportunity"}.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(resumeDraft, "resume")}
                    className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedSection === "resume" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#4D7C0F]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#4B5563]" />
                        <span>Copy Bullets</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={resumeDraft}
                  onChange={(e) => setResumeDraft(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all p-4 font-mono text-xs text-[#101214] leading-relaxed focus:outline-none"
                  placeholder="Generating tailored resume bullets..."
                />
              </div>
            )}

            {/* Tab 2: Cover Letter Draft */}
            {activeStudioTab === "coverLetter" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>
                    Grounded draft using your verified university, degree, and projects.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(coverLetterDraft, "coverLetter")}
                    className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedSection === "coverLetter" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#4D7C0F]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#4B5563]" />
                        <span>Copy Cover Letter</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={coverLetterDraft}
                  onChange={(e) => setCoverLetterDraft(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all p-4 text-xs sm:text-sm text-[#101214] leading-relaxed focus:outline-none"
                  placeholder="Drafting cover letter..."
                />
              </div>
            )}

            {/* Tab 3: Application Answers */}
            {activeStudioTab === "answers" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>
                    Common technical and motivation questions grounded in your demonstrated facts.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(answersDraft, "answers")}
                    className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedSection === "answers" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#4D7C0F]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#4B5563]" />
                        <span>Copy Answers</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={answersDraft}
                  onChange={(e) => setAnswersDraft(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all p-4 font-mono text-xs text-[#101214] leading-relaxed focus:outline-none"
                  placeholder="Generating application responses..."
                />
              </div>
            )}

            {/* Tab 4: Interview Preparation */}
            {activeStudioTab === "interview" && (
              <div className="mt-4 space-y-4">
                <div className="text-xs text-[#6B7280]">
                  Technical interview checklist tailored for {activeOpp?.organization || "this organization"}.
                </div>

                <div className="space-y-2.5">
                  {[
                    `Review official job posting and requirements on ${activeOpp?.organization || "employer site"}`,
                    `Practice coding and explaining core skills: ${(activeOpp?.requiredSkills || ["Data Structures", "Python"]).join(", ")}`,
                    `Prepare 3 STAR-format behavioral stories grounded in your actual projects`,
                    `Confirm availability (${profile?.availability || "Immediate"}) and work mode (${activeOpp?.workMode || "Hybrid"})`,
                    `Prepare 3 technical questions about engineering culture and team tooling`,
                  ].map((task, idx) => (
                    <label
                      key={idx}
                      className="flex items-start space-x-3 p-3.5 rounded-xl border border-black/[0.07] bg-[#FAFBF7] hover:bg-white hover:border-black/[0.12] transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={idx === 0}
                        className="mt-0.5 h-4 w-4 rounded border-black/20 text-[#101214] focus:ring-[#94D814]"
                      />
                      <span className="text-xs sm:text-sm text-[#101214] font-semibold leading-snug">
                        {task}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* =================================================== */}
        {/* RIGHT COLUMN (~32% width)                           */}
        {/* =================================================== */}
        <div className="w-full lg:w-[33%] xl:w-[32%] space-y-6">
          {/* A. Your Next Best Move */}
          <section className="rounded-[22px] border border-[#F5DFA0] bg-[#FEF9E7] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 relative overflow-hidden">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#715515] uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-[#715515]" />
              <span>Your next best move</span>
            </div>

            <h3 className="mt-2.5 text-lg font-bold text-[#101214] leading-snug">
              {nextBestTask.concreteAction}
            </h3>

            <p className="mt-1.5 text-xs text-[#4B5563] leading-relaxed">
              {nextBestTask.requirement}
            </p>

            <div className="mt-3.5 flex items-center justify-between text-xs text-[#101214] pt-3 border-t border-[#F5DFA0]">
              <div className="flex items-center space-x-1 font-mono text-[11px] font-semibold text-[#715515]">
                <Clock className="h-3.5 w-3.5 text-[#715515]" />
                <span>{nextBestTask.estimatedEffort || "~ 2-3 hours"}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleTaskExpansion(nextBestTask.id);
                  const el = document.getElementById(nextBestTask.id);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs cursor-pointer"
              >
                <span>Continue Preparation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* B. Opportunity Readiness */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#101214] uppercase tracking-wide">
              <CheckSquare className="h-4 w-4 text-[#4B5563]" />
              <span>Opportunity readiness</span>
            </div>

            {/* Score & Recommendation Row */}
            <div className="mt-4 grid grid-cols-2 gap-3 pb-4 border-b border-black/[0.06]">
              <div>
                <span className="text-[11px] font-medium text-[#6B7280]">
                  Fit Score
                </span>
                <div className="mt-0.5 text-2xl font-extrabold text-[#101214]">
                  {activeEval?.overallScore ?? 0}%
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#6B7280]">
                  Current Recommendation
                </span>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 px-2.5 py-0.5 text-[11px] font-semibold text-[#101214]">
                    <BookOpen className="h-3 w-3" />
                    <span>
                      {activeEval?.recommendation === "APPLY_NOW"
                        ? "Apply Now"
                        : "Prepare First"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Readiness Checklist */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#4D7C0F]" />
                  <span className="text-[#101214] font-semibold">Eligibility</span>
                </div>
                <span className="rounded-full bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 px-2.5 py-0.5 text-[11px] font-semibold text-[#101214]">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CircleDashed className="h-3.5 w-3.5 text-[#6B7280]" />
                  <span className="text-[#101214] font-semibold">
                    Outstanding Skill Gaps
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#101214]">
                  {skillGaps.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CircleDashed className="h-3.5 w-3.5 text-[#6B7280]" />
                  <span className="text-[#101214] font-semibold">
                    Missing Information
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#6B7280]">
                  {activeEval?.uncertainties?.length ?? 0}
                </span>
              </div>
            </div>
          </section>

          {/* C. Upcoming Preparation Tasks */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#101214] uppercase tracking-wide">
              <Clock className="h-4 w-4 text-[#4B5563]" />
              <span>Upcoming preparation tasks</span>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    {t.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-[#4D7C0F] shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-black/[0.2] shrink-0" />
                    )}
                    <span className="truncate font-semibold text-[#101214]">
                      {t.concreteAction}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className="text-[11px] font-mono text-[#6B7280] max-w-[115px] truncate"
                      title={t.displayDate}
                    >
                      {t.displayDate}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                        t.displayPriority === "High"
                          ? "border-[#F5DFA0] bg-[#FEF9E7] text-[#715515]"
                          : "border-black/[0.06] bg-[#F4F5F0] text-[#4B5563]"
                      }`}
                    >
                      <Signal className="h-2.5 w-2.5" />
                      <span>{t.displayPriority}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.06] text-right">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("task-1");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#101214] hover:underline transition-colors cursor-pointer"
              >
                <span>View All Tasks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* D. Motivation Card */}
          <section className="rounded-[22px] border border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 flex items-center space-x-4">
            <div className="h-10 w-10 rounded-xl border border-[#C6E832] bg-[#E3FC6D] flex items-center justify-center text-[#101214] shrink-0">
              <Sparkles className="h-5 w-5 text-[#101214]" />
            </div>
            <p className="italic text-sm sm:text-base text-[#101214] font-semibold leading-snug">
              Small steps today create stronger opportunities tomorrow.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
