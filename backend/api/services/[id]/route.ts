import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import {
  getServiceById,
  updateService,
  deleteService,
} from "@backend/modules/services/services.service";
import { updateServiceSchema } from "@backend/modules/services/schemas";
import { revalidateServicesCache } from "@backend/lib/cache";

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await segmentData.params;
    if (!id || id.trim() === "") {
      return apiError("Parameter ID layanan tidak valid.", "BAD_REQUEST", 400);
    }

    const service = await getServiceById(id.trim());
    return apiSuccess(service);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil detail layanan grooming.");
  }
}

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);

    const { id } = await segmentData.params;
    if (!id || id.trim() === "") {
      return apiError("Parameter ID layanan tidak valid.", "BAD_REQUEST", 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validated = updateServiceSchema.parse(body);
    const updated = await updateService(id.trim(), validated);
    revalidateServicesCache(updated.slug);

    return apiSuccess(updated, "Layanan grooming berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui layanan grooming.");
  }
}

export async function DELETE(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);

    const { id } = await segmentData.params;
    if (!id || id.trim() === "") {
      return apiError("Parameter ID layanan tidak valid.", "BAD_REQUEST", 400);
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const result = await deleteService(id.trim(), force);
    revalidateServicesCache();

    return apiSuccess(result, result.message);
  } catch (error) {
    return handleApiError(error, "Gagal menghapus layanan grooming.");
  }
}
