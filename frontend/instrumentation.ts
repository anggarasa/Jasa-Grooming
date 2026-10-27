export async function register() {
  // Hanya jalankan background worker pada server-side runtime (Node.js environment)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startEmbeddedCalendarWorker } = await import("@backend/workers/embedded-worker");
      startEmbeddedCalendarWorker(10000);
    } catch (err) {
      console.error("[Instrumentation] Failed to start embedded calendar worker:", err);
    }
  }
}
