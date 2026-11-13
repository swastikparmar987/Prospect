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
        className="inline-flex items-center gap-1 rounded-md bg-[#E0FB66] px-2 py-0.5 text-[10px] font-bold text-[#080808] border border-[#080808]"
        title={
          conf.evidenceSnippet
            ? `Source in resume: "${conf.evidenceSnippet}"`
            : "High confidence extraction"
        }
      >
        <ShieldCheck className="h-3 w-3 text-[#080808]" />
        <span>Verified</span>
      </span>
    );
  }

  if (conf.level === "medium") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 border border-teal-200"
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
      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200"
      title={conf.reason || "Please review or fill in this field"}
    >
      <AlertCircle className="h-3 w-3 text-amber-700" />
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b-2 border-[#080808] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-0.5 text-xs font-bold text-[#080808] mb-2">
            <BadgeCheck className="h-3.5 w-3.5 text-[#080808]" />
            <span>Extracted from {filename}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#080808]">
            Here&apos;s what we found in your resume.
          </h1>
          <p className="mt-1 text-sm text-[#777777]">
            Review, edit any field, and confirm your career targets before we search for opportunities.
          </p>
        </div>

        <button
          onClick={onReupload}
          disabled={isSaving}
          className="neo-btn-outline inline-flex items-center gap-1.5 px-4 py-2 text-xs cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Upload Different Resume
        </button>
      </div>

      {/* Scanned / Low-Text Notice Banner */}
      {isScannedOrLowText && (
        <div className="mb-6 rounded-2xl border-2 border-[#080808] bg-[#FEF189] p-4 text-xs text-[#080808] shadow-[3px_3px_0px_#080808] flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#080808] shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Low Text or Scanned Document Detected</p>
            <p className="mt-0.5 text-[#080808]/85 leading-relaxed">
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
          <section className="neo-card bg-white p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#080808]">
              <h2 className="text-lg font-extrabold text-[#080808] flex items-center gap-2">
                <span>Personal Information</span>
                <span className="rounded-md bg-[#E0FB66] border border-[#080808] px-2 py-0.5 text-[11px] font-bold text-[#080808]">
                  Resume Extracted
                </span>
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">Full Name</label>
                  <ConfidenceBadge field="fullName" conf={fieldConfidences?.fullName} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Swastik Parmar"
                  value={profile.fullName || ""}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">Headline</label>
                  <ConfidenceBadge field="headline" conf={fieldConfidences?.headline} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning Engineer | Computer Vision"
                  value={profile.headline || ""}
                  onChange={(e) => updateField("headline", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">Email Address</label>
                  <ConfidenceBadge field="email" conf={fieldConfidences?.email} />
                </div>
                <input
                  type="email"
                  placeholder="e.g. student@college.edu"
                  value={profile.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">Phone Number</label>
                  <ConfidenceBadge field="phone" conf={fieldConfidences?.phone} />
                </div>
                <input
                  type="text"
                  placeholder="Optional, e.g. +91 9266581335"
                  value={profile.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">Location</label>
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
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: Academic Background */}
          <section className="neo-card bg-white p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#080808]">
              <h2 className="text-lg font-extrabold text-[#080808] flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#080808]" />
                <span>Education</span>
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">College or University</label>
                  <ConfidenceBadge field="university" conf={fieldConfidences?.university} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. SRM University, Haryana"
                  value={profile.university || ""}
                  onChange={(e) => updateField("university", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">Degree</label>
                  <ConfidenceBadge field="degree" conf={fieldConfidences?.degree} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. B.Tech or B.S."
                  value={profile.degree || ""}
                  onChange={(e) => updateField("degree", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">Major / Branch</label>
                  <ConfidenceBadge field="major" conf={fieldConfidences?.major} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Computer Science and Engineering"
                  value={profile.major || ""}
                  onChange={(e) => updateField("major", e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">
                    Graduation Year <span className="text-[#080808]">*</span>
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
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm font-bold text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#777777]">
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
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-sm text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: Skills & Competencies */}
          <section className="neo-card bg-white p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#080808]">
              <h2 className="text-lg font-extrabold text-[#080808] flex items-center gap-2">
                <Code className="h-5 w-5 text-[#080808]" />
                <span>Skills & Competencies ({profile.skills.length})</span>
                <ConfidenceBadge field="skills" conf={fieldConfidences?.skills} />
              </h2>
              <span className="text-xs font-medium text-[#777777]">Click &apos;×&apos; to remove</span>
            </div>

            {/* Current Skills Chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-1 text-xs font-bold text-[#080808]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#080808]/70 hover:text-red-700 transition cursor-pointer"
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
                className="flex-1 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-1.5 text-xs text-[#080808] focus:bg-white focus:outline-none placeholder:text-[#777777]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center gap-1 rounded-xl border-2 border-[#080808] bg-[#080808] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#080808]/90 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </section>

          {/* SECTION 4: Projects */}
          <section className="neo-card bg-white p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#080808]">
              <h2 className="text-lg font-extrabold text-[#080808] flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-[#080808]" />
                <span>Projects ({profile.projects.length})</span>
              </h2>
              <button
                type="button"
                onClick={handleAddProject}
                className="inline-flex items-center gap-1 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] px-2.5 py-1 text-xs font-bold text-[#080808] hover:bg-[#E0FB66] transition cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Project
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {profile.projects.length === 0 ? (
                <p className="text-xs text-[#777777] italic">
                  No technical projects extracted from resume. You can add them with the button above.
                </p>
              ) : (
                profile.projects.map((proj, idx) => (
                  <div
                    key={proj.id || idx}
                    className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-4 shadow-[2px_2px_0px_#080808]"
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
                        className="font-bold text-sm text-[#080808] bg-transparent border-b border-transparent hover:border-[#080808] focus:border-[#080808] focus:outline-none w-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateField(
                            "projects",
                            profile.projects.filter((_, i) => i !== idx)
                          );
                        }}
                        className="text-[#777777] hover:text-red-600 transition"
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
                      className="mt-2 w-full rounded-lg border-2 border-[#080808] bg-white p-2 text-xs text-[#080808] focus:outline-none leading-relaxed"
                    />

                    <div className="mt-2 flex flex-wrap gap-1">
                      {proj.techStack?.map((t) => (
                        <span
                          key={t}
                          className="rounded-md border border-[#080808] bg-white px-2 py-0.5 text-[10px] font-bold text-[#080808]"
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
          <section className="neo-card bg-white p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#080808]">
              <h2 className="text-lg font-extrabold text-[#080808] flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#080808]" />
                <span>Experience ({profile.experiences.length})</span>
              </h2>
              <button
                type="button"
                onClick={handleAddExperience}
                className="inline-flex items-center gap-1 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] px-2.5 py-1 text-xs font-bold text-[#080808] hover:bg-[#E0FB66] transition cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Experience
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {profile.experiences.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-[#D8D5CE] p-4 text-center">
                  <p className="text-xs font-medium text-[#777777]">
                    No corporate work experience extracted. This is completely standard for early-career students.
                  </p>
                  <p className="mt-1 text-[11px] text-[#777777]">
                    Your hands-on projects, coursework, and competencies will be used for matching opportunities.
                  </p>
                </div>
              ) : (
                profile.experiences.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-4 shadow-[2px_2px_0px_#080808]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-[#080808]">{exp.title}</p>
                        <p className="text-xs text-[#777777]">
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
                        className="text-[#777777] hover:text-red-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-[#080808]/85">
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
          <div className="sticky top-6 neo-card-lg bg-[#FDF9F3] p-6">
            <div className="flex items-center gap-2 pb-4 border-b-2 border-[#080808]">
              <Compass className="h-5 w-5 text-[#080808]" />
              <h3 className="text-lg font-extrabold text-[#080808]">
                Career Direction
              </h3>
            </div>

            <p className="mt-3 text-xs text-[#777777] leading-relaxed">
              We inferred these opportunity targets based on your skills and projects. Tap to toggle or add new targets:
            </p>

            {/* Target Roles */}
            <div className="mt-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#080808] mb-2">
                Target Roles ({selectedRoles.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleToggleRole(role)}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-1 text-xs font-bold text-[#080808] transition hover:bg-[#FEF189] cursor-pointer"
                  >
                    <span>{role}</span>
                    <span className="text-[#080808]/70 hover:text-[#080808]">×</span>
                  </button>
                ))}
              </div>

              {/* Add Custom Role */}
              <div className="mt-2 flex gap-1.5">
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
                  className="flex-1 rounded-xl border-2 border-[#080808] bg-white px-2.5 py-1 text-xs text-[#080808] focus:outline-none placeholder:text-[#777777]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="rounded-xl border-2 border-[#080808] bg-[#FEF189] px-2.5 py-1 text-xs font-bold text-[#080808] hover:bg-[#E0FB66] cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Opportunity Types */}
            <div className="mt-5 border-t border-[#D8D5CE] pt-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#080808] mb-2">
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
                      className={`rounded-full border-2 border-[#080808] px-3 py-1 text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-[#E0FB66] text-[#080808] font-bold"
                          : "bg-white text-[#080808] hover:bg-[#FEF189]/40"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Modes */}
            <div className="mt-5 border-t border-[#D8D5CE] pt-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#080808] mb-2">
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
                      className={`rounded-full border-2 border-[#080808] px-3 py-1 text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-[#E0FB66] text-[#080808] font-bold"
                          : "bg-white text-[#080808] hover:bg-[#FEF189]/40"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Mode Toggle */}
            <div className="mt-5 border-t border-[#D8D5CE] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#080808]">
                  Search Provider
                </span>
                <span className="rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-3 py-1 text-[11px] font-bold text-[#080808]">
                  Live Public Feeds &amp; APIs
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-6 border-t-2 border-[#080808] pt-5">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="neo-btn-primary w-full py-3.5 px-4 text-center text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving Profile & Launching Agent...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#E0FB66]" />
                    <span>Confirm Profile & Find Opportunities</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[11px] text-[#777777]">
                Saves confirmed profile & starts immediate discovery
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}