import { NextRequest } from "next/server";
import { assertOwner } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  getOperatingHours,
  updateOperatingHours,
} from "@/modules/business/business.service";
import { updateOperatingHoursSchema } from "@/modules/business/schemas";
import { revalidateHoursCache } from "@/lib/cache";

export async function GET() {
  try {
    const hours = await getOperatingHours();
    return apiSuccess(hours);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil data jam operasional.");
  }
}

export async function PUT(request: NextRequest) {
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

    const validated = updateOperatingHoursSchema.parse(body);
    const updated = await updateOperatingHours(validated);
    revalidateHoursCache();

    return apiSuccess(updated, "Jam operasional berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui jam operasional.");
  }
}
