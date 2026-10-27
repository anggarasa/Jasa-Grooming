import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { prisma } from "@backend/lib/prisma";
import { performIncrementalSync } from "@backend/modules/integrations/google/google-incremental-sync.service";
import { runSyncWorkerCycle } from "@backend/modules/integrations/google/google-sync-worker.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Validasi CSRF gagal.", "CSRF_FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    let fullSync = false;
    try {
      const body = await request.json();
      if (body && typeof body === "object" && "fullSync" in body) {
        fullSync = Boolean(body.fullSync);
      }
    } catch {
      // Body is optional; default fullSync = false
    }

    const connection = await prisma.calendarConnection.findUnique({
      where: {
        businessId_provider: {
          businessId: business.id,
          provider: "GOOGLE",
        },
      },
    });

    if (!connection || connection.status !== "ACTIVE") {
      return apiError(
        "Koneksi Google Calendar tidak aktif atau belum terhubung.",
        "CONNECTION_NOT_ACTIVE",
        400
      );
    }

    // Process pending outbox queue jobs immediately so on-demand sync processes local changes without delay
    let outboxJobsProcessed = 0;
    try {
      outboxJobsProcessed = await runSyncWorkerCycle(20);
    } catch (workerErr) {
      console.warn("[GoogleSyncRoute] Outbox worker processing warning during on-demand sync:", workerErr);
    }

    const result = await performIncrementalSync({
      connectionId: connection.id,
      forceFullSync: fullSync,
    });

    return apiSuccess(
      {
        ...result,
        outboxJobsProcessed,
      },
      "Sinkronisasi kalender Google berhasil dijalankan."
    );
  } catch (error) {
    return handleApiError(error, "Gagal menjalankan sinkronisasi kalender Google.");
  }
}
