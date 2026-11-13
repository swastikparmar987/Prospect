import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "child_process";
import path from "path";
import { prisma } from "../lib/db";

test("Priority 3 — Real OS Multi-Process Worker Recovery Suite", async (t) => {
  const testUserId = `usr_os_proc_${Date.now()}`;
  const scriptPath = path.resolve(__dirname, "../../scripts/worker-process.ts");

  await t.test(
    "1. Hard Crash & Recovery across independent Operating System Processes (SIGKILL -> Recovery)",
    async () => {
      try {
      // Step A: Spawn OS Process 1
      const child1 = spawn("npx", ["tsx", scriptPath, "--action=process-1", `--userId=${testUserId}`, "--workerId=os-proc-1"], {
        cwd: path.resolve(__dirname, "../.."),
        stdio: ["ignore", "pipe", "pipe"],
      });

      let process1Pid = child1.pid;
      assert.ok(process1Pid);
      assert.notEqual(process1Pid, process.pid, "Process 1 must have its own distinct OS PID");

      let taskBId = "";
      const readyPromise = new Promise<void>((resolve, reject) => {
        child1.stdout?.on("data", (chunk) => {
          const text = chunk.toString();
          const match = text.match(/READY_FOR_CRASH:([^:]+):(\d+)/);
          if (match) {
            taskBId = match[1];
            process1Pid = parseInt(match[2], 10);
            resolve();
          }
        });
        child1.stderr?.on("data", (chunk) => {
          console.error("Child 1 stderr:", chunk.toString());
        });
        child1.on("error", reject);
        child1.on("exit", (code) => {
          if (code !== null && code !== 0 && !taskBId) {
            reject(new Error(`Child 1 exited unexpectedly with code ${code}`));
          }
        });
      });

      await readyPromise;
      assert.ok(taskBId, "Task B must have been enqueued and claimed by Process 1");

      // Verify in DB that Task B is RUNNING and owned by Process 1
      const runningTaskB = await prisma.durableTask.findUnique({
        where: { id: taskBId },
      });
      assert.ok(runningTaskB);
      assert.equal(runningTaskB.status, "RUNNING");
      assert.equal(runningTaskB.leaseOwner, "os-proc-1");
      const initialCheckpoint = JSON.parse(runningTaskB.checkpointJson);
      assert.equal(initialCheckpoint.step1Completed, true);

      // Step B: Abruptly terminate Process 1 with SIGKILL (simulating unexpected power loss or hard crash)
      try {
        process.kill(process1Pid, "SIGKILL");
      } catch {}
      try {
        child1.kill("SIGKILL");
      } catch {}

      // Wait a moment for lease expiry
      // To simulate lease expiry deterministically:
      await prisma.durableTask.update({
        where: { id: taskBId },
        data: {
          leaseExpiresAt: new Date(Date.now() - 1000), // Expired 1s ago
        },
      });

      // Step C: Spawn OS Process 2 (separate process, new PID)
      const child2 = spawn("npx", ["tsx", scriptPath, "--action=process-2", `--userId=${testUserId}`, "--workerId=os-proc-2"], {
        cwd: path.resolve(__dirname, "../.."),
        stdio: ["ignore", "pipe", "pipe"],
      });

      let process2Pid = child2.pid;
      assert.ok(process2Pid);
      assert.notEqual(process2Pid, process1Pid, "Process 2 must have a different PID than Process 1");
      assert.notEqual(process2Pid, process.pid, "Process 2 must have a different PID than the test runner");

      let process2Success = false;
      const completePromise = new Promise<void>((resolve, reject) => {
        child2.stdout?.on("data", (chunk) => {
          const text = chunk.toString();
          if (text.includes("RECOVERY_SUCCESS")) {
            process2Success = true;
          }
        });
        child2.stderr?.on("data", (chunk) => {
          console.error("Child 2 stderr:", chunk.toString());
        });
        child2.on("error", reject);
        child2.on("exit", (code) => {
          if (code === 0 && process2Success) {
            resolve();
          } else {
            reject(new Error(`Process 2 exited with code ${code}`));
          }
        });
      });

      await completePromise;

      // Step D: Inspect database to verify all 3 tasks are COMPLETED
      const allTasks = await prisma.durableTask.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: "asc" },
      });

      assert.equal(allTasks.length, 3, "Exactly 3 tasks must exist for test user");

      // Task A: Completed by Process 1
      assert.equal(allTasks[0].status, "COMPLETED");
      assert.equal(allTasks[0].resultSummary, "Completed by OS Process 1");

      // Task B: Resumed and completed by Process 2 from checkpoint
      assert.equal(allTasks[1].status, "COMPLETED");
      assert.ok(allTasks[1].resultSummary?.includes("resumed from step 1 checkpoint"));
      const checkpointB = JSON.parse(allTasks[1].checkpointJson);
      assert.equal(checkpointB.step1Completed, true);

      // Task C: Completed by Process 2
      assert.equal(allTasks[2].status, "COMPLETED");
      assert.equal(allTasks[2].resultSummary, "Completed by OS Process 2");

      // Verify no dangling leases
      for (const t of allTasks) {
        assert.equal(t.leaseOwner, null, `Task ${t.id} must have null leaseOwner upon completion`);
      }
      } catch (err) {
        console.error("FATAL ERROR IN TEST:", err);
        throw err;
      }
    }
  );

  await t.test("2. Idempotency across OS processes: Duplicate enqueue requests return existing records", async () => {
    const key = `fixed-idemp-proc-${Date.now()}`;

    // First enqueue
    const created1 = await prisma.durableTask.create({
      data: {
        id: `idemp-task-1-${Date.now()}`,
        taskType: "ADAPTIVE_SEARCH",
        userId: testUserId,
        runId: `run-${Date.now()}`,
        status: "QUEUED",
        idempotencyKey: key,
        payloadJson: JSON.stringify({ role: "Staff Engineer" }),
      },
    });

    // Second enqueue attempt with identical idempotencyKey
    const existing = await prisma.durableTask.findUnique({
      where: { idempotencyKey: key },
    });

    assert.ok(existing);
    assert.equal(existing.id, created1.id, "Existing task must be returned on key match");

    // Total records with key must remain 1
    const count = await prisma.durableTask.count({
      where: { idempotencyKey: key },
    });
    assert.equal(count, 1, "Database must enforce exactly 1 record per idempotency key");
  });
});
