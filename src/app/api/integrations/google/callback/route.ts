import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/modules/integrations/google/google-oauth.service";
import { registerCalendarWatchChannel } from "@/modules/integrations/google/google-webhook.service";
import { enqueueCalendarSyncJob } from "@/modules/integrations/google/google-sync-outbox.service";
import { runSyncWorkerCycle } from "@/modules/integrations/google/google-sync-worker.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const baseUrl = new URL(request.url).origin;
  const targetDashboard = `${baseUrl}/dashboard/settings/integrations`;

  if (errorParam) {
    console.error("[GoogleOAuthCallback] Google returned error:", errorParam);
    return NextResponse.redirect(`${targetDashboard}?error=${encodeURIComponent(errorParam)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${targetDashboard}?error=missing_code_or_state`);
  }

  try {
    const connection = await handleOAuthCallback({ code, state });

    // Try registering push notification watch channel
    try {
      await registerCalendarWatchChannel(connection.id);
    } catch (watchErr) {
      console.warn("[GoogleOAuthCallback] Watch registration deferred:", watchErr);
    }

    // Trigger initial full synchronization via outbox queue and process immediately
    try {
      await enqueueCalendarSyncJob(prisma, {
        businessId: connection.businessId,
        operationType: "FULL_SYNC",
      });
      await runSyncWorkerCycle(5);
    } catch (syncErr) {
      console.warn("[GoogleOAuthCallback] Initial sync enqueue/processing deferred:", syncErr);
    }

    return NextResponse.redirect(`${targetDashboard}?status=connected`);
  } catch (err: unknown) {
    console.error("[GoogleOAuthCallback] Error completing OAuth flow:", err);
    const msg = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(`${targetDashboard}?error=${encodeURIComponent(msg)}`);
  }
}
