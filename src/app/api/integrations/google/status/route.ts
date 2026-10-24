import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireRole([Role.OWNER, Role.ADMIN]);
    const isOwner = user.role === Role.OWNER;
    const business = await getPrimaryBusiness();

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

    if (!connection) {
      return apiSuccess({
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
      });
    }

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

    const activeWatch = connection.webhookChannels[0] ?? null;

    return apiSuccess({
      isConfigured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      isEnabled: env.GOOGLE_CALENDAR_SYNC_ENABLED,
      status: connection.status === "ACTIVE" ? "CONNECTED" : (connection.status === "DISCONNECTED" ? "NOT_CONNECTED" : connection.status),
      rawStatus: connection.status,
      isOwner,
      connectedAccount: connection.googleAccountEmail,
      selectedCalendar: connection.calendarId
        ? {
            id: connection.calendarId,
            name: connection.calendarName ?? "Kalender Terpilih",
            timeZone: connection.calendarTimezone ?? "Asia/Jakarta",
          }
        : null,
      error: connection.lastErrorMessage,
      googleAccountEmail: connection.googleAccountEmail,
      calendarId: connection.calendarId,
      calendarName: connection.calendarName,
      calendarTimezone: connection.calendarTimezone,
      lastSyncAt: connection.lastSyncAt,
      lastErrorAt: connection.lastErrorAt,
      lastErrorMessage: connection.lastErrorMessage,
      syncState: connection.syncState
        ? {
            syncStatus: connection.syncState.syncStatus,
            lastSuccessfulSyncAt: connection.syncState.lastSuccessfulSyncAt,
            lastIncrementalSyncAt: connection.syncState.lastIncrementalSyncAt,
          }
        : null,
      watchChannel: activeWatch
        ? {
            channelId: activeWatch.channelId,
            expirationAt: activeWatch.expirationAt,
            status: activeWatch.status,
          }
        : null,
      metrics: {
        pendingJobs,
        failedJobs,
        pendingConflicts,
      },
    });
  } catch (error) {
    return handleApiError(error, "Gagal mengambil status koneksi Google Calendar.");
  }
}
