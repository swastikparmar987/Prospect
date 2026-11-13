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
    badgeClass: "bg-[#E0FB66] text-[#080808] border-[#080808]",
    icon: RefreshCw,
  },
  INTERVIEW_PREP: {
    label: "Interview Prep",
    badgeClass: "bg-[#FEF189] text-[#080808] border-[#080808]",
    icon: BookOpen,
  },
  APPLICATION_FOLLOWUP: {
    label: "Follow-Up",
    badgeClass: "bg-[#C4E7FF] text-[#080808] border-[#080808]",
    icon: Briefcase,
  },
  DEV_WORKFLOW: {
    label: "Testing & Dev",
    badgeClass: "bg-white text-[#080808] border-[#080808]",
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <section className="rounded-3xl border-2 border-[#080808] bg-white p-6 shadow-[4px_4px_0px_#080808]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-1 text-xs font-extrabold text-[#080808]">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Automated Sync &amp; Prep Scheduler</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808]">
              Daily Job Syncs &amp; Interview Preparation Scheduler
            </h1>
            <p className="text-sm text-[#555555] max-w-2xl">
              Automate multi-platform job ingestion (LinkedIn, Naukri, Company Boards, Public APIs), schedule focused interview preparation slots from your Prep Plans, and track testing &amp; workflow tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleAutoBuild}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-[#FEF189] hover:bg-[#fde95e] px-4 py-2 font-heading text-xs font-extrabold text-[#080808] shadow-[3px_3px_0px_#080808] cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>Auto-Build Daily &amp; Prep Plan</span>
            </button>

            <button
              type="button"
              onClick={handleRunGlobalSync}
              disabled={runningGlobalSync}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#d5f54e] px-4 py-2 font-heading text-xs font-extrabold text-[#080808] shadow-[3px_3px_0px_#080808] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${runningGlobalSync ? "animate-spin" : ""}`}
              />
              <span>{runningGlobalSync ? "Syncing..." : "Run Sync Now"}</span>
            </button>
          </div>
        </div>

        {/* Live Background Ledger Summary */}
        {syncLedger && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#D8D5CE] text-xs">
            <div className="rounded-xl border border-[#080808] bg-[#FDF9F3] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-[#666666]">
                Background Interval
              </p>
              <p className="font-heading text-sm font-extrabold text-[#080808] flex items-center gap-1 mt-0.5">
                <Radio className="h-3.5 w-3.5 text-emerald-600" />
                <span>Every {syncLedger.intervalMinutes} mins</span>
              </p>
            </div>
            <div className="rounded-xl border border-[#080808] bg-[#FDF9F3] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-[#666666]">
                Last Sync Status
              </p>
              <p className="font-heading text-sm font-extrabold text-[#080808] mt-0.5">
                {syncLedger.lastSyncStatus || "READY"}
              </p>
            </div>
            <div className="rounded-xl border border-[#080808] bg-[#FDF9F3] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-[#666666]">
                Active Jobs Indexed
              </p>
              <p className="font-heading text-sm font-extrabold text-[#080808] mt-0.5">
                {(syncLedger.counts?.totalActive ?? 0).toLocaleString()} live
              </p>
            </div>
            <div className="rounded-xl border border-[#080808] bg-[#FDF9F3] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-[#666666]">
                Scheduled Rules / Tasks
              </p>
              <p className="font-heading text-sm font-extrabold text-[#080808] mt-0.5">
                {tasks.filter((t) => t.status !== "COMPLETED").length} pending ·{" "}
                {autoSyncRules.length} sync rules
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add New Scheduled Sync / Prep / Workflow Task */}
        <section className="rounded-3xl border-2 border-[#080808] bg-white p-5 shadow-[4px_4px_0px_#080808] h-fit space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-[#080808] flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Schedule Reminder or Auto-Sync</span>
          </h2>

          <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#080808] mb-1">
                Task / Reminder Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Daily ML Intern Sync (LinkedIn + Naukri)"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs font-medium text-[#080808] outline-none focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-[#080808] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ScheduledTaskItem["category"])
                  }
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-2.5 py-2 font-bold text-[#080808] outline-none"
                >
                  <option value="INTERVIEW_PREP">Interview Prep</option>
                  <option value="JOB_SYNC">Automated Job Sync</option>
                  <option value="APPLICATION_FOLLOWUP">Follow-Up</option>
                  <option value="DEV_WORKFLOW">Testing &amp; Dev</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#080808] mb-1">
                  Frequency
                </label>
                <select
                  value={scheduleKind}
                  onChange={(e) =>
                    setScheduleKind(
                      e.target.value as ScheduledTaskItem["scheduleKind"]
                    )
                  }
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-2.5 py-2 font-bold text-[#080808] outline-none"
                >
                  <option value="ONE_TIME">One-Time</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-[#080808] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-2.5 py-2 font-medium text-[#080808] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#080808] mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-2.5 py-2 font-medium text-[#080808] outline-none"
                />
              </div>
            </div>

            {category === "JOB_SYNC" && (
              <div>
                <label className="block font-bold text-[#080808] mb-1.5">
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
                      className={`rounded-full border border-[#080808] px-2.5 py-1 text-[10px] font-bold cursor-pointer ${
                        selectedPlatforms.includes(p.id)
                          ? "bg-[#E0FB66] text-[#080808]"
                          : "bg-white text-[#666666]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#080808] mb-1">
                Action Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Topics to cover, endpoints to test, or sync filters..."
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs text-[#080808] outline-none focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] px-4 py-2.5 font-heading text-xs font-extrabold text-[#080808] shadow-[3px_3px_0px_#080808] cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{creating ? "Saving..." : "Add to Schedule"}</span>
            </button>
          </form>
        </section>

        {/* Right: Active Schedule Timeline */}
        <section className="lg:col-span-2 rounded-3xl border-2 border-[#080808] bg-white p-5 shadow-[4px_4px_0px_#080808] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D5CE] pb-3">
            <h2 className="font-heading text-lg font-extrabold text-[#080808]">
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
                  className={`rounded-full border border-[#080808] px-3 py-1 font-heading text-[11px] font-bold cursor-pointer ${
                    activeFilter === f.id
                      ? "bg-[#E0FB66] text-[#080808]"
                      : "bg-[#FDF9F3] text-[#080808] hover:bg-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs font-bold text-[#666666]">
              Loading your scheduled sync rules and reminders...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#D8D5CE] bg-[#FDF9F3] p-8 text-center space-y-3">
              <p className="font-heading text-sm font-extrabold text-[#080808]">
                No scheduled tasks yet in this view
              </p>
              <p className="text-xs text-[#666666] max-w-md mx-auto">
                Click <strong>Auto-Build Daily &amp; Prep Plan</strong> to automatically schedule daily LinkedIn/Naukri/board syncs plus interview prep reminders from your Preparation Plans.
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
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-[#080808] px-4 py-3 transition ${
                      isDone
                        ? "bg-[#FDF9F3]/60 opacity-75"
                        : isPaused
                        ? "bg-[#FDF9F3] border-dashed"
                        : "bg-white shadow-[2px_2px_0px_#080808]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(task)}
                        aria-label={
                          isDone ? "Mark incomplete" : "Mark completed"
                        }
                        className="mt-0.5 text-[#080808] hover:scale-105 transition cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#080808]" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-heading text-[10px] font-extrabold ${meta.badgeClass}`}
                          >
                            <CatIcon className="h-3 w-3" />
                            <span>{meta.label}</span>
                          </span>
                          <span className="rounded-full border border-[#D8D5CE] bg-[#FDF9F3] px-2 py-0.5 text-[10px] font-bold text-[#555555]">
                            {task.scheduleKind}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#080808]">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formattedDate} · {task.timeLabel}
                            </span>
                          </span>
                        </div>

                        <p
                          className={`font-heading text-sm font-extrabold text-[#080808] ${
                            isDone ? "line-through text-[#666666]" : ""
                          }`}
                        >
                          {task.title}
                        </p>

                        {task.notes && (
                          <p className="text-xs text-[#555555] leading-relaxed">
                            {task.notes}
                          </p>
                        )}

                        {task.lastRunAt && (
                          <p className="text-[10px] font-bold text-emerald-700">
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
                          className="inline-flex items-center gap-1 rounded-full border border-[#080808] bg-[#FDF9F3] hover:bg-[#FEF189] px-2.5 py-1 text-[10px] font-bold text-[#080808]"
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
                            className="inline-flex items-center gap-1 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] px-2.5 py-1 font-heading text-[10px] font-extrabold text-[#080808] cursor-pointer disabled:opacity-50"
                          >
                            <Play className="h-3 w-3" />
                            <span>
                              {runningTaskId === task.id ? "Running..." : "Run Now"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePauseRule(task)}
                            className="p-1.5 rounded-full border border-[#080808] bg-white hover:bg-[#FDF9F3] text-[#080808] cursor-pointer"
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
                        className="p-1.5 rounded-full border border-transparent hover:border-red-600 hover:bg-red-50 text-[#777777] hover:text-red-700 cursor-pointer"
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
