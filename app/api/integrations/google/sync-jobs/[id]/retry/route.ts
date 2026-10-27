import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { prisma } from "@backend/lib/prisma";
import { executeSyncJob } from "@backend/modules/integrations/google/google-sync-worker.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Validasi CSRF gagal.", "CSRF_FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();
    const { id } = await params;

    const job = await prisma.calendarSyncJob.findFirst({
      where: {
        id,
        calendarConnection: {
          businessId: business.id,
        },
      },
    });

    if (!job) {
      return apiError("Job sinkronisasi tidak ditemukan.", "NOT_FOUND", 404);
    }

    const updated = await prisma.calendarSyncJob.update({
      where: { id: job.id },
      data: {
        status: "PENDING",
        attemptCount: 0,
        nextAttemptAt: new Date(),
        lockedUntil: null,
        lockedBy: null,
        lastError: null,
      },
    });

    try {
      await executeSyncJob(job.id);
    } catch (execErr) {
      console.warn("[GoogleSyncRetryRoute] Eksekusi job langsung:", execErr);
    }

    const latestJob = await prisma.calendarSyncJob.findUnique({
      where: { id: job.id },
    });

    return apiSuccess(latestJob || updated, "Job sinkronisasi berhasil diproses ulang.");
  } catch (error) {
    return handleApiError(error, "Gagal mengulang job sinkronisasi.");
  }
}
