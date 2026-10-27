import { prisma } from "@backend/lib/prisma";
import { performIncrementalSync } from "@backend/modules/integrations/google/google-incremental-sync.service";
import { recoverDeadlockedJobs } from "@backend/modules/integrations/google/google-sync-worker.service";

async function main() {
  console.log("[CalendarReconcile] Starting reconciliation and deadlock recovery...");

  const recoveredCount = await recoverDeadlockedJobs();
  if (recoveredCount > 0) {
    console.log(`[CalendarReconcile] Recovered ${recoveredCount} deadlocked job(s).`);
  }

  const activeConnections = await prisma.calendarConnection.findMany({
    where: {
      provider: "GOOGLE",
      status: "ACTIVE",
    },
  });

  for (const conn of activeConnections) {
    console.log(`[CalendarReconcile] Reconciling connection ${conn.id}...`);
    try {
      const result = await performIncrementalSync({
        connectionId: conn.id,
        forceFullSync: true,
      });
      console.log(`[CalendarReconcile] Reconciled connection ${conn.id}:`, result);
    } catch (err) {
      console.error(`[CalendarReconcile] Failed reconciling connection ${conn.id}:`, err);
    }
  }

  console.log("[CalendarReconcile] Reconciliation finished.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[CalendarReconcile] Fatal error:", err);
  process.exit(1);
});
