"use client";

import React from "react";
import {
  PersonalizedCareerBrief,
  Opportunity,
  EvaluationResult,
} from "@/types";
import {
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  FolderGit2,
  Clock,
  Layers,
  Building,
  MapPin,
  TrendingUp,
} from "lucide-react";

interface PersonalizedCareerBriefViewProps {
  brief: PersonalizedCareerBrief;
  onInspectOpportunity: (opp: Opportunity, evalResult: EvaluationResult) => void;
  onSaveToTracker: (opp: Opportunity) => void;
  onViewAllOpportunities: () => void;
  onReopenCareerOutlook?: () => void;
  savedOpportunityIds?: string[];
}

export function PersonalizedCareerBriefView({
  brief,
  onInspectOpportunity,
  onSaveToTracker,
  onViewAllOpportunities,
  onReopenCareerOutlook,
  savedOpportunityIds = [],
}: PersonalizedCareerBriefViewProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-2 animate-fade-in text-[#101214]">
      {/* Top Banner */}
      <div className="bg-white border border-black/[0.07] rounded-[26px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)]">
              <Compass className="h-3.5 w-3.5" />
              <span>Personalized Career Brief</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#101214]">
              Career Brief for {brief.candidateName}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl">
              Synthesized from your confirmed profile facts, selected career directions, and real-time opportunity discovery evaluations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onReopenCareerOutlook && (
              <button
                type="button"
                onClick={onReopenCareerOutlook}
                className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-4 py-2 text-xs font-medium transition cursor-pointer"
              >
                Review Career Outlook
              </button>
            )}
            <button
              type="button"
              onClick={onViewAllOpportunities}
              className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore All Listings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION A: YOUR STRONGEST CAREER DIRECTIONS               */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C6E832] bg-[#E3FC6D] text-xs font-bold text-[#0E1012]">
              A
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#101214]">
              Your Strongest Career Directions
            </h2>
          </div>
          <span className="text-xs font-medium text-[#64748B]">
            {brief.strongestDirections.length} directions identified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brief.strongestDirections.map((dir) => (
            <div
              key={dir.id}
              className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] hover:shadow-[0_12px_34px_rgba(15,23,42,0.075)] hover:border-black/[0.12] transition-all p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4B5563] bg-[#FAFBF7] px-2.5 py-0.5 rounded-full border border-black/[0.08]">
                    {dir.familyType}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      dir.evidenceStrength === "Strong evidence"
                        ? "bg-[#E3FC6D] border-[#C6E832] text-[#0E1012]"
                        : dir.evidenceStrength === "Some evidence"
                        ? "bg-[#F5F2FF] border-[#D9CCF8] text-[#4C1D95]"
                        : "bg-[#FEF9E7] border-[#F5DFA0] text-[#101214]"
                    }`}
                  >
                    {dir.evidenceStrength}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#101214]">
                  {dir.title}
                </h3>

                <p className="text-xs text-[#64748B] line-clamp-3 leading-relaxed">
                  {dir.relevanceExplanation}
                </p>
              </div>

              <div className="pt-2.5 border-t border-black/[0.07] text-[11px] text-[#4B5563] space-y-1">
                <div>
                  <strong className="text-[#101214]">Skills:</strong> {dir.supportingSkills.slice(0, 3).join(", ") || "Foundational"}
                </div>
                {dir.relevantProjects.length > 0 && (
                  <div>
                    <strong className="text-[#101214]">Project proof:</strong> {dir.relevantProjects[0].name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION B: OPPORTUNITIES WORTH PURSUING (APPLY NOW)       */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C6E832] bg-[#E3FC6D] text-xs font-bold text-[#0E1012]">
              B
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#101214]">
              Opportunities Worth Pursuing ({brief.opportunitiesWorthPursuing.length})
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#0E1012] bg-[#E3FC6D] px-3 py-0.5 rounded-full border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)]">
            Direct High-Fit Matches
          </span>
        </div>

        {brief.opportunitiesWorthPursuing.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-black/[0.14] bg-white/80 p-6 text-center text-xs text-[#64748B]">
            No direct APPLY_NOW matches discovered in current round. Review the opportunities requiring preparation below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brief.opportunitiesWorthPursuing.slice(0, 4).map(({ opportunity, evaluation }) => {
              const isSaved = savedOpportunityIds.includes(opportunity.id);
              return (
                <div
                  key={opportunity.id}
                  className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] hover:shadow-[0_12px_34px_rgba(15,23,42,0.075)] hover:border-black/[0.12] transition-all p-5 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-[#64748B] truncate">
                        {opportunity.organization} • {opportunity.location}
                      </span>
                      <span className="rounded-full bg-[#E3FC6D] px-2.5 py-0.5 text-xs font-semibold text-[#0E1012] border border-[#C6E832] shrink-0">
                        {evaluation.overallScore}% Fit
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#101214]">
                      {opportunity.title}
                    </h3>

                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                      {evaluation.rationale}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2.5 border-t border-black/[0.07]">
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.requiredSkills.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="rounded-full border border-black/[0.08] bg-[#FAFBF7] px-2.5 py-0.5 text-[10px] font-medium text-[#4B5563]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => onInspectOpportunity(opportunity, evaluation)}
                        className="text-xs font-semibold text-[#101214] hover:underline cursor-pointer"
                      >
                        Inspect Evidence & Score →
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSaveToTracker(opportunity)}
                          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer ${
                            isSaved
                              ? "bg-[#101214] text-white"
                              : "bg-white text-[#101214] border border-black/[0.09] hover:bg-[#F7F7F3]"
                          }`}
                        >
                          {isSaved ? "Saved" : "Save"}
                        </button>

                        <a
                          href={opportunity.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-1 text-xs font-semibold text-[#0E1012] hover:bg-[#DDFB4B] flex items-center gap-1 transition"
                        >
                          <span>Apply</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION C: OPPORTUNITIES REQUIRING PREPARATION             */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#F5DFA0] bg-[#FEF9E7] text-xs font-bold text-[#101214]">
              C
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#101214]">
              Opportunities Requiring Preparation ({brief.opportunitiesRequiringPrep.length})
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#101214] bg-[#FEF9E7] px-3 py-0.5 rounded-full border border-[#F5DFA0]">
            Addressable Skill Gaps
          </span>
        </div>

        {brief.opportunitiesRequiringPrep.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-black/[0.14] bg-white/80 p-6 text-center text-xs text-[#64748B]">
            No preparation-stage opportunities found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brief.opportunitiesRequiringPrep.slice(0, 4).map(({ opportunity, evaluation }) => (
              <div
                key={opportunity.id}
                className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] hover:shadow-[0_12px_34px_rgba(15,23,42,0.075)] hover:border-black/[0.12] transition-all p-5 space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#64748B] truncate">
                      {opportunity.organization} • {opportunity.location}
                    </span>
                    <span className="rounded-full bg-[#FEF9E7] px-2.5 py-0.5 text-xs font-semibold text-[#101214] border border-[#F5DFA0] shrink-0">
                      {evaluation.overallScore}% Fit
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#101214]">
                    {opportunity.title}
                  </h3>

                  <div className="rounded-2xl border border-[#D9CCF8] bg-[#F5F2FF] p-3 text-xs text-[#101214] space-y-1">
                    <strong className="font-semibold">Next preparation action:</strong>
                    <p className="text-[#4B5563]">{evaluation.nextAction}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.07]">
                  <button
                    type="button"
                    onClick={() => onInspectOpportunity(opportunity, evaluation)}
                    className="text-xs font-semibold text-[#101214] hover:underline cursor-pointer"
                  >
                    View Gap Plan & Roadmap →
                  </button>
                  <button
                    type="button"
                    onClick={() => onSaveToTracker(opportunity)}
                    className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3.5 py-1 text-xs font-medium transition cursor-pointer"
                  >
                    Track in Prep
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION D & E: SKILL GAPS & RECOMMENDED ACTIONS            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION D: IMPORTANT SKILL GAPS */}
        <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-black/[0.07] pb-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#F5DFA0] bg-[#FEF9E7] text-xs font-bold text-[#101214]">
              D
            </span>
            <h3 className="text-lg font-bold text-[#101214]">
              Important Skill Gaps
            </h3>
          </div>
          <p className="text-xs text-[#64748B]">
            The most frequently missing qualifications across your target career directions:
          </p>

          <div className="space-y-2.5">
            {brief.importantSkillGaps.length === 0 ? (
              <p className="text-xs font-semibold text-[#101214]">
                No critical skill gaps identified across discovered listings!
              </p>
            ) : (
              brief.importantSkillGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#101214]">{gap.skill}</span>
                    <p className="text-[11px] text-[#64748B]">
                      Requested by {gap.relatedRoles.join(", ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#FEF9E7] px-2.5 py-0.5 text-[10px] font-semibold text-[#101214] border border-[#F5DFA0] shrink-0">
                    {gap.frequency}x demand
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION E: RECOMMENDED NEXT ACTIONS */}
        <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-black/[0.07] pb-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C6E832] bg-[#E3FC6D] text-xs font-bold text-[#0E1012]">
              E
            </span>
            <h3 className="text-lg font-bold text-[#101214]">
              Recommended Next Actions
            </h3>
          </div>
          <p className="text-xs text-[#64748B]">
            High-leverage tactical steps to advance your application readiness:
          </p>

          <div className="space-y-2.5">
            {brief.recommendedNextActions.map((action, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#101214]">{action.title}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border shrink-0 ${
                      action.priority === "HIGH"
                        ? "bg-[#E3FC6D] border-[#C6E832] text-[#0E1012]"
                        : "bg-white border-black/[0.08] text-[#4B5563]"
                    }`}
                  >
                    {action.priority}
                  </span>
                </div>
                <p className="text-[#64748B] leading-relaxed">{action.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* SECTION F: UPCOMING OPPORTUNITY DEADLINES                 */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C6E832] bg-[#E3FC6D] text-xs font-bold text-[#0E1012]">
              F
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#101214]">
              Upcoming Opportunity Deadlines ({brief.upcomingDeadlines.length})
            </h2>
          </div>
          <span className="text-xs font-medium text-[#64748B]">Chronological Urgency</span>
        </div>

        {brief.upcomingDeadlines.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-black/[0.14] bg-white/80 p-6 text-center text-xs text-[#64748B]">
            Most current opportunities have rolling deadlines or are updated live.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {brief.upcomingDeadlines.map((dl) => (
              <div
                key={dl.opportunityId}
                className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-[#101214] truncate">{dl.organization}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                      dl.daysRemaining <= 7
                        ? "bg-rose-50 border-rose-200 text-rose-800"
                        : "bg-[#FEF9E7] border-[#F5DFA0] text-[#101214]"
                    }`}
                  >
                    {dl.daysRemaining} days left
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#101214] line-clamp-1">
                  {dl.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                  <Clock className="h-3.5 w-3.5 text-[#64748B]" />
                  <span>Due {new Date(dl.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION G: EVIDENCE & SOURCE REFERENCES                   */}
      {/* ========================================================= */}
      <section className="bg-white border border-black/[0.07] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.07] pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C6E832] bg-[#E3FC6D] text-xs font-bold text-[#0E1012]">
              G
            </span>
            <h3 className="text-lg font-bold text-[#101214]">
              Evidence & Verified Source References
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#64748B]">
            100% Traceable Links
          </span>
        </div>
        <p className="text-xs text-[#64748B]">
          Every opportunity listing, requirement claim, and compensation rate in Prospect is verified against primary source URLs:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brief.sourceReferences.map((ref, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 text-xs space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#101214]">{ref.name}</span>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-[#101214] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Verify at source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-[#64748B] line-clamp-1 text-[11px]">{ref.claim}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

