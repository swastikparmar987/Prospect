"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CalendarClock,
  RefreshCw,
  Plus,
  CheckCircle2,
  Circle,
  PauseCircle,
  Play,
  Trash2,
  Sparkles,
  Clock,
  Briefcase,
  BookOpen,
  Code2,
  Radio,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ScheduledTaskItem {
  id: string;
  title: string;
  category: "INTERVIEW_PREP" | "JOB_SYNC" | "APPLICATION_FOLLOWUP" | "DEV_WORKFLOW";
  scheduleKind: "ONE_TIME" | "DAILY" | "WEEKLY";
  dueAt: string;
  timeLabel: string;
  notes: string;
  linkedOpportunityId?: string | null;
  linkedUrl?: string;
  status: "PENDING" | "COMPLETED" | "PAUSED";
  isAutoSyncRule: boolean;
  syncPlatforms: string[];
  syncQuery: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface SchedulerViewProps {
  onShowToast?: (msg: string) => void;
  onSyncCompleted?: () => void;
}

const CATEGORY_META: Record<
  ScheduledTaskItem["category"],
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  JOB_SYNC: {
    label: "Auto Job Sync",
    badgeClass: "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832]",
    icon: RefreshCw,
  },
  INTERVIEW_PREP: {
    label: "Interview Prep",
    badgeClass: "bg-[#FEF9E7] text-[#92400E] border-[#F5DFA0]",
    icon: BookOpen,
  },
  APPLICATION_FOLLOWUP: {
    label: "Follow-Up",
    badgeClass: "bg-[#EFF7FF] text-[#1D4ED8] border-[#C7E0FA]",
    icon: Briefcase,
  },
  DEV_WORKFLOW: {
    label: "Testing & Dev",
    badgeClass: "bg-[#F5F2FF] text-[#5B21B6] border-[#D9CCF8]",
    icon: Code2,
  },
};

export function SchedulerView({
  onShowToast,
  onSyncCompleted,
}: SchedulerViewProps) {
  const [tasks, setTasks] = useState<ScheduledTaskItem[]>([]);
  const [syncLedger, setSyncLedger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [runningGlobalSync, setRunningGlobalSync] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | ScheduledTaskItem["category"]>("ALL");

  // New task form
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<ScheduledTaskItem["category"]>("INTERVIEW_PREP");
  const [scheduleKind, setScheduleKind] =
    useState<ScheduledTaskItem["scheduleKind"]>("ONE_TIME");
  const [dueDate, setDueDate] = useState(() => {
    const tmr = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tmr.toISOString().split("T")[0];
  });
  const [timeLabel, setTimeLabel] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "LINKEDIN",
    "NAUKRI",
    "CAREER_FEEDS",
    "PUBLIC_BOARDS",
  ]);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/scheduler");
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
      if (data.syncLedger) {
        setSyncLedger(data.syncLedger);
      }
    } catch {
      onShowToast?.("Failed to load scheduled items.");
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleAutoBuild = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "AUTO_GENERATE_DAILY_AND_PREP" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate schedule");
      onShowToast?.(data.message || "Schedule updated!");
      await loadSchedule();
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : "Could not generate schedule.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRunGlobalSync = async () => {
    setRunningGlobalSync(true);
    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RUN_SYNC_NOW",
          syncPlatforms: selectedPlatforms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      onShowToast?.(
        `Live sync completed: ${data.syncResult?.itemsAdded ?? 0} new jobs added.`
      );
      await loadSchedule();
      onSyncCompleted?.();
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : "Failed to run live sync.");
    } finally {
      setRunningGlobalSync(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const dueIso = `${dueDate}T${timeLabel || "10:00"}:00`;
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          scheduleKind,
          dueAt: new Date(dueIso).toISOString(),
          timeLabel,
          notes: notes.trim(),
          isAutoSyncRule: category === "JOB_SYNC",
          syncPlatforms: selectedPlatforms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create item");
      setTitle("");
      setNotes("");
      onShowToast?.("Scheduled item added.");
      await loadSchedule();
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : "Failed to create schedule item.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (task: ScheduledTaskItem) => {
    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      const res = await fetch("/api/scheduler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === task.id ? { ...item, status: nextStatus } : item
          )
        );
      }
    } catch {
      onShowToast?.("Failed to update status.");
    }
  };

  const handleTogglePauseRule = async (task: ScheduledTaskItem) => {
    const nextStatus = task.status === "PAUSED" ? "PENDING" : "PAUSED";
    try {
      const res = await fetch("/api/scheduler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (res.ok) {
        await loadSchedule();
      }
    } catch {
      onShowToast?.("Failed to toggle rule.");
    }
  };

  const handleTriggerRuleNow = async (task: ScheduledTaskItem) => {
    setRunningTaskId(task.id);
    try {
      const res = await fetch("/api/scheduler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, triggerNow: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync trigger failed");
      onShowToast?.(
        `Sync rule "${task.title}" ran cleanly (+${data.syncRunSummary?.itemsAdded ?? 0} added).`
      );
      await loadSchedule();
      onSyncCompleted?.();
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : "Failed to trigger sync rule.");
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduler?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        onShowToast?.("Scheduled item removed.");
      }
    } catch {
      onShowToast?.("Could not delete item.");
    }
  };

  const togglePlatform = (plat: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat)
        ? prev.length > 1
          ? prev.filter((p) => p !== plat)
          : prev
        : [...prev, plat]
    );
  };

  const filteredTasks = tasks.filter(
    (t) => activeFilter === "ALL" || t.category === activeFilter
  );
  const autoSyncRules = tasks.filter((t) => t.isAutoSyncRule || t.category === "JOB_SYNC");

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-[#101214]">
      {/* Header Banner */}
      <section className="rounded-[24px] border border-black/[0.07] bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3 py-1 text-xs font-semibold text-[#0E1012]">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Automated Sync &amp; Prep Scheduler</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#101214]">
              Daily Job Syncs &amp; Interview Preparation Scheduler
            </h1>
            <p className="text-sm text-[#6B7280] max-w-2xl leading-relaxed">
              Automate multi-platform job ingestion (LinkedIn, Naukri, Company Boards, Public APIs), schedule focused interview preparation slots from your Prep Plans, and track testing &amp; workflow tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleAutoBuild}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-4 py-2.5 font-heading text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4D7C0F]" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-[#4D7C0F]" />
              )}
              <span>Auto-Build Daily &amp; Prep Plan</span>
            </button>

            <button
              type="button"
              onClick={handleRunGlobalSync}
              disabled={runningGlobalSync}
              className="inline-flex items-center gap-2 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all px-5 py-2.5 font-heading text-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#E3FC6D] ${runningGlobalSync ? "animate-spin" : ""}`}
              />
              <span>{runningGlobalSync ? "Syncing..." : "Run Sync Now"}</span>
            </button>
          </div>
        </div>

        {/* Live Background Ledger Summary */}
        {syncLedger && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-black/[0.06] text-xs">
            <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Background Interval
              </p>
              <p className="font-heading text-sm font-bold text-[#101214] flex items-center gap-1.5 mt-1">
                <Radio className="h-3.5 w-3.5 text-[#059669]" />
                <span>Every {syncLedger.intervalMinutes} mins</span>
              </p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Last Sync Status
              </p>
              <p className="font-heading text-sm font-bold text-[#101214] mt-1">
                {syncLedger.lastSyncStatus || "READY"}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#F3FCDA]/80 to-[#E6F9A4]/50 border border-[#C7E938]/55 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
                Active Jobs Indexed
              </p>
              <p className="font-heading text-sm font-bold text-[#101214] mt-1">
                {(syncLedger.counts?.totalActive ?? 0).toLocaleString()} live
              </p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Scheduled Rules / Tasks
              </p>
              <p className="font-heading text-sm font-bold text-[#101214] mt-1">
                {tasks.filter((t) => t.status !== "COMPLETED").length} pending ·{" "}
                {autoSyncRules.length} sync rules
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add New Scheduled Sync / Prep / Workflow Task */}
        <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.045)] h-fit space-y-4">
          <h2 className="font-heading text-lg font-bold text-[#101214] flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#F4F5F0] border border-black/[0.06] flex items-center justify-center">
              <Plus className="h-4 w-4 text-[#101214]" />
            </div>
            <span>Schedule Reminder or Auto-Sync</span>
          </h2>

          <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#101214] mb-1.5">
                Task / Reminder Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Daily ML Intern Sync (LinkedIn + Naukri)"
                className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs font-medium text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-[#101214] mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ScheduledTaskItem["category"])
                  }
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3 py-2.5 font-medium text-[#101214] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
                >
                  <option value="INTERVIEW_PREP">Interview Prep</option>
                  <option value="JOB_SYNC">Automated Job Sync</option>
                  <option value="APPLICATION_FOLLOWUP">Follow-Up</option>
                  <option value="DEV_WORKFLOW">Testing &amp; Dev</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#101214] mb-1.5">
                  Frequency
                </label>
                <select
                  value={scheduleKind}
                  onChange={(e) =>
                    setScheduleKind(
                      e.target.value as ScheduledTaskItem["scheduleKind"]
                    )
                  }
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3 py-2.5 font-medium text-[#101214] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
                >
                  <option value="ONE_TIME">One-Time</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-[#101214] mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3 py-2.5 font-medium text-[#101214] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#101214] mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3 py-2.5 font-medium text-[#101214] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
                />
              </div>
            </div>

            {category === "JOB_SYNC" && (
              <div>
                <label className="block font-semibold text-[#101214] mb-1.5">
                  Sync Sources
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "LINKEDIN", label: "LinkedIn" },
                    { id: "NAUKRI", label: "Naukri" },
                    { id: "CAREER_FEEDS", label: "Company Boards" },
                    { id: "PUBLIC_BOARDS", label: "Public APIs" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`rounded-full px-3 py-1 text-[11px] transition-all cursor-pointer ${
                        selectedPlatforms.includes(p.id)
                          ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                          : "bg-[#F4F5F0] text-[#4B5563] border border-black/[0.06] hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#101214] mb-1.5">
                Action Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Topics to cover, endpoints to test, or sync filters..."
                className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all px-4 py-2.5 font-heading text-xs cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5 text-[#E3FC6D]" />
              <span>{creating ? "Saving..." : "Add to Schedule"}</span>
            </button>
          </form>
        </section>

        {/* Right: Active Schedule Timeline */}
        <section className="lg:col-span-2 rounded-[22px] border border-black/[0.07] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.045)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3.5">
            <h2 className="font-heading text-lg font-bold text-[#101214]">
              Upcoming &amp; Automated Schedule ({filteredTasks.length})
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "JOB_SYNC", label: "Auto Sync" },
                  { id: "INTERVIEW_PREP", label: "Interview Prep" },
                  { id: "APPLICATION_FOLLOWUP", label: "Follow-Up" },
                  { id: "DEV_WORKFLOW", label: "Dev & Testing" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={`rounded-full px-3 py-1 font-heading text-[11px] transition-all cursor-pointer ${
                    activeFilter === f.id
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                      : "bg-[#F4F5F0] text-[#4B5563] border border-black/[0.06] hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-medium text-[#6B7280]">
              Loading your scheduled sync rules and reminders...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/[0.12] bg-[#FAFBF7] p-8 text-center space-y-2.5">
              <p className="font-heading text-sm font-bold text-[#101214]">
                No scheduled tasks yet in this view
              </p>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
                Click <strong className="text-[#101214]">Auto-Build Daily &amp; Prep Plan</strong> to automatically schedule daily LinkedIn/Naukri/board syncs plus interview prep reminders from your Preparation Plans.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const meta = CATEGORY_META[task.category];
                const CatIcon = meta.icon;
                const isDone = task.status === "COMPLETED";
                const isPaused = task.status === "PAUSED";
                const formattedDate = new Date(task.dueAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                );

                return (
                  <div
                    key={task.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
                      isDone
                        ? "border-black/[0.05] bg-[#FAFBF7] opacity-75"
                        : isPaused
                        ? "border-dashed border-black/[0.12] bg-[#FAFBF7]"
                        : "border-black/[0.07] bg-white hover:border-black/[0.12] hover:shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(task)}
                        aria-label={
                          isDone ? "Mark incomplete" : "Mark completed"
                        }
                        className="mt-0.5 text-[#101214] hover:scale-105 transition cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-[#059669]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#9CA3AF] hover:text-[#101214]" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-heading text-[10px] font-semibold ${meta.badgeClass}`}
                          >
                            <CatIcon className="h-3 w-3" />
                            <span>{meta.label}</span>
                          </span>
                          <span className="rounded-full border border-black/[0.06] bg-[#F4F5F0] px-2.5 py-0.5 text-[10px] font-medium text-[#4B5563]">
                            {task.scheduleKind}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4B5563]">
                            <Clock className="h-3 w-3 text-[#6B7280]" />
                            <span>
                              {formattedDate} · {task.timeLabel}
                            </span>
                          </span>
                        </div>

                        <p
                          className={`font-heading text-sm font-bold text-[#101214] ${
                            isDone ? "line-through text-[#6B7280]" : ""
                          }`}
                        >
                          {task.title}
                        </p>

                        {task.notes && (
                          <p className="text-xs text-[#6B7280] leading-relaxed">
                            {task.notes}
                          </p>
                        )}

                        {task.lastRunAt && (
                          <p className="text-[11px] font-medium text-[#059669]">
                            Last synced:{" "}
                            {new Date(task.lastRunAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-8 sm:pl-0">
                      {task.linkedUrl && (
                        <a
                          href={task.linkedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white hover:bg-[#F7F7F3] px-3 py-1 text-[11px] font-semibold text-[#101214] transition-colors"
                        >
                          <span>Role Link</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {task.isAutoSyncRule && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleTriggerRuleNow(task)}
                            disabled={runningTaskId === task.id}
                            className="inline-flex items-center gap-1 rounded-full bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] hover:bg-[#d7f54f] px-3 py-1 font-heading text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Play className="h-3 w-3" />
                            <span>
                              {runningTaskId === task.id ? "Running..." : "Run Now"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePauseRule(task)}
                            className="p-1.5 rounded-full border border-black/[0.08] bg-white hover:bg-[#F4F5F0] text-[#4B5563] hover:text-[#101214] transition-colors cursor-pointer"
                            title={isPaused ? "Resume schedule" : "Pause schedule"}
                          >
                            {isPaused ? (
                              <Play className="h-3.5 w-3.5" />
                            ) : (
                              <PauseCircle className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-full border border-transparent hover:border-[#FECDD3] hover:bg-[#FFF1F2] text-[#9CA3AF] hover:text-[#E11D48] transition-colors cursor-pointer"
                        aria-label="Delete scheduled item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
