import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole, assertOwner } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  getBookingSettings,
  updateBookingSettings,
} from "@/modules/business/business.service";
import { updateBookingSettingsSchema } from "@/modules/business/schemas";
import { revalidateBookingSettingsCache } from "@/lib/cache";

export async function GET() {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const settings = await getBookingSettings();
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil pengaturan booking.");
  }
}

export async function PATCH(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    await assertOwner();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validated = updateBookingSettingsSchema.parse(body);
    const updated = await updateBookingSettings(validated);
    revalidateBookingSettingsCache();

    return apiSuccess(updated, "Pengaturan booking berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui pengaturan booking.");
  }
}
