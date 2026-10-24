import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rescheduleBooking } from "@/modules/bookings/reschedule.service";
import { rescheduleBookingSchema } from "@/modules/bookings/admin-schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    const user = await requireRole([Role.OWNER, Role.ADMIN]);
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validated = rescheduleBookingSchema.parse(body);
    const updated = await rescheduleBooking({
      bookingId: id,
      newDate: validated.date,
      newTime: validated.time,
      reason: validated.reason,
      actorUserId: user.id,
    });

    return apiSuccess(updated, "Jadwal reservasi berhasil diubah.");
  } catch (error) {
    return handleApiError(error, "Gagal mengubah jadwal reservasi.");
  }
}
