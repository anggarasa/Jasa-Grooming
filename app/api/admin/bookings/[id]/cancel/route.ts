import { NextRequest } from "next/server";
import { Role, BookingStatus } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import { updateBookingStatus } from "@backend/modules/bookings/admin-booking.service";
import { cancelBookingSchema } from "@backend/modules/bookings/admin-schemas";

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

    const validated = cancelBookingSchema.parse(body);
    const updated = await updateBookingStatus({
      bookingId: id,
      input: {
        status: BookingStatus.CANCELLED,
        reason: validated.reason,
      },
      actorUserId: user.id,
    });

    return apiSuccess(updated, "Reservasi berhasil dibatalkan.");
  } catch (error) {
    return handleApiError(error, "Gagal membatalkan reservasi.");
  }
}
