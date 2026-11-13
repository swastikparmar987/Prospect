"use client";

import React, { useState } from "react";
import {
  CareerDirection,
  CareerOutlook,
  UserProfile,
  WorkMode,
} from "@/types";
import {
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Compass,
  Briefcase,
  FolderGit2,
  Code,
} from "lucide-react";
import { evaluateCustomCareerDirection } from "@/lib/career-outlook";

interface CareerOutlookExperienceProps {
  outlook: CareerOutlook;
  userProfile: UserProfile;
  initialPreferences?: {
    categories?: string[];
    workModes?: WorkMode[];
    location?: string;
    mode?: "LIVE" | "DEMO";
  };
  onConfirm: (
    selectedDirections: string[],
    preferences: {
      targetRoles: string[];
      categories: string[];
      workModes: WorkMode[];
      location: string;
      mode: "LIVE" | "DEMO";
    }
  ) => Promise<void>;
  onBackToProfile?: () => void;
  backButtonLabel?: string;
  isSearching?: boolean;
}

export function CareerOutlookExperience({
  outlook,
  userProfile,
  initialPreferences,
  onConfirm,
  onBackToProfile,
  backButtonLabel,
  isSearching = false,
}: CareerOutlookExperienceProps) {
  // Local state for active career directions
  const [directions, setDirections] = useState<CareerDirection[]>(
    outlook.directions.map((d) => ({
      ...d,
      isSelected: d.isSelected !== undefined ? d.isSelected : true,
    }))
  );

  const [customRoleInput, setCustomRoleInput] = useState("");
  const [activeDirectionId, setActiveDirectionId] = useState<string>(
    outlook.directions[0]?.id || ""
  );

  // Preference filters carried over from profile confirmation
  const searchMode = "LIVE" as const;
  const [selectedWorkModes, setSelectedWorkModes] = useState<WorkMode[]>(
    initialPreferences?.workModes || userProfile.preferredWorkModes || ["Remote", "Hybrid"]
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialPreferences?.categories || ["Internship", "Research"]
  );
  const [location, setLocation] = useState<string>(
    initialPreferences?.location || userProfile.location || "Bengaluru, India"
  );

  // Toggle selection of a direction
  const handleToggleSelect = (id: string) => {
    setDirections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isSelected: !d.isSelected } : d))
    );
  };

  // Remove/exclude a direction
  const handleRemoveDirection = (id: string) => {
    setDirections((prev) => prev.filter((d) => d.id !== id));
  };

  // Add custom direction
  const handleAddCustomRole = () => {
    if (!customRoleInput.trim()) return;
    const exists = directions.some(
      (d) => d.title.toLowerCase() === customRoleInput.trim().toLowerCase()
    );
    if (exists) {
      setCustomRoleInput("");
      return;
    }

    const newDir = evaluateCustomCareerDirection(customRoleInput, userProfile);
    setDirections((prev) => [...prev, newDir]);
    setActiveDirectionId(newDir.id);
    setCustomRoleInput("");
  };

  const selectedCount = directions.filter((d) => d.isSelected).length;

  const handleFinalConfirm = async () => {
    const selectedTitles = directions
      .filter((d) => d.isSelected)
      .map((d) => d.title);

    const finalTargetRoles =
      selectedTitles.length > 0
        ? selectedTitles
        : [userProfile.targetRoles?.[0] || "Software Engineering Intern"];

    await onConfirm(selectedTitles, {
      targetRoles: finalTargetRoles,
      categories: selectedCategories,
      workModes: selectedWorkModes,
      location,
      mode: searchMode,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-2 text-[#080808]">
      {/* Top back navigation */}
      {onBackToProfile && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToProfile}
            className="inline-flex items-center gap-1.5 font-heading text-xs sm:text-sm font-bold text-[#080808] hover:underline transition group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{backButtonLabel || "Review Profile"}</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HERO HEADER                                            */}
      {/* ========================================================= */}
      <div className="neo-card-lg p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E0FB66] px-3.5 py-1 font-heading text-xs font-extrabold uppercase tracking-wider text-[#080808] border-2 border-[#080808] mb-4">
            <Compass className="h-3.5 w-3.5" />
            <span>Career Outlook & Direction Intelligence</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-[#080808] leading-tight">
            Understand your strengths. Discover your direction.
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#777777] font-medium leading-relaxed">
            Welcome, <strong className="text-[#080808]">{outlook.candidateName}</strong>. Based on{" "}
            <span className="font-bold text-[#080808]">
              {outlook.coreEvidenceCount.skills} confirmed skills
            </span>
            ,{" "}
            <span className="font-bold text-[#080808]">
              {outlook.coreEvidenceCount.projects} verified projects
            </span>
            , and your academic background in{" "}
            <span className="font-bold text-[#080808]">
              {userProfile.major || "Computer Science"}
            </span>
            , here is where your foundation points.
          </p>

          {/* Readiness Narrative Callout */}
          <div className="mt-5 rounded-2xl bg-[#FEF189] border-2 border-[#080808] p-4 text-xs sm:text-sm text-[#080808] flex items-start gap-3 shadow-[3px_3px_0px_#080808]">
            <Sparkles className="h-5 w-5 text-[#080808] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-heading font-extrabold block">Readiness Summary:</span>
              <p className="leading-relaxed font-medium">{outlook.overallReadinessSummary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CAREER DIRECTIONS SECTION                              */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#080808]">
              Recommended Career Directions ({directions.length})
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] mt-0.5">
              Select the paths you wish to target. You can remove any path or add your own custom direction below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FEF189] border-2 border-[#080808] text-[#080808]">
              {selectedCount} of {directions.length} Selected
            </span>
          </div>
        </div>

        {/* Directions Grid / Cards */}
        <div className="grid grid-cols-1 gap-5">
          {directions.map((direction) => {
            const isSelected = direction.isSelected;

            return (
              <div
                key={direction.id}
                className={`relative rounded-2xl border-2 border-[#080808] transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? "bg-white shadow-[5px_5px_0px_#080808]"
                    : "bg-[#FDF9F3] opacity-75 hover:opacity-100"
                }`}
              >
                {/* Selection Top Bar Indicator */}
                <div
                  className={`h-2 w-full border-b-2 border-[#080808] ${
                    isSelected ? "bg-[#E0FB66]" : "bg-[#D8D5CE]"
                  }`}
                />

                <div className="p-5 sm:p-7 space-y-5">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#080808] bg-[#FDF9F3] px-2.5 py-0.5 rounded-md border border-[#080808]">
                          {direction.roleFamily}
                        </span>

                        {/* Evidence Strength Indicator */}
                        {direction.evidenceStrength === "Strong evidence" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E0FB66] px-3 py-0.5 text-xs font-bold text-[#080808] border border-[#080808]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Strong evidence</span>
                          </span>
                        )}
                        {direction.evidenceStrength === "Some evidence" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#C4E7FF] px-3 py-0.5 text-xs font-bold text-[#080808] border border-[#080808]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Some evidence</span>
                          </span>
                        )}
                        {direction.evidenceStrength === "Insufficient evidence" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF189] px-3 py-0.5 text-xs font-bold text-[#080808] border border-[#080808]">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Insufficient evidence</span>
                          </span>
                        )}

                        {direction.isCustom && (
                          <span className="rounded-full bg-[#FEF189] px-2.5 py-0.5 text-[10px] font-bold text-[#080808] border border-[#080808]">
                            Custom Added
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-extrabold text-[#080808]">
                        {direction.title}
                      </h3>
                    </div>

                    {/* Interactive Selection & Dismiss Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(direction.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-4 py-2 text-xs font-bold transition shadow-[2px_2px_0px_#080808] cursor-pointer ${
                          isSelected
                            ? "bg-[#E0FB66] text-[#080808] hover:bg-[#FEF189]"
                            : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#080808]" />
                        <span>{isSelected ? "Selected Target" : "Select Path"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveDirection(direction.id)}
                        className="rounded-xl border-2 border-[#080808] p-2 text-[#777777] hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                        title="Remove direction from recommendations"
                        aria-label="Remove direction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Why this direction is relevant (Grounded Rationale) */}
                  <div className="rounded-2xl bg-[#FDF9F3] border-2 border-[#080808] p-4 text-xs sm:text-sm text-[#080808] leading-relaxed">
                    <strong className="text-[#080808] font-extrabold block mb-1">
                      Why this direction fits your profile:
                    </strong>
                    {direction.relevanceExplanation}
                  </div>

                  {/* Evidence Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* A. Supporting Technical Skills */}
                    <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#080808]">
                        <Code className="h-4 w-4 text-[#080808]" />
                        <span>Supporting Technical Skills ({direction.supportingSkills.length})</span>
                      </div>
                      {direction.supportingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {direction.supportingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#080808] border border-[#080808]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#080808]" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#777777] italic">
                          No direct skills recorded yet. General CS coursework will serve as foundation.
                        </p>
                      )}
                    </div>

                    {/* B. Missing or In-Progress Requirements */}
                    <div className="rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#080808]">
                        <AlertCircle className="h-4 w-4 text-[#080808]" />
                        <span>Missing or Unverified Requirements</span>
                      </div>
                      {direction.missingRequirements.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {direction.missingRequirements.map((req) => (
                            <span
                              key={req}
                              className="inline-flex items-center gap-1 rounded-md bg-[#FEF189] px-2.5 py-1 text-xs font-bold text-[#080808] border border-[#080808]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#080808]" />
                              {req}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#080808] font-bold">
                          All typical baseline requirements are evidenced in your profile!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* C. Relevant Student Projects Evidence */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#080808]">
                        <FolderGit2 className="h-4 w-4 text-[#080808]" />
                        <span>Relevant Student Projects ({direction.relevantProjects.length})</span>
                      </div>
                    </div>

                    {direction.relevantProjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {direction.relevantProjects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border-2 border-[#080808] bg-white p-3.5 space-y-1.5 shadow-[2px_2px_0px_#080808]"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs sm:text-sm font-bold text-[#080808]">
                                {proj.name}
                              </h4>
                              {proj.link && (
                                <a
                                  href={proj.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-[#080808] underline"
                                >
                                  Repo →
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-[#777777] line-clamp-2 leading-relaxed">
                              {proj.description}
                            </p>
                            {proj.techStack && proj.techStack.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {proj.techStack.map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded bg-[#FDF9F3] px-1.5 py-0.5 text-[10px] font-semibold text-[#080808] border border-[#080808]"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-[#D8D5CE] bg-white/50 p-4 text-center">
                        <p className="text-xs text-[#777777]">
                          No projects specifically tagged for this direction yet. We will search for entry-level postings and generate a project preparation plan.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* D. Relevant Experience (if available) */}
                  {direction.relevantExperiences.length > 0 && (
                    <div className="space-y-2 border-t border-[#D8D5CE] pt-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#080808]">
                        <Briefcase className="h-4 w-4 text-[#080808]" />
                        <span>Supporting Prior Experience ({direction.relevantExperiences.length})</span>
                      </div>
                      <div className="space-y-2">
                        {direction.relevantExperiences.map((exp, idx) => (
                          <div key={idx} className="rounded-xl bg-[#FDF9F3] p-3 text-xs border border-[#080808]">
                            <div className="flex items-center justify-between font-bold text-[#080808]">
                              <span>{exp.title}</span>
                              <span className="text-[#777777] font-medium">{exp.company} • {exp.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ADD CUSTOM CAREER DIRECTION                            */}
      {/* ========================================================= */}
      <div className="neo-card-lg bg-white p-6 sm:p-7 space-y-3">
        <h3 className="text-lg font-extrabold text-[#080808]">
          Interested in a direction not listed above?
        </h3>
        <p className="text-xs sm:text-sm text-[#777777]">
          Add any target role (e.g. <em>Cloud DevOps Intern</em>, <em>Full Stack Developer</em>, <em>Robotics Research Fellow</em>). Prospect will immediately audit your verified profile evidence and include it in discovery.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={customRoleInput}
            onChange={(e) => setCustomRoleInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomRole()}
            placeholder="e.g. Cloud Security Intern, Data Analyst..."
            className="flex-1 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-4 py-3 text-sm text-[#080808] focus:bg-white focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddCustomRole}
            disabled={!customRoleInput.trim()}
            className="rounded-xl bg-[#E0FB66] px-6 py-3 text-sm font-bold text-[#080808] border-2 border-[#080808] hover:bg-[#FEF189] shadow-[2px_2px_0px_#080808] transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Direction</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DISCOVERY PREFERENCES & CONFIRMATION ACTION BAR        */}
      {/* ========================================================= */}
      <div className="sticky bottom-4 z-20 rounded-2xl border-2 border-[#080808] bg-white p-5 sm:p-6 shadow-[5px_5px_0px_#080808] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E0FB66] border border-[#080808]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#080808]">
                Ready to Discover
              </span>
            </div>
            <p className="text-sm font-bold text-[#080808]">
              Prospect will search real-time opportunities across your {selectedCount} selected career {selectedCount === 1 ? "direction" : "directions"}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onBackToProfile && (
              <button
                type="button"
                onClick={onBackToProfile}
                disabled={isSearching}
                className="neo-btn-outline px-4 py-3 text-xs sm:text-sm cursor-pointer"
              >
                {backButtonLabel || "Review Profile"}
              </button>
            )}

            <button
              type="button"
              onClick={handleFinalConfirm}
              disabled={isSearching || selectedCount === 0}
              className="neo-btn-primary px-6 py-3.5 text-center text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Launching Opportunity Agent...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#E0FB66]" />
                  <span>Confirm Career Direction & Find Opportunities</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Mode & Location summary pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D8D5CE] pt-3 text-[11px] text-[#777777]">
          <div className="flex items-center gap-3">
            <span>
              Target Location: <strong className="text-[#080808]">{location}</strong>
            </span>
            <span>•</span>
            <span>
              Modes: <strong className="text-[#080808]">{selectedWorkModes.join(", ")}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#777777]">Search Engine:</span>
            <span className="rounded-md px-2 py-0.5 font-bold border border-[#080808] bg-[#E0FB66] text-[#080808]">
              Live Web Search (Tavily)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
