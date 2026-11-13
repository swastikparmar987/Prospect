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
    <div className="mx-auto max-w-5xl space-y-10 py-2 animate-fade-in text-[#080808]">
      {/* Top Banner */}
      <div className="neo-card-lg bg-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#080808]">
              <Compass className="h-3.5 w-3.5" />
              <span>Personalized Career Brief</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#080808]">
              Career Brief for {brief.candidateName}
            </h1>
            <p className="text-xs sm:text-sm text-[#777777] max-w-2xl">
              Synthesized from your confirmed profile facts, selected career directions, and real-time opportunity discovery evaluations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onReopenCareerOutlook && (
              <button
                type="button"
                onClick={onReopenCareerOutlook}
                className="neo-btn-outline px-4 py-2 text-xs cursor-pointer"
              >
                Review Career Outlook
              </button>
            )}
            <button
              type="button"
              onClick={onViewAllOpportunities}
              className="neo-btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
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
        <div className="flex items-center justify-between border-b-2 border-[#080808] pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#080808] bg-[#E0FB66] text-xs font-extrabold text-[#080808]">
              A
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#080808]">
              Your Strongest Career Directions
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#777777]">
            {brief.strongestDirections.length} directions identified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brief.strongestDirections.map((dir) => (
            <div
              key={dir.id}
              className="neo-card bg-white p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#080808] bg-[#FDF9F3] px-2 py-0.5 rounded border border-[#080808]">
                    {dir.familyType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#080808] ${
                      dir.evidenceStrength === "Strong evidence"
                        ? "bg-[#E0FB66] text-[#080808]"
                        : dir.evidenceStrength === "Some evidence"
                        ? "bg-[#C4E7FF] text-[#080808]"
                        : "bg-[#FEF189] text-[#080808]"
                    }`}
                  >
                    {dir.evidenceStrength}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-[#080808]">
                  {dir.title}
                </h3>

                <p className="text-xs text-[#777777] line-clamp-3 leading-relaxed">
                  {dir.relevanceExplanation}
                </p>
              </div>

              <div className="pt-2 border-t border-[#D8D5CE] text-[11px] text-[#080808]/85 space-y-1">
                <div>
                  <strong>Skills:</strong> {dir.supportingSkills.slice(0, 3).join(", ") || "Foundational"}
                </div>
                {dir.relevantProjects.length > 0 && (
                  <div>
                    <strong>Project proof:</strong> {dir.relevantProjects[0].name}
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
        <div className="flex items-center justify-between border-b-2 border-[#080808] pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#080808] bg-[#E0FB66] text-xs font-extrabold text-[#080808]">
              B
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#080808]">
              Opportunities Worth Pursuing ({brief.opportunitiesWorthPursuing.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-[#080808] bg-[#E0FB66] px-2.5 py-0.5 rounded-full border border-[#080808]">
            Direct High-Fit Matches
          </span>
        </div>

        {brief.opportunitiesWorthPursuing.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#080808]/40 bg-white/80 p-6 text-center text-xs text-[#777777]">
            No direct APPLY_NOW matches discovered in current round. Review the opportunities requiring preparation below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brief.opportunitiesWorthPursuing.slice(0, 4).map(({ opportunity, evaluation }) => {
              const isSaved = savedOpportunityIds.includes(opportunity.id);
              return (
                <div
                  key={opportunity.id}
                  className="neo-card-interactive bg-white p-5 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#777777]">
                        {opportunity.organization} • {opportunity.location}
                      </span>
                      <span className="rounded-full bg-[#E0FB66] px-2.5 py-0.5 text-xs font-bold text-[#080808] border border-[#080808]">
                        {evaluation.overallScore}% Fit
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-[#080808]">
                      {opportunity.title}
                    </h3>

                    <p className="text-xs text-[#777777] line-clamp-2 leading-relaxed">
                      {evaluation.rationale}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#D8D5CE]">
                    <div className="flex flex-wrap gap-1">
                      {opportunity.requiredSkills.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="rounded border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 text-[10px] font-bold text-[#080808]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => onInspectOpportunity(opportunity, evaluation)}
                        className="text-xs font-bold text-[#080808] hover:underline cursor-pointer"
                      >
                        Inspect Evidence & Score →
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSaveToTracker(opportunity)}
                          className={`rounded-full border border-[#080808] px-3 py-1 text-xs font-bold transition cursor-pointer ${
                            isSaved
                              ? "bg-[#080808] text-white"
                              : "bg-[#FDF9F3] text-[#080808] hover:bg-[#FEF189]"
                          }`}
                        >
                          {isSaved ? "Saved" : "Save"}
                        </button>

                        <a
                          href={opportunity.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#080808] bg-[#E0FB66] px-3 py-1 text-xs font-bold text-[#080808] hover:bg-[#FEF189] flex items-center gap-1"
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
        <div className="flex items-center justify-between border-b-2 border-[#080808] pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#080808] bg-[#FEF189] text-xs font-extrabold text-[#080808]">
              C
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#080808]">
              Opportunities Requiring Preparation ({brief.opportunitiesRequiringPrep.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-[#080808] bg-[#FEF189] px-2.5 py-0.5 rounded-full border border-[#080808]">
            Addressable Skill Gaps
          </span>
        </div>

        {brief.opportunitiesRequiringPrep.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#080808]/40 bg-white/80 p-6 text-center text-xs text-[#777777]">
            No preparation-stage opportunities found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brief.opportunitiesRequiringPrep.slice(0, 4).map(({ opportunity, evaluation }) => (
              <div
                key={opportunity.id}
                className="neo-card bg-white p-5 space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#777777]">
                      {opportunity.organization} • {opportunity.location}
                    </span>
                    <span className="rounded-full bg-[#FEF189] px-2.5 py-0.5 text-xs font-bold text-[#080808] border border-[#080808]">
                      {evaluation.overallScore}% Fit
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#080808]">
                    {opportunity.title}
                  </h3>

                  <div className="rounded-xl border border-[#080808] bg-[#FDF9F3] p-2.5 text-xs text-[#080808] space-y-1">
                    <strong>Next preparation action:</strong>
                    <p className="text-[#777777]">{evaluation.nextAction}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#D8D5CE]">
                  <button
                    type="button"
                    onClick={() => onInspectOpportunity(opportunity, evaluation)}
                    className="text-xs font-bold text-[#080808] hover:underline cursor-pointer"
                  >
                    View Gap Plan & Roadmap →
                  </button>
                  <button
                    type="button"
                    onClick={() => onSaveToTracker(opportunity)}
                    className="rounded-full border border-[#080808] bg-[#FDF9F3] px-3 py-1 text-xs font-bold text-[#080808] hover:bg-[#FEF189] cursor-pointer"
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
        <section className="neo-card bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#080808] pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#080808] bg-[#FEF189] text-xs font-extrabold text-[#080808]">
              D
            </span>
            <h3 className="text-lg font-extrabold text-[#080808]">
              Important Skill Gaps
            </h3>
          </div>
          <p className="text-xs text-[#777777]">
            The most frequently missing qualifications across your target career directions:
          </p>

          <div className="space-y-2.5">
            {brief.importantSkillGaps.length === 0 ? (
              <p className="text-xs font-bold text-[#080808]">
                No critical skill gaps identified across discovered listings!
              </p>
            ) : (
              brief.importantSkillGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#080808] bg-[#FDF9F3] p-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#080808]">{gap.skill}</span>
                    <p className="text-[11px] text-[#777777]">
                      Requested by {gap.relatedRoles.join(", ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#FEF189] px-2 py-0.5 text-[10px] font-bold text-[#080808] border border-[#080808]">
                    {gap.frequency}x demand
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION E: RECOMMENDED NEXT ACTIONS */}
        <section className="neo-card bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#080808] pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#080808] bg-[#E0FB66] text-xs font-extrabold text-[#080808]">
              E
            </span>
            <h3 className="text-lg font-extrabold text-[#080808]">
              Recommended Next Actions
            </h3>
          </div>
          <p className="text-xs text-[#777777]">
            High-leverage tactical steps to advance your application readiness:
          </p>

          <div className="space-y-2.5">
            {brief.recommendedNextActions.map((action, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#080808] bg-[#FDF9F3] p-3.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#080808]">{action.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border border-[#080808] ${
                      action.priority === "HIGH"
                        ? "bg-[#E0FB66] text-[#080808]"
                        : "bg-white text-[#080808]"
                    }`}
                  >
                    {action.priority}
                  </span>
                </div>
                <p className="text-[#777777] leading-relaxed">{action.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* SECTION F: UPCOMING OPPORTUNITY DEADLINES                 */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#080808] pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#080808] bg-[#E0FB66] text-xs font-extrabold text-[#080808]">
              F
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#080808]">
              Upcoming Opportunity Deadlines ({brief.upcomingDeadlines.length})
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#777777]">Chronological Urgency</span>
        </div>

        {brief.upcomingDeadlines.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#080808]/40 bg-white/80 p-6 text-center text-xs text-[#777777]">
            Most current opportunities have rolling deadlines or are updated live.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {brief.upcomingDeadlines.map((dl) => (
              <div
                key={dl.opportunityId}
                className="neo-card bg-white p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#080808]">{dl.organization}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#080808] ${
                      dl.daysRemaining <= 7
                        ? "bg-rose-100 text-rose-900"
                        : "bg-[#FEF189] text-[#080808]"
                    }`}
                  >
                    {dl.daysRemaining} days left
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#080808] line-clamp-1">
                  {dl.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
                  <Clock className="h-3.5 w-3.5 text-[#080808]" />
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
      <section className="neo-card-lg bg-white p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#080808] pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#080808] bg-[#E0FB66] text-xs font-extrabold text-[#080808]">
              G
            </span>
            <h3 className="text-lg font-extrabold text-[#080808]">
              Evidence & Verified Source References
            </h3>
          </div>
          <span className="text-xs font-bold text-[#080808]">
            100% Traceable Links
          </span>
        </div>
        <p className="text-xs text-[#777777]">
          Every opportunity listing, requirement claim, and compensation rate in Prospect is verified against primary source URLs:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brief.sourceReferences.map((ref, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#080808] bg-[#FDF9F3] p-3 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#080808]">{ref.name}</span>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#080808] underline flex items-center gap-1"
                >
                  <span>Verify at source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-[#777777] line-clamp-1 text-[11px]">{ref.claim}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

