import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import {
  listCategories,
  createCategory,
} from "@backend/modules/categories/categories.service";
import { createServiceCategorySchema } from "@backend/modules/categories/schemas";
import { revalidateCategoriesCache } from "@backend/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly");
    const isActive = activeOnly === "true" ? true : undefined;

    const categories = await listCategories({ isActive });
    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar kategori layanan.");
  }
}

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validated = createServiceCategorySchema.parse(body);
    const category = await createCategory(validated);
    revalidateCategoriesCache();

    return apiSuccess(category, "Kategori layanan berhasil dibuat.", 201);
  } catch (error) {
    return handleApiError(error, "Gagal menambahkan kategori layanan.");
  }
}
