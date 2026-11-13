import { prisma } from "../src/lib/db";
import { runScheduledSyncIfDue, getPersistentSchedulerState } from "../src/lib/sync/scheduler";

const args = process.argv.slice(2);
const force = args.includes("--force");
const statusOnly = args.includes("--status");

async function main() {
  if (statusOnly) {
    const state = await getPersistentSchedulerState();
    console.log(JSON.stringify(state, null, 2));
    await prisma.$disconnect();
    return;
  }

  const result = await runScheduledSyncIfDue({ force });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Persistent scheduler execution failed:", err);
  process.exit(1);
});
