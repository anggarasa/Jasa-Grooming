import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@backend/modules/categories/categories.service";
import { updateServiceCategorySchema } from "@backend/modules/categories/schemas";
import { revalidateCategoriesCache } from "@backend/lib/cache";

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await segmentData.params;
    if (!id || id.trim() === "") {
      return apiError("Parameter ID kategori tidak valid.", "BAD_REQUEST", 400);
    }

    const category = await getCategoryById(id.trim());
    return apiSuccess(category);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil detail kategori layanan.");
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
      return apiError("Parameter ID kategori tidak valid.", "BAD_REQUEST", 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validated = updateServiceCategorySchema.parse(body);
    const updated = await updateCategory(id.trim(), validated);
    revalidateCategoriesCache();

    return apiSuccess(updated, "Kategori layanan berhasil diperbarui.");
  } catch (error) {
    return handleApiError(error, "Gagal memperbarui kategori layanan.");
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
      return apiError("Parameter ID kategori tidak valid.", "BAD_REQUEST", 400);
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const result = await deleteCategory(id.trim(), force);
    revalidateCategoriesCache();

    return apiSuccess(result, result.message);
  } catch (error) {
    return handleApiError(error, "Gagal menghapus kategori layanan.");
  }
}
