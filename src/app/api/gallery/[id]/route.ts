import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  updateGalleryItem,
  deleteGalleryItem,
} from "@/modules/gallery/gallery.service";
import { updateGalleryItemSchema } from "@/modules/gallery/schemas";
import { revalidateGalleryCache } from "@/lib/cache";

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
      return apiError("Parameter ID foto galeri tidak valid.", "BAD_REQUEST", 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validated = updateGalleryItemSchema.parse(body);
    const updated = await updateGalleryItem(id.trim(), validated);
    revalidateGalleryCache();

    return apiSuccess(updated, "Foto galeri berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui foto galeri.");
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
      return apiError("Parameter ID foto galeri tidak valid.", "BAD_REQUEST", 400);
    }

    const result = await deleteGalleryItem(id.trim());
    revalidateGalleryCache();

    return apiSuccess(result, result.message);
  } catch (error) {
    return handleApiError(error, "Gagal menghapus foto galeri.");
  }
}
