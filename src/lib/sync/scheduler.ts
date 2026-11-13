import { prisma } from "../db";
import { durableWorker } from "../agent/durable-worker";
import {
  runOpportunitySyncWorker,
  SyncWorkerOptions,
  SyncWorkerResult,
} from "./sync-worker";

export const DEFAULT_SYNC_INTERVAL_MINUTES = Number(
  process.env.PROSPECT_SYNC_INTERVAL_MINUTES || 15
);

export interface PersistentSchedulerState {
  schedulerType: "PERSISTENT_DATABASE_LEDGER";
  intervalMinutes: number;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastSyncStatus: "SUCCESS" | "PARTIAL" | "FAILED" | "NEVER_RUN";
  nextScheduledSyncAt: string;
  isDue: boolean;
  dueReason: string | null;
  retryTask: {
    taskId: string;
    status: string;
    attemptCount: number;
    maxAttempts: number;
    nextRetryTime: string | null;
    failureReason: string | null;
  } | null;
  lastRunMetrics: {
    itemsFetched: number;
    itemsAdded: number;
    itemsUpdated: number;
    itemsExpired: number;
    durationMs: number;
    failedProviders: string[];
    providerStatuses: Record<string, string>;
    retryCount: number;
  } | null;
  counts: {
    totalOpportunities: number;
    totalActive: number;
    totalExpired: number;
    totalSyncRuns: number;
  };
}

export interface ScheduledSyncExecutionResult {
  triggered: boolean;
  reason: string;
  taskId?: string;
  syncResult?: SyncWorkerResult;
  schedulerState: PersistentSchedulerState;
}

/**
 * Inspects the persistent database (`SyncLog` + `DurableTask`) to compute the
 * true schedule state across server restarts without relying on any in-memory timer.
 */
export async function getPersistentSchedulerState(
  intervalMinutes = DEFAULT_SYNC_INTERVAL_MINUTES,
  now = new Date()
): Promise<PersistentSchedulerState> {
  const safeIntervalMinutes = Math.max(1, intervalMinutes);
  const intervalMs = safeIntervalMinutes * 60 * 1000;

  const [
    latestLog,
    latestSuccessLog,
    totalSyncRuns,
    totalOpportunities,
    totalActive,
    totalExpired,
    latestRefreshTask,
  ] = await Promise.all([
    prisma.syncLog.findFirst({ orderBy: { completedAt: "desc" } }),
    prisma.syncLog.findFirst({
      where: { status: { in: ["SUCCESS", "PARTIAL"] } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.syncLog.count(),
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { isExpired: false } }),
    prisma.opportunity.count({ where: { isExpired: true } }),
    prisma.durableTask.findFirst({
      where: { taskType: "OPPORTUNITY_REFRESH" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const lastSyncAt = latestLog ? latestLog.completedAt.toISOString() : null;
  const lastSuccessfulSyncAt = latestSuccessLog
    ? latestSuccessLog.completedAt.toISOString()
    : null;
  const lastSyncStatus = latestLog
    ? (latestLog.status as "SUCCESS" | "PARTIAL" | "FAILED")
    : "NEVER_RUN";

  let nextScheduledTimeMs = now.getTime();
  let isDue = false;
  let dueReason: string | null = null;

  if (
    latestRefreshTask &&
    latestRefreshTask.status === "RETRY_SCHEDULED" &&
    latestRefreshTask.nextRetryTime
  ) {
    nextScheduledTimeMs = latestRefreshTask.nextRetryTime.getTime();
    if (now.getTime() >= nextScheduledTimeMs) {
      isDue = true;
      dueReason = `Retry attempt ${latestRefreshTask.attemptCount + 1}/${latestRefreshTask.maxAttempts} is due after previous failure.`;
    }
  } else if (!latestSuccessLog) {
    nextScheduledTimeMs = now.getTime();
    isDue = true;
    dueReason = "No successful background synchronization recorded yet.";
  } else {
    nextScheduledTimeMs = latestSuccessLog.completedAt.getTime() + intervalMs;
    if (now.getTime() >= nextScheduledTimeMs) {
      isDue = true;
      dueReason = `Scheduled sync interval (${safeIntervalMinutes} min) has elapsed since ${latestSuccessLog.completedAt.toISOString()}.`;
    }
  }

  let parsedMetrics: Record<string, any> = {};
  if (latestLog?.metricsJson) {
    try {
      parsedMetrics = JSON.parse(latestLog.metricsJson);
    } catch {
      parsedMetrics = {};
    }
  }

  const lastRunMetrics = latestLog
    ? {
        itemsFetched: latestLog.itemsFetched,
        itemsAdded: latestLog.itemsAdded,
        itemsUpdated: latestLog.itemsUpdated,
        itemsExpired: latestLog.itemsExpired,
        durationMs: latestLog.durationMs,
        failedProviders: Array.isArray(parsedMetrics.failedProviders)
          ? parsedMetrics.failedProviders
          : [],
        providerStatuses:
          parsedMetrics.providerStatuses && typeof parsedMetrics.providerStatuses === "object"
            ? parsedMetrics.providerStatuses
            : {},
        retryCount: typeof parsedMetrics.retryCount === "number" ? parsedMetrics.retryCount : 0,
      }
    : null;

  const retryTask =
    latestRefreshTask &&
    (latestRefreshTask.status === "RETRY_SCHEDULED" ||
      latestRefreshTask.status === "RUNNING" ||
      latestRefreshTask.status === "FAILED")
      ? {
          taskId: latestRefreshTask.id,
          status: latestRefreshTask.status,
          attemptCount: latestRefreshTask.attemptCount,
          maxAttempts: latestRefreshTask.maxAttempts,
          nextRetryTime: latestRefreshTask.nextRetryTime
            ? latestRefreshTask.nextRetryTime.toISOString()
            : null,
          failureReason: latestRefreshTask.failureReason || null,
        }
      : null;

  return {
    schedulerType: "PERSISTENT_DATABASE_LEDGER",
    intervalMinutes: safeIntervalMinutes,
    lastSyncAt,
    lastSuccessfulSyncAt,
    lastSyncStatus,
    nextScheduledSyncAt: new Date(nextScheduledTimeMs).toISOString(),
    isDue,
    dueReason,
    retryTask,
    lastRunMetrics,
    counts: {
      totalOpportunities,
      totalActive,
      totalExpired,
      totalSyncRuns,
    },
  };
}

/**
 * Checks the persistent database schedule and executes `runOpportunitySyncWorker`
 * through a durable database-leased task when due or when `force` is true.
 */
export async function runScheduledSyncIfDue(
  options: SyncWorkerOptions & {
    force?: boolean;
    intervalMinutes?: number;
    now?: Date;
  } = {}
): Promise<ScheduledSyncExecutionResult> {
  const now = options.now || new Date();
  const intervalMinutes = options.intervalMinutes ?? DEFAULT_SYNC_INTERVAL_MINUTES;

  // 1. Recover any stale leases from crashed worker processes
  await durableWorker.recoverStaleTasks();

  // 2. Evaluate persistent schedule state
  const preState = await getPersistentSchedulerState(intervalMinutes, now);

  if (!options.force && !preState.isDue) {
    return {
      triggered: false,
      reason: `Sync not yet due. Next scheduled sync at ${preState.nextScheduledSyncAt}.`,
      schedulerState: preState,
    };
  }

  const triggerReason = options.force
    ? "Explicit manual or cron sync trigger"
    : preState.dueReason || "Scheduled interval elapsed";

  // 3. Claim an existing RETRY_SCHEDULED task or enqueue a new persistent OPPORTUNITY_REFRESH task
  const bucketKey = options.force
    ? `sync-manual-${Date.now()}`
    : `sync-window-${Math.floor(now.getTime() / (intervalMinutes * 60 * 1000))}`;

  let claimedTask = await durableWorker.claimNextTask("scheduler");
  if (!claimedTask || claimedTask.taskType !== "OPPORTUNITY_REFRESH") {
    const enqueued = await durableWorker.enqueue(
      "OPPORTUNITY_REFRESH",
      "scheduler",
      {
        triggerReason,
        providers: options.providers || ["CAREER_FEEDS", "FREEHIRE"],
      },
      bucketKey
    );
    claimedTask = (await durableWorker.claimNextTask("scheduler")) || enqueued;
  }

  await durableWorker.heartbeat(
    claimedTask.id,
    25,
    `Running opportunity sync (${triggerReason})`,
    { startedAt: now.toISOString(), triggerReason }
  );

  // 4. Execute real opportunity synchronization worker
  const syncResult = await runOpportunitySyncWorker(options);

  if (syncResult.status === "FAILED") {
    const failMsg =
      syncResult.errors.length > 0
        ? syncResult.errors.slice(0, 3).join("; ")
        : "All configured sync providers failed";
    await durableWorker.failTask(claimedTask.id, failMsg);
  } else {
    await durableWorker.completeTask(
      claimedTask.id,
      `Synced ${syncResult.itemsFetched} items (${syncResult.itemsAdded} added, ${syncResult.itemsUpdated} updated, ${syncResult.itemsExpired} expired).`
    );
  }

  const postState = await getPersistentSchedulerState(intervalMinutes, new Date());

  return {
    triggered: true,
    reason: triggerReason,
    taskId: claimedTask.id,
    syncResult,
    schedulerState: postState,
  };
}
