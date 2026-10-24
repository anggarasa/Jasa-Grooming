import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

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

    return apiSuccess(updated, "Job sinkronisasi berhasil dijadwalkan ulang.");
  } catch (error) {
    return handleApiError(error, "Gagal mengulang job sinkronisasi.");
  }
}
