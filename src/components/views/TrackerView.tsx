"use client";

import React, { useState, useMemo } from "react";
import { ApplicationRecord, ApplicationStage, Opportunity, UserProfile } from "@/types";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  Bookmark,
  Send,
  Calendar,
  Star,
  FileText,
  BarChart3,
  Search,
  ChevronDown,
  MoreHorizontal,
  X,
  MapPin,
  Briefcase,
  Clock,
  Laptop,
  Coins,
  Edit2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Award,
  ArrowRight,
} from "lucide-react";

interface TrackerViewProps {
  applications: ApplicationRecord[];
  upcomingDeadlines: any[];
  userProfile?: UserProfile | null;
  onUpdateApplication: (params: {
    id: string;
    stage?: ApplicationStage;
    notes?: string;
    plannedNextAction?: string;
    outcome?: any;
    outcomeReflection?: string;
    eventNote?: string;
    reminders?: any[];
  }) => void;
  onDeleteApplication: (id: string) => void;
  onInspectOpportunity: (opp: Opportunity) => void;
  onOpenAddModal?: (initialStage?: ApplicationStage) => void;
  initialTab?: "pipeline" | "metrics";
}

export function TrackerView({
  applications,
  upcomingDeadlines = [],
  userProfile,
  onUpdateApplication,
  onDeleteApplication,
  onInspectOpportunity,
  onOpenAddModal,
  initialTab = "pipeline",
}: TrackerViewProps) {
  const [viewMode, setViewMode] = useState<"pipeline" | "metrics">(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setViewMode(initialTab);
    }
  }, [initialTab]);
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "deadline">("newest");

  // Selected Application for Detail Drawer
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Detail Drawer active tab
  const [drawerTab, setDrawerTab] = useState<"overview" | "notes" | "preparation" | "timeline" | "documents">("overview");

  // Inline notes editing in Drawer
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  // Three dots menu state for cards
  const [openMenuAppId, setOpenMenuAppId] = useState<string | null>(null);

  // New step input inside Drawer
  const [newStepText, setNewStepText] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);

  // Compute counts for summary metrics
  const totalCount = applications.length;
  const savedCount = applications.filter((a) => a.stage === "SAVED").length;
  const appliedCount = applications.filter((a) => a.stage === "APPLIED" || a.stage === "PREPARING" || a.stage === "READY_TO_APPLY").length;
  const interviewCount = applications.filter((a) => a.stage === "INTERVIEW").length;
  const offerCount = applications.filter((a) => a.stage === "OFFER").length;
  const rejectedCount = applications.filter((a) => a.stage === "REJECTED").length;

  // Filter & Sort applications
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        const title = app.opportunity?.title || "";
        const org = app.opportunity?.organization || "";
        const category = app.opportunity?.category || "";
        const location = app.opportunity?.location || "";
        const workMode = app.opportunity?.workMode || "";

        // Text query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = title.toLowerCase().includes(q);
          const matchOrg = org.toLowerCase().includes(q);
          const matchNotes = (app.notes || "").toLowerCase().includes(q);
          const matchSkills = (app.opportunity?.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
          if (!matchTitle && !matchOrg && !matchNotes && !matchSkills) return false;
        }

        // Status Filter
        if (statusFilter !== "ALL") {
          if (statusFilter === "APPLIED" && (app.stage === "PREPARING" || app.stage === "READY_TO_APPLY")) {
            // Include preparing/ready
          } else if (app.stage !== statusFilter) {
            return false;
          }
        }

        // Type Filter
        if (typeFilter !== "ALL" && category !== typeFilter) {
          return false;
        }

        // Location Filter
        if (locationFilter !== "ALL") {
          if (locationFilter === "Remote" && workMode !== "Remote") return false;
          if (locationFilter === "On-site" && workMode !== "On-site") return false;
          if (locationFilter === "Hybrid" && workMode !== "Hybrid") return false;
          if (locationFilter === "SF" && !location.toLowerCase().includes("san francisco")) return false;
          if (locationFilter === "NYC" && !location.toLowerCase().includes("new york")) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "deadline") {
          const dA = a.targetDeadline ? new Date(a.targetDeadline).getTime() : Infinity;
          const dB = b.targetDeadline ? new Date(b.targetDeadline).getTime() : Infinity;
          return dA - dB;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [applications, searchQuery, statusFilter, typeFilter, locationFilter, sortBy]);

  // Find currently selected app or default to most recently saved
  const selectedApp = useMemo(() => {
    if (selectedAppId) {
      const found = applications.find((a) => a.id === selectedAppId);
      if (found) return found;
    }
    return applications[0] || null;
  }, [selectedAppId, applications]);

  // Format date helper (e.g. 28 Feb 2025)
  const formatDeadline = (dateStr?: string | Date | null) => {
    if (!dateStr) return "Rolling / Flexible";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  // Helper to extract round badge from notes/title if interview
  const getInterviewRound = (app: ApplicationRecord) => {
    const combined = `${app.notes || ""} ${app.plannedNextAction || ""}`;
    if (combined.includes("Final")) return "Final Round";
    if (combined.includes("Round 2")) return "Round 2";
    if (combined.includes("Round 1")) return "Round 1";
    if (combined.includes("Technical")) return "Round 1";
    return "Interview";
  };

  // Toggle Next Steps Checkbox in Drawer
  const handleToggleReminder = (remId: string, currentDone: boolean) => {
    if (!selectedApp) return;
    const currentReminders = (selectedApp.reminders || []) as Array<{ id: string; title: string; dueDate: string; isDone: boolean }>;
    const updated = currentReminders.map((r) => (r.id === remId ? { ...r, isDone: !currentDone } : r));
    onUpdateApplication({
      id: selectedApp.id,
      reminders: updated,
      eventNote: `Checklist item updated: ${updated.find((r) => r.id === remId)?.title}`,
    });
  };

  // Add a new Next Step checklist item
  const handleAddNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim() || !selectedApp) return;
    const currentReminders = (selectedApp.reminders || []) as Array<{ id: string; title: string; dueDate: string; isDone: boolean }>;
    const nextItem = {
      id: `rem-custom-${Date.now()}`,
      title: newStepText.trim(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      isDone: false,
    };
    onUpdateApplication({
      id: selectedApp.id,
      reminders: [...currentReminders, nextItem],
      eventNote: `Added next step: ${newStepText.trim()}`,
    });
    setNewStepText("");
    setShowAddStep(false);
  };

  // Save edited notes
  const handleSaveNotes = () => {
    if (!selectedApp) return;
    onUpdateApplication({
      id: selectedApp.id,
      notes: tempNotes,
      eventNote: "Updated personal application notes",
    });
    setIsEditingNotes(false);
  };

  // Weekly Goal & Velocity Calculations
  const weeklyGoal = 5;
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const appliedThisWeek = applications.filter((a) => {
    const timestamp = new Date((a as any).appliedAt || a.createdAt || 0).getTime();
    return timestamp >= oneWeekAgo && (a.stage === "APPLIED" || a.stage === "INTERVIEW" || a.stage === "OFFER");
  }).length;

  const weeklyProgress = Math.min(100, Math.round((appliedThisWeek / weeklyGoal) * 100));
  const avgResponseDays = 4.2;

  const interviewRate = totalCount > 0 ? Math.round(((interviewCount + offerCount) / Math.max(1, appliedCount + interviewCount + offerCount)) * 100) : 0;
  const offerRate = (interviewCount + offerCount) > 0 ? Math.round((offerCount / Math.max(1, interviewCount + offerCount)) * 100) : 0;

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach((a) => {
      const cat = a.opportunity?.category || "Other";
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [applications]);

  const workModeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach((a) => {
      const wm = a.opportunity?.workMode || "Flexible";
      map[wm] = (map[wm] || 0) + 1;
    });
    return map;
  }, [applications]);

  const staleApplications = useMemo(() => {
    return applications.filter((a) => {
      if (a.stage !== "APPLIED") return false;
      const created = new Date(a.createdAt || 0).getTime();
      return now - created > 5 * 24 * 60 * 60 * 1000;
    });
  }, [applications, now]);

  // Columns partition
  const savedApplications = filteredApps.filter((a) => a.stage === "SAVED");
  const appliedApplications = filteredApps.filter(
    (a) => a.stage === "APPLIED" || a.stage === "PREPARING" || a.stage === "READY_TO_APPLY"
  );
  const interviewApplications = filteredApps.filter((a) => a.stage === "INTERVIEW");
  const offerApplications = filteredApps.filter((a) => a.stage === "OFFER");
  const rejectedApplications = filteredApps.filter((a) => a.stage === "REJECTED");

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* ========================================================= */}
      {/* EDITORIAL HEADER                                          */}
      {/* ========================================================= */}
      <div className="bg-white border border-black/[0.07] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 sm:p-8 flex flex-col justify-between">
        {/* Top Controls: Eyebrow & Add Application */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-heading font-bold tracking-[0.14em] text-[#6B7280] uppercase">
              APPLICATION TRACKER
            </span>
            <span className="rounded-full bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 px-2.5 py-0.5 font-heading text-[10px] font-semibold text-[#101214]">
              {totalCount} Tracked
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* + Add Application Primary Button */}
            <button
              onClick={() => onOpenAddModal?.("SAVED")}
              className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all inline-flex items-center space-x-1.5 px-5 py-2.5 text-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* Header Title & Subtitle */}
        <div className="mt-5 max-w-xl">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#101214] leading-[1.08]">
            Track your{" "}
            <span className="relative inline-block">
              journey.
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-3.5 text-[#CBEF3B] pointer-events-none"
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
          <p className="mt-2.5 text-xs sm:text-sm text-[#6B7280] font-medium leading-relaxed">
            Keep track of your applications, see what&apos;s next, and never miss a deadline.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW SWITCHER: PIPELINE VS METRICS                        */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-black/[0.06] bg-[#F4F5F0] p-1">
          <button
            type="button"
            onClick={() => setViewMode("pipeline")}
            className={`rounded-full px-4 py-2 font-heading text-xs transition-all cursor-pointer ${
              viewMode === "pipeline"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
            }`}
          >
            Applications Pipeline (Kanban)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("metrics")}
            className={`rounded-full px-4 py-2 font-heading text-xs transition-all cursor-pointer ${
              viewMode === "metrics"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
            }`}
          >
            Metrics, Velocity & Outcome Charts
          </button>
        </div>

        <span className="text-xs font-semibold text-[#6B7280]">
          {viewMode === "pipeline"
            ? `Showing Visual Kanban Pipeline (${totalCount})`
            : "Showing Response Velocity & Funnel Analytics"}
        </span>
      </div>

      {/* ========================================================= */}
      {/* 6 SUMMARY METRIC CARDS                                    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Total Applications */}
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-[#E3FC6D] border-[#C6E832] shadow-[0_6px_18px_rgba(205,238,54,0.28)]"
              : "bg-white border-black/[0.07] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:bg-[#FAFBF7]"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#101214]">{totalCount}</div>
            <div className="text-[11px] font-semibold text-[#4B5563]">Total Applications</div>
          </div>
          <div className="flex flex-col items-end space-y-1 text-[#101214]">
            <BarChart3 className="h-5 w-5" />
          </div>
        </button>

        {/* 2. Saved */}
        <button
          onClick={() => setStatusFilter("SAVED")}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "SAVED"
              ? "bg-[#FEF9E7] border-[#F5DFA0] shadow-[0_6px_18px_rgba(245,223,160,0.35)]"
              : "bg-white border-black/[0.07] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:bg-[#FEF9E7]/50"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#101214]">{savedCount}</div>
            <div className="text-[11px] font-semibold text-[#4B5563]">Saved</div>
          </div>
          <Bookmark className="h-5 w-5 text-[#B47818]" />
        </button>

        {/* 3. Applied */}
        <button
          onClick={() => setStatusFilter("APPLIED")}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "APPLIED"
              ? "bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border-[#C7E938]/55 shadow-[0_6px_18px_rgba(205,238,54,0.24)]"
              : "bg-white border-black/[0.07] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:bg-[#F3FCDA]/50"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#101214]">{appliedCount}</div>
            <div className="text-[11px] font-semibold text-[#4B5563]">Applied</div>
          </div>
          <Send className="h-5 w-5 text-[#4D7C0F]" />
        </button>

        {/* 4. Interview */}
        <button
          onClick={() => setStatusFilter("INTERVIEW")}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "INTERVIEW"
              ? "bg-[#EFF7FF] border-[#C7E0FA] shadow-[0_6px_18px_rgba(147,197,253,0.3)]"
              : "bg-white border-black/[0.07] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:bg-[#EFF7FF]/60"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#101214]">{interviewCount}</div>
            <div className="text-[11px] font-semibold text-[#4B5563]">Interview</div>
          </div>
          <Calendar className="h-5 w-5 text-[#0369A1]" />
        </button>

        {/* 5. Offer */}
        <button
          onClick={() => setStatusFilter("OFFER")}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "OFFER"
              ? "bg-[#F5F2FF] border-[#D9CCF8] shadow-[0_6px_18px_rgba(196,181,253,0.3)]"
              : "bg-white border-black/[0.07] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:bg-[#F5F2FF]/60"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#101214]">{offerCount}</div>
            <div className="text-[11px] font-semibold text-[#4B5563]">Offer</div>
          </div>
          <Star className="h-5 w-5 text-[#6D28D9]" />
        </button>

        {/* 6. Rejected */}
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "REJECTED"
              ? "bg-[#EAECE4] border-black/[0.12] shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
              : "bg-white border-black/[0.07] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:bg-[#F4F5F0]"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#101214]">{rejectedCount}</div>
            <div className="text-[11px] font-semibold text-[#6B7280]">Rejected</div>
          </div>
          <X className="h-5 w-5 text-[#6B7280]" />
        </button>
      </div>

      {viewMode === "pipeline" ? (
        <>
          {/* ========================================================= */}
          {/* SEARCH AND FILTER BAR                                     */}
          {/* ========================================================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications, companies, or roles..."
            className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all pl-10 pr-8 py-2 text-xs font-medium text-[#101214] placeholder-[#9CA3AF] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#101214] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all px-3.5 py-2 pr-8 text-[#101214] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
          </div>

          {/* Types Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all px-3.5 py-2 pr-8 text-[#101214] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Fellowship">Fellowship</option>
              <option value="Research">Research</option>
              <option value="Entry-level">Entry-level</option>
              <option value="Hackathon">Hackathon</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
          </div>

          {/* Locations Dropdown */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="appearance-none rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all px-3.5 py-2 pr-8 text-[#101214] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
              <option value="SF">San Francisco</option>
              <option value="NYC">New York</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all px-3.5 py-2 pr-8 text-[#101214] focus:outline-none cursor-pointer"
            >
              <option value="newest">⇅ Newest First</option>
              <option value="oldest">⇅ Oldest First</option>
              <option value="deadline">⏰ Deadline Soonest</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
          </div>
        </div>
      </div>

      {/* Approaching Real Deadlines Quick Strip */}
      {upcomingDeadlines && upcomingDeadlines.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
          <span className="font-semibold text-rose-700 shrink-0 flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-full px-3 py-1">
            <Clock className="h-3.5 w-3.5 text-rose-600" />
            <span>Upcoming Deadlines:</span>
          </span>
          {upcomingDeadlines.slice(0, 4).map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedAppId(d.id)}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[#101214] shadow-[0_2px_8px_rgba(15,23,42,0.035)] hover:bg-[#FEF9E7] hover:border-[#F5DFA0] transition-all shrink-0 cursor-pointer"
            >
              <span className="font-semibold text-[#101214]">{d.organization}</span>
              <span className="text-[#9CA3AF]">•</span>
              <span className="text-[#4B5563] truncate max-w-[150px]">{d.title}</span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                {d.daysRemaining}d left
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* BOARD AND DETAIL DRAWER CONTAINER                         */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        {/* Left Side: Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-w-0 w-full">
          {/* COLUMN 1: SAVED */}
          <div className="rounded-[22px] border border-[#F5DFA0]/70 bg-[#FEF9E7]/55 p-4 flex flex-col justify-between h-[660px] shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Column Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#F5DFA0]/60">
                <div className="flex items-center space-x-2">
                  <Bookmark className="h-4 w-4 text-amber-600 fill-amber-500/20" />
                  <span className="font-semibold text-xs text-[#101214]">Saved</span>
                </div>
                <span className="rounded-full bg-white border border-black/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-[#715515]">
                  {savedApplications.length}
                </span>
              </div>

              {/* Cards List: Scrollable with thin scrollbar */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:#D8CFC0_transparent]">
                {savedApplications.map((app) => renderApplicationCard(app))}
                {savedApplications.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#6B7280]">
                    No saved applications yet.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Add Saved Button */}
            <button
              onClick={() => onOpenAddModal?.("SAVED")}
              className="mt-3 shrink-0 flex w-full items-center justify-center space-x-1.5 rounded-full border border-dashed border-[#DFC484] bg-white/80 py-2 text-xs font-semibold text-[#101214] hover:bg-white hover:border-[#101214]/30 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Saved</span>
            </button>
          </div>

          {/* COLUMN 2: APPLIED */}
          <div className="rounded-[22px] border border-[#C7E938]/45 bg-[#F3FCDA]/45 p-4 flex flex-col justify-between h-[660px] shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Column Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#C7E938]/35">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-[#4D7C0F] fill-[#4D7C0F]/15" />
                  <span className="font-semibold text-xs text-[#101214]">Applied</span>
                </div>
                <span className="rounded-full bg-white border border-black/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-[#3F6212]">
                  {appliedApplications.length}
                </span>
              </div>

              {/* Cards List: Scrollable with thin scrollbar */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:#D8CFC0_transparent]">
                {appliedApplications.map((app) => renderApplicationCard(app))}
                {appliedApplications.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#6B7280]">
                    No applications currently in applied stage.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Add Application Button */}
            <button
              onClick={() => onOpenAddModal?.("APPLIED")}
              className="mt-3 shrink-0 flex w-full items-center justify-center space-x-1.5 rounded-full border border-dashed border-[#B2D62A] bg-white/80 py-2 text-xs font-semibold text-[#101214] hover:bg-white hover:border-[#101214]/30 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Application</span>
            </button>
          </div>

          {/* COLUMN 3: INTERVIEW */}
          <div className="rounded-[22px] border border-[#C7E0FA]/80 bg-[#EFF7FF]/55 p-4 flex flex-col justify-between h-[660px] shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Column Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#C7E0FA]/60">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-sky-600 fill-sky-600/15" />
                  <span className="font-semibold text-xs text-[#101214]">Interview</span>
                </div>
                <span className="rounded-full bg-white border border-black/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                  {interviewApplications.length}
                </span>
              </div>

              {/* Cards List: Scrollable with thin scrollbar */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:#D8CFC0_transparent]">
                {interviewApplications.map((app) => renderApplicationCard(app, true))}
                {interviewApplications.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#6B7280]">
                    No interviews in progress.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Add Application Button */}
            <button
              onClick={() => onOpenAddModal?.("INTERVIEW")}
              className="mt-3 shrink-0 flex w-full items-center justify-center space-x-1.5 rounded-full border border-dashed border-[#9FC7F4] bg-white/80 py-2 text-xs font-semibold text-[#101214] hover:bg-white hover:border-[#101214]/30 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE DETAIL DRAWER / INSPECTOR                      */}
        {/* ========================================================= */}
        {selectedApp && (
          <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0 sticky top-6">
            <div className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] h-[660px] flex flex-col justify-between overflow-hidden">
              {/* Drawer Top Header (Sticky inside card) */}
              <div className="shrink-0">
                <div className="flex items-start space-x-3.5">
                  <CompanyLogo
                    name={selectedApp.opportunity?.organization || ""}
                    size={46}
                    className="h-[46px] w-[46px] shrink-0 rounded-2xl border border-black/[0.06]"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Title and Actions (More + Close) */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-base font-bold text-[#101214] leading-snug truncate">
                        {selectedApp.opportunity?.title}
                      </h3>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const newStage = selectedApp.stage === "SAVED" ? "APPLIED" : "SAVED";
                            onUpdateApplication({ id: selectedApp.id, stage: newStage });
                          }}
                          title="Options"
                          className="p-1 text-[#6B7280] hover:text-[#101214] transition-colors rounded-lg hover:bg-[#F4F5F0] cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAppId(null)}
                          title="Close preview"
                          className="p-1 text-[#6B7280] hover:text-[#101214] transition-colors rounded-lg hover:bg-[#F4F5F0] cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Organization Name + Status Pill + Bookmark */}
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs font-medium text-[#6B7280]">
                        {selectedApp.opportunity?.organization}
                      </p>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            selectedApp.stage === "SAVED"
                              ? "bg-[#FEF9E7] text-[#715515] border-[#F5DFA0]"
                              : selectedApp.stage === "APPLIED"
                              ? "bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 text-[#3F6212] border-[#C7E938]/55"
                              : selectedApp.stage === "INTERVIEW"
                              ? "bg-[#EFF7FF] text-[#0369A1] border-[#C7E0FA]"
                              : selectedApp.stage === "OFFER"
                              ? "bg-[#F5F2FF] text-[#5B21B6] border-[#D9CCF8]"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {selectedApp.stage === "SAVED"
                            ? "Saved"
                            : selectedApp.stage === "APPLIED"
                            ? "Applied"
                            : selectedApp.stage === "INTERVIEW"
                            ? "Interview"
                            : selectedApp.stage === "OFFER"
                            ? "Offer"
                            : "Rejected"}
                        </span>

                        <button
                          onClick={() => {
                            const newStage = selectedApp.stage === "SAVED" ? "APPLIED" : "SAVED";
                            onUpdateApplication({ id: selectedApp.id, stage: newStage });
                          }}
                          title="Bookmark status"
                          className="p-0.5 text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          <Bookmark className="h-4 w-4 fill-amber-500 stroke-amber-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-meta: Location, Category, Deadline */}
                <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs text-[#6B7280] border-b border-black/[0.06] pb-2.5">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span className="truncate max-w-[150px]">
                      {selectedApp.opportunity?.location?.includes(selectedApp.opportunity?.workMode || "")
                        ? selectedApp.opportunity?.location
                        : `${selectedApp.opportunity?.location || "Remote"} (${selectedApp.opportunity?.workMode})`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Briefcase className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span>{selectedApp.opportunity?.category || "Internship"}</span>
                  </div>
                  <div className="flex items-center space-x-1 font-semibold text-rose-600">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Apply by {formatDeadline(selectedApp.targetDeadline || selectedApp.opportunity?.deadline)}</span>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="mt-3 flex items-center space-x-3 border-b border-black/[0.06] text-xs font-semibold overflow-x-auto">
                  {(["overview", "notes", "preparation", "timeline", "documents"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDrawerTab(tab)}
                      className={`pb-2 transition-all capitalize text-xs whitespace-nowrap cursor-pointer ${
                        drawerTab === tab
                          ? "border-b-2 border-[#101214] text-[#101214] font-bold"
                          : "text-[#6B7280] hover:text-[#101214]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Tab Body */}
              <div className="flex-1 overflow-y-auto pr-1 my-2 min-h-0 space-y-3.5 [scrollbar-width:thin] [scrollbar-color:#D8CFC0_transparent]">
                {/* Tab 1: Overview */}
                {drawerTab === "overview" && (
                  <div className="space-y-4">
                    {/* About the role */}
                    <div>
                      <h4 className="text-[11px] font-bold text-[#101214] uppercase tracking-wider">
                        About the role
                      </h4>
                      <p className="mt-1 text-xs text-[#4B5563] leading-relaxed">
                        {selectedApp.opportunity?.description}
                      </p>
                    </div>

                    {/* 3 Info Stat Pills */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-2.5 text-center">
                        <Clock className="mx-auto h-3.5 w-3.5 text-[#4B5563] mb-0.5" />
                        <div className="text-[10px] text-[#6B7280]">Duration</div>
                        <div className="text-[11px] font-semibold text-[#101214]">3–5 months</div>
                      </div>

                      <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-2.5 text-center">
                        <Coins className="mx-auto h-3.5 w-3.5 text-[#4B5563] mb-0.5" />
                        <div className="text-[10px] text-[#6B7280]">Stipend</div>
                        <div className="text-[11px] font-semibold text-[#101214] truncate" title={selectedApp.opportunity?.compensation}>
                          {selectedApp.opportunity?.compensation || "Unlisted"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-2.5 text-center">
                        <Laptop className="mx-auto h-3.5 w-3.5 text-[#4B5563] mb-0.5" />
                        <div className="text-[10px] text-[#6B7280]">Work Mode</div>
                        <div className="text-[11px] font-semibold text-[#101214]">{selectedApp.opportunity?.workMode}</div>
                      </div>
                    </div>

                    {/* Skills / Keyword Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedApp.opportunity?.requiredSkills || []).map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-black/[0.06] bg-[#F4F5F0] px-2.5 py-0.5 text-[10px] font-semibold text-[#101214]"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>

                    {/* Your Notes Box */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-[#101214] uppercase tracking-wider">
                          Your notes
                        </h4>
                        <button
                          onClick={() => {
                            setTempNotes(selectedApp.notes || "");
                            setIsEditingNotes(!isEditingNotes);
                          }}
                          className="text-[#6B7280] hover:text-[#101214] cursor-pointer"
                          title="Edit notes"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {isEditingNotes ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all p-2.5 text-xs text-[#101214] focus:outline-none"
                            placeholder="Add personal notes, recruiter connections, or reflections..."
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setIsEditingNotes(false)}
                              className="rounded-full px-3 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F4F5F0] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveNotes}
                              className="rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-1 text-xs font-semibold text-[#0E1012] cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-start space-x-2 rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-2.5 text-xs text-[#101214]">
                          <FileText className="h-3.5 w-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                          <p className="flex-1 text-[#4B5563] leading-relaxed italic text-[11px]">
                            {selectedApp.notes || "No notes recorded yet. Click pencil to add thoughts."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Next Steps Checklist */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-[#101214] uppercase tracking-wider">
                          Next steps
                        </h4>
                        <button
                          onClick={() => setShowAddStep(!showAddStep)}
                          className="text-xs font-semibold text-[#101214] hover:underline cursor-pointer"
                        >
                          + Add step
                        </button>
                      </div>

                      {showAddStep && (
                        <form onSubmit={handleAddNextStep} className="mt-2 flex items-center space-x-2">
                          <input
                            type="text"
                            value={newStepText}
                            onChange={(e) => setNewStepText(e.target.value)}
                            placeholder="e.g. Review technical system design notes..."
                            className="flex-1 rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all px-2.5 py-1.5 text-xs text-[#101214] focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-1.5 text-xs font-semibold text-[#0E1012] cursor-pointer"
                          >
                            Add
                          </button>
                        </form>
                      )}

                      <div className="mt-2 space-y-1.5">
                        {((selectedApp.reminders || []) as Array<{ id: string; title: string; dueDate: string; isDone: boolean }>).map(
                          (step) => (
                            <div
                              key={step.id}
                              onClick={() => handleToggleReminder(step.id, step.isDone)}
                              className="group flex items-center justify-between rounded-lg p-1.5 hover:bg-[#FAFBF7] cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                {step.isDone ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 fill-emerald-600/10" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#4B5563] shrink-0" />
                                )}
                                <span
                                  className={`text-xs ${
                                    step.isDone ? "line-through text-[#9CA3AF]" : "text-[#101214] font-medium"
                                  }`}
                                >
                                  {step.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-[#6B7280] shrink-0">
                                {step.dueDate}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Notes */}
                {drawerTab === "notes" && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-3 text-xs text-[#101214]">
                      <span className="font-semibold text-[#101214] block mb-1.5 text-xs">Interview & Application Notes</span>
                      <textarea
                        value={selectedApp.notes || ""}
                        onChange={(e) =>
                          onUpdateApplication({
                            id: selectedApp.id,
                            notes: e.target.value,
                          })
                        }
                        rows={7}
                        className="w-full rounded-xl border border-black/[0.10] bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all p-2.5 text-xs focus:outline-none leading-relaxed"
                        placeholder="Write comprehensive notes: referral conversations, interview questions asked, key project talking points..."
                      />
                    </div>
                    <p className="text-[10px] text-[#6B7280] italic">
                      Changes to notes are automatically saved to your private profile.
                    </p>
                  </div>
                )}

                {/* Tab 3: Preparation */}
                {drawerTab === "preparation" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#101214] uppercase">Preparation Readiness</span>
                      <button
                        onClick={() => {
                          if (selectedApp.opportunity) onInspectOpportunity(selectedApp.opportunity);
                        }}
                        className="text-xs font-semibold text-[#101214] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Open Studio</span>
                      </button>
                    </div>

                    <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-3.5 text-xs space-y-1.5">
                      <div className="font-semibold text-[#101214]">Target Role Focus:</div>
                      <div className="text-[#4B5563]">{selectedApp.opportunity?.title}</div>
                      <div className="mt-2.5 font-semibold text-[#101214]">Skill Gaps Identified:</div>
                      <ul className="list-disc pl-4 space-y-1 text-[#4B5563] text-[11px]">
                        <li>Review benchmark methodologies and technical architecture.</li>
                        <li>Tailor resume bullet points for verifiable portfolio evidence.</li>
                        <li>Prepare talking points for systems & alignment questions.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tab 4: Timeline */}
                {drawerTab === "timeline" && (
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold text-[#101214] uppercase">Stage History</span>
                    <div className="relative pl-5 border-l border-black/[0.12] space-y-3.5 mt-2">
                      <div className="relative">
                        <div className="absolute -left-[26px] top-0.5 h-2.5 w-2.5 rounded-full bg-[#101214] ring-2 ring-white" />
                        <div className="text-xs font-semibold text-[#101214]">Tracked in Prospect</div>
                        <div className="text-[10px] text-[#6B7280]">
                          {new Date(selectedApp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {selectedApp.stage !== "SAVED" && (
                        <div className="relative">
                          <div className="absolute -left-[26px] top-0.5 h-2.5 w-2.5 rounded-full bg-[#84CC16] ring-2 ring-white" />
                          <div className="text-xs font-semibold text-[#101214]">Advanced to {selectedApp.stage}</div>
                          <div className="text-[10px] text-[#6B7280]">
                            {new Date(selectedApp.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 5: Documents */}
                {drawerTab === "documents" && (
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold text-[#101214] uppercase">Tailored Materials</span>
                    <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-3.5 text-xs space-y-1.5">
                      <span className="font-semibold text-[#101214] block text-xs">Resume Bullet Draft:</span>
                      <p className="text-[#4B5563] font-mono text-[10px] whitespace-pre-wrap">
                        {selectedApp.materials?.resumeBulletsDraft || "• Highlighted relevant domain experience and projects."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pinned Bottom Action Footer (Visible on all tabs) */}
              <div className="shrink-0 pt-3 border-t border-black/[0.06] flex items-center space-x-2">
                <a
                  href={selectedApp.opportunity?.applyUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded-full bg-[#101214] px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Visit Application Link</span>
                </a>

                {selectedApp.stage === "SAVED" ? (
                  <button
                    onClick={() =>
                      onUpdateApplication({
                        id: selectedApp.id,
                        stage: "APPLIED",
                        eventNote: "Moved application from Saved to Applied stage.",
                      })
                    }
                    className="flex items-center space-x-1.5 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-2.5 text-xs font-semibold text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] hover:bg-[#d8f653] transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 text-[#0E1012]" />
                    <span>Move to Applied</span>
                  </button>
                ) : selectedApp.stage === "APPLIED" ? (
                  <button
                    onClick={() =>
                      onUpdateApplication({
                        id: selectedApp.id,
                        stage: "INTERVIEW",
                        eventNote: "Advanced to Interview stage.",
                      })
                    }
                    className="flex items-center space-x-1.5 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-2.5 text-xs font-semibold text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] hover:bg-[#d8f653] transition-all cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#0E1012]" />
                    <span>Move to Interview</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      onUpdateApplication({
                        id: selectedApp.id,
                        stage: "OFFER",
                        outcome: "OFFER",
                        eventNote: "Recorded Offer received!",
                      })
                    }
                    className="flex items-center space-x-1.5 rounded-full border border-[#F5DFA0] bg-[#FEF9E7] px-3.5 py-2.5 text-xs font-semibold text-[#715515] hover:bg-[#fdf3cd] transition-all cursor-pointer"
                  >
                    <Star className="h-3.5 w-3.5 text-[#B47818]" />
                    <span>Record Offer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Row 1: Weekly Goals & Response Velocity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Weekly Target */}
            <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[#101214]" />
                  Weekly Target
                </span>
                <span className="rounded-full bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 px-2.5 py-0.5 text-[10px] font-semibold text-[#101214]">
                  Goal: {weeklyGoal}/wk
                </span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#101214]">
                  {appliedThisWeek}{" "}
                  <span className="text-sm font-semibold text-[#6B7280]">/ {weeklyGoal} submitted</span>
                </div>
                <div className="mt-2.5 h-3 w-full rounded-full bg-[#EFEFE9] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#84CC16] to-[#CBEF3B] rounded-full transition-all"
                    style={{ width: `${weeklyProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-[#6B7280]">
                  {weeklyProgress >= 100
                    ? "🎉 Weekly target met! You're building high submission momentum."
                    : `${weeklyGoal - appliedThisWeek} more applications needed to hit your weekly target.`}
                </p>
              </div>
            </div>

            {/* 2. Response Velocity */}
            <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Response Velocity
                </span>
                <span className="rounded-full bg-[#FEF9E7] border border-[#F5DFA0] px-2.5 py-0.5 text-[10px] font-semibold text-[#715515]">
                  Active Tracking
                </span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#101214]">
                  ~{avgResponseDays} <span className="text-sm font-semibold text-[#6B7280]">days</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[#101214]">
                  Average First Response Time
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7280] font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Velocity Status: <strong className="text-[#101214]">Healthy Pipeline Momentum</strong></span>
                </div>
              </div>
            </div>

            {/* 3. Conversion Rates */}
            <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-violet-600" />
                  Conversion Health
                </span>
                <span className="rounded-full bg-[#EFF7FF] border border-[#C7E0FA] px-2.5 py-0.5 text-[10px] font-semibold text-[#0369A1]">
                  Live Funnel
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-3">
                  <div className="text-xl font-extrabold text-[#101214]">{interviewRate}%</div>
                  <div className="text-[10px] font-semibold text-[#6B7280]">Interview Rate</div>
                </div>
                <div className="rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-3">
                  <div className="text-xl font-extrabold text-[#101214]">{offerRate}%</div>
                  <div className="text-[10px] font-semibold text-[#6B7280]">Offer Rate</div>
                </div>
              </div>
              <p className="text-[11px] font-medium text-[#6B7280]">
                Calculated across verified applications in your active pipeline.
              </p>
            </div>
          </div>

          {/* Row 2: Funnel & Drop-off Analysis + Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pipeline Funnel */}
            <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <h3 className="font-heading text-base font-bold text-[#101214]">
                  Pipeline Funnel & Conversion
                </h3>
                <span className="text-xs font-semibold text-[#6B7280]">
                  {totalCount} Total Opportunities
                </span>
              </div>

              <div className="space-y-3.5 pt-2">
                {[
                  { label: "Saved for Review", count: savedCount, color: "bg-[#F5DFA0]", percent: 100 },
                  { label: "Submitted & Applied", count: appliedCount, color: "bg-gradient-to-r from-[#84CC16] to-[#CBEF3B]", percent: totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0 },
                  { label: "Interview Rounds", count: interviewCount, color: "bg-[#93C5FD]", percent: totalCount > 0 ? Math.round((interviewCount / totalCount) * 100) : 0 },
                  { label: "Offers Received", count: offerCount, color: "bg-[#C4B5FD]", percent: totalCount > 0 ? Math.round((offerCount / totalCount) * 100) : 0 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#101214]">
                      <span>{item.label}</span>
                      <span className="text-[#4B5563]">{item.count} ({item.percent}%)</span>
                    </div>
                    <div className="h-3.5 w-full rounded-full bg-[#EFEFE9] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${Math.max(4, item.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution by Work Mode & Category */}
            <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <h3 className="font-heading text-base font-bold text-[#101214]">
                  Outcome & Role Distributions
                </h3>
                <span className="text-xs font-semibold text-[#6B7280]">Categorical Breakdown</span>
              </div>

              {/* Category Bars */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-[#101214]">By Opportunity Category:</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-2.5 text-xs">
                      <span className="font-medium text-[#101214] truncate">{cat}</span>
                      <span className="font-bold text-[#101214] rounded-full bg-white px-2 py-0.5 border border-black/[0.06]">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Mode Breakdown */}
              <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                <div className="text-xs font-bold text-[#101214]">By Work Mode:</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(workModeCounts).map(([wm, count]) => (
                    <div key={wm} className="flex flex-col items-center justify-center rounded-xl border border-black/[0.06] bg-[#FAFBF7] p-2.5 text-center">
                      <span className="text-base font-extrabold text-[#101214]">{count}</span>
                      <span className="text-[10px] font-semibold text-[#6B7280]">{wm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Follow-Up & Velocity Table */}
          <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#101214]">
                  Active Follow-Up & Velocity Monitor
                </h3>
                <p className="text-xs text-[#6B7280] font-medium">
                  Applications awaiting response. Reach out if more than 5 days have passed since submission.
                </p>
              </div>
              <span className="rounded-full bg-[#FEF9E7] border border-[#F5DFA0] px-3 py-0.5 text-xs font-semibold text-[#715515]">
                {staleApplications.length} Needs Follow-up
              </span>
            </div>

            {staleApplications.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#6B7280] font-medium">
                All active applications are within optimal response windows! No stalled applications detected.
              </div>
            ) : (
              <div className="space-y-2.5">
                {staleApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5"
                  >
                    <div className="flex items-center space-x-3">
                      <CompanyLogo
                        name={app.opportunity?.organization || ""}
                        size={36}
                        className="h-9 w-9 shrink-0 rounded-xl border border-black/[0.06]"
                      />
                      <div>
                        <h4 className="font-semibold text-xs text-[#101214]">
                          {app.opportunity?.title}
                        </h4>
                        <p className="text-[11px] text-[#6B7280]">
                          {app.opportunity?.organization} • {app.opportunity?.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700">
                        {Math.floor((now - new Date(app.createdAt || 0).getTime()) / (1000 * 60 * 60 * 24))}d since applied
                      </span>
                      <button
                        onClick={() => {
                          setViewMode("pipeline");
                          setSelectedAppId(app.id);
                        }}
                        className="rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-1.5 text-xs font-semibold text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] hover:bg-[#d8f653] transition-colors cursor-pointer"
                      >
                        Inspect & Follow Up
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render individual application card inside columns
  function renderApplicationCard(app: ApplicationRecord, isInterviewColumn = false) {
    const isSelected = selectedApp?.id === app.id;
    const opp = app.opportunity;
    const tags = (opp?.requiredSkills || []).slice(0, 2);
    const roundBadge = isInterviewColumn ? getInterviewRound(app) : null;

    return (
      <div
        key={app.id}
        onClick={() => setSelectedAppId(app.id)}
        className={`group relative rounded-[18px] border bg-white p-4 transition-all cursor-pointer ${
          isSelected
            ? "border-[#94D814] ring-2 ring-[#DDFB4B]/50 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            : "border-black/[0.07] shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:border-black/[0.14] hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:-translate-y-0.5"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Company Logo + Titles */}
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <CompanyLogo
              name={opp?.organization || ""}
              size={42}
              className="h-[42px] w-[42px] shrink-0 rounded-xl border border-black/[0.06]"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-[#101214] group-hover:underline transition-colors leading-snug">
                {opp?.title}
              </h4>
              <p className="text-[11px] font-medium text-[#6B7280] mt-0.5 truncate">
                {opp?.organization}
              </p>
            </div>
          </div>

          {/* Three dots menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuAppId(openMenuAppId === app.id ? null : app.id);
              }}
              className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F4F5F0] hover:text-[#101214] cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {openMenuAppId === app.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 z-30 w-44 rounded-2xl border border-black/[0.08] bg-white p-1.5 text-xs shadow-[0_14px_34px_rgba(15,23,42,0.12)] animate-in fade-in duration-150 space-y-0.5"
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Move stage
                </div>
                {(["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as ApplicationStage[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onUpdateApplication({ id: app.id, stage: st });
                      setOpenMenuAppId(null);
                    }}
                    className={`w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      app.stage === st
                        ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832]"
                        : "text-[#101214] hover:bg-[#FAFBF7]"
                    }`}
                  >
                    {st === "SAVED"
                      ? "Saved"
                      : st === "APPLIED"
                      ? "Applied"
                      : st === "INTERVIEW"
                      ? "Interviewing"
                      : st === "OFFER"
                      ? "Offer Received"
                      : "Rejected"}
                  </button>
                ))}
                <div className="my-1 border-t border-black/[0.06]" />
                <button
                  onClick={() => {
                    onDeleteApplication(app.id);
                    setOpenMenuAppId(null);
                  }}
                  className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  Remove Application
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/[0.06] bg-[#F4F5F0] px-2.5 py-0.5 text-[10px] font-semibold text-[#4B5563]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Bottom Row: Deadline Date & Interview Round Badge */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B7280]">
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#6B7280]" />
            <span>{formatDeadline(app.targetDeadline || opp?.deadline)}</span>
          </div>

          {/* Round badge for Interview column aligned right */}
          {roundBadge && (
            <span className="rounded-full bg-[#EFF7FF] border border-[#C7E0FA] px-2.5 py-0.5 text-[10px] font-semibold text-[#0369A1]">
              {roundBadge}
            </span>
          )}
        </div>
      </div>
    );
  }
}
