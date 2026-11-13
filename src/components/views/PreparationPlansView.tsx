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
  initialStudioTab,
}: PreparationPlansViewProps) {
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
    }
  }, [initialStudioTab]);
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

  // -------------------------------------------------------------
  // EMPTY STATE: No preparation plans exist
  // -------------------------------------------------------------
  if (!activePlan || plans.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="neo-card-lg bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] shadow-[3px_3px_0px_#080808]">
            <Compass className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-[#080808]">
            Your next opportunity deserves a plan.
          </h2>
          <p className="mt-2 text-sm text-[#777777] max-w-md mx-auto leading-relaxed">
            Explore opportunities and let Prospect identify the skills and
            evidence worth strengthening for roles evaluated as{" "}
            <strong className="text-[#080808]">PREPARE FIRST</strong>.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onNavigateDiscover}
              className="neo-btn-primary inline-flex items-center space-x-2 px-6 py-2.5 text-sm cursor-pointer"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
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
            ? "bg-[#FEF189] text-[#080808] border-[#080808]"
            : "bg-[#E0FB66] text-[#080808] border-[#080808]",
        actionLabel: gap.preparationPath,
        targetTaskId: items[idx]?.id || items[0]?.id || "task-1",
      }))
    : items.slice(0, 3).map((item, idx) => ({
        name: item.skillTag || item.requirement || `Requirement ${idx + 1}`,
        icon: idx % 3 === 0 ? Database : idx % 3 === 1 ? Terminal : BarChart2,
        requirement: item.gap || item.concreteAction,
        status: item.isCompleted ? "Completed" : "In Progress",
        statusColor: item.isCompleted
          ? "bg-[#E0FB66] text-[#080808] border-[#080808]"
          : "bg-[#FEF189] text-[#080808] border-[#080808]",
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ===================================================== */}
      {/* 1. HERO SECTION                                       */}
      {/* ===================================================== */}
      <section className="neo-card-lg p-6 sm:p-8 select-none">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-heading font-extrabold tracking-[0.14em] text-[#777777] uppercase">
            PREPARATION & APPLICATION STUDIO
          </span>
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="mt-4 max-w-lg">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-[#080808] leading-[1.08]">
            Turn your gaps <br />
            <span className="relative inline-block">
              into progress.
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-3.5 text-[#E0FB66] pointer-events-none"
                viewBox="0 0 180 18"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M4 13.5C44 9.5 128 5.5 176 4.5"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-[#777777] font-medium leading-relaxed max-w-md">
            Build the skills, evidence, and tailored materials needed for opportunities worth pursuing.
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* 2. CONTEXTUAL OPPORTUNITY SELECTOR ("PREPARING FOR")  */}
      {/* ===================================================== */}
      <div className="neo-card relative p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Preparing For Label + Opportunity Details */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FDF9F3] px-3 py-1 font-heading text-[11px] font-extrabold text-[#080808] uppercase tracking-wider shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-[#080808]" />
            <span>Preparing For</span>
          </div>

          <div className="flex items-center space-x-3 min-w-0">
            {activeOpp && (
              <CompanyLogo
                name={activeOpp.organization}
                size={38}
                className="h-9 w-9 shrink-0 rounded-xl border border-[#D8D5CE]"
              />
            )}

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-heading text-base sm:text-lg font-extrabold text-[#080808] truncate">
                  {activeOpp?.title || "Selected Opportunity"}
                </h3>

                {plans.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsOppDropdownOpen(!isOppDropdownOpen)}
                    className="p-1 text-[#080808] hover:bg-[#FDF9F3] rounded-full transition-colors cursor-pointer"
                    title="Switch opportunity plan"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-[#777777] font-medium truncate">
                {activeOpp?.organization || "Organization"} •{" "}
                {activeOpp?.category || "Internship"} •{" "}
                {activeOpp?.workMode || "Remote"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Recommendation Badge & Inspect Link */}
        <div className="flex items-center space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#D8D5CE]">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FEF189] px-3.5 py-1 font-heading text-xs font-extrabold text-[#080808]">
            <BookOpen className="h-3.5 w-3.5 text-[#080808]" />
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
              className="inline-flex items-center space-x-1 font-heading text-xs font-bold text-[#080808] hover:underline transition-colors cursor-pointer"
            >
              <span>View Opportunity</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#080808]" />
            </button>
          )}
        </div>

        {/* Dropdown to switch opportunity plans */}
        {isOppDropdownOpen && plans.length > 1 && (
          <div className="absolute left-4 top-full mt-2 w-72 rounded-2xl border-2 border-[#080808] bg-white p-2 shadow-[4px_4px_0px_#080808] z-30">
            <span className="block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#777777]">
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
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                  p.id === activePlan.id
                    ? "bg-[#E0FB66] text-[#080808] font-bold border border-[#080808]"
                    : "text-[#080808] hover:bg-[#FDF9F3]"
                }`}
              >
                <div className="font-bold truncate">
                  {p.opportunity?.title || p.title}
                </div>
                <div className="text-[11px] text-[#777777]">
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
          <section className="neo-card bg-white p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#080808]">
                  Your preparation plan
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#777777]">
                  Focused steps based on the requirements you still need to meet.
                </p>
              </div>

              <div className="text-right text-xs sm:text-sm font-bold text-[#080808] shrink-0 mt-2 sm:mt-0">
                <span>
                  {completedTasks} of {totalTasks} tasks ({progressPct}%)
                </span>
              </div>
            </div>

            {/* Electric Lime progress bar */}
            <div className="mt-4 h-3 w-full rounded-full bg-[#FDF9F3] border border-[#080808] overflow-hidden">
              <div
                className="h-full bg-[#E0FB66] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* 3 Status Counters */}
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-[#D8D5CE]">
              {/* Completed */}
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#080808] bg-[#E0FB66] text-[#080808]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-sm sm:text-base font-extrabold text-[#080808] leading-none">
                    {completedTasks}
                  </span>
                  <span className="text-[11px] text-[#777777] font-semibold">
                    Completed
                  </span>
                </div>
              </div>

              {/* In Progress */}
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#080808] bg-[#FEF189] text-[#080808]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-sm sm:text-base font-extrabold text-[#080808] leading-none">
                    {inProgressTasks}
                  </span>
                  <span className="text-[11px] text-[#777777] font-semibold">
                    In Progress
                  </span>
                </div>
              </div>

              {/* Remaining */}
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#080808] bg-[#FDF9F3] text-[#777777]">
                  <CircleDashed className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-sm sm:text-base font-extrabold text-[#080808] leading-none">
                    {remainingTasks}
                  </span>
                  <span className="text-[11px] text-[#777777] font-semibold">
                    Remaining
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* B. Skill Gap Overview: What you need to strengthen */}
          <section className="neo-card bg-white p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-[#080808]">
              What you need to strengthen
            </h2>

            <div className="mt-4 divide-y divide-[#D8D5CE]">
              {skillGaps.map((gap, i) => {
                const GapIcon = gap.icon;
                return (
                  <div
                    key={i}
                    className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    {/* Left: Skill name & requirement context */}
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDF9F3] border border-[#080808] text-[#080808] shrink-0 mt-0.5">
                        <GapIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-[#080808]">
                          {gap.name}
                        </span>
                        <p className="text-xs text-[#777777] leading-snug mt-0.5">
                          {gap.requirement}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status badge & Action link */}
                    <div className="flex items-center space-x-3 shrink-0 pl-11 sm:pl-0">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold shrink-0 ${gap.statusColor}`}
                      >
                        {gap.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleTaskExpansion(gap.targetTaskId)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-[#080808] hover:underline transition-colors cursor-pointer"
                        title={gap.actionLabel}
                      >
                        <span className="max-w-[180px] truncate">{gap.actionLabel}</span>
                        <ArrowRight className="h-3 w-3 text-[#080808] shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* C. Actionable Preparation Roadmap: Your next steps */}
          <section className="neo-card bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xl font-extrabold text-[#080808]">
                Your next steps
              </h2>
              <span className="text-xs font-medium text-[#777777]">
                Click checkbox to update progress
              </span>
            </div>

            {/* Vertical Milestone Timeline */}
            <div className="mt-5 space-y-4 relative">
              {(showAllSteps ? items : items.slice(0, 2)).map((item, index, arr) => {
                const isExpanded = expandedTaskIds.has(item.id);
                const hasNext = index < arr.length - 1;

                return (
                  <div key={item.id} className="relative flex items-start space-x-3 sm:space-x-4">
                    {/* Connecting line */}
                    {hasNext && (
                      <div className="absolute left-[13px] sm:left-[15px] top-7 bottom-0 w-0.5 bg-[#080808] -mb-4 z-0" />
                    )}

                    {/* Timeline Node Checkbox */}
                    <button
                      type="button"
                      onClick={() =>
                        onToggleItem(activePlan.id, item.id, item.isCompleted)
                      }
                      className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#080808] transition-all cursor-pointer ${
                        item.isCompleted
                          ? "bg-[#080808] text-[#E0FB66]"
                          : "bg-white text-transparent hover:bg-[#FEF189]"
                      }`}
                      title={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                      aria-label={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    {/* Task Card Container */}
                    <div
                      className={`flex-1 rounded-2xl border-2 border-[#080808] transition-all overflow-hidden ${
                        item.isCompleted
                          ? "bg-[#FDF9F3]"
                          : "bg-white shadow-[3px_3px_0px_#080808]"
                      }`}
                    >
                      {/* Main Task Header Bar */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3
                              className={`font-bold text-sm sm:text-base leading-snug ${
                                item.isCompleted
                                  ? "line-through text-[#777777]"
                                  : "text-[#080808]"
                              }`}
                            >
                              {item.concreteAction}
                            </h3>
                          </div>

                          <p className="mt-1 text-xs text-[#777777] leading-relaxed">
                            {item.deliverable}
                          </p>

                          {/* Skill tag and priority chips */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {item.skillTag && (
                              <span className="rounded-full bg-[#FDF9F3] border border-[#080808] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#080808]">
                                {item.skillTag}
                              </span>
                            )}

                            {item.priority && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#080808] font-semibold">
                                <Signal className="h-3 w-3 text-[#080808]" />
                                <span>{item.priority}</span>
                              </span>
                            )}

                            {item.estimatedEffort && (
                              <span className="text-[11px] text-[#777777]">
                                • {item.estimatedEffort}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Action or Completed Badge + Chevron */}
                        <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                          {item.isCompleted ? (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-[#E0FB66] border border-[#080808] px-3 py-1 text-xs font-bold text-[#080808]">
                              <Check className="h-3.5 w-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onToggleItem(activePlan.id, item.id, false)
                              }
                              className="rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] text-[#080808] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#080808] transition-colors cursor-pointer"
                            >
                              Start Task
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleTaskExpansion(item.id)}
                            className="p-1.5 text-[#080808] hover:bg-[#FDF9F3] rounded-full transition-colors cursor-pointer"
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
                        <div className="border-t-2 border-[#080808] bg-[#FDF9F3] p-4 sm:p-5 text-xs space-y-3">
                          <div>
                            <strong className="text-[#080808]">Why this task matters: </strong>
                            <span className="text-[#777777]">
                              Directly addresses the verified requirement &quot;{item.requirement}&quot;.
                              Completing it provides tangible evidence for your application.
                            </span>
                          </div>

                          <div>
                            <strong className="text-[#080808]">Completion Criteria: </strong>
                            <span className="text-[#777777]">
                              {item.completionCriteria}
                            </span>
                          </div>

                          <div>
                            <strong className="text-[#080808]">Portfolio Proof: </strong>
                            <span className="text-[#777777]">
                              {item.portfolioProof}
                            </span>
                          </div>

                          <div className="pt-2 flex items-center justify-between text-[11px] text-[#777777]">
                            <span>
                              * Effort is a rough planning estimate. Completing items improves evidence but does not guarantee selection.
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onToggleItem(activePlan.id, item.id, item.isCompleted)
                              }
                              className="font-bold text-[#080808] hover:underline cursor-pointer"
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
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#080808] hover:underline transition-colors cursor-pointer"
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
          <section className="neo-card bg-white p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-2 border-[#080808]">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-[#080808]" />
                <h2 className="text-xl font-extrabold text-[#080808]">
                  Prepare your application
                </h2>
              </div>

              {/* Segmented Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[#FDF9F3] border-2 border-[#080808]">
                <button
                  type="button"
                  onClick={() => setActiveStudioTab("resume")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeStudioTab === "resume"
                      ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                      : "text-[#777777] hover:text-[#080808]"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Resume</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStudioTab("coverLetter")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeStudioTab === "coverLetter"
                      ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                      : "text-[#777777] hover:text-[#080808]"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Cover Letter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStudioTab("answers")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeStudioTab === "answers"
                      ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                      : "text-[#777777] hover:text-[#080808]"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Application Answers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStudioTab("interview")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeStudioTab === "interview"
                      ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                      : "text-[#777777] hover:text-[#080808]"
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
                <div className="flex items-center justify-between text-xs text-[#777777]">
                  <span>
                    Evidence-grounded resume suggestions tailored for {activeOpp?.organization || "this opportunity"}.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(resumeDraft, "resume")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] text-xs font-bold text-[#080808] hover:bg-[#E0FB66] transition-colors cursor-pointer"
                  >
                    {copiedSection === "resume" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#080808]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#080808]" />
                        <span>Copy Bullets</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={resumeDraft}
                  onChange={(e) => setResumeDraft(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-4 font-mono text-xs text-[#080808] leading-relaxed focus:bg-white focus:outline-none"
                  placeholder="Generating tailored resume bullets..."
                />
              </div>
            )}

            {/* Tab 2: Cover Letter Draft */}
            {activeStudioTab === "coverLetter" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#777777]">
                  <span>
                    Grounded draft using your verified university, degree, and projects.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(coverLetterDraft, "coverLetter")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] text-xs font-bold text-[#080808] hover:bg-[#E0FB66] transition-colors cursor-pointer"
                  >
                    {copiedSection === "coverLetter" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#080808]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#080808]" />
                        <span>Copy Cover Letter</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={coverLetterDraft}
                  onChange={(e) => setCoverLetterDraft(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-4 text-xs sm:text-sm text-[#080808] leading-relaxed focus:bg-white focus:outline-none"
                  placeholder="Drafting cover letter..."
                />
              </div>
            )}

            {/* Tab 3: Application Answers */}
            {activeStudioTab === "answers" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#777777]">
                  <span>
                    Common technical and motivation questions grounded in your demonstrated facts.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(answersDraft, "answers")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] text-xs font-bold text-[#080808] hover:bg-[#E0FB66] transition-colors cursor-pointer"
                  >
                    {copiedSection === "answers" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#080808]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#080808]" />
                        <span>Copy Answers</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={answersDraft}
                  onChange={(e) => setAnswersDraft(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-4 font-mono text-xs text-[#080808] leading-relaxed focus:bg-white focus:outline-none"
                  placeholder="Generating application responses..."
                />
              </div>
            )}

            {/* Tab 4: Interview Preparation */}
            {activeStudioTab === "interview" && (
              <div className="mt-4 space-y-4">
                <div className="text-xs text-[#777777]">
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
                      className="flex items-start space-x-3 p-3 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] hover:bg-white transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={idx === 0}
                        className="mt-0.5 h-4 w-4 rounded border-[#080808] text-[#080808] focus:ring-[#080808]"
                      />
                      <span className="text-xs sm:text-sm text-[#080808] font-semibold leading-snug">
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
          <section className="neo-card bg-[#FEF189] p-5 relative overflow-hidden">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-[#080808] uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-[#080808]" />
              <span>Your next best move</span>
            </div>

            <h3 className="mt-2.5 text-lg font-extrabold text-[#080808] leading-snug">
              {nextBestTask.concreteAction}
            </h3>

            <p className="mt-1.5 text-xs text-[#080808]/80 leading-relaxed">
              {nextBestTask.requirement}
            </p>

            <div className="mt-3.5 flex items-center justify-between text-xs text-[#080808] pt-3 border-t border-[#080808]/20">
              <div className="flex items-center space-x-1 font-mono text-[11px] font-bold">
                <Clock className="h-3.5 w-3.5 text-[#080808]" />
                <span>{nextBestTask.estimatedEffort || "~ 2-3 hours"}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleTaskExpansion(nextBestTask.id);
                  const el = document.getElementById(nextBestTask.id);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="neo-btn-primary inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs cursor-pointer"
              >
                <span>Continue Preparation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* B. Opportunity Readiness */}
          <section className="neo-card bg-white p-5">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-[#080808] uppercase tracking-wide">
              <CheckSquare className="h-4 w-4 text-[#080808]" />
              <span>Opportunity readiness</span>
            </div>

            {/* Score & Recommendation Row */}
            <div className="mt-4 grid grid-cols-2 gap-3 pb-4 border-b border-[#D8D5CE]">
              <div>
                <span className="text-[11px] font-semibold text-[#777777]">
                  Fit Score
                </span>
                <div className="mt-0.5 text-2xl font-extrabold text-[#080808]">
                  {activeEval?.overallScore ?? 0}%
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#777777]">
                  Current Recommendation
                </span>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#080808] bg-[#E0FB66] px-2.5 py-0.5 text-[11px] font-bold text-[#080808]">
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
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#080808]" />
                  <span className="text-[#080808] font-semibold">Eligibility</span>
                </div>
                <span className="rounded-md bg-[#E0FB66] border border-[#080808] px-2 py-0.5 text-[11px] font-bold text-[#080808]">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CircleDashed className="h-3.5 w-3.5 text-[#777777]" />
                  <span className="text-[#080808] font-semibold">
                    Outstanding Skill Gaps
                  </span>
                </div>
                <span className="font-mono text-xs font-extrabold text-[#080808]">
                  {skillGaps.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CircleDashed className="h-3.5 w-3.5 text-[#777777]" />
                  <span className="text-[#080808] font-semibold">
                    Missing Information
                  </span>
                </div>
                <span className="font-mono text-xs font-extrabold text-[#777777]">
                  {activeEval?.uncertainties?.length ?? 0}
                </span>
              </div>
            </div>
          </section>

          {/* C. Upcoming Preparation Tasks */}
          <section className="neo-card bg-white p-5">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-[#080808] uppercase tracking-wide">
              <Clock className="h-4 w-4 text-[#080808]" />
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
                      <CheckCircle2 className="h-4 w-4 text-[#080808] shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-[#080808] shrink-0" />
                    )}
                    <span className="truncate font-semibold text-[#080808]">
                      {t.concreteAction}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className="text-[11px] font-mono text-[#777777] max-w-[115px] truncate"
                      title={t.displayDate}
                    >
                      {t.displayDate}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border border-[#080808] px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                        t.displayPriority === "High"
                          ? "bg-[#FEF189] text-[#080808]"
                          : "bg-[#FDF9F3] text-[#080808]"
                      }`}
                    >
                      <Signal className="h-2.5 w-2.5" />
                      <span>{t.displayPriority}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#D8D5CE] text-right">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("task-1");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center space-x-1 text-xs font-bold text-[#080808] hover:underline transition-colors cursor-pointer"
              >
                <span>View All Tasks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* D. Motivation Card */}
          <section className="neo-card bg-[#FDF9F3] p-5 flex items-center space-x-4">
            <div className="h-10 w-10 rounded-xl border-2 border-[#080808] bg-[#E0FB66] flex items-center justify-center text-[#080808] shrink-0">
              <Sparkles className="h-5 w-5 text-[#080808]" />
            </div>
            <p className="italic text-sm sm:text-base text-[#080808] font-bold leading-snug">
              Small steps today create stronger opportunities tomorrow.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
