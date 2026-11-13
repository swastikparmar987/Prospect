"use client";

import React, { useState, useEffect } from "react";
import {
  UserProfile,
  ExperienceFact,
  ProjectFact,
  PortfolioFact,
  WorkMode,
} from "@/types";
import {
  Upload,
  FileText,
  Save,
  Trash2,
  X,
  ExternalLink,
  Briefcase,
  FolderGit2,
  Link2,
  CheckCircle2,
  Circle,
  Radio,
  MapPin,
  Mail,
  Pencil,
  ArrowRight,
  GraduationCap,
  Layers,
  Code,
  Target,
  Calendar,
  Award,
  MoreHorizontal,
} from "lucide-react";
import { ConnectedSourcesModal } from "../ConnectedSourcesModal";

interface ProfileViewProps {
  profile: UserProfile | null;
  onSaveProfile: (profile: Partial<UserProfile>) => Promise<void>;
  onDeleteProfile: () => Promise<void>;
  onUploadNewResume?: () => void;
}

type EditTab =
  | "general"
  | "academic"
  | "skills"
  | "experience"
  | "projects"
  | "preferences"
  | "goals";

export function ProfileView({
  profile,
  onSaveProfile,
  onDeleteProfile,
  onUploadNewResume,
}: ProfileViewProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(
    profile || {
      fullName: "",
      email: "",
      headline: "",
      university: "",
      degree: "",
      major: "",
      graduationYear: null,
      gpa: null,
      location: "",
      targetRoles: [],
      preferredWorkModes: [],
      preferredLocations: [],
      skills: [],
      experiences: [],
      projects: [],
      portfolioLinks: [],
      availability: "",
      stipendPreference: "Any",
      constraints: "",
      factProvenance: {},
    }
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<EditTab>("general");
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  // Draft inputs for adding items
  const [skillInput, setSkillInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [expTitle, setExpTitle] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expDuration, setExpDuration] = useState("");
  const [expBullets, setExpBullets] = useState("");

  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projLink, setProjLink] = useState("");

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Sync state if profile prop updates
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      factProvenance: {
        ...(prev.factProvenance || {}),
        [field]: {
          source: "manually-entered",
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    const trimmed = skillInput.trim();
    if (!formData.skills?.includes(trimmed)) {
      handleChange("skills", [...(formData.skills || []), trimmed]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    handleChange(
      "skills",
      (formData.skills || []).filter((s) => s !== skill)
    );
  };

  const handleAddRole = () => {
    if (!roleInput.trim()) return;
    const trimmed = roleInput.trim();
    if (!formData.targetRoles?.includes(trimmed)) {
      handleChange("targetRoles", [...(formData.targetRoles || []), trimmed]);
    }
    setRoleInput("");
  };

  const handleRemoveRole = (role: string) => {
    handleChange(
      "targetRoles",
      (formData.targetRoles || []).filter((r) => r !== role)
    );
  };

  const handleAddLocation = () => {
    if (!locationInput.trim()) return;
    const trimmed = locationInput.trim();
    if (!formData.preferredLocations?.includes(trimmed)) {
      handleChange("preferredLocations", [
        ...(formData.preferredLocations || []),
        trimmed,
      ]);
    }
    setLocationInput("");
  };

  const handleRemoveLocation = (loc: string) => {
    handleChange(
      "preferredLocations",
      (formData.preferredLocations || []).filter((l) => l !== loc)
    );
  };

  const handleAddExperience = () => {
    if (!expTitle.trim() || !expCompany.trim()) return;
    const newExp: ExperienceFact = {
      id: `exp-${Date.now()}`,
      title: expTitle.trim(),
      company: expCompany.trim(),
      duration: expDuration.trim() || "Summer 2025",
      bullets: expBullets
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      verified: true,
    };
    handleChange("experiences", [...(formData.experiences || []), newExp]);
    setExpTitle("");
    setExpCompany("");
    setExpDuration("");
    setExpBullets("");
  };

  const handleRemoveExperience = (id: string) => {
    handleChange(
      "experiences",
      (formData.experiences || []).filter((e) => e.id !== id)
    );
  };

  const handleAddProject = () => {
    if (!projName.trim()) return;
    const newProj: ProjectFact = {
      id: `proj-${Date.now()}`,
      name: projName.trim(),
      description: projDesc.trim(),
      techStack: projTech
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      link: projLink.trim(),
    };
    handleChange("projects", [...(formData.projects || []), newProj]);
    setProjName("");
    setProjDesc("");
    setProjTech("");
    setProjLink("");
  };

  const handleRemoveProject = (id?: string, name?: string) => {
    handleChange(
      "projects",
      (formData.projects || []).filter((p) => (p.id ? p.id !== id : p.name !== name))
    );
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const newLink: PortfolioFact = {
      label: linkTitle.trim() || "Portfolio Link",
      url: linkUrl.startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`,
    };
    handleChange("portfolioLinks", [
      ...(formData.portfolioLinks || []),
      newLink,
    ]);
    setLinkTitle("");
    setLinkUrl("");
  };

  const handleRemoveLink = (url: string) => {
    handleChange(
      "portfolioLinks",
      (formData.portfolioLinks || []).filter((l) => l.url !== url)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await onSaveProfile(formData);
      setFeedback("Profile saved successfully.");
      setTimeout(() => setFeedback(null), 3000);
      setEditModalOpen(false);
    } catch {
      setFeedback("Failed to save profile. Please verify your inputs.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFeedback(null);

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/profile/upload-resume", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      const facts = result.profile || result.extractedFacts;
      const updatedForm: Partial<UserProfile> = {
        ...formData,
        fullName: facts.fullName || formData.fullName,
        email: facts.email || formData.email,
        headline: facts.headline || formData.headline,
        university: facts.university || formData.university,
        degree: facts.degree || formData.degree,
        major: facts.major || formData.major,
        graduationYear: facts.graduationYear || formData.graduationYear,
        gpa: facts.gpa ?? formData.gpa,
        location: facts.location || formData.location,
        locationPreference: facts.locationPreference || formData.locationPreference,
        preferredLocations:
          facts.preferredLocations && facts.preferredLocations.length > 0
            ? facts.preferredLocations
            : formData.preferredLocations,
        preferredWorkModes:
          facts.preferredWorkModes && facts.preferredWorkModes.length > 0
            ? facts.preferredWorkModes
            : formData.preferredWorkModes,
        targetRoles:
          facts.targetRoles && facts.targetRoles.length > 0
            ? facts.targetRoles
            : formData.targetRoles,
        skills:
          facts.skills && facts.skills.length > 0
            ? facts.skills
            : formData.skills,
        experiences:
          facts.experiences && facts.experiences.length > 0
            ? facts.experiences
            : formData.experiences,
        projects:
          facts.projects && facts.projects.length > 0
            ? facts.projects
            : formData.projects,
        portfolioLinks:
          facts.portfolioLinks && facts.portfolioLinks.length > 0
            ? facts.portfolioLinks
            : formData.portfolioLinks,
        resumeFilename: result.filename,
        factProvenance: {
          ...(formData.factProvenance || {}),
          ...(facts.factProvenance || {}),
        },
        capabilityMap: result.capabilityMap || facts.capabilityMap,
        expandedRoleFamilies: result.expandedRoles || facts.expandedRoleFamilies,
      };
      setFormData(updatedForm);
      await onSaveProfile(updatedForm);

      setFeedback(
        result.message ||
          `Extracted facts and capabilities from ${result.filename} and updated your profile.`
      );
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Resume upload failed");
    } finally {
      setUploading(false);
    }
  };

  // -------------------------------------------------------------
  // Dynamic Profile Completeness Computations
  // -------------------------------------------------------------
  const hasAcademic = Boolean(formData.degree && formData.major);
  const hasSkills = Boolean(formData.skills && formData.skills.length > 0);
  const hasExperience = Boolean(
    formData.experiences && formData.experiences.length > 0
  );
  const hasProjects = Boolean(formData.projects && formData.projects.length >= 2);
  const hasPreferences = Boolean(
    formData.targetRoles && formData.targetRoles.length > 0
  );

  const completionChecks = [
    { label: "Academic Details", done: hasAcademic },
    { label: "Skills", done: hasSkills },
    { label: "Experience", done: hasExperience },
    { label: "Projects", done: hasProjects },
    { label: "Preferences", done: hasPreferences },
  ];

  const completedCount = completionChecks.filter((c) => c.done).length;
  const completenessPct = Math.round((completedCount / completionChecks.length) * 100);

  // Experience breakdown
  const experiencesList = formData.experiences || [];
  const internshipCount = experiencesList.filter(
    (e) => !/research/i.test(e.title)
  ).length;
  const researchCount = experiencesList.filter(
    (e) => /research/i.test(e.title) || /lab/i.test(e.company)
  ).length;

  const projectsList = formData.projects || [];
  const projectsWithLinksCount = projectsList.filter(
    (p) => Boolean(p.link && p.link.trim())
  ).length;

  const linkedInLink = (formData.portfolioLinks || []).find((l) =>
    /linkedin/i.test(l.label) || /linkedin\.com/i.test(l.url)
  );

  const candidateInitial = (formData.fullName?.trim()?.charAt(0) || "A").toUpperCase();

  const openEditTab = (tab: EditTab) => {
    setActiveEditTab(tab);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-[#080808]">
      {/* ===================================================== */}
      {/* 1. HERO SECTION                                       */}
      {/* ===================================================== */}
      <section className="neo-card-lg p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.14em] font-heading font-extrabold text-[#777777]">
            YOUR PROFILE
          </span>

          <div className="flex items-center space-x-3">
            {/* Connected Sources & Ingestion Modal Button */}
            <button
              type="button"
              onClick={() => setShowSourcesModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#d5f54e] text-[#080808] font-heading text-xs font-extrabold shadow-[2px_2px_0px_#080808] transition-all cursor-pointer"
              title="Connected Sources & Ingestion Status"
            >
              <Radio className="h-3.5 w-3.5 text-[#080808] animate-pulse" />
              <span>Connected Sources</span>
            </button>
          </div>
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="mt-5 max-w-xl">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-[#080808] leading-[1.08]">
            Your career{" "}
            <span className="relative inline-block">
              foundation.
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

          <p className="mt-3 text-sm sm:text-base text-[#777777] font-medium leading-relaxed max-w-lg">
            Keep your academic details, skills, experience and goals up to date for
            more accurate matching and preparation plans.
          </p>
        </div>
      </section>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className="rounded-2xl border-2 border-[#080808] bg-[#E0FB66] px-4 py-3 text-xs sm:text-sm text-[#080808] font-heading font-bold flex items-center justify-between shadow-[3px_3px_0px_#080808]">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[#080808] hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===================================================== */}
      {/* 2. MAIN 2-COLUMN PROFILE WORKSPACE                     */}
      {/* ===================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =================================================== */}
        {/* LEFT COLUMN: Summary Card & My Information (8 cols)  */}
        {/* =================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card A: Candidate Header & Profile Completeness */}
          <section className="neo-card p-6">
            {/* Top row: Avatar, Info, Edit Button */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Large Black/Volt Avatar Circle */}
                <div className="w-16 h-16 rounded-full bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center font-heading text-2xl font-extrabold text-[#080808] shrink-0 select-none shadow-[3px_3px_0px_#080808]">
                  {candidateInitial}
                </div>

                <div className="space-y-1">
                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808] leading-tight">
                    {formData.fullName || "Unconfigured Candidate Profile"}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#777777] font-medium">
                    {formData.degree || formData.major
                      ? `${formData.degree || "Degree"}${formData.major ? `, ${formData.major}` : ""}${formData.graduationYear ? ` • Class of ${formData.graduationYear}` : ""}`
                      : "No academic details added yet — upload your resume or click Edit Profile"}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-[#777777]">
                    {formData.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#080808]" />
                        <span>{formData.location}</span>
                      </span>
                    )}

                    {formData.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#080808]" />
                        <span>{formData.email}</span>
                      </span>
                    )}

                    {linkedInLink && (
                      <a
                        href={linkedInLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-[#080808] transition-colors"
                      >
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] bg-[#080808] text-[#E0FB66] text-[9px] font-bold leading-none select-none">
                          in
                        </span>
                        <span>
                          {linkedInLink.url.replace(/^https?:\/\/(www\.)?/, "")}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Profile Button */}
              <button
                type="button"
                onClick={() => openEditTab("general")}
                className="neo-btn-outline inline-flex items-center gap-1.5 px-4 py-2 text-xs cursor-pointer self-start shrink-0"
              >
                <Pencil className="h-3.5 w-3.5 text-[#080808]" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Profile Completeness Divider */}
            <div className="mt-6 pt-5 border-t border-[#D8D5CE]">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-heading text-sm sm:text-base font-extrabold text-[#080808]">
                  Profile Completeness
                </h3>
                <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 font-heading text-xs font-extrabold text-[#080808]">
                  {completenessPct}% Complete
                </span>
              </div>

              {/* Thick Volt-Lime Progress Bar */}
              <div className="h-3 w-full bg-[#FDF9F3] border-2 border-[#080808] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-[#E0FB66] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(4, completenessPct)}%` }}
                />
              </div>

              {/* Completeness Steps Row */}
              <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                {completionChecks.map((check) => (
                  <div
                    key={check.label}
                    className="flex items-center gap-1.5"
                  >
                    {check.done ? (
                      <CheckCircle2 className="h-4 w-4 text-[#080808] fill-[#E0FB66] shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-[#777777] shrink-0" />
                    )}
                    <span
                      className={`font-semibold ${
                        check.done ? "text-[#080808]" : "text-[#777777]"
                      }`}
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Card B: "My Information" Stack */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#080808]">
              My Information
            </h2>

            <div className="neo-card bg-white divide-y-2 divide-[#080808]/15 overflow-hidden">
              {/* Row 1: Academic Details */}
              <div
                onClick={() => openEditTab("academic")}
                className="p-5 flex items-center justify-between gap-4 hover:bg-[#FDF9F3] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center text-[#080808] shrink-0 group-hover:bg-[#FEF189] transition-colors">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#080808]">
                      Academic Details
                    </h3>
                    <p className="text-xs text-[#777777]">
                      Degree, institution, year, CGPA
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-[#080808] text-right hidden sm:inline">
                    {formData.degree || formData.major
                      ? `${formData.degree || "Not set"}, ${formData.major || "Not set"} • GPA: ${formData.gpa ?? "Not set"}`
                      : "Not configured"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#080808] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* Row 2: Skills */}
              <div
                onClick={() => openEditTab("skills")}
                className="p-5 flex items-center justify-between gap-4 hover:bg-[#FDF9F3] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center text-[#080808] shrink-0 group-hover:bg-[#FEF189] transition-colors">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#080808]">Skills</h3>
                    <p className="text-xs text-[#777777]">
                      Technical and soft skills
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-wrap items-center gap-1.5 justify-end">
                    {(formData.skills || []).slice(0, 4).map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-0.5 rounded-md bg-[#E0FB66] border border-[#080808] text-[11px] font-bold text-[#080808]"
                      >
                        {sk}
                      </span>
                    ))}
                    {(formData.skills || []).length > 4 && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FDF9F3] border border-[#080808] text-[11px] font-bold text-[#080808]">
                        +{(formData.skills || []).length - 4}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#080808] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* Row 3: Experience */}
              <div
                onClick={() => openEditTab("experience")}
                className="p-5 flex items-center justify-between gap-4 hover:bg-[#FDF9F3] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center text-[#080808] shrink-0 group-hover:bg-[#FEF189] transition-colors">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#080808]">
                      Experience
                    </h3>
                    <p className="text-xs text-[#777777]">
                      Internships, research, work experience
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-[#080808] text-right hidden sm:inline">
                    {internshipCount} {internshipCount === 1 ? "internship" : "internships"} • {researchCount} {researchCount === 1 ? "research role" : "research roles"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#080808] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* Row 4: Projects */}
              <div
                onClick={() => openEditTab("projects")}
                className="p-5 flex items-center justify-between gap-4 hover:bg-[#FDF9F3] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center text-[#080808] shrink-0 group-hover:bg-[#FEF189] transition-colors">
                    <Code className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#080808]">Projects</h3>
                    <p className="text-xs text-[#777777]">
                      Academic and personal projects
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-[#080808] text-right hidden sm:inline">
                    {projectsList.length} projects •{" "}
                    {projectsWithLinksCount} with links
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#080808] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* Row 5: Career Preferences */}
              <div
                onClick={() => openEditTab("preferences")}
                className="p-5 flex items-center justify-between gap-4 hover:bg-[#FDF9F3] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center text-[#080808] shrink-0 group-hover:bg-[#FEF189] transition-colors">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#080808]">
                      Career Preferences
                    </h3>
                    <p className="text-xs text-[#777777]">
                      Roles, work mode, location, fields
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-wrap items-center gap-1.5 justify-end">
                    {(formData.targetRoles || []).slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="px-2.5 py-0.5 rounded-md bg-[#E0FB66] border border-[#080808] text-[11px] font-bold text-[#080808]"
                      >
                        {r}
                      </span>
                    ))}
                    {(formData.preferredWorkModes || []).slice(0, 1).map((wm) => (
                      <span
                        key={wm}
                        className="px-2.5 py-0.5 rounded-md bg-[#FDF9F3] border border-[#080808] text-[11px] font-bold text-[#080808]"
                      >
                        {wm}
                      </span>
                    ))}
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#080808] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* =================================================== */}
        {/* RIGHT COLUMN: At a Glance, Goals, Documents (4 cols) */}
        {/* =================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: At a Glance */}
          <section className="neo-card bg-[#FDF9F3] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#080808]" />
              <h3 className="text-base font-extrabold text-[#080808]">
                At a Glance
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-[#080808] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-[#080808]">
                    {formData.graduationYear ? `Class of ${formData.graduationYear}` : "Graduation Year Not Set"}
                  </p>
                  <p className="text-xs text-[#777777]">
                    {formData.degree || formData.major
                      ? `${formData.degree || ""}${formData.major ? `, ${formData.major}` : ""}`
                      : "Academic details not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-[#080808] shrink-0" />
                <p className="font-bold text-[#080808]">
                  {formData.gpa !== null && formData.gpa !== undefined ? `${formData.gpa} GPA` : "GPA Not Set"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-[#080808] shrink-0" />
                <p className="font-bold text-[#080808]">
                  {experiencesList.length} {experiencesList.length === 1 ? "Experience" : "Experiences"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <FolderGit2 className="h-4 w-4 text-[#080808] shrink-0" />
                <p className="font-bold text-[#080808]">
                  {projectsList.length} {projectsList.length === 1 ? "Project" : "Projects"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Code className="h-4 w-4 text-[#080808] shrink-0" />
                <p className="font-bold text-[#080808]">
                  {(formData.skills || []).length} Key Skills
                </p>
              </div>
            </div>
          </section>

          {/* Card 2: Your Goals */}
          <section
            onClick={() => openEditTab("goals")}
            className="neo-card bg-[#FEF189] p-5 relative overflow-hidden group cursor-pointer"
          >
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#080808]" />
                  <h3 className="text-base font-extrabold text-[#080808]">
                    Your Goals
                  </h3>
                </div>
                <Pencil className="h-3.5 w-3.5 text-[#080808] opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex items-start gap-2">
                <span className="text-2xl font-extrabold text-[#080808] leading-none select-none -mt-0.5">
                  “
                </span>
                <p className="italic text-xs sm:text-sm font-medium text-[#080808] leading-relaxed">
                  {formData.headline ||
                    "No career objective added yet — click to add your career headline and goals."}
                  ”
                </p>
              </div>
            </div>
          </section>

          {/* Card 3: Resume & Documents */}
          <section className="neo-card bg-white p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#080808]" />
                <h3 className="text-base font-extrabold text-[#080808]">
                  Resume & Documents
                </h3>
              </div>
              <p className="text-xs text-[#777777] mt-1">
                Keep your key documents ready for applications.
              </p>
            </div>

            {/* Document Items List */}
            <div className="space-y-2.5">
              {formData.resumeFilename ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FDF9F3] border-2 border-[#080808] text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-[#080808] shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-[#080808] truncate">
                        {formData.resumeFilename}
                      </p>
                      <p className="text-[10px] text-[#777777]">
                        {formData.updatedAt
                          ? `Updated: ${new Date(formData.updatedAt).toLocaleDateString()}`
                          : "Extracted from uploaded document"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#FDF9F3] border-2 border-dashed border-[#D8D5CE] text-xs text-[#777777]">
                  No resume document uploaded yet.
                </div>
              )}
            </div>

            {/* Upload Document Action */}
            {onUploadNewResume ? (
              <button
                type="button"
                onClick={onUploadNewResume}
                className="neo-btn-outline text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer w-full"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload & Extract New Resume</span>
              </button>
            ) : (
              <label className="neo-btn-outline text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer w-full">
                <Upload className="h-3.5 w-3.5" />
                <span>
                  {uploading ? "Extracting Facts..." : "Upload Document"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </section>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 3. INTERACTIVE SECTION EDIT MODAL                     */}
      {/* ===================================================== */}
      {editModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl border-2 border-[#080808] shadow-[6px_6px_0px_#080808] flex flex-col overflow-hidden text-[#080808]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b-2 border-[#080808] flex items-center justify-between bg-[#FDF9F3]">
              <div>
                <h3 className="text-lg font-extrabold text-[#080808]">
                  Edit Profile & Information
                </h3>
                <p className="text-xs text-[#777777]">
                  Ground your career foundation with accurate, verified facts.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl border-2 border-[#080808] bg-white p-1.5 text-[#080808] hover:bg-[#FEF189] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 border-b-2 border-[#080808] bg-[#FDF9F3] flex items-center gap-2 overflow-x-auto text-xs font-bold py-2.5">
              {[
                { id: "general", label: "General" },
                { id: "academic", label: "Academic" },
                { id: "skills", label: "Skills" },
                { id: "experience", label: "Experience" },
                { id: "projects", label: "Projects" },
                { id: "preferences", label: "Preferences" },
                { id: "goals", label: "Goals" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveEditTab(t.id as EditTab)}
                  className={`px-3 py-1.5 rounded-full border-2 border-[#080808] transition-colors whitespace-nowrap cursor-pointer ${
                    activeEditTab === t.id
                      ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                      : "bg-white text-[#777777] hover:text-[#080808]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {/* Tab: General */}
              {activeEditTab === "general" && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName || ""}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] focus:outline-none focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] focus:outline-none focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] focus:outline-none focus:bg-white text-sm"
                    />
                  </div>

                  {/* Portfolio / LinkedIn Links */}
                  <div>
                    <label className="block font-bold mb-1">
                      Portfolio & Social Links
                    </label>
                    <div className="space-y-2 mb-2">
                      {(formData.portfolioLinks || []).map((l) => (
                        <div
                          key={l.url}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#FDF9F3] border border-[#080808] text-xs"
                        >
                          <span className="font-semibold text-[#080808]">
                            {l.label}: {l.url}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(l.url)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. LinkedIn)"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        className="w-1/3 px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] text-xs"
                      />
                      <input
                        type="text"
                        placeholder="URL (e.g. https://linkedin.com/in/...)"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#E0FB66] text-[#080808] font-bold text-xs hover:bg-[#FEF189] cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Academic */}
              {activeEditTab === "academic" && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold mb-1">University / College</label>
                    <input
                      type="text"
                      value={formData.university || ""}
                      onChange={(e) => handleChange("university", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Degree</label>
                      <input
                        type="text"
                        value={formData.degree || ""}
                        onChange={(e) => handleChange("degree", e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Major / Branch</label>
                      <input
                        type="text"
                        value={formData.major || ""}
                        onChange={(e) => handleChange("major", e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Graduation Year</label>
                      <input
                        type="number"
                        value={formData.graduationYear || 2026}
                        onChange={(e) =>
                          handleChange("graduationYear", parseInt(e.target.value, 10))
                        }
                        className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">GPA / CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpa ?? 8.6}
                        onChange={(e) =>
                          handleChange("gpa", parseFloat(e.target.value))
                        }
                        className="w-full px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Skills */}
              {activeEditTab === "skills" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a new skill (e.g. PyTorch, TypeScript)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 rounded-xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] text-xs font-bold hover:bg-[#FEF189] cursor-pointer"
                    >
                      Add Skill
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {(formData.skills || []).map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0FB66] border border-[#080808] text-xs font-bold text-[#080808]"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(sk)}
                          className="hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Experience */}
              {activeEditTab === "experience" && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-2">
                    {(formData.experiences || []).map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] flex items-start justify-between"
                      >
                        <div>
                          <p className="font-bold text-[#080808] text-sm">
                            {exp.title} • {exp.company}
                          </p>
                          <p className="text-[#777777] text-xs">{exp.duration}</p>
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className="list-disc list-inside mt-1 text-[#080808]/80 space-y-0.5">
                              {exp.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(exp.id)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Experience Form */}
                  <div className="p-3.5 rounded-xl border-2 border-[#080808] bg-[#FEF189]/40 space-y-2">
                    <p className="font-bold text-xs text-[#080808]">Add New Experience</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={expTitle}
                        onChange={(e) => setExpTitle(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Company / Lab"
                        value={expCompany}
                        onChange={(e) => setExpCompany(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Duration (e.g. May 2025 - Aug 2025)"
                      value={expDuration}
                      onChange={(e) => setExpDuration(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                    />
                    <textarea
                      placeholder="Bullet points (one per line)"
                      value={expBullets}
                      onChange={(e) => setExpBullets(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="px-3.5 py-1.5 rounded-lg border-2 border-[#080808] bg-[#E0FB66] text-[#080808] font-bold text-xs hover:bg-[#FEF189] cursor-pointer"
                    >
                      Save Experience Item
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Projects */}
              {activeEditTab === "projects" && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-2">
                    {(formData.projects || []).map((proj, idx) => (
                      <div
                        key={proj.id || idx}
                        className="p-3 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] flex items-start justify-between"
                      >
                        <div>
                          <p className="font-bold text-[#080808] text-sm">
                            {proj.name}
                          </p>
                          <p className="text-[#777777] text-xs">{proj.description}</p>
                          {proj.techStack && (
                            <p className="text-[#080808] text-[11px] font-semibold mt-1">
                              Stack:{" "}
                              {Array.isArray(proj.techStack)
                                ? proj.techStack.join(", ")
                                : proj.techStack}
                            </p>
                          )}
                          {proj.link && (
                            <a
                              href={proj.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#080808] underline flex items-center gap-1 mt-0.5"
                            >
                              <span>{proj.link}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(proj.id, proj.name)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Project Form */}
                  <div className="p-3.5 rounded-xl border-2 border-[#080808] bg-[#FEF189]/40 space-y-2">
                    <p className="font-bold text-xs text-[#080808]">Add Technical Project</p>
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                    />
                    <textarea
                      placeholder="Description & impact"
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tech Stack (e.g. Next.js, SQLite)"
                        value={projTech}
                        onChange={(e) => setProjTech(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="GitHub / Live Link"
                        value={projLink}
                        onChange={(e) => setProjLink(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-white text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="px-3.5 py-1.5 rounded-lg border-2 border-[#080808] bg-[#E0FB66] text-[#080808] font-bold text-xs hover:bg-[#FEF189] cursor-pointer"
                    >
                      Save Project Item
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Preferences */}
              {activeEditTab === "preferences" && (
                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Target Roles */}
                  <div>
                    <label className="block font-bold mb-1">Target Roles</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Machine Learning Engineer"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddRole();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddRole}
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#E0FB66] text-[#080808] text-xs font-bold cursor-pointer"
                      >
                        Add Role
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(formData.targetRoles || []).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#080808] bg-[#E0FB66] text-[#080808] text-xs font-bold"
                        >
                          <span>{r}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(r)}
                            className="hover:text-rose-700 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Locations */}
                  <div>
                    <label className="block font-bold mb-1">Preferred Locations</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Remote, San Francisco, Bengaluru"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddLocation();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#FDF9F3] text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddLocation}
                        className="px-3 py-1.5 rounded-lg border-2 border-[#080808] bg-[#E0FB66] text-[#080808] text-xs font-bold cursor-pointer"
                      >
                        Add Location
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(formData.preferredLocations || []).map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#080808] bg-[#FEF189] text-[#080808] text-xs font-bold"
                        >
                          <span>{loc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(loc)}
                            className="hover:text-rose-700 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Work Modes */}
                  <div>
                    <label className="block font-bold mb-1">Work Modes</label>
                    <div className="flex gap-3">
                      {(["Remote", "Hybrid", "On-site"] as WorkMode[]).map((wm) => {
                        const checked = (formData.preferredWorkModes || []).includes(wm);
                        return (
                          <label
                            key={wm}
                            className="flex items-center gap-2 cursor-pointer text-xs font-semibold"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = formData.preferredWorkModes || [];
                                const next = e.target.checked
                                  ? [...current, wm]
                                  : current.filter((m) => m !== wm);
                                handleChange("preferredWorkModes", next);
                              }}
                              className="rounded border-[#080808] text-[#080808] focus:ring-[#080808]"
                            />
                            <span>{wm}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Goals */}
              {activeEditTab === "goals" && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold mb-1">
                      Career Mission & Statement
                    </label>
                    <p className="text-xs text-[#777777] mb-2">
                      This statement personalizes the &ldquo;Your Goals&rdquo; card and guides the role expansion engine.
                    </p>
                    <textarea
                      rows={4}
                      value={formData.headline || ""}
                      onChange={(e) => handleChange("headline", e.target.value)}
                      placeholder="Gain industry experience in software development and work on impactful, real-world projects."
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t-2 border-[#080808] bg-[#FDF9F3] flex items-center justify-between">
              <button
                type="button"
                onClick={onDeleteProfile}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Profile Data</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="neo-btn-outline px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="neo-btn-primary px-5 py-2 text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-[#E0FB66]" />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Sources & Ingestion Modal */}
      <ConnectedSourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        userProfile={profile}
      />
    </div>
  );
}
