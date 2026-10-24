import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { updateBookingStatus } from "@/modules/bookings/admin-booking.service";
import { updateBookingStatusSchema } from "@/modules/bookings/admin-schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const validated = updateBookingStatusSchema.parse(body);
    const updated = await updateBookingStatus({
      bookingId: id,
      input: validated,
      actorUserId: user.id,
    });

    return apiSuccess(updated, `Status reservasi berhasil diperbarui menjadi ${validated.status}.`);
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui status reservasi.");
  }
}
