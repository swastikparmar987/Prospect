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
    <div className="mx-auto max-w-6xl space-y-6 py-2 text-[#101214]">
      {/* Top back navigation */}
      {onBackToProfile && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToProfile}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#4B5563] hover:text-[#101214] transition group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{backButtonLabel || "Review Profile"}</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HERO HEADER                                            */}
      {/* ========================================================= */}
      <div className="bg-white border border-black/[0.07] rounded-[26px] shadow-[0_12px_38px_rgba(15,23,42,0.055)] p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E3FC6D] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] mb-4">
            <Compass className="h-3.5 w-3.5" />
            <span>Career Outlook & Direction Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#101214] leading-tight">
            Understand your strengths. Discover your direction.
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#64748B] font-medium leading-relaxed">
            Welcome, <strong className="text-[#101214]">{outlook.candidateName}</strong>. Based on{" "}
            <span className="font-semibold text-[#101214]">
              {outlook.coreEvidenceCount.skills} confirmed skills
            </span>
            ,{" "}
            <span className="font-semibold text-[#101214]">
              {outlook.coreEvidenceCount.projects} verified projects
            </span>
            , and your academic background in{" "}
            <span className="font-semibold text-[#101214]">
              {userProfile.major || "Computer Science"}
            </span>
            , here is where your foundation points.
          </p>

          {/* Readiness Narrative Callout */}
          <div className="mt-5 rounded-2xl bg-[#FEF9E7] border border-[#F5DFA0] p-4 text-xs sm:text-sm text-[#101214] flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#9A7400] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-[#101214]">Readiness Summary:</span>
              <p className="leading-relaxed text-[#423A20]">{outlook.overallReadinessSummary}</p>
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#101214]">
              Recommended Career Directions ({directions.length})
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Select the paths you wish to target. You can remove any path or add your own custom direction below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FEF9E7] border border-[#F5DFA0] text-[#101214]">
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
                className={`relative rounded-[22px] border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? "bg-white border-[#C7E938]/80 shadow-[0_12px_34px_rgba(148,216,20,0.12)]"
                    : "bg-[#FAFBF7] border-black/[0.07] opacity-80 hover:opacity-100 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                }`}
              >
                {/* Selection Top Bar Indicator */}
                <div
                  className={`h-1.5 w-full ${
                    isSelected ? "bg-gradient-to-r from-[#9CE21B] via-[#E3FC6D] to-[#9CE21B]" : "bg-black/[0.06]"
                  }`}
                />

                <div className="p-5 sm:p-7 space-y-5">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] bg-[#FAFBF7] px-2.5 py-0.5 rounded-full border border-black/[0.08]">
                          {direction.roleFamily}
                        </span>

                        {/* Evidence Strength Indicator */}
                        {direction.evidenceStrength === "Strong evidence" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E3FC6D] px-3 py-0.5 text-xs font-semibold text-[#0E1012] border border-[#C6E832]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Strong evidence</span>
                          </span>
                        )}
                        {direction.evidenceStrength === "Some evidence" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F2FF] px-3 py-0.5 text-xs font-semibold text-[#4C1D95] border border-[#D9CCF8]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Some evidence</span>
                          </span>
                        )}
                        {direction.evidenceStrength === "Insufficient evidence" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF9E7] px-3 py-0.5 text-xs font-semibold text-[#856404] border border-[#F5DFA0]">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Insufficient evidence</span>
                          </span>
                        )}

                        {direction.isCustom && (
                          <span className="rounded-full bg-[#FEF9E7] px-2.5 py-0.5 text-[10px] font-semibold text-[#101214] border border-[#F5DFA0]">
                            Custom Added
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-extrabold text-[#101214]">
                        {direction.title}
                      </h3>
                    </div>

                    {/* Interactive Selection & Dismiss Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(direction.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs transition cursor-pointer ${
                          isSelected
                            ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold hover:bg-[#DDFB4B]"
                            : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isSelected ? "Selected Target" : "Select Path"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveDirection(direction.id)}
                        className="rounded-full border border-black/[0.08] bg-white p-2 text-[#64748B] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition cursor-pointer"
                        title="Remove direction from recommendations"
                        aria-label="Remove direction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Why this direction is relevant (Grounded Rationale) */}
                  <div className="rounded-2xl bg-[#F3FCDA]/55 border border-[#C7E938]/50 p-4 text-xs sm:text-sm text-[#101214] leading-relaxed">
                    <strong className="text-[#101214] font-bold block mb-1">
                      Why this direction fits your profile:
                    </strong>
                    <span className="text-[#374151]">{direction.relevanceExplanation}</span>
                  </div>

                  {/* Evidence Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* A. Supporting Technical Skills */}
                    <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#101214]">
                        <Code className="h-4 w-4 text-[#65B811]" />
                        <span>Supporting Technical Skills ({direction.supportingSkills.length})</span>
                      </div>
                      {direction.supportingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {direction.supportingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#101214] border border-black/[0.08]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#65B811]" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748B] italic">
                          No direct skills recorded yet. General CS coursework will serve as foundation.
                        </p>
                      )}
                    </div>

                    {/* B. Missing or In-Progress Requirements */}
                    <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#101214]">
                        <AlertCircle className="h-4 w-4 text-[#9A7400]" />
                        <span>Missing or Unverified Requirements</span>
                      </div>
                      {direction.missingRequirements.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {direction.missingRequirements.map((req) => (
                            <span
                              key={req}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF9E7] px-2.5 py-1 text-xs font-medium text-[#101214] border border-[#F5DFA0]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#D99B00]" />
                              {req}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#101214] font-semibold">
                          All typical baseline requirements are evidenced in your profile!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* C. Relevant Student Projects Evidence */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#101214]">
                        <FolderGit2 className="h-4 w-4 text-[#4B5563]" />
                        <span>Relevant Student Projects ({direction.relevantProjects.length})</span>
                      </div>
                    </div>

                    {direction.relevantProjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {direction.relevantProjects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-black/[0.07] bg-white p-3.5 space-y-1.5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-[#101214]">
                                {proj.name}
                              </h4>
                              {proj.link && (
                                <a
                                  href={proj.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-semibold text-[#101214] hover:underline shrink-0"
                                >
                                  Repo →
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                              {proj.description}
                            </p>
                            {proj.techStack && proj.techStack.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {proj.techStack.map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded-full bg-[#FAFBF7] px-2 py-0.5 text-[10px] font-medium text-[#4B5563] border border-black/[0.07]"
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
                      <div className="rounded-2xl border border-dashed border-black/[0.12] bg-[#FAFBF7]/60 p-4 text-center">
                        <p className="text-xs text-[#64748B]">
                          No projects specifically tagged for this direction yet. We will search for entry-level postings and generate a project preparation plan.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* D. Relevant Experience (if available) */}
                  {direction.relevantExperiences.length > 0 && (
                    <div className="space-y-2 border-t border-black/[0.07] pt-3.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#101214]">
                        <Briefcase className="h-4 w-4 text-[#4B5563]" />
                        <span>Supporting Prior Experience ({direction.relevantExperiences.length})</span>
                      </div>
                      <div className="space-y-2">
                        {direction.relevantExperiences.map((exp, idx) => (
                          <div key={idx} className="rounded-2xl bg-[#FAFBF7] p-3 text-xs border border-black/[0.07]">
                            <div className="flex items-center justify-between font-semibold text-[#101214]">
                              <span>{exp.title}</span>
                              <span className="text-[#64748B] font-medium">{exp.company} • {exp.duration}</span>
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
      <div className="bg-white border border-black/[0.07] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 sm:p-7 space-y-3">
        <h3 className="text-lg font-bold text-[#101214]">
          Interested in a direction not listed above?
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B]">
          Add any target role (e.g. <em>Cloud DevOps Intern</em>, <em>Full Stack Developer</em>, <em>Robotics Research Fellow</em>). Prospect will immediately audit your verified profile evidence and include it in discovery.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <input
            type="text"
            value={customRoleInput}
            onChange={(e) => setCustomRoleInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomRole()}
            placeholder="e.g. Cloud Security Intern, Data Analyst..."
            className="flex-1 rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-4 py-3 text-sm text-[#101214] outline-none transition"
          />
          <button
            type="button"
            onClick={handleAddCustomRole}
            disabled={!customRoleInput.trim()}
            className="rounded-full bg-[#E3FC6D] px-6 py-3 text-sm font-semibold text-[#0E1012] border border-[#C6E832] hover:bg-[#DDFB4B] shadow-[0_2px_10px_rgba(205,238,54,0.28)] transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Direction</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. SLEEK OBSIDIAN & LIME STICKY ACTION STRIP              */}
      {/* ========================================================= */}
      <div className="sticky bottom-3 z-30 rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.08] shadow-[0_12px_36px_rgba(15,23,42,0.08)] py-3 px-4 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Badge + Direction Count + Metadata */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0E1012] shrink-0 shadow-[0_2px_8px_rgba(205,238,54,0.25)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0E1012] animate-pulse" />
              Ready to Discover
            </span>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#101214] truncate">
              <span>
                <strong className="underline decoration-[#C6E832] decoration-2">
                  {selectedCount}
                </strong>{" "}
                {selectedCount === 1 ? "direction" : "directions"} selected
              </span>
              <span className="text-black/[0.2] hidden md:inline">•</span>
              <span className="text-[11px] font-medium text-[#64748B] hidden md:inline truncate">
                {location} ({selectedWorkModes.join(", ")})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onBackToProfile && (
              <button
                type="button"
                onClick={onBackToProfile}
                disabled={isSearching}
                className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3.5 py-1.5 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                {backButtonLabel || "Review Profile"}
              </button>
            )}

            <button
              type="button"
              onClick={handleFinalConfirm}
              disabled={isSearching || selectedCount === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 px-4 py-1.5 text-xs sm:text-sm transition-all disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Launching Agent...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#E3FC6D]" />
                  <span>Confirm & Find Opportunities</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#E3FC6D]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
