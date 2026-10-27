import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@backend/lib/prisma";
import { checkStorageHealth } from "@backend/lib/minio";
import { env } from "@backend/config/env";

export async function GET(request?: NextRequest | Request) {
  const timestamp = new Date().toISOString();

  let probeType: string | null = null;
  if (request && request.url) {
    try {
      const url = new URL(request.url);
      probeType = url.searchParams.get("type") || url.searchParams.get("probe");
    } catch {
      // Ignored if invalid URL
    }
  }

  // 1. Semantik Liveness: Memverifikasi proses server Next.js aktif dan merespons
  if (probeType === "liveness" || probeType === "live") {
    return NextResponse.json(
      {
        status: "live",
        application: "tampilkit-booking",
        version: "0.1.0",
        timestamp,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  // 2. Evaluasi Kesiapan Komponen (Readiness & Dependency Health)
  let databaseStatus: "healthy" | "unhealthy" = "unhealthy";
  let storageStatus: "healthy" | "unhealthy" = "unhealthy";
  let googleSyncStatus: "healthy" | "disabled" | "degraded" = "disabled";
  let outboxLagSeconds = 0;
  let outboxPendingJobs = 0;

  // Cek Konektivitas Database (PostgreSQL)
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = "healthy";
  } catch (error) {
    console.error("Health check Database failure:", error);
    databaseStatus = "unhealthy";
  }

  // Semantik Readiness murni: Kesiapan menerima beban transaksi data
  if (probeType === "readiness" || probeType === "ready") {
    const isReady = databaseStatus === "healthy";
    return NextResponse.json(
      {
        status: isReady ? "ready" : "not_ready",
        application: "tampilkit-booking",
        timestamp,
        database: databaseStatus,
      },
      {
        status: isReady ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  // Cek Konektivitas Object Storage (MinIO)
  try {
    const storageHealth = await checkStorageHealth();
    storageStatus = storageHealth.healthy ? "healthy" : "unhealthy";
  } catch (error) {
    console.error("Health check Storage failure:", error);
    storageStatus = "unhealthy";
  }

  // Cek Status Google Calendar & Antrean Outbox
  if (env.GOOGLE_CALENDAR_SYNC_ENABLED) {
    try {
      const activeConnection = await prisma.calendarConnection.findFirst({
        where: { provider: "GOOGLE", status: "ACTIVE" },
        select: { id: true, lastErrorAt: true, status: true },
      });

      if (!activeConnection) {
        googleSyncStatus = "disabled";
      } else {
        const oldestPending = await prisma.calendarSyncJob.findFirst({
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        });

        if (oldestPending) {
          outboxLagSeconds = Math.max(
            0,
            Math.floor((Date.now() - oldestPending.createdAt.getTime()) / 1000)
          );
        }

        outboxPendingJobs = await prisma.calendarSyncJob.count({
          where: { status: "PENDING" },
        });

        const failedCount = await prisma.calendarSyncJob.count({
          where: {
            calendarConnectionId: activeConnection.id,
            status: "FAILED",
          },
        });

        if (failedCount > 5 || outboxLagSeconds > 900) {
          googleSyncStatus = "degraded";
        } else {
          googleSyncStatus = "healthy";
        }
      }
    } catch (err) {
      console.warn("Health check Google Sync warning:", err);
      googleSyncStatus = "degraded";
    }
  } else {
    googleSyncStatus = "disabled";
  }

  const isDbHealthy = databaseStatus === "healthy";
  const isStorageHealthy = storageStatus === "healthy";
  const isSyncDegraded = googleSyncStatus === "degraded";

  // Status sistem secara keseluruhan
  const isOverallHealthy = isDbHealthy && isStorageHealthy && !isSyncDegraded;
  const overallStatus = isOverallHealthy ? "healthy" : "degraded";

  // HTTP status: 503 jika DB gagal atau Storage gagal; 200 jika hanya Google sync yang degraded
  const httpStatus = isDbHealthy && isStorageHealthy ? 200 : 503;

  const responseBody = {
    status: overallStatus,
    application: "tampilkit-booking",
    version: "0.1.0",
    timestamp,
    checks: {
      database: databaseStatus,
      storage: storageStatus,
      googleSync: googleSyncStatus,
    },
    services: {
      database: databaseStatus,
      storage: storageStatus,
      googleSync: googleSyncStatus,
    },
    metrics: {
      outboxPendingJobs,
      outboxLagSeconds,
    },
  };

  return NextResponse.json(responseBody, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
