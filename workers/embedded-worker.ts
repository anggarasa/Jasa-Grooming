import {
  runSyncWorkerCycle,
  recoverDeadlockedJobs,
} from "@backend/modules/integrations/google/google-sync-worker.service";

let isWorkerStarted = false;
let workerTimer: NodeJS.Timeout | null = null;

export function startEmbeddedCalendarWorker(intervalMs = 10000) {
  // Prevent duplicate worker instance during hot reload or multi-import
  if (isWorkerStarted) {
    return;
  }

  isWorkerStarted = true;
  console.log("[EmbeddedWorker] Background calendar sync worker initialized (interval: " + intervalMs + "ms).");

  let isCycleRunning = false;

  const runTick = async () => {
    if (isCycleRunning) {
      return;
    }
    isCycleRunning = true;

    try {
      await recoverDeadlockedJobs();
      const processedCount = await runSyncWorkerCycle(10);
      if (processedCount > 0) {
        console.log(`[EmbeddedWorker] Auto-processed ${processedCount} calendar sync job(s).`);
      }
    } catch (err) {
      console.error("[EmbeddedWorker] Error in sync worker cycle:", err);
    } finally {
      isCycleRunning = false;
    }
  };

  // Run first tick after 3 seconds
  setTimeout(() => {
    void runTick();
  }, 3000);

  // Set recurring interval
  workerTimer = setInterval(() => {
    void runTick();
  }, intervalMs);

  if (typeof workerTimer.unref === "function") {
    workerTimer.unref();
  }
}
