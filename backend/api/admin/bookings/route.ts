import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import {
  listAdminBookings,
  createWalkInBooking,
} from "@backend/modules/bookings/admin-booking.service";
import {
  adminListBookingsQuerySchema,
  adminWalkInSchema,
} from "@backend/modules/bookings/admin-schemas";

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const url = new URL(request.url);
    const queryParams: Record<string, string | undefined> = {};
    url.searchParams.forEach((val, key) => {
      if (val !== "") queryParams[key] = val;
    });

    const parsedQuery = adminListBookingsQuerySchema.parse(queryParams);
    const result = await listAdminBookings(business.id, parsedQuery);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar reservasi.");
  }
}

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    const user = await requireRole([Role.OWNER, Role.ADMIN]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validatedInput = adminWalkInSchema.parse(body);
    const created = await createWalkInBooking(validatedInput, user.id);

    return apiSuccess(created, "Reservasi berhasil dibuat.", 201);
  } catch (error) {
    return handleApiError(error, "Gagal membuat reservasi.");
  }
}
