import { DurableWorkerEngine } from "../src/lib/agent/durable-worker";
import { prisma } from "../src/lib/db";

const args = process.argv.slice(2);
const action = args.find((a) => a.startsWith("--action="))?.split("=")[1];
const userId = args.find((a) => a.startsWith("--userId="))?.split("=")[1] || "user-multi-proc";
const workerId = args.find((a) => a.startsWith("--workerId="))?.split("=")[1] || `worker-${process.pid}`;

async function main() {
  if (action === "process-1") {
    // Process 1: Enqueue 3 tasks, complete Task A, checkpoint Task B, and hang for SIGKILL
    const worker = new DurableWorkerEngine(workerId, 1500); // 1.5s short lease

    const taskA = await worker.enqueue("ADAPTIVE_SEARCH", userId, { query: "Task A Query" }, `key-a-${userId}`);
    const taskB = await worker.enqueue("ADAPTIVE_SEARCH", userId, { query: "Task B Query" }, `key-b-${userId}`);
    const taskC = await worker.enqueue("OPPORTUNITY_REFRESH", userId, { query: "Task C Query" }, `key-c-${userId}`);

    // Claim and complete Task A
    const claimA = await worker.claimNextTask(userId);
    if (!claimA || claimA.id !== taskA.id) {
      console.error("FAIL: Did not claim Task A");
      process.exit(1);
    }
    await worker.completeTask(taskA.id, "Completed by OS Process 1");

    // Claim Task B, write checkpoint
    const claimB = await worker.claimNextTask(userId);
    if (!claimB || claimB.id !== taskB.id) {
      console.error("FAIL: Did not claim Task B");
      process.exit(1);
    }

    const checkpoint = {
      step1Completed: true,
      queryParsed: "Task B Query",
      executedSteps: ["parse_intent", "initial_plan"],
      discoveringCount: 4,
    };
    await worker.heartbeat(taskB.id, 45, "Step 1 complete: plan generated", checkpoint);

    // Notify parent process that checkpoint is written and Process 1 is ready to be SIGKILLed
    console.log(`READY_FOR_CRASH:${taskB.id}:${process.pid}`);

    // Sleep indefinitely until parent delivers SIGKILL
    setInterval(() => {}, 1000);
  } else if (action === "process-2") {
    // Process 2: Start fresh in a completely different OS process, recover stale tasks, finish B and C
    const worker = new DurableWorkerEngine(workerId, 5000);

    // 1. Recover stale tasks
    const recoveredCount = await worker.recoverStaleTasks();

    // 2. Claim Task B
    const claimB = await worker.claimNextTask(userId);
    if (!claimB) {
      console.error("FAIL_P2: Could not claim Task B");
      process.exit(1);
    }

    // Verify checkpoint survived process death
    const checkpoint = claimB.checkpoints;
    if (!checkpoint || !checkpoint.step1Completed) {
      console.error("FAIL_P2: Checkpoint was lost across process boundary");
      process.exit(1);
    }

    // Complete Task B without repeating Step 1
    await worker.completeTask(claimB.id, `Completed by OS Process 2 (resumed from step 1 checkpoint)`);

    // 3. Claim and complete Task C
    const claimC = await worker.claimNextTask(userId);
    if (!claimC) {
      console.error("FAIL_P2: Could not claim Task C");
      process.exit(1);
    }
    await worker.completeTask(claimC.id, `Completed by OS Process 2`);

    console.log(`RECOVERY_SUCCESS:${process.pid}:${recoveredCount}`);
    await prisma.$disconnect();
    process.exit(0);
  } else {
    console.error("Unknown action:", action);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Worker process error:", err);
  process.exit(1);
});
