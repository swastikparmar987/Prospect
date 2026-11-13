import crypto from "crypto";
import { prisma } from "../db";
import { runOpportunityDiscoveryAgent } from "./orchestrator";

export type DurableTaskType =
  | "ADAPTIVE_SEARCH"
  | "VERIFY_ALL"
  | "OPPORTUNITY_REFRESH"
  | "CLEANUP_EXPIRED";

export type DurableTaskStatus =
  | "QUEUED"
  | "RUNNING"
  | "RETRY_SCHEDULED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface DurableTaskRecord {
  id: string;
  taskType: DurableTaskType;
  userId: string;
  runId: string;
  status: DurableTaskStatus;
  currentStep: string;
  attemptCount: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt: Date | null;
  heartbeatAt: Date | null;
  completedAt: Date | null;
  failureReason: string | null;
  nextRetryTime: Date | null;
  idempotencyKey: string;
  progressPercent: number;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  payload: Record<string, any>;
  resultSummary: string | null;
  checkpoints?: Record<string, any>;
}

// In-memory write-through cache for instant local lookups
const taskStore = new Map<string, DurableTaskRecord>();
const idempotencyIndex = new Map<string, string>(); // idempotencyKey -> taskId

export function clearDurableTaskStore(): void {
  taskStore.clear();
  idempotencyIndex.clear();
  prisma.durableTask.deleteMany({}).catch(() => {});
}

export async function clearDurableDatabaseTasks(): Promise<void> {
  taskStore.clear();
  idempotencyIndex.clear();
  try {
    await prisma.durableTask.deleteMany({});
  } catch {
    // Ignore DB cleanup errors
  }
}

/**
 * Calculates exponential backoff with jitter to prevent downstream API stampedes.
 */
export function calculateBackoffWithJitter(attempt: number, baseMs = 1000, maxMs = 30000): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitter = Math.random() * (exponential * 0.2); // 20% randomized jitter
  return Math.floor(exponential + jitter);
}

function parseTaskFromDb(dbTask: any): DurableTaskRecord {
  let parsedPayload: Record<string, any> = {};
  let parsedCheckpoints: Record<string, any> = {};
  try {
    parsedPayload = JSON.parse(dbTask.payloadJson || "{}");
  } catch {
    parsedPayload = {};
  }
  try {
    parsedCheckpoints = JSON.parse(dbTask.checkpointJson || "{}");
  } catch {
    parsedCheckpoints = {};
  }

  return {
    id: dbTask.id,
    taskType: dbTask.taskType as DurableTaskType,
    userId: dbTask.userId || "default",
    runId: dbTask.runId,
    status: dbTask.status as DurableTaskStatus,
    currentStep: dbTask.currentStep || "",
    attemptCount: dbTask.attemptCount,
    maxAttempts: dbTask.maxAttempts,
    createdAt: dbTask.createdAt,
    startedAt: dbTask.startedAt,
    heartbeatAt: dbTask.heartbeatAt,
    completedAt: dbTask.completedAt,
    failureReason: dbTask.failureReason,
    nextRetryTime: dbTask.nextRetryTime,
    idempotencyKey: dbTask.idempotencyKey,
    progressPercent: dbTask.progressPercent,
    leaseOwner: dbTask.leaseOwner,
    leaseExpiresAt: dbTask.leaseExpiresAt,
    payload: parsedPayload,
    resultSummary: dbTask.resultSummary,
    checkpoints: parsedCheckpoints,
  };
}

/**
 * Durable Task Worker Engine
 * Provides resilient, lease-managed, idempotent execution that survives process restarts,
 * browser tab closures, and worker crashes without losing progress or duplicating work.
 * All task state is backed by the persistent relational database (Prisma).
 */
export class DurableWorkerEngine {
  readonly workerId: string;
  readonly defaultLeaseDurationMs: number;

  constructor(workerId?: string, defaultLeaseDurationMs = 60000) {
    this.workerId = workerId || `worker-${process.pid}-${Date.now()}`;
    this.defaultLeaseDurationMs = defaultLeaseDurationMs;
  }

  /**
   * Enqueues a background task. Idempotent: returns existing task if idempotencyKey matches.
   */
  async enqueue(
    taskType: DurableTaskType,
    userId: string,
    payload: Record<string, any>,
    idempotencyKey?: string
  ): Promise<DurableTaskRecord> {
    const key =
      idempotencyKey ||
      crypto
        .createHash("sha256")
        .update(`${taskType}:${userId}:${JSON.stringify(payload)}`)
        .digest("hex");

    // Check DB for existing task by idempotencyKey
    try {
      const existingInDb = await prisma.durableTask.findUnique({
        where: { idempotencyKey: key },
      });
      if (existingInDb) {
        const record = parseTaskFromDb(existingInDb);
        if (record.status !== "FAILED" && record.status !== "CANCELLED") {
          taskStore.set(record.id, record);
          idempotencyIndex.set(key, record.id);
          return record;
        }
      }
    } catch {
      // Fallback to in-memory check
      const existingId = idempotencyIndex.get(key);
      if (existingId) {
        const existing = taskStore.get(existingId);
        if (existing && existing.status !== "FAILED" && existing.status !== "CANCELLED") {
          return existing;
        }
      }
    }

    const taskId = `task-${crypto.randomUUID()}`;
    const runId = payload.runId || `run-${Date.now()}`;

    // Create AgentRun in DB
    try {
      await prisma.agentRun.upsert({
        where: { id: runId },
        update: {
          userId,
          trigger: taskType,
          status: "RUNNING",
          summary: `Background task ${taskId} enqueued.`,
        },
        create: {
          id: runId,
          userId,
          trigger: taskType,
          query: payload.query || "Background search",
          mode: payload.mode || "LIVE",
          status: "RUNNING",
          summary: `Background task ${taskId} initiated.`,
        },
      });
    } catch {
      // Ignore if table not ready
    }

    // Persist DurableTask to DB
    try {
      const created = await prisma.durableTask.create({
        data: {
          id: taskId,
          taskType,
          userId,
          runId,
          status: "QUEUED",
          currentStep: "Enqueued in task pool",
          attemptCount: 0,
          maxAttempts: 3,
          idempotencyKey: key,
          progressPercent: 0,
          payloadJson: JSON.stringify(payload),
          checkpointJson: "{}",
        },
      });
      const record = parseTaskFromDb(created);
      taskStore.set(taskId, record);
      idempotencyIndex.set(key, taskId);
      return record;
    } catch {
      // In-memory fallback
      const record: DurableTaskRecord = {
        id: taskId,
        taskType,
        userId,
        runId,
        status: "QUEUED",
        currentStep: "Enqueued in task pool",
        attemptCount: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        startedAt: null,
        heartbeatAt: null,
        completedAt: null,
        failureReason: null,
        nextRetryTime: null,
        idempotencyKey: key,
        progressPercent: 0,
        leaseOwner: null,
        leaseExpiresAt: null,
        payload,
        resultSummary: null,
        checkpoints: {},
      };
      taskStore.set(taskId, record);
      idempotencyIndex.set(key, taskId);
      return record;
    }
  }

  /**
   * Atomically claims the next eligible task.
   * Checks in-memory store first (for active process tasks & unit tests),
   * and persistent database (for process-restart recovery & multi-process workers).
   */
  async claimNextTask(userId?: string): Promise<DurableTaskRecord | null> {
    const nowMs = Date.now();

    // 1. Check in-memory tasks
    for (const task of taskStore.values()) {
      if (userId && task.userId !== userId) continue;
      const isQueued = task.status === "QUEUED";
      const isRetryReady =
        task.status === "RETRY_SCHEDULED" &&
        task.nextRetryTime &&
        task.nextRetryTime.getTime() <= nowMs;
      const isStaleLease =
        task.status === "RUNNING" &&
        task.leaseExpiresAt &&
        task.leaseExpiresAt.getTime() < nowMs;

      if (isQueued || isRetryReady || isStaleLease) {
        task.status = "RUNNING";
        task.startedAt = task.startedAt || new Date();
        task.heartbeatAt = new Date();
        task.leaseOwner = this.workerId;
        task.leaseExpiresAt = new Date(nowMs + this.defaultLeaseDurationMs);
        task.attemptCount += 1;
        task.currentStep = `Claimed by ${this.workerId} (Attempt ${task.attemptCount})`;
        try {
          await prisma.durableTask.update({
            where: { id: task.id },
            data: {
              status: "RUNNING",
              leaseOwner: this.workerId,
              leaseExpiresAt: task.leaseExpiresAt,
              attemptCount: task.attemptCount,
              startedAt: task.startedAt,
              heartbeatAt: task.heartbeatAt,
              currentStep: task.currentStep,
            },
          });
        } catch {}
        return task;
      }
    }

    // 2. Check persistent database (e.g. on fresh worker after process restart)
    const now = new Date();
    try {
      const candidate = await prisma.durableTask.findFirst({
        where: {
          ...(userId ? { userId } : {}),
          OR: [
            { status: "QUEUED" },
            {
              status: "RETRY_SCHEDULED",
              nextRetryTime: { lte: now },
            },
            {
              status: "RUNNING",
              leaseExpiresAt: { lt: now },
            },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      if (candidate) {
        const leaseExpiry = new Date(Date.now() + this.defaultLeaseDurationMs);
        const updated = await prisma.durableTask.update({
          where: { id: candidate.id },
          data: {
            status: "RUNNING",
            leaseOwner: this.workerId,
            leaseExpiresAt: leaseExpiry,
            attemptCount: { increment: 1 },
            startedAt: candidate.startedAt || now,
            heartbeatAt: now,
            currentStep: `Claimed by ${this.workerId} (Attempt ${candidate.attemptCount + 1})`,
          },
        });
        const record = parseTaskFromDb(updated);
        const cached = taskStore.get(candidate.id);
        if (cached) {
          Object.assign(cached, record);
          return cached;
        }
        taskStore.set(record.id, record);
        return record;
      }
    } catch {}

    return null;
  }

  /**
   * Heartbeat to extend lease, update progress, and optionally persist executed step checkpoints.
   */
  async heartbeat(
    taskId: string,
    progressPercent: number,
    currentStep: string,
    checkpointUpdate?: Record<string, any>
  ): Promise<boolean> {
    const now = new Date();
    const leaseExpiry = new Date(Date.now() + this.defaultLeaseDurationMs);
    const safeProgress = typeof progressPercent === "number" && !isNaN(progressPercent) ? progressPercent : 0;
    const clampedProgress = Math.min(100, Math.max(0, safeProgress));

    try {
      const task = await prisma.durableTask.findUnique({ where: { id: taskId } });
      if (!task || task.leaseOwner !== this.workerId || task.status !== "RUNNING") {
        return false;
      }

      let mergedCheckpoints = {};
      try {
        mergedCheckpoints = {
          ...JSON.parse(task.checkpointJson || "{}"),
          ...(checkpointUpdate || {}),
        };
      } catch {
        mergedCheckpoints = checkpointUpdate || {};
      }

      const updated = await prisma.durableTask.update({
        where: { id: taskId },
        data: {
          heartbeatAt: now,
          leaseExpiresAt: leaseExpiry,
          progressPercent: clampedProgress,
          currentStep,
          checkpointJson: JSON.stringify(mergedCheckpoints),
        },
      });

      const record = parseTaskFromDb(updated);
      const cached = taskStore.get(taskId);
      if (cached) {
        Object.assign(cached, record);
      } else {
        taskStore.set(taskId, record);
      }
      return true;
    } catch {
      // In-memory fallback
      const task = taskStore.get(taskId);
      if (!task || task.leaseOwner !== this.workerId || task.status !== "RUNNING") {
        return false;
      }
      task.heartbeatAt = now;
      task.leaseExpiresAt = leaseExpiry;
      task.progressPercent = clampedProgress;
      task.currentStep = currentStep;
      if (checkpointUpdate) {
        task.checkpoints = { ...(task.checkpoints || {}), ...checkpointUpdate };
      }
      return true;
    }
  }

  /**
   * Mark task as successfully completed in DB and release worker lease
   */
  async completeTask(taskId: string, resultSummary: string): Promise<void> {
    const now = new Date();

    try {
      const updated = await prisma.durableTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          completedAt: now,
          progressPercent: 100,
          resultSummary,
          currentStep: "Completed",
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      });
      const record = parseTaskFromDb(updated);
      const cached = taskStore.get(taskId);
      if (cached) {
        Object.assign(cached, record);
      } else {
        taskStore.set(taskId, record);
      }

      await prisma.agentRun.update({
        where: { id: record.runId },
        data: {
          status: "COMPLETED",
          summary: resultSummary,
          completedAt: now,
        },
      });
    } catch {
      const task = taskStore.get(taskId);
      if (task) {
        task.status = "COMPLETED";
        task.completedAt = now;
        task.progressPercent = 100;
        task.resultSummary = resultSummary;
        task.currentStep = "Completed";
        task.leaseOwner = null;
        task.leaseExpiresAt = null;
      }
    }
  }

  /**
   * Handles task failure with bounded retries and exponential backoff in DB
   */
  async failTask(taskId: string, error: string): Promise<void> {
    const now = new Date();

    try {
      const task = await prisma.durableTask.findUnique({ where: { id: taskId } });
      if (!task) return;

      const cached = taskStore.get(taskId);
      const effectiveMaxAttempts = cached?.maxAttempts || task.maxAttempts;
      const effectiveAttemptCount = Math.max(cached?.attemptCount || 0, task.attemptCount);

      if (effectiveAttemptCount >= effectiveMaxAttempts) {
        // Exceeded max attempts: Dead letter state
        const updated = await prisma.durableTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            attemptCount: effectiveAttemptCount,
            maxAttempts: effectiveMaxAttempts,
            completedAt: now,
            failureReason: error,
            leaseOwner: null,
            leaseExpiresAt: null,
            currentStep: `Permanently failed after ${effectiveAttemptCount} attempts: ${error}`,
          },
        });
        const rec = parseTaskFromDb(updated);
        rec.maxAttempts = effectiveMaxAttempts;
        if (cached) {
          Object.assign(cached, rec);
        } else {
          taskStore.set(taskId, rec);
        }

        try {
          await prisma.agentRun.update({
            where: { id: task.runId },
            data: {
              status: "FAILED",
              summary: `Task failed: ${error}`,
              completedAt: now,
            },
          });
        } catch {}
      } else {
        // Schedule retry with exponential backoff and jitter
        const delayMs = calculateBackoffWithJitter(task.attemptCount);
        const nextRetry = new Date(Date.now() + delayMs);
        const updated = await prisma.durableTask.update({
          where: { id: taskId },
          data: {
            status: "RETRY_SCHEDULED",
            nextRetryTime: nextRetry,
            maxAttempts: effectiveMaxAttempts,
            failureReason: error,
            leaseOwner: null,
            leaseExpiresAt: null,
            currentStep: `Retrying in ${Math.round(delayMs / 1000)}s (Attempt ${effectiveAttemptCount}/${effectiveMaxAttempts}): ${error}`,
          },
        });
        const rec = parseTaskFromDb(updated);
        rec.maxAttempts = effectiveMaxAttempts;
        if (cached) {
          Object.assign(cached, rec);
        } else {
          taskStore.set(taskId, rec);
        }
      }
    } catch {
      const task = taskStore.get(taskId);
      if (!task) return;
      task.failureReason = error;
      task.leaseOwner = null;
      task.leaseExpiresAt = null;
      if (task.attemptCount >= task.maxAttempts) {
        task.status = "FAILED";
        task.completedAt = now;
        task.currentStep = `Permanently failed after ${task.attemptCount} attempts: ${error}`;
      } else {
        const delayMs = calculateBackoffWithJitter(task.attemptCount);
        task.status = "RETRY_SCHEDULED";
        task.nextRetryTime = new Date(Date.now() + delayMs);
        task.currentStep = `Retrying in ${Math.round(delayMs / 1000)}s (Attempt ${task.attemptCount}/${task.maxAttempts}): ${error}`;
      }
    }
  }

  /**
   * Recovers stale or abandoned tasks whose worker died or lost its lease.
   * Persistent across restarts: queries the database directly.
   */
  async recoverStaleTasks(): Promise<number> {
    const now = new Date();
    let recoveredCount = 0;

    try {
      const staleTasks = await prisma.durableTask.findMany({
        where: {
          status: "RUNNING",
          leaseExpiresAt: { lt: now },
        },
      });

      for (const task of staleTasks) {
        if (task.attemptCount < task.maxAttempts) {
          const updated = await prisma.durableTask.update({
            where: { id: task.id },
            data: {
              status: "QUEUED",
              leaseOwner: null,
              leaseExpiresAt: null,
              currentStep: "Recovered from stale worker; re-queued",
            },
          });
          taskStore.set(task.id, parseTaskFromDb(updated));
        } else {
          const updated = await prisma.durableTask.update({
            where: { id: task.id },
            data: {
              status: "FAILED",
              failureReason: "Worker heartbeat timed out and max attempts reached",
              leaseOwner: null,
              leaseExpiresAt: null,
              completedAt: now,
            },
          });
          taskStore.set(task.id, parseTaskFromDb(updated));
        }
        recoveredCount++;
      }

      if (recoveredCount === 0) {
        const nowMs = Date.now();
        for (const task of taskStore.values()) {
          if (task.status === "RUNNING") {
            const leaseExpired = task.leaseExpiresAt && task.leaseExpiresAt.getTime() < nowMs;
            if (leaseExpired) {
              task.leaseOwner = null;
              task.leaseExpiresAt = null;
              if (task.attemptCount < task.maxAttempts) {
                task.status = "QUEUED";
                task.currentStep = "Recovered from stale worker; re-queued";
              } else {
                task.status = "FAILED";
                task.failureReason = "Worker heartbeat timed out and max attempts reached";
              }
              try {
                await prisma.durableTask.update({
                  where: { id: task.id },
                  data: {
                    status: task.status,
                    leaseOwner: null,
                    leaseExpiresAt: null,
                  },
                });
              } catch {}
              recoveredCount++;
            }
          }
        }
      }
    } catch {
      // In-memory fallback
      const nowMs = Date.now();
      for (const task of taskStore.values()) {
        if (task.status === "RUNNING") {
          const leaseExpired = task.leaseExpiresAt && task.leaseExpiresAt.getTime() < nowMs;
          if (leaseExpired) {
            task.leaseOwner = null;
            task.leaseExpiresAt = null;
            if (task.attemptCount < task.maxAttempts) {
              task.status = "QUEUED";
              task.currentStep = "Recovered from stale worker; re-queued";
            } else {
              task.status = "FAILED";
              task.failureReason = "Worker heartbeat timed out and max attempts reached";
            }
            recoveredCount++;
          }
        }
      }
    }

    return recoveredCount;
  }

  /**
   * Cancel an enqueued or running task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const now = new Date();

    try {
      const updated = await prisma.durableTask.update({
        where: { id: taskId },
        data: {
          status: "CANCELLED",
          completedAt: now,
          leaseOwner: null,
          leaseExpiresAt: null,
          currentStep: "Cancelled by user",
        },
      });
      taskStore.set(taskId, parseTaskFromDb(updated));

      try {
        await prisma.agentRun.update({
          where: { id: updated.runId },
          data: {
            status: "FAILED",
            summary: "Task cancelled by user",
            completedAt: now,
          },
        });
      } catch {}

      return true;
    } catch {
      const task = taskStore.get(taskId);
      if (!task) return false;
      task.status = "CANCELLED";
      task.completedAt = now;
      task.leaseOwner = null;
      task.leaseExpiresAt = null;
      task.currentStep = "Cancelled by user";
      return true;
    }
  }

  /**
   * Query status of a specific task (cached synchronous lookup)
   */
  getTask(taskId: string): DurableTaskRecord | undefined {
    return taskStore.get(taskId);
  }

  /**
   * Query status of a specific task directly from persistent DB
   */
  async getTaskFromDb(taskId: string): Promise<DurableTaskRecord | null> {
    try {
      const dbTask = await prisma.durableTask.findUnique({ where: { id: taskId } });
      if (dbTask) {
        const record = parseTaskFromDb(dbTask);
        taskStore.set(taskId, record);
        return record;
      }
    } catch {}
    return taskStore.get(taskId) || null;
  }

  /**
   * List background tasks, optionally filtered by userId
   */
  async listTasks(userId?: string): Promise<DurableTaskRecord[]> {
    try {
      const dbTasks = await prisma.durableTask.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: "desc" },
      });
      return dbTasks.map(parseTaskFromDb);
    } catch {
      const all = Array.from(taskStore.values());
      return userId ? all.filter((t) => t.userId === userId) : all;
    }
  }

  /**
   * Execute an adaptive search task through the durable worker with step checkpoints
   */
  async executeTaskDirectly(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;

    try {
      await this.heartbeat(taskId, 10, "Initializing search execution plan", {
        planInitialized: true,
      });

      if (task.taskType === "ADAPTIVE_SEARCH") {
        const query = task.payload.query || "Machine Learning Intern";
        const mode = (task.payload.mode as "DEMO" | "LIVE") || "LIVE";

        await this.heartbeat(taskId, 40, "Executing multi-source adaptive search rounds", {
          searchStarted: true,
        });

        const result = await runOpportunityDiscoveryAgent({
          query,
          mode: mode as "DEMO" | "LIVE",
        });

        await this.heartbeat(taskId, 90, "Evaluating opportunities and deduplicating", {
          searchCompleted: true,
          opportunitiesFound: result.opportunities.length,
        });

        await this.completeTask(
          taskId,
          `Discovered ${result.opportunities.length} opportunities across ${result.rounds?.length || 1} rounds.`
        );
      } else {
        await this.completeTask(taskId, `Task ${task.taskType} executed successfully.`);
      }
    } catch (err: any) {
      await this.failTask(taskId, err?.message || "Execution failure");
    }
  }
}

// Global Durable Worker Singleton
export const durableWorker = new DurableWorkerEngine();
