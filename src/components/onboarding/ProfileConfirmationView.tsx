"use client";

import React, { useState } from "react";
import {
  UserProfile,
  ProjectFact,
  ExperienceFact,
  WorkMode,
  FieldConfidenceRecord,
} from "@/types";
import {
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Code,
  Compass,
  ArrowRight,
  RotateCcw,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";

interface ProfileConfirmationViewProps {
  initialProfile: UserProfile;
  suggestedRoles: string[];
  suggestedCategories: string[];
  lowConfidenceFields?: string[];
  fieldConfidences?: Record<string, FieldConfidenceRecord>;
  isScannedOrLowText?: boolean;
  filename: string;
  onConfirm: (
    confirmedProfile: UserProfile,
    searchPreferences: {
      targetRoles: string[];
      categories: string[];
      workModes: WorkMode[];
      location: string;
      mode: "LIVE" | "DEMO";
    }
  ) => Promise<void>;
  onReupload: () => void;
  isSaving?: boolean;
}

function ConfidenceBadge({
  conf,
}: {
  field?: string;
  conf?: FieldConfidenceRecord;
}) {
  if (!conf) return null;

  if (conf.level === "high") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-[#E3FC6D] px-2.5 py-0.5 text-[10px] font-semibold text-[#0E1012] border border-[#C6E832]"
        title={
          conf.evidenceSnippet
            ? `Source in resume: "${conf.evidenceSnippet}"`
            : "High confidence extraction"
        }
      >
        <ShieldCheck className="h-3 w-3 text-[#0E1012]" />
        <span>Verified</span>
      </span>
    );
  }

  if (conf.level === "medium") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-[#F5F2FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#4C1D95] border border-[#D9CCF8]"
        title={
          conf.evidenceSnippet
            ? `Contextual source: "${conf.evidenceSnippet}"`
            : "Contextual inference"
        }
      >
        <span>Inferred</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[#FEF9E7] px-2.5 py-0.5 text-[10px] font-semibold text-[#856404] border border-[#F5DFA0]"
      title={conf.reason || "Please review or fill in this field"}
    >
      <AlertCircle className="h-3 w-3 text-[#9A7400]" />
      <span>Review Needed</span>
    </span>
  );
}

export function ProfileConfirmationView({
  initialProfile,
  suggestedRoles = [],
  suggestedCategories = [],
  lowConfidenceFields: _lowConfidenceFields = [],
  fieldConfidences = {},
  isScannedOrLowText = false,
  filename,
  onConfirm,
  onReupload,
  isSaving = false,
}: ProfileConfirmationViewProps) {
  // Editable Profile State
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  // Preference Selections (Phase 4)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    suggestedRoles.length > 0
      ? suggestedRoles
      : initialProfile.targetRoles?.length > 0
      ? initialProfile.targetRoles
      : ["Software Engineering Intern"]
  );
  const [customRoleInput, setCustomRoleInput] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    suggestedCategories.length > 0
      ? suggestedCategories
      : ["Internship", "Research"]
  );

  const [selectedWorkModes, setSelectedWorkModes] = useState<WorkMode[]>(
    initialProfile.preferredWorkModes?.length > 0
      ? initialProfile.preferredWorkModes
      : ["Remote", "Hybrid"]
  );

  const [preferredLocation, setPreferredLocation] = useState(
    initialProfile.location || ""
  );

  const searchMode = "LIVE" as const;

  // New Skill Input State
  const [newSkill, setNewSkill] = useState("");

  // Helpers for editing
  const updateField = (field: keyof UserProfile, val: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: val,
      factProvenance: {
        ...(prev.factProvenance || {}),
        [field]: {
          source: "user-confirmed",
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || profile.skills.includes(trimmed)) return;
    updateField("skills", [...profile.skills, trimmed]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    updateField(
      "skills",
      profile.skills.filter((s) => s !== skillToRemove)
    );
  };

  const handleAddProject = () => {
    const newProj: ProjectFact = {
      id: `proj-custom-${Date.now()}`,
      name: "New Technical Project",
      description: "Describe what you built, the architecture, and the impact.",
      techStack: profile.skills.slice(0, 3),
    };
    updateField("projects", [...profile.projects, newProj]);
  };

  const handleAddExperience = () => {
    const newExp: ExperienceFact = {
      id: `exp-custom-${Date.now()}`,
      title: "Software Engineering Intern",
      company: "Company Name",
      duration: "Summer 2024",
      bullets: ["Built features and collaborated with engineering team."],
      verified: true,
    };
    updateField("experiences", [...profile.experiences, newExp]);
  };

  const handleToggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleAddCustomRole = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed || selectedRoles.includes(trimmed)) return;
    setSelectedRoles([...selectedRoles, trimmed]);
    setCustomRoleInput("");
  };

  const handleToggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleToggleWorkMode = (mode: WorkMode) => {
    if (selectedWorkModes.includes(mode)) {
      if (selectedWorkModes.length > 1) {
        setSelectedWorkModes(selectedWorkModes.filter((m) => m !== mode));
      }
    } else {
      setSelectedWorkModes([...selectedWorkModes, mode]);
    }
  };

  const handleFinalSubmit = () => {
    const confirmedProfile: UserProfile = {
      ...profile,
      targetRoles: selectedRoles,
      preferredWorkModes: selectedWorkModes,
      preferredLocations: preferredLocation ? [preferredLocation] : ["Remote / Flexible"],
      location: preferredLocation,
    };

    onConfirm(confirmedProfile, {
      targetRoles: selectedRoles,
      categories: selectedCategories,
      workModes: selectedWorkModes,
      location: preferredLocation || "Remote / Flexible",
      mode: searchMode,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 text-[#101214]">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-black/[0.08] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3 py-0.5 text-xs font-semibold text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] mb-2">
            <BadgeCheck className="h-3.5 w-3.5 text-[#0E1012]" />
            <span>Extracted from {filename}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#101214]">
            Here&apos;s what we found in your resume.
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Review, edit any field, and confirm your career targets before we search for opportunities.
          </p>
        </div>

        <button
          onClick={onReupload}
          disabled={isSaving}
          className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Upload Different Resume
        </button>
      </div>

      {/* Scanned / Low-Text Notice Banner */}
      {isScannedOrLowText && (
        <div className="mb-6 rounded-2xl border border-[#F5DFA0] bg-[#FEF9E7] p-4 text-xs text-[#101214] flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#9A7400] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Low Text or Scanned Document Detected</p>
            <p className="mt-0.5 text-[#423A20] leading-relaxed">
              This document contains little selectable text and may be a scanned image or non-standard format.
              Please review each field below and fill in any missing details before confirming.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Editable Sections */}
        <div className="space-y-6 lg:col-span-2">
          {/* SECTION 1: Personal Details */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.07]">
              <h2 className="text-lg font-bold text-[#101214] flex items-center gap-2">
                <span>Personal Information</span>
                <span className="rounded-full bg-[#E3FC6D] border border-[#C6E832] px-2.5 py-0.5 text-[11px] font-semibold text-[#0E1012]">
                  Resume Extracted
                </span>
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Full Name</label>
                  <ConfidenceBadge field="fullName" conf={fieldConfidences?.fullName} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Swastik Parmar"
                  value={profile.fullName || ""}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Headline</label>
                  <ConfidenceBadge field="headline" conf={fieldConfidences?.headline} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning Engineer | Computer Vision"
                  value={profile.headline || ""}
                  onChange={(e) => updateField("headline", e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Email Address</label>
                  <ConfidenceBadge field="email" conf={fieldConfidences?.email} />
                </div>
                <input
                  type="email"
                  placeholder="e.g. student@college.edu"
                  value={profile.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Phone Number</label>
                  <ConfidenceBadge field="phone" conf={fieldConfidences?.phone} />
                </div>
                <input
                  type="text"
                  placeholder="Optional, e.g. +91 9266581335"
                  value={profile.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Location</label>
                  <ConfidenceBadge field="location" conf={fieldConfidences?.location} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. New Delhi, India or San Francisco, CA"
                  value={profile.location || ""}
                  onChange={(e) => {
                    updateField("location", e.target.value);
                    setPreferredLocation(e.target.value);
                  }}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: Academic Background */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.07]">
              <h2 className="text-lg font-bold text-[#101214] flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#65B811]" />
                <span>Education</span>
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">College or University</label>
                  <ConfidenceBadge field="university" conf={fieldConfidences?.university} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. SRM University, Haryana"
                  value={profile.university || ""}
                  onChange={(e) => updateField("university", e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Degree</label>
                  <ConfidenceBadge field="degree" conf={fieldConfidences?.degree} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. B.Tech or B.S."
                  value={profile.degree || ""}
                  onChange={(e) => updateField("degree", e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Major / Branch</label>
                  <ConfidenceBadge field="major" conf={fieldConfidences?.major} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Computer Science and Engineering"
                  value={profile.major || ""}
                  onChange={(e) => updateField("major", e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">
                    Graduation Year <span className="text-[#101214]">*</span>
                  </label>
                  <ConfidenceBadge field="graduationYear" conf={fieldConfidences?.graduationYear} />
                </div>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  placeholder="e.g. 2028"
                  value={profile.graduationYear ?? ""}
                  onChange={(e) => {
                    const parsed = e.target.value === "" ? null : parseInt(e.target.value, 10);
                    updateField("graduationYear", parsed);
                  }}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm font-semibold text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">
                    GPA / CGPA (Scale 4.0 or 10.0)
                  </label>
                  <ConfidenceBadge field="gpa" conf={fieldConfidences?.gpa} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 7.15 or 3.8"
                  value={profile.gpa !== null && profile.gpa !== undefined ? profile.gpa : ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : parseFloat(e.target.value);
                    updateField("gpa", val);
                  }}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-sm text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: Skills & Competencies */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.07]">
              <h2 className="text-lg font-bold text-[#101214] flex items-center gap-2">
                <Code className="h-5 w-5 text-[#65B811]" />
                <span>Skills & Competencies ({profile.skills.length})</span>
                <ConfidenceBadge field="skills" conf={fieldConfidences?.skills} />
              </h2>
              <span className="text-xs font-medium text-[#64748B]">Click &apos;×&apos; to remove</span>
            </div>

            {/* Current Skills Chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3 py-1 text-xs font-semibold text-[#0E1012] shadow-[0_2px_8px_rgba(205,238,54,0.2)]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#0E1012]/70 hover:text-rose-700 transition cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add Skill Input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Add missing skill (e.g. PyTorch, Docker, Kubernetes)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-2 text-xs text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center gap-1 rounded-full bg-[#101214] text-white font-semibold shadow-[0_4px_12px_rgba(16,18,20,0.14)] hover:bg-[#1E2226] px-4 py-2 text-xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </section>

          {/* SECTION 4: Projects */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.07]">
              <h2 className="text-lg font-bold text-[#101214] flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-[#4B5563]" />
                <span>Projects ({profile.projects.length})</span>
              </h2>
              <button
                type="button"
                onClick={handleAddProject}
                className="inline-flex items-center gap-1 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F3FCDA] hover:border-[#C7E938] px-3.5 py-1.5 text-xs font-medium transition cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Project
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {profile.projects.length === 0 ? (
                <p className="text-xs text-[#64748B] italic">
                  No technical projects extracted from resume. You can add them with the button above.
                </p>
              ) : (
                profile.projects.map((proj, idx) => (
                  <div
                    key={proj.id || idx}
                    className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => {
                          const updated = [...profile.projects];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          updateField("projects", updated);
                        }}
                        className="font-bold text-sm text-[#101214] bg-transparent border-b border-transparent hover:border-black/[0.15] focus:border-[#94D814] focus:outline-none w-full transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateField(
                            "projects",
                            profile.projects.filter((_, i) => i !== idx)
                          );
                        }}
                        className="text-[#64748B] hover:text-rose-600 transition cursor-pointer"
                        title="Remove project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        updateField("projects", updated);
                      }}
                      className="mt-2.5 w-full rounded-xl border border-black/[0.10] bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 p-2.5 text-xs text-[#101214] outline-none leading-relaxed transition"
                    />

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {proj.techStack?.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#4B5563]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* SECTION 5: Experience */}
          <section className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.07]">
              <h2 className="text-lg font-bold text-[#101214] flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#4B5563]" />
                <span>Experience ({profile.experiences.length})</span>
              </h2>
              <button
                type="button"
                onClick={handleAddExperience}
                className="inline-flex items-center gap-1 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F3FCDA] hover:border-[#C7E938] px-3.5 py-1.5 text-xs font-medium transition cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Experience
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {profile.experiences.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/[0.12] bg-[#FAFBF7]/60 p-4 text-center">
                  <p className="text-xs font-medium text-[#64748B]">
                    No corporate work experience extracted. This is completely standard for early-career students.
                  </p>
                  <p className="mt-1 text-[11px] text-[#64748B]">
                    Your hands-on projects, coursework, and competencies will be used for matching opportunities.
                  </p>
                </div>
              ) : (
                profile.experiences.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-[#101214]">{exp.title}</p>
                        <p className="text-xs text-[#64748B]">
                          {exp.company} • {exp.duration}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateField(
                            "experiences",
                            profile.experiences.filter((_, i) => i !== idx)
                          );
                        }}
                        className="text-[#64748B] hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-[#4B5563]">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="list-disc list-inside">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right 1 Column: Career Intent & Discovery Trigger (Phase 4) */}
        <div className="space-y-6">
          <div className="sticky top-6 bg-white border border-black/[0.07] rounded-[24px] shadow-[0_12px_36px_rgba(15,23,42,0.06)] p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-black/[0.07]">
              <Compass className="h-5 w-5 text-[#65B811]" />
              <h3 className="text-lg font-bold text-[#101214]">
                Career Direction
              </h3>
            </div>

            <p className="mt-3 text-xs text-[#64748B] leading-relaxed">
              We inferred these opportunity targets based on your skills and projects. Tap to toggle or add new targets:
            </p>

            {/* Target Roles */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Target Roles ({selectedRoles.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleToggleRole(role)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3 py-1 text-xs font-semibold text-[#0E1012] shadow-[0_2px_8px_rgba(205,238,54,0.25)] transition hover:bg-[#DDFB4B] cursor-pointer"
                  >
                    <span>{role}</span>
                    <span className="text-[#0E1012]/70 hover:text-[#0E1012]">×</span>
                  </button>
                ))}
              </div>

              {/* Add Custom Role */}
              <div className="mt-2.5 flex gap-1.5">
                <input
                  type="text"
                  placeholder="Add target role..."
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomRole();
                    }
                  }}
                  className="flex-1 rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-1.5 text-xs text-[#101214] outline-none placeholder:text-[#94A3B8] transition"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="rounded-full border border-[#F5DFA0] bg-[#FEF9E7] px-3 py-1.5 text-xs font-semibold text-[#101214] hover:bg-[#E3FC6D] hover:border-[#C6E832] transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Opportunity Types */}
            <div className="mt-5 border-t border-black/[0.07] pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Opportunity Types
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["Internship", "Research", "Fellowship", "Hackathon", "Entry-level"].map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`rounded-full px-3 py-1 text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                          : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Modes */}
            <div className="mt-5 border-t border-black/[0.07] pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Work Mode Preference
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(["Remote", "Hybrid", "On-site"] as WorkMode[]).map((mode) => {
                  const isSelected = selectedWorkModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleToggleWorkMode(mode)}
                      className={`rounded-full px-3 py-1 text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                          : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Mode Toggle */}
            <div className="mt-5 border-t border-black/[0.07] pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Search Provider
                </span>
                <span className="rounded-full border border-[#C7E938]/60 bg-[#F3FCDA]/80 px-3 py-1 text-[11px] font-semibold text-[#101214]">
                  Live Public Feeds &amp; APIs
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-6 border-t border-black/[0.07] pt-5">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="w-full rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all py-3.5 px-4 text-center text-sm disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving Profile & Launching Agent...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#E3FC6D]" />
                    <span>Confirm Profile &amp; Run Live Discovery</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-[#64748B]">
                Saves confirmed profile & starts immediate discovery
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}