import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getPersistentSchedulerState,
  runScheduledSyncIfDue,
} from "@/lib/sync/scheduler";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isCronTrigger =
      searchParams.get("cron") === "1" ||
      searchParams.get("cron") === "true" ||
      searchParams.get("checkSchedule") === "true";

    let scheduledExecution = null;
    if (isCronTrigger) {
      scheduledExecution = await runScheduledSyncIfDue({
        force: searchParams.get("force") === "true",
      });
    }

    const [schedulerState, latestLogs] = await Promise.all([
      getPersistentSchedulerState(),
      prisma.syncLog.findMany({
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      status: "HEALTHY",
      lastSyncAt: schedulerState.lastSyncAt,
      lastSuccessfulSyncAt: schedulerState.lastSuccessfulSyncAt,
      lastSyncStatus: schedulerState.lastSyncStatus,
      nextScheduledSyncAt: schedulerState.nextScheduledSyncAt,
      isDue: schedulerState.isDue,
      dueReason: schedulerState.dueReason,
      scheduler: schedulerState,
      scheduledExecution,
      counts: schedulerState.counts,
      recentRuns: latestLogs.map((log) => {
        let parsedMetrics: Record<string, any> = {};
        if (log.metricsJson) {
          try {
            parsedMetrics = JSON.parse(log.metricsJson);
          } catch {}
        }
        return {
          id: log.id,
          provider: log.provider,
          itemsFetched: log.itemsFetched,
          itemsAdded: log.itemsAdded,
          itemsUpdated: log.itemsUpdated,
          itemsExpired: log.itemsExpired,
          durationMs: log.durationMs,
          status: log.status,
          failedProviders: parsedMetrics.failedProviders || [],
          retryCount: parsedMetrics.retryCount || 0,
          startedAt: log.startedAt.toISOString(),
          completedAt: log.completedAt.toISOString(),
        };
      }),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to fetch sync status",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const providers = body.providers; // e.g. ["CAREER_FEEDS", "FREEHIRE"]
    const force = body.force !== undefined ? Boolean(body.force) : true;
    const maxBoards = typeof body.maxBoards === "number" ? body.maxBoards : undefined;
    const maxRetries = typeof body.maxRetries === "number" ? body.maxRetries : undefined;

    const execution = await runScheduledSyncIfDue({
      providers,
      force,
      maxBoards,
      maxRetries,
    });

    if (execution.syncResult) {
      return NextResponse.json({
        ...execution.syncResult,
        triggered: execution.triggered,
        reason: execution.reason,
        taskId: execution.taskId,
        scheduler: execution.schedulerState,
      });
    }

    return NextResponse.json({
      triggered: execution.triggered,
      reason: execution.reason,
      scheduler: execution.schedulerState,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Synchronization worker failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
