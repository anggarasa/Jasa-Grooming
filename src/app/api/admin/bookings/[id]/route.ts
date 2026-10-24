import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  getAdminBookingDetail,
  updateBookingInternalNotes,
} from "@/modules/bookings/admin-booking.service";
import { updateBookingNotesSchema } from "@/modules/bookings/admin-schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const { id } = await params;
    const booking = await getAdminBookingDetail(id);

    return apiSuccess(booking);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil rincian reservasi.");
  }
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

    const validated = updateBookingNotesSchema.parse(body);
    const updated = await updateBookingInternalNotes({
      bookingId: id,
      internalNotes: validated.internalNotes,
      actorUserId: user.id,
    });

    return apiSuccess(updated, "Catatan internal berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui catatan internal.");
  }
}
