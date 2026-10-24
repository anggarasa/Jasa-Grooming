import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { IntegrationsClient } from "./IntegrationsClient";
import { GoogleIntegrationStatus } from "@/components/dashboard/integrations/GoogleIntegrationCard";

export const instant = false;

export const metadata: Metadata = {
  title: "Integrasi Eksternal - PawCare Grooming",
  description: "Kelola koneksi kalender dan integrasi pihak ketiga untuk PawCare Grooming.",
};

export default async function IntegrationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getPrimaryBusiness();
  const isOwner = user.role === "OWNER";

  const connection = await prisma.calendarConnection.findUnique({
    where: {
      businessId_provider: {
        businessId: business.id,
        provider: "GOOGLE",
      },
    },
    include: {
      syncState: true,
      webhookChannels: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let initialStatus: GoogleIntegrationStatus;

  if (!connection) {
    initialStatus = {
      isConfigured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      isEnabled: env.GOOGLE_CALENDAR_SYNC_ENABLED,
      status: "NOT_CONNECTED",
      isOwner,
      connectedAccount: null,
      selectedCalendar: null,
      error: null,
      googleAccountEmail: null,
      calendarId: null,
      calendarName: null,
      lastSyncAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
      metrics: {
        pendingJobs: 0,
        failedJobs: 0,
        pendingConflicts: 0,
      },
    };
  } else {
    const [pendingJobs, failedJobs, pendingConflicts] = await Promise.all([
      prisma.calendarSyncJob.count({
        where: {
          calendarConnectionId: connection.id,
          status: "PENDING",
        },
      }),
      prisma.calendarSyncJob.count({
        where: {
          calendarConnectionId: connection.id,
          status: { in: ["FAILED", "DEAD_LETTER"] },
        },
      }),
      prisma.calendarSyncConflict.count({
        where: {
          calendarConnectionId: connection.id,
          status: "PENDING",
        },
      }),
    ]);

    initialStatus = {
      isConfigured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      isEnabled: env.GOOGLE_CALENDAR_SYNC_ENABLED,
      status:
        connection.status === "ACTIVE"
          ? "CONNECTED"
          : connection.status === "DISCONNECTED"
          ? "NOT_CONNECTED"
          : connection.status,
      isOwner,
      connectedAccount: connection.googleAccountEmail,
      googleAccountEmail: connection.googleAccountEmail,
      selectedCalendar: connection.calendarId
        ? {
            id: connection.calendarId,
            name: connection.calendarName ?? "Kalender Terpilih",
            timeZone: connection.calendarTimezone ?? "Asia/Jakarta",
          }
        : null,
      calendarId: connection.calendarId,
      calendarName: connection.calendarName,
      calendarTimezone: connection.calendarTimezone,
      lastSyncAt: connection.lastSyncAt ? connection.lastSyncAt.toISOString() : null,
      lastErrorAt: connection.lastErrorAt ? connection.lastErrorAt.toISOString() : null,
      lastErrorMessage: connection.lastErrorMessage,
      error: connection.lastErrorMessage,
      metrics: {
        pendingJobs,
        failedJobs,
        pendingConflicts,
      },
    };
  }

  return <IntegrationsClient initialStatus={initialStatus} />;
}
