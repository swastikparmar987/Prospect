import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { loadActiveUserProfile } from "@/lib/agent/orchestrator";
import { runOpportunitySyncWorker } from "@/lib/sync/sync-worker";
import {
  getPersistentSchedulerState,
  runScheduledSyncIfDue,
} from "@/lib/sync/scheduler";
import { publishRealtimeEvent } from "@/lib/realtime/opportunity-events";

const CreateScheduleSchema = z.object({
  action: z.enum(["CREATE", "AUTO_GENERATE_DAILY_AND_PREP", "RUN_SYNC_NOW"]).optional(),
  title: z.string().trim().min(2).max(180).optional(),
  category: z
    .enum(["INTERVIEW_PREP", "JOB_SYNC", "APPLICATION_FOLLOWUP", "DEV_WORKFLOW"])
    .default("INTERVIEW_PREP"),
  scheduleKind: z.enum(["ONE_TIME", "DAILY", "WEEKLY"]).default("ONE_TIME"),
  dueAt: z.string().optional(),
  timeLabel: z.string().max(32).default("10:00"),
  notes: z.string().max(1500).default(""),
  linkedOpportunityId: z.string().optional(),
  linkedUrl: z.string().optional(),
  isAutoSyncRule: z.boolean().default(false),
  syncPlatforms: z.array(z.string()).default(["LINKEDIN", "NAUKRI", "CAREER_FEEDS", "PUBLIC_BOARDS"]),
  syncQuery: z.string().max(240).default(""),
});

const PatchScheduleSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "COMPLETED", "PAUSED"]).optional(),
  dueAt: z.string().optional(),
  timeLabel: z.string().optional(),
  notes: z.string().optional(),
  triggerNow: z.boolean().optional(),
});

function computeNextRunAt(scheduleKind: string, fromDate = new Date()): Date {
  const next = new Date(fromDate.getTime());
  if (scheduleKind === "WEEKLY") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function mapSyncPlatformsToProviders(
  platforms: string[]
): Array<"CAREER_FEEDS" | "FREEHIRE" | "PUBLIC_BOARDS" | "TAVILY"> {
  const set = new Set<"CAREER_FEEDS" | "FREEHIRE" | "PUBLIC_BOARDS" | "TAVILY">();
  for (const p of platforms) {
    const up = p.toUpperCase();
    if (up === "LINKEDIN" || up === "NAUKRI" || up === "TAVILY") set.add("TAVILY");
    else if (up === "CAREER_FEEDS" || up === "BOARDS") set.add("CAREER_FEEDS");
    else if (up === "PUBLIC_BOARDS" || up === "PUBLIC") set.add("PUBLIC_BOARDS");
    else if (up === "FREEHIRE") set.add("FREEHIRE");
  }
  if (set.size === 0) {
    return ["TAVILY", "CAREER_FEEDS", "PUBLIC_BOARDS"];
  }
  return Array.from(set);
}

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const now = new Date();

    const tasks = await prisma.scheduledTask.findMany({
      where: { userId: user.userId },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    });

    const [syncLedger, prepPlans, applications] = await Promise.all([
      getPersistentSchedulerState(15),
      prisma.preparationPlan.findMany({
        where: { userId: user.userId },
        include: { opportunity: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.application.findMany({
        where: { userId: user.userId },
        include: { opportunity: true },
        orderBy: { updatedAt: "desc" },
        take: 15,
      }),
    ]);

    return NextResponse.json({
      tasks: tasks.map((t) => ({
        ...t,
        syncPlatforms: JSON.parse(t.syncPlatformsJson || "[]"),
        dueAt: t.dueAt.toISOString(),
        lastRunAt: t.lastRunAt ? t.lastRunAt.toISOString() : null,
        nextRunAt: t.nextRunAt ? t.nextRunAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      syncLedger,
      prepPlansCount: prepPlans.length,
      prepPlansPreview: prepPlans.map((p) => ({
        id: p.id,
        title: p.title,
        opportunityId: p.opportunityId,
        opportunityTitle: p.opportunity.title,
        organization: p.opportunity.organization,
      })),
      upcomingApplications: applications.map((a) => ({
        id: a.id,
        stage: a.stage,
        title: a.opportunity.title,
        organization: a.opportunity.organization,
        targetDeadline: a.targetDeadline ? a.targetDeadline.toISOString() : null,
      })),
      serverTime: now.toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to load scheduler",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const parsed = CreateScheduleSchema.parse(body);

    if (parsed.action === "RUN_SYNC_NOW") {
      const providers = mapSyncPlatformsToProviders(parsed.syncPlatforms);
      const exec = await runScheduledSyncIfDue({
        providers,
        force: true,
      });
      publishRealtimeEvent(
        "SYNC_COMPLETED",
        `Scheduled multi-platform sync finished (${exec.syncResult?.itemsAdded ?? 0} new opportunities added).`,
        { itemsAdded: exec.syncResult?.itemsAdded ?? 0 }
      );
      return NextResponse.json({
        success: true,
        syncResult: exec.syncResult,
        scheduler: exec.schedulerState,
      });
    }

    if (parsed.action === "AUTO_GENERATE_DAILY_AND_PREP") {
      const profile = await loadActiveUserProfile(user.userId);
      const existing = await prisma.scheduledTask.findMany({
        where: { userId: user.userId },
      });
      const existingTitles = new Set(existing.map((x) => x.title.toLowerCase()));
      const created: any[] = [];

      const now = new Date();
      const tomorrowMorning = new Date(now);
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      tomorrowMorning.setHours(9, 30, 0, 0);

      // 1. Daily Multi-Platform Auto-Sync Schedule
      const syncTitle = "Daily Multi-Platform Job Sync (LinkedIn, Naukri & Boards)";
      if (!existingTitles.has(syncTitle.toLowerCase())) {
        const row = await prisma.scheduledTask.create({
          data: {
            userId: user.userId,
            title: syncTitle,
            category: "JOB_SYNC",
            scheduleKind: "DAILY",
            dueAt: tomorrowMorning,
            timeLabel: "09:30",
            notes: `Automatically refreshes LinkedIn (/jobs/view), Naukri (/job-listings), Greenhouse/Ashby/Lever boards, and public feeds near ${
              profile?.locationPreference?.city || profile?.location || "your resume location"
            }.`,
            status: "PENDING",
            isAutoSyncRule: true,
            syncPlatformsJson: JSON.stringify(["LINKEDIN", "NAUKRI", "CAREER_FEEDS", "PUBLIC_BOARDS"]),
            syncQuery: profile?.targetRoles?.[0] || "Machine Learning Intern",
            nextRunAt: tomorrowMorning,
          },
        });
        created.push(row);
      }

      // 2. Interview Preparation Reminders from active Prep Plans or top skills
      const prepPlans = await prisma.preparationPlan.findMany({
        where: { userId: user.userId },
        include: { opportunity: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      let offsetHours = 11;
      for (const plan of prepPlans) {
        const items: Array<{ gap?: string; concreteAction?: string; isCompleted?: boolean }> = JSON.parse(
          plan.items || "[]"
        );
        const firstPending = items.find((i) => !i.isCompleted) || items[0];
        const prepTitle = `Interview Prep: ${plan.opportunity.title} (${plan.opportunity.organization})`;
        if (!existingTitles.has(prepTitle.toLowerCase())) {
          const slot = new Date(tomorrowMorning);
          slot.setHours(offsetHours, 0, 0, 0);
          const row = await prisma.scheduledTask.create({
            data: {
              userId: user.userId,
              title: prepTitle.slice(0, 175),
              category: "INTERVIEW_PREP",
              scheduleKind: "ONE_TIME",
              dueAt: slot,
              timeLabel: `${String(offsetHours).padStart(2, "0")}:00`,
              notes:
                firstPending?.concreteAction ||
                `Complete STAR stories and role alignment review for ${plan.opportunity.title}.`,
              linkedOpportunityId: plan.opportunityId,
              linkedUrl: plan.opportunity.applyUrl,
              status: "PENDING",
            },
          });
          created.push(row);
          offsetHours = Math.min(20, offsetHours + 2);
        }
      }

      if (prepPlans.length === 0) {
        const defaultPrep = "Daily Coding & ML System Design Prep Block";
        if (!existingTitles.has(defaultPrep.toLowerCase())) {
          const slot = new Date(tomorrowMorning);
          slot.setHours(18, 0, 0, 0);
          const row = await prisma.scheduledTask.create({
            data: {
              userId: user.userId,
              title: defaultPrep,
              category: "INTERVIEW_PREP",
              scheduleKind: "DAILY",
              dueAt: slot,
              timeLabel: "18:00",
              notes:
                "Practice 2 DSA problems + review LLM/RAG/PyTorch project benchmarks for technical interviews.",
              status: "PENDING",
            },
          });
          created.push(row);
        }
      }

      // 3. Development & QA Verification Workflow Check
      const devTitle = "Review Sync Quality, Location Filtering & Application Pipeline";
      if (!existingTitles.has(devTitle.toLowerCase())) {
        const eveningSlot = new Date(tomorrowMorning);
        eveningSlot.setHours(20, 0, 0, 0);
        const row = await prisma.scheduledTask.create({
          data: {
            userId: user.userId,
            title: devTitle,
            category: "DEV_WORKFLOW",
            scheduleKind: "WEEKLY",
            dueAt: eveningSlot,
            timeLabel: "20:00",
            notes:
              "Verify LinkedIn/Naukri ingestion counts, test Vicinity vs Prompt search, and review Project Lab matches.",
            status: "PENDING",
          },
        });
        created.push(row);
      }

      return NextResponse.json({
        success: true,
        createdCount: created.length,
        message:
          created.length > 0
            ? `Generated ${created.length} automated sync & interview prep schedule item(s).`
            : "Automated daily sync and interview prep schedule is already active.",
      });
    }

    if (!parsed.title) {
      return NextResponse.json(
        { error: "Title is required when creating a scheduled task." },
        { status: 400 }
      );
    }

    const dueDate = parsed.dueAt ? new Date(parsed.dueAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const created = await prisma.scheduledTask.create({
      data: {
        userId: user.userId,
        title: parsed.title,
        category: parsed.category,
        scheduleKind: parsed.scheduleKind,
        dueAt: isNaN(dueDate.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : dueDate,
        timeLabel: parsed.timeLabel,
        notes: parsed.notes,
        linkedOpportunityId: parsed.linkedOpportunityId || null,
        linkedUrl: parsed.linkedUrl || "",
        status: "PENDING",
        isAutoSyncRule: parsed.isAutoSyncRule || parsed.category === "JOB_SYNC",
        syncPlatformsJson: JSON.stringify(parsed.syncPlatforms),
        syncQuery: parsed.syncQuery,
        nextRunAt:
          parsed.isAutoSyncRule || parsed.category === "JOB_SYNC"
            ? computeNextRunAt(parsed.scheduleKind)
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        ...created,
        syncPlatforms: JSON.parse(created.syncPlatformsJson || "[]"),
        dueAt: created.dueAt.toISOString(),
        lastRunAt: null,
        nextRunAt: created.nextRunAt ? created.nextRunAt.toISOString() : null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid schedule payload", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to save scheduled item",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const parsed = PatchScheduleSchema.parse(body);

    const existing = await prisma.scheduledTask.findFirst({
      where: { id: parsed.id, userId: user.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Scheduled item not found" }, { status: 404 });
    }

    let syncRunSummary: unknown = null;
    const now = new Date();
    const updateData: Record<string, any> = {};

    if (parsed.status) updateData.status = parsed.status;
    if (parsed.dueAt) {
      const d = new Date(parsed.dueAt);
      if (!isNaN(d.getTime())) updateData.dueAt = d;
    }
    if (parsed.timeLabel) updateData.timeLabel = parsed.timeLabel;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes;

    if (parsed.triggerNow) {
      const platforms: string[] = JSON.parse(existing.syncPlatformsJson || "[]");
      const providers = mapSyncPlatformsToProviders(platforms);
      const result = await runOpportunitySyncWorker({ providers });
      updateData.lastRunAt = now;
      updateData.nextRunAt = computeNextRunAt(existing.scheduleKind, now);
      syncRunSummary = {
        itemsFetched: result.itemsFetched,
        itemsAdded: result.itemsAdded,
        itemsUpdated: result.itemsUpdated,
        status: result.status,
      };
      publishRealtimeEvent(
        "SYNC_COMPLETED",
        `Scheduled rule "${existing.title}" synced ${result.itemsAdded} new opportunities.`,
        { itemsAdded: result.itemsAdded }
      );
    }

    const updated = await prisma.scheduledTask.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      task: {
        ...updated,
        syncPlatforms: JSON.parse(updated.syncPlatformsJson || "[]"),
        dueAt: updated.dueAt.toISOString(),
        lastRunAt: updated.lastRunAt ? updated.lastRunAt.toISOString() : null,
        nextRunAt: updated.nextRunAt ? updated.nextRunAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      syncRunSummary,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to update scheduled item",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing scheduled task id" }, { status: 400 });
    }

    const res = await prisma.scheduledTask.deleteMany({
      where: { id, userId: user.userId },
    });

    if (res.count === 0) {
      return NextResponse.json({ error: "Scheduled item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to delete scheduled item",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
