import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { prisma } from "@/lib/prisma";
import { SyncMonitoringClient } from "./SyncMonitoringClient";

export const instant = false;

export const metadata: Metadata = {
  title: "Monitoring Sinkronisasi Google Calendar - PawCare Grooming",
  description: "Pantau antrean outbox worker dan rekonsiliasi konflik sinkronisasi Google Calendar.",
};

export default async function GoogleCalendarMonitoringPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getPrimaryBusiness();

  const connection = await prisma.calendarConnection.findUnique({
    where: {
      businessId_provider: {
        businessId: business.id,
        provider: "GOOGLE",
      },
    },
  });

  const connectionId = connection?.id;

  const [pendingJobs, failedJobs, pendingConflicts] = await Promise.all([
    connectionId
      ? prisma.calendarSyncJob.count({
          where: {
            calendarConnectionId: connectionId,
            status: "PENDING",
          },
        })
      : 0,
    connectionId
      ? prisma.calendarSyncJob.count({
          where: {
            calendarConnectionId: connectionId,
            status: { in: ["FAILED", "DEAD_LETTER"] },
          },
        })
      : 0,
    connectionId
      ? prisma.calendarSyncConflict.count({
          where: {
            calendarConnectionId: connectionId,
            status: "PENDING",
          },
        })
      : 0,
  ]);

  const initialStatus = {
    status: connection
      ? connection.status === "ACTIVE"
        ? "CONNECTED"
        : connection.status === "DISCONNECTED"
        ? "NOT_CONNECTED"
        : connection.status
      : "NOT_CONNECTED",
    connectedAccount: connection?.googleAccountEmail || null,
    selectedCalendar: connection?.calendarName
      ? {
          name: connection.calendarName,
          timeZone: connection.calendarTimezone || "Asia/Jakarta",
        }
      : null,
    lastSyncAt: connection?.lastSyncAt ? connection.lastSyncAt.toISOString() : null,
    metrics: {
      pendingJobs,
      failedJobs,
      pendingConflicts,
    },
  };

  return <SyncMonitoringClient initialStatus={initialStatus} />;
}
