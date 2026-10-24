import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  listGallery,
  createGalleryItem,
} from "@/modules/gallery/gallery.service";
import { createGalleryItemSchema } from "@/modules/gallery/schemas";
import { revalidateGalleryCache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly");
    const isActive = activeOnly === "true" ? true : undefined;

    const gallery = await listGallery({ isActive });
    return apiSuccess(gallery);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar foto galeri.");
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

    const validated = createGalleryItemSchema.parse(body);
    const item = await createGalleryItem(validated);
    revalidateGalleryCache();

    return apiSuccess(item, "Foto galeri berhasil ditambahkan.", 201);
  } catch (error) {
    return handleApiError(error, "Gagal menambahkan foto galeri.");
  }
}
