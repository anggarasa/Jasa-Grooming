import { prisma } from "@/lib/prisma";
import { registerCalendarWatchChannel } from "@/modules/integrations/google/google-webhook.service";

async function main() {
  console.log("[RenewWatches] Checking push notification channels expiring in the next 24 hours...");

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const activeConnections = await prisma.calendarConnection.findMany({
    where: {
      provider: "GOOGLE",
      status: "ACTIVE",
    },
    include: {
      webhookChannels: {
        where: {
          status: "ACTIVE",
          expirationAt: { lte: tomorrow },
        },
      },
    },
  });

  for (const conn of activeConnections) {
    // If has expiring channel or no active channel at all
    const hasExpiring = conn.webhookChannels.length > 0;
    const totalActive = await prisma.calendarWebhookChannel.count({
      where: {
        calendarConnectionId: conn.id,
        status: "ACTIVE",
      },
    });

    if (hasExpiring || totalActive === 0) {
      console.log(`[RenewWatches] Registering renewed watch channel for connection ${conn.id}...`);
      try {
        const newChannel = await registerCalendarWatchChannel(conn.id);
        console.log(`[RenewWatches] Channel created successfully:`, newChannel?.channelId);
      } catch (err) {
        console.error(`[RenewWatches] Failed renewing channel for ${conn.id}:`, err);
      }
    }
  }

  console.log("[RenewWatches] Watch channel renewal completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[RenewWatches] Fatal error:", err);
  process.exit(1);
});
