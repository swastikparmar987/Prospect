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
}

export function TrackerView({
  applications,
  upcomingDeadlines = [],
  userProfile,
  onUpdateApplication,
  onDeleteApplication,
  onInspectOpportunity,
  onOpenAddModal,
}: TrackerViewProps) {
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
      <div className="neo-card-lg p-6 sm:p-8 flex flex-col justify-between">
        {/* Top Controls: Eyebrow & Add Application */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-heading font-extrabold tracking-[0.16em] text-[#777777] uppercase">
              APPLICATION TRACKER
            </span>
            <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 font-heading text-[10px] font-extrabold text-[#080808]">
              {totalCount} Tracked
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* + Add Application Primary Button */}
            <button
              onClick={() => onOpenAddModal?.("SAVED")}
              className="neo-btn-primary inline-flex items-center space-x-1.5 px-5 py-2.5 text-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* Header Title & Subtitle */}
        <div className="mt-5 max-w-xl">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#080808] leading-[1.08]">
            Track your{" "}
            <span className="relative inline-block">
              journey.
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
          <p className="mt-2.5 text-xs sm:text-sm text-[#777777] font-medium leading-relaxed">
            Keep track of your applications, see what&apos;s next, and never miss a deadline.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6 SUMMARY METRIC CARDS                                    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Total Applications */}
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`flex items-center justify-between rounded-2xl border-2 border-[#080808] p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-[#E0FB66] shadow-[3px_3px_0px_#080808]"
              : "bg-white hover:bg-[#FDF9F3]"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#080808]">{totalCount}</div>
            <div className="text-[11px] font-bold text-[#080808]/75">Total Applications</div>
          </div>
          <div className="flex flex-col items-end space-y-1 text-[#080808]">
            <BarChart3 className="h-5 w-5" />
          </div>
        </button>

        {/* 2. Saved */}
        <button
          onClick={() => setStatusFilter("SAVED")}
          className={`flex items-center justify-between rounded-2xl border-2 border-[#080808] p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "SAVED"
              ? "bg-[#FEF189] shadow-[3px_3px_0px_#080808]"
              : "bg-white hover:bg-[#FEF189]/40"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#080808]">{savedCount}</div>
            <div className="text-[11px] font-bold text-[#080808]/75">Saved</div>
          </div>
          <Bookmark className="h-5 w-5 text-[#080808]" />
        </button>

        {/* 3. Applied */}
        <button
          onClick={() => setStatusFilter("APPLIED")}
          className={`flex items-center justify-between rounded-2xl border-2 border-[#080808] p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "APPLIED"
              ? "bg-[#E0FB66] shadow-[3px_3px_0px_#080808]"
              : "bg-white hover:bg-[#E0FB66]/35"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#080808]">{appliedCount}</div>
            <div className="text-[11px] font-bold text-[#080808]/75">Applied</div>
          </div>
          <Send className="h-5 w-5 text-[#080808]" />
        </button>

        {/* 4. Interview */}
        <button
          onClick={() => setStatusFilter("INTERVIEW")}
          className={`flex items-center justify-between rounded-2xl border-2 border-[#080808] p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "INTERVIEW"
              ? "bg-[#C4E7FF] shadow-[3px_3px_0px_#080808]"
              : "bg-white hover:bg-[#C4E7FF]/40"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#080808]">{interviewCount}</div>
            <div className="text-[11px] font-bold text-[#080808]/75">Interview</div>
          </div>
          <Calendar className="h-5 w-5 text-[#080808]" />
        </button>

        {/* 5. Offer */}
        <button
          onClick={() => setStatusFilter("OFFER")}
          className={`flex items-center justify-between rounded-2xl border-2 border-[#080808] p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "OFFER"
              ? "bg-[#E0FB66] shadow-[3px_3px_0px_#080808]"
              : "bg-white hover:bg-[#FEF189]/40"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#080808]">{offerCount}</div>
            <div className="text-[11px] font-bold text-[#080808]/75">Offer</div>
          </div>
          <Star className="h-5 w-5 text-[#080808]" />
        </button>

        {/* 6. Rejected */}
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`flex items-center justify-between rounded-2xl border-2 border-[#080808] p-3.5 text-left transition-all cursor-pointer ${
            statusFilter === "REJECTED"
              ? "bg-[#D8D5CE] shadow-[3px_3px_0px_#080808]"
              : "bg-white hover:bg-[#FDF9F3]"
          }`}
        >
          <div>
            <div className="text-2xl font-extrabold text-[#080808]">{rejectedCount}</div>
            <div className="text-[11px] font-bold text-[#777777]">Rejected</div>
          </div>
          <X className="h-5 w-5 text-[#777777]" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* SEARCH AND FILTER BAR                                     */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications, companies, or roles..."
            className="w-full rounded-xl border-2 border-[#080808] bg-white pl-10 pr-4 py-2 text-xs font-semibold text-[#080808] placeholder-[#777777] focus:outline-none shadow-[3px_3px_0px_#080808] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#080808]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border-2 border-[#080808] bg-white px-3 py-2 pr-7 text-[#080808] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#080808]" />
          </div>

          {/* Types Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border-2 border-[#080808] bg-white px-3 py-2 pr-7 text-[#080808] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Fellowship">Fellowship</option>
              <option value="Research">Research</option>
              <option value="Entry-level">Entry-level</option>
              <option value="Hackathon">Hackathon</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#080808]" />
          </div>

          {/* Locations Dropdown */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="appearance-none rounded-xl border-2 border-[#080808] bg-white px-3 py-2 pr-7 text-[#080808] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
              <option value="SF">San Francisco</option>
              <option value="NYC">New York</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#080808]" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-xl border-2 border-[#080808] bg-white px-3 py-2 pr-7 text-[#080808] focus:outline-none cursor-pointer"
            >
              <option value="newest">⇅ Newest First</option>
              <option value="oldest">⇅ Oldest First</option>
              <option value="deadline">⏰ Deadline Soonest</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#080808]" />
          </div>
        </div>
      </div>

      {/* Approaching Real Deadlines Quick Strip */}
      {upcomingDeadlines && upcomingDeadlines.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
          <span className="font-semibold text-rose-800 shrink-0 flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1">
            <Clock className="h-3.5 w-3.5 text-rose-600" />
            <span>Upcoming Deadlines:</span>
          </span>
          {upcomingDeadlines.slice(0, 4).map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedAppId(d.id)}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-[#080808] bg-white px-2.5 py-1 text-[#080808] hover:bg-[#FEF189] transition-all shrink-0 cursor-pointer"
            >
              <span className="font-bold text-[#080808]">{d.organization}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 truncate max-w-[150px]">{d.title}</span>
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
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
          <div className="rounded-2xl border border-[#F4EBD7] bg-[#FCF8EE]/70 p-4 flex flex-col justify-between h-[660px] shadow-2xs">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Column Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#F0E4CD]">
                <div className="flex items-center space-x-2">
                  <Bookmark className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                  <span className="font-bold text-xs text-slate-800">Saved</span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-amber-800 shadow-2xs">
                  {savedApplications.length}
                </span>
              </div>

              {/* Cards List: Scrollable with thin scrollbar */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:#D8CFC0_transparent]">
                {savedApplications.map((app) => renderApplicationCard(app))}
                {savedApplications.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No saved applications yet.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Add Saved Button */}
            <button
              onClick={() => onOpenAddModal?.("SAVED")}
              className="mt-3 shrink-0 flex w-full items-center justify-center space-x-1.5 rounded-xl border border-dashed border-[#E0D4BA] bg-white/70 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-400 transition-all shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Saved</span>
            </button>
          </div>

          {/* COLUMN 2: APPLIED */}
          <div className="rounded-2xl border border-[#DFF1E3] bg-[#F2F8F3]/70 p-4 flex flex-col justify-between h-[660px] shadow-2xs">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Column Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#D5EAD9]">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-emerald-600 fill-emerald-600/20" />
                  <span className="font-bold text-xs text-slate-800">Applied</span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
                  {appliedApplications.length}
                </span>
              </div>

              {/* Cards List: Scrollable with thin scrollbar */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:#D8CFC0_transparent]">
                {appliedApplications.map((app) => renderApplicationCard(app))}
                {appliedApplications.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No applications currently in applied stage.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Add Application Button */}
            <button
              onClick={() => onOpenAddModal?.("APPLIED")}
              className="mt-3 shrink-0 flex w-full items-center justify-center space-x-1.5 rounded-xl border border-dashed border-[#C7E3CD] bg-white/70 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-400 transition-all shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Application</span>
            </button>
          </div>

          {/* COLUMN 3: INTERVIEW */}
          <div className="rounded-2xl border border-[#DEECF8] bg-[#F2F7FB]/70 p-4 flex flex-col justify-between h-[660px] shadow-2xs">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Column Header */}
              <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#D3E4F3]">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-sky-600 fill-sky-600/20" />
                  <span className="font-bold text-xs text-slate-800">Interview</span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-sky-800 shadow-2xs">
                  {interviewApplications.length}
                </span>
              </div>

              {/* Cards List: Scrollable with thin scrollbar */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:#D8CFC0_transparent]">
                {interviewApplications.map((app) => renderApplicationCard(app, true))}
                {interviewApplications.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No interviews in progress.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Add Application Button */}
            <button
              onClick={() => onOpenAddModal?.("INTERVIEW")}
              className="mt-3 shrink-0 flex w-full items-center justify-center space-x-1.5 rounded-xl border border-dashed border-[#C5DDF2] bg-white/70 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-400 transition-all shadow-2xs"
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
            <div className="rounded-2xl border border-[#E6DFD2] bg-white p-5 shadow-sm h-[660px] flex flex-col justify-between overflow-hidden">
              {/* Drawer Top Header (Sticky inside card) */}
              <div className="shrink-0">
                <div className="flex items-start space-x-3.5">
                  <CompanyLogo
                    name={selectedApp.opportunity?.organization || ""}
                    size={46}
                    className="h-[46px] w-[46px] shrink-0 rounded-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Title and Actions (More + Close) */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-base font-bold text-slate-900 leading-snug truncate">
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
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAppId(null)}
                          title="Close preview"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Organization Name + Status Pill + Bookmark */}
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500">
                        {selectedApp.opportunity?.organization}
                      </p>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            selectedApp.stage === "SAVED"
                              ? "bg-[#FEF6E9] text-[#B47818] border border-[#F6E3BF]"
                              : selectedApp.stage === "APPLIED"
                              ? "bg-[#EBF7EE] text-[#1E7E34] border border-[#CDEED5]"
                              : selectedApp.stage === "INTERVIEW"
                              ? "bg-[#EBF3FC] text-[#185FA5] border border-[#D0E3F9]"
                              : selectedApp.stage === "OFFER"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
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
                          className="p-0.5 text-amber-500 hover:text-amber-600 transition-colors"
                        >
                          <Bookmark className="h-4 w-4 fill-amber-500 stroke-amber-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-meta: Location, Category, Deadline */}
                <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs text-slate-500 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate max-w-[150px]">
                      {selectedApp.opportunity?.location?.includes(selectedApp.opportunity?.workMode || "")
                        ? selectedApp.opportunity?.location
                        : `${selectedApp.opportunity?.location || "Remote"} (${selectedApp.opportunity?.workMode})`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedApp.opportunity?.category || "Internship"}</span>
                  </div>
                  <div className="flex items-center space-x-1 font-semibold text-rose-600">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Apply by {formatDeadline(selectedApp.targetDeadline || selectedApp.opportunity?.deadline)}</span>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="mt-3 flex items-center space-x-3.5 border-b border-slate-200 text-xs font-semibold">
                  {(["overview", "notes", "preparation", "timeline", "documents"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDrawerTab(tab)}
                      className={`pb-2 transition-all capitalize text-xs ${
                        drawerTab === tab
                          ? "border-b-2 border-slate-900 text-slate-900 font-bold"
                          : "text-slate-500 hover:text-slate-800"
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
                      <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                        About the role
                      </h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {selectedApp.opportunity?.description}
                      </p>
                    </div>

                    {/* 3 Info Stat Pills */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2 text-center">
                        <Clock className="mx-auto h-3.5 w-3.5 text-[#080808] mb-0.5" />
                        <div className="text-[10px] text-[#777777]">Duration</div>
                        <div className="text-[11px] font-bold text-[#080808]">3–5 months</div>
                      </div>

                      <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2 text-center">
                        <Coins className="mx-auto h-3.5 w-3.5 text-[#080808] mb-0.5" />
                        <div className="text-[10px] text-[#777777]">Stipend</div>
                        <div className="text-[11px] font-bold text-[#080808] truncate" title={selectedApp.opportunity?.compensation}>
                          {selectedApp.opportunity?.compensation || "Unlisted"}
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2 text-center">
                        <Laptop className="mx-auto h-3.5 w-3.5 text-[#080808] mb-0.5" />
                        <div className="text-[10px] text-[#777777]">Work Mode</div>
                        <div className="text-[11px] font-bold text-[#080808]">{selectedApp.opportunity?.workMode}</div>
                      </div>
                    </div>

                    {/* Skills / Keyword Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedApp.opportunity?.requiredSkills || []).map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-[#080808] bg-[#FDF9F3] px-2 py-0.5 text-[10px] font-bold text-[#080808]"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>

                    {/* Your Notes Box */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-extrabold text-[#080808] uppercase tracking-wider">
                          Your notes
                        </h4>
                        <button
                          onClick={() => {
                            setTempNotes(selectedApp.notes || "");
                            setIsEditingNotes(!isEditingNotes);
                          }}
                          className="text-[#777777] hover:text-[#080808]"
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
                            className="w-full rounded-xl border-2 border-[#080808] p-2.5 text-xs text-[#080808] focus:outline-none"
                            placeholder="Add personal notes, recruiter connections, or reflections..."
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setIsEditingNotes(false)}
                              className="rounded-lg px-2.5 py-1 text-xs text-[#777777] hover:bg-[#FDF9F3]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveNotes}
                              className="rounded-lg border-2 border-[#080808] bg-[#E0FB66] px-3 py-1 text-xs font-bold text-[#080808]"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-start space-x-2 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5 text-xs text-[#080808]">
                          <FileText className="h-3.5 w-3.5 text-[#080808] shrink-0 mt-0.5" />
                          <p className="flex-1 text-[#080808]/80 leading-relaxed italic text-[11px]">
                            {selectedApp.notes || "No notes recorded yet. Click pencil to add thoughts."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Next Steps Checklist */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-extrabold text-[#080808] uppercase tracking-wider">
                          Next steps
                        </h4>
                        <button
                          onClick={() => setShowAddStep(!showAddStep)}
                          className="text-xs font-bold text-[#080808] hover:underline"
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
                            className="flex-1 rounded-lg border-2 border-[#080808] px-2.5 py-1 text-xs text-[#080808] focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="rounded-lg border-2 border-[#080808] bg-[#E0FB66] px-3 py-1 text-xs font-bold text-[#080808]"
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
                              className="group flex items-center justify-between rounded-lg p-1 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                {step.isDone ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 fill-emerald-600/10" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 shrink-0" />
                                )}
                                <span
                                  className={`text-xs ${
                                    step.isDone ? "line-through text-slate-400" : "text-slate-700 font-medium"
                                  }`}
                                >
                                  {step.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-400 shrink-0">
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
                    <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3 text-xs text-[#080808]">
                      <span className="font-bold text-[#080808] block mb-1.5 text-xs">Interview & Application Notes</span>
                      <textarea
                        value={selectedApp.notes || ""}
                        onChange={(e) =>
                          onUpdateApplication({
                            id: selectedApp.id,
                            notes: e.target.value,
                          })
                        }
                        rows={7}
                        className="w-full rounded-lg border-2 border-[#080808] bg-white p-2.5 text-xs focus:outline-none leading-relaxed"
                        placeholder="Write comprehensive notes: referral conversations, interview questions asked, key project talking points..."
                      />
                    </div>
                    <p className="text-[10px] text-[#777777] italic">
                      Changes to notes are automatically saved to your private profile.
                    </p>
                  </div>
                )}

                {/* Tab 3: Preparation */}
                {drawerTab === "preparation" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#080808] uppercase">Preparation Readiness</span>
                      <button
                        onClick={() => {
                          if (selectedApp.opportunity) onInspectOpportunity(selectedApp.opportunity);
                        }}
                        className="text-xs font-bold text-[#080808] hover:underline flex items-center space-x-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Open Studio</span>
                      </button>
                    </div>

                    <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3 text-xs space-y-1.5">
                      <div className="font-bold text-[#080808]">Target Role Focus:</div>
                      <div className="text-[#080808]/80">{selectedApp.opportunity?.title}</div>
                      <div className="mt-2.5 font-bold text-[#080808]">Skill Gaps Identified:</div>
                      <ul className="list-disc pl-4 space-y-1 text-[#080808]/80 text-[11px]">
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
                    <span className="text-[11px] font-extrabold text-[#080808] uppercase">Stage History</span>
                    <div className="relative pl-5 border-l-2 border-[#080808] space-y-3.5 mt-2">
                      <div className="relative">
                        <div className="absolute -left-[27px] top-0.5 h-3 w-3 rounded-full bg-[#080808] border-2 border-white" />
                        <div className="text-xs font-bold text-[#080808]">Tracked in Prospect</div>
                        <div className="text-[10px] text-[#777777]">
                          {new Date(selectedApp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {selectedApp.stage !== "SAVED" && (
                        <div className="relative">
                          <div className="absolute -left-[27px] top-0.5 h-3 w-3 rounded-full bg-[#E0FB66] border-2 border-[#080808]" />
                          <div className="text-xs font-bold text-[#080808]">Advanced to {selectedApp.stage}</div>
                          <div className="text-[10px] text-[#777777]">
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
                    <span className="text-[11px] font-extrabold text-[#080808] uppercase">Tailored Materials</span>
                    <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3 text-xs space-y-1.5">
                      <span className="font-bold text-[#080808] block text-xs">Resume Bullet Draft:</span>
                      <p className="text-[#080808]/80 font-mono text-[10px] whitespace-pre-wrap">
                        {selectedApp.materials?.resumeBulletsDraft || "• Highlighted relevant domain experience and projects."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pinned Bottom Action Footer (Visible on all tabs) */}
              <div className="shrink-0 pt-3 border-t-2 border-[#080808] flex items-center space-x-2.5">
                <a
                  href={selectedApp.opportunity?.applyUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border-2 border-[#080808] bg-[#080808] px-3.5 py-2.5 text-xs font-bold text-white shadow-[2px_2px_0px_#080808] hover:bg-[#080808]/90 active:scale-[0.98] transition-all"
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
                    className="flex items-center space-x-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-3 py-2.5 text-xs font-bold text-[#080808] hover:bg-[#FEF189] transition-all shadow-[2px_2px_0px_#080808]"
                  >
                    <Send className="h-3.5 w-3.5 text-[#080808]" />
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
                    className="flex items-center space-x-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-3 py-2.5 text-xs font-bold text-[#080808] hover:bg-[#FEF189] transition-all shadow-[2px_2px_0px_#080808]"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#080808]" />
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
                    className="flex items-center space-x-1.5 rounded-xl border-2 border-[#080808] bg-[#FEF189] px-3 py-2.5 text-xs font-bold text-[#080808] hover:bg-[#E0FB66] transition-all shadow-[2px_2px_0px_#080808]"
                  >
                    <Star className="h-3.5 w-3.5 text-[#080808]" />
                    <span>Record Offer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
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
        className={`group relative rounded-2xl border-2 border-[#080808] bg-white p-4 transition-all cursor-pointer ${
          isSelected
            ? "bg-[#FEF189]/40 shadow-[4px_4px_0px_#080808]"
            : "shadow-[3px_3px_0px_#080808] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#080808]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Company Logo + Titles */}
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <CompanyLogo
              name={opp?.organization || ""}
              size={42}
              className="h-[42px] w-[42px] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs text-[#080808] group-hover:underline transition-colors leading-snug">
                {opp?.title}
              </h4>
              <p className="text-[11px] font-medium text-[#777777] mt-0.5 truncate">
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
              className="rounded-lg p-1 text-[#777777] hover:bg-[#FDF9F3] hover:text-[#080808]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {openMenuAppId === app.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 z-30 w-44 rounded-xl border-2 border-[#080808] bg-white p-1 text-xs shadow-[4px_4px_0px_#080808] animate-in fade-in duration-150"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-[#777777] uppercase tracking-wider">
                  Move stage
                </div>
                {(["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as ApplicationStage[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onUpdateApplication({ id: app.id, stage: st });
                      setOpenMenuAppId(null);
                    }}
                    className={`w-full text-left rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                      app.stage === st
                        ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                        : "text-[#080808] hover:bg-[#FDF9F3]"
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
                <div className="my-1 border-t border-[#D8D5CE]" />
                <button
                  onClick={() => {
                    onDeleteApplication(app.id);
                    setOpenMenuAppId(null);
                  }}
                  className="w-full text-left rounded-lg px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
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
              className="rounded-full border border-[#080808] bg-[#FDF9F3] px-2.5 py-0.5 text-[10px] font-bold text-[#080808]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Bottom Row: Deadline Date & Interview Round Badge */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#777777]">
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#080808]" />
            <span>{formatDeadline(app.targetDeadline || opp?.deadline)}</span>
          </div>

          {/* Round badge for Interview column aligned right */}
          {roundBadge && (
            <span className="rounded-full bg-[#C4E7FF] border border-[#080808] px-2.5 py-0.5 text-[10px] font-bold text-[#080808]">
              {roundBadge}
            </span>
          )}
        </div>
      </div>
    );
  }
}
