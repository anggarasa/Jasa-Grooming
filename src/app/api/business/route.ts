import { NextRequest } from "next/server";
import { assertOwner } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  getBusinessProfile,
  updateBusinessProfile,
} from "@/modules/business/business.service";
import { updateBusinessProfileSchema } from "@/modules/business/schemas";
import { revalidateBusinessCache } from "@/lib/cache";

export async function GET() {
  try {
    const business = await getBusinessProfile();
    return apiSuccess(business);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil data profil bisnis.");
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

    const validated = updateBusinessProfileSchema.parse(body);
    const updated = await updateBusinessProfile(validated);
    revalidateBusinessCache();

    return apiSuccess(updated, "Profil bisnis berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui profil bisnis.");
  }
}
