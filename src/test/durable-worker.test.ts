import test from "node:test";
import assert from "node:assert/strict";
import {
  DurableWorkerEngine,
  calculateBackoffWithJitter,
  clearDurableTaskStore,
} from "../lib/agent/durable-worker";

test("DurableWorkerEngine — Resilient Background Execution & Leases Suite", async (t) => {
  clearDurableTaskStore();
  await t.test("1. Enqueues task and returns QUEUED state", async () => {
    const worker = new DurableWorkerEngine("test-worker-1");
    const task = await worker.enqueue("ADAPTIVE_SEARCH", "user-1", {
      query: "Research Fellow",
      mode: "DEMO",
    });

    assert.ok(task.id);
    assert.equal(task.status, "QUEUED");
    assert.equal(task.taskType, "ADAPTIVE_SEARCH");
    assert.equal(task.attemptCount, 0);
  });

  await t.test("2. Idempotency: Enqueueing identical payload returns existing task", async () => {
    const worker = new DurableWorkerEngine("test-worker-1");
    const task1 = await worker.enqueue(
      "OPPORTUNITY_REFRESH",
      "user-1",
      { target: "global" },
      "idemp-key-100"
    );
    const task2 = await worker.enqueue(
      "OPPORTUNITY_REFRESH",
      "user-1",
      { target: "global" },
      "idemp-key-100"
    );

    assert.equal(task1.id, task2.id);
  });

  await t.test("3. Claim next task assigns worker lease and transitions to RUNNING", async () => {
    const worker = new DurableWorkerEngine("worker-alpha");
    const task = await worker.enqueue("CLEANUP_EXPIRED", "user-1", { days: 30 });

    const claimed = await worker.claimNextTask();
    assert.ok(claimed);
    assert.equal(claimed.status, "RUNNING");
    assert.equal(claimed.leaseOwner, "worker-alpha");
    assert.equal(claimed.attemptCount, 1);
    assert.ok(claimed.leaseExpiresAt);
  });

  await t.test("4. Heartbeat updates progress and extends lease", async () => {
    const worker = new DurableWorkerEngine("worker-beta");
    const task = await worker.enqueue("VERIFY_ALL", "user-1", { batch: 20 });
    const claimed = await worker.claimNextTask();
    assert.ok(claimed);

    const initialExpiry = claimed.leaseExpiresAt?.getTime() || 0;
    const hbSuccess = await worker.heartbeat(claimed.id, 50, "Halfway done");
    assert.equal(hbSuccess, true);

    const updated = worker.getTask(claimed.id);
    assert.equal(updated?.progressPercent, 50);
    assert.equal(updated?.currentStep, "Halfway done");
    assert.ok((updated?.leaseExpiresAt?.getTime() || 0) >= initialExpiry);
  });

  await t.test("5. Completing task sets status to COMPLETED and releases lease", async () => {
    const worker = new DurableWorkerEngine("worker-gamma");
    const task = await worker.enqueue("ADAPTIVE_SEARCH", "user-1", { query: "AI" });
    const claimed = await worker.claimNextTask();
    assert.ok(claimed);

    await worker.completeTask(claimed.id, "Successfully discovered 15 listings");

    const completed = worker.getTask(claimed.id);
    assert.equal(completed?.status, "COMPLETED");
    assert.equal(completed?.progressPercent, 100);
    assert.equal(completed?.leaseOwner, null);
    assert.ok(completed?.completedAt);
  });

  await t.test("6. Failure schedules retry with exponential backoff and jitter", async () => {
    const worker = new DurableWorkerEngine("worker-delta");
    const task = await worker.enqueue("ADAPTIVE_SEARCH", "user-1", { query: "fail-test" });
    const claimed = await worker.claimNextTask();
    assert.ok(claimed);

    await worker.failTask(claimed.id, "Simulated network timeout");

    const retried = worker.getTask(claimed.id);
    assert.equal(retried?.status, "RETRY_SCHEDULED");
    assert.ok(retried?.nextRetryTime);
    assert.ok(retried.nextRetryTime.getTime() > Date.now());
  });

  await t.test("7. Exceeding maxAttempts moves task to FAILED dead letter state", async () => {
    clearDurableTaskStore();
    const worker = new DurableWorkerEngine("worker-dead-letter");
    const task = await worker.enqueue("ADAPTIVE_SEARCH", "user-1", { query: "dead-letter" });
    task.maxAttempts = 2;

    // Attempt 1
    const claim1 = await worker.claimNextTask();
    assert.ok(claim1);
    await worker.failTask(claim1.id, "Error 1");

    // Manually force nextRetryTime to now to allow claim 2
    task.nextRetryTime = new Date(Date.now() - 1000);

    // Attempt 2
    const claim2 = await worker.claimNextTask();
    assert.ok(claim2);
    await worker.failTask(claim2.id, "Error 2 (Permanent)");

    const finalTask = worker.getTask(task.id);
    assert.equal(finalTask?.status, "FAILED");
    assert.ok(finalTask?.failureReason?.includes("Permanent"));
  });

  await t.test("8. Recover stale tasks rescues expired lease from dead worker", async () => {
    const worker = new DurableWorkerEngine("worker-stale");
    const task = await worker.enqueue("ADAPTIVE_SEARCH", "user-1", { query: "stale-test" });
    const claimed = await worker.claimNextTask();
    assert.ok(claimed);

    // Simulate worker crashing by backdating lease expiry
    claimed.leaseExpiresAt = new Date(Date.now() - 5000);

    const recovered = await worker.recoverStaleTasks();
    assert.equal(recovered, 1);

    const rescued = worker.getTask(claimed.id);
    assert.equal(rescued?.status, "QUEUED");
    assert.equal(rescued?.leaseOwner, null);
  });

  await t.test("9. User can cancel an active task", async () => {
    const worker = new DurableWorkerEngine("worker-cancel");
    const task = await worker.enqueue("ADAPTIVE_SEARCH", "user-1", { query: "to-cancel" });

    const cancelled = await worker.cancelTask(task.id);
    assert.equal(cancelled, true);

    const record = worker.getTask(task.id);
    assert.equal(record?.status, "CANCELLED");
  });

  await t.test("10. calculateBackoffWithJitter produces bounded positive delay with jitter", () => {
    const d1 = calculateBackoffWithJitter(1);
    const d2 = calculateBackoffWithJitter(2);
    const d3 = calculateBackoffWithJitter(3);

    assert.ok(d1 >= 1000 && d1 <= 30000);
    assert.ok(d2 >= 2000 && d2 <= 30000);
    assert.ok(d3 >= 4000 && d3 <= 30000);
    assert.ok(d3 > d1);
  });
});
