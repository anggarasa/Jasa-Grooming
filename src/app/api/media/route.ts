import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { deleteMediaAsset } from "@/modules/storage/media.service";

export async function DELETE(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const { searchParams } = new URL(request.url);
    let target = searchParams.get("key") || searchParams.get("id");

    if (!target) {
      try {
        const body = (await request.json()) as { key?: string; id?: string };
        target = body?.key || body?.id || null;
      } catch {
        // Abaikan jika tidak ada body JSON
      }
    }

    if (!target || target.trim() === "") {
      return apiError("Parameter 'key' atau 'id' media wajib disertakan.", "BAD_REQUEST", 400);
    }

    await deleteMediaAsset(target.trim(), business.id);

    return apiSuccess(null, "Media berhasil dihapus.");
  } catch (error) {
    return handleApiError(error, "Gagal menghapus media.");
  }
}
