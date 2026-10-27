import { runSyncWorkerCycle } from "@backend/modules/integrations/google/google-sync-worker.service";

let isRunning = true;

process.on("SIGINT", () => {
  console.log("\n[CalendarWorker] Received SIGINT. Shutting down gracefully...");
  isRunning = false;
});

process.on("SIGTERM", () => {
  console.log("\n[CalendarWorker] Received SIGTERM. Shutting down gracefully...");
  isRunning = false;
});

async function main() {
  console.log("[CalendarWorker] Starting durable outbox queue worker...");

  while (isRunning) {
    try {
      const processedCount = await runSyncWorkerCycle(10);
      if (processedCount > 0) {
        console.log(`[CalendarWorker] Processed ${processedCount} sync job(s).`);
      }
    } catch (err) {
      console.error("[CalendarWorker] Error running worker cycle:", err);
    }

    // Wait 5 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("[CalendarWorker] Worker exited.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[CalendarWorker] Fatal error:", err);
  process.exit(1);
});
