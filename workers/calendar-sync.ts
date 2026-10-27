import { prisma } from "@backend/lib/prisma";
import { performIncrementalSync } from "@backend/modules/integrations/google/google-incremental-sync.service";

async function main() {
  console.log("[CalendarSync] Running incremental synchronization across all active connections...");

  const activeConnections = await prisma.calendarConnection.findMany({
    where: {
      provider: "GOOGLE",
      status: "ACTIVE",
    },
  });

  if (activeConnections.length === 0) {
    console.log("[CalendarSync] No active Google Calendar connections found.");
    process.exit(0);
  }

  for (const conn of activeConnections) {
    console.log(`[CalendarSync] Syncing connection ${conn.id} (business: ${conn.businessId})...`);
    try {
      const result = await performIncrementalSync({
        connectionId: conn.id,
      });
      console.log(`[CalendarSync] Connection ${conn.id} synced:`, result);
    } catch (err) {
      console.error(`[CalendarSync] Connection ${conn.id} sync failed:`, err);
    }
  }

  console.log("[CalendarSync] All connections processed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[CalendarSync] Fatal error:", err);
  process.exit(1);
});
