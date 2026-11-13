import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import {
  DurableWorkerEngine,
  clearDurableDatabaseTasks,
} from "../lib/agent/durable-worker";

test("Priority 1 — Durable Worker Process-Restart Recovery Suite", async (t) => {
  await clearDurableDatabaseTasks();

  await t.test("Simulates process restart: Worker 2 recovers tasks enqueued and abandoned by Worker 1", async () => {
    // -----------------------------------------------------------------
    // PROCESS 1: Initial worker instance enqueues multiple tasks
    // -----------------------------------------------------------------
    const worker1 = new DurableWorkerEngine("worker-proc-1", 5000); // 5-second lease

    const taskA = await worker1.enqueue("ADAPTIVE_SEARCH", "user-recovery", {
      query: "Recovery Test Task A",
      mode: "DEMO",
    });

    const taskB = await worker1.enqueue("ADAPTIVE_SEARCH", "user-recovery", {
      query: "Recovery Test Task B",
      mode: "DEMO",
    });

    const taskC = await worker1.enqueue("OPPORTUNITY_REFRESH", "user-recovery", {
      target: "Recovery Test Task C",
    });

    assert.ok(taskA.id);
    assert.ok(taskB.id);
    assert.ok(taskC.id);

    // Worker 1 claims Task A and completes it
    const claimA = await worker1.claimNextTask();
    assert.ok(claimA);
    assert.equal(claimA.id, taskA.id);
    assert.equal(claimA.status, "RUNNING");
    assert.equal(claimA.leaseOwner, "worker-proc-1");

    await worker1.completeTask(taskA.id, "Task A completed before crash");

    const finishedA = await worker1.getTaskFromDb(taskA.id);
    assert.equal(finishedA?.status, "COMPLETED");

    // Worker 1 claims Task B, starts step 1, records checkpoint, and then 'CRASHES'
    const claimB = await worker1.claimNextTask();
    assert.ok(claimB);
    assert.equal(claimB.id, taskB.id);
    assert.equal(claimB.status, "RUNNING");
    assert.equal(claimB.leaseOwner, "worker-proc-1");

    // Persist checkpoint indicating Step 1 (Parse & Initial Plan) completed
    const checkpointData = {
      step1Completed: true,
      queryNormalized: "Recovery Test Task B",
      executedSteps: ["parse_intent", "initial_plan"],
      opportunitiesDiscovered: 3,
    };
    await worker1.heartbeat(taskB.id, 40, "Step 1: Initial Plan done", checkpointData);

    // -----------------------------------------------------------------
    // WORKER 1 PROCESS CRASH / TERMINATION SIMULATION
    // Simulate Worker 1 dying and its lease expiring
    // -----------------------------------------------------------------
    await prisma.durableTask.update({
      where: { id: taskB.id },
      data: {
        leaseExpiresAt: new Date(Date.now() - 10000), // Expired 10 seconds ago
      },
    });

    // Worker 1 instance is destroyed / discarded from memory
    // (Notice taskC was never claimed, still QUEUED)

    // -----------------------------------------------------------------
    // PROCESS 2: Fresh worker instance starts up with empty memory
    // -----------------------------------------------------------------
    const worker2 = new DurableWorkerEngine("worker-proc-2", 30000);

    // 1. Recover stale tasks abandoned by dead Worker 1
    const recovered = await worker2.recoverStaleTasks();
    assert.equal(recovered, 1);

    const reQueuedB = await worker2.getTaskFromDb(taskB.id);
    assert.equal(reQueuedB?.status, "QUEUED");
    assert.equal(reQueuedB?.leaseOwner, null);
    // Crucial check: Checkpoints from before the crash are preserved!
    assert.equal(reQueuedB?.checkpoints?.step1Completed, true);
    assert.deepEqual(reQueuedB?.checkpoints?.executedSteps, ["parse_intent", "initial_plan"]);

    // 2. Worker 2 claims recovered Task B
    const claimBWorker2 = await worker2.claimNextTask();
    assert.ok(claimBWorker2);
    assert.equal(claimBWorker2.id, taskB.id);
    assert.equal(claimBWorker2.leaseOwner, "worker-proc-2");

    // Worker 2 verifies that Step 1 is already completed in checkpoint and does NOT re-run it
    const priorCheckpoints = claimBWorker2.checkpoints || {};
    assert.equal(priorCheckpoints.step1Completed, true);

    // Worker 2 performs Step 2 (Search & Evaluation)
    await worker2.heartbeat(taskB.id, 80, "Step 2: Resumed from checkpoint, executed search", {
      ...priorCheckpoints,
      step2Completed: true,
      executedSteps: [...priorCheckpoints.executedSteps, "search_execution"],
    });

    // Worker 2 completes Task B
    await worker2.completeTask(taskB.id, "Task B completed successfully after recovery");
    const completedB = await worker2.getTaskFromDb(taskB.id);
    assert.equal(completedB?.status, "COMPLETED");
    assert.equal(completedB?.leaseOwner, null);

    // 3. Worker 2 claims Task C (which was queued before the crash) and finishes it
    const claimCWorker2 = await worker2.claimNextTask();
    assert.ok(claimCWorker2);
    assert.equal(claimCWorker2.id, taskC.id);
    assert.equal(claimCWorker2.leaseOwner, "worker-proc-2");

    await worker2.completeTask(taskC.id, "Task C completed by Worker 2");
    const completedC = await worker2.getTaskFromDb(taskC.id);
    assert.equal(completedC?.status, "COMPLETED");

    // 4. Confirm all user-recovery tasks are completed in database
    const allTasks = await worker2.listTasks("user-recovery");
    assert.equal(allTasks.length, 3);
    assert.ok(allTasks.every((t) => t.status === "COMPLETED"));
  });

  await t.test("Transactional idempotency: Repeated enqueuing does not create duplicate tasks", async () => {
    const worker = new DurableWorkerEngine("worker-idemp");
    const t1 = await worker.enqueue("ADAPTIVE_SEARCH", "user-idemp", { role: "ML Engineer" }, "fixed-key-42");
    const t2 = await worker.enqueue("ADAPTIVE_SEARCH", "user-idemp", { role: "ML Engineer" }, "fixed-key-42");

    assert.equal(t1.id, t2.id);

    const fromDb = await worker.getTaskFromDb(t1.id);
    assert.equal(fromDb?.id, t1.id);
  });
});
