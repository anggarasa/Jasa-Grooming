import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import {
  uploadMediaAsset,
  ALLOWED_STORAGE_FOLDERS,
  AllowedStorageFolder,
  MAX_MEDIA_SIZE_BYTES,
} from "@backend/modules/storage/media.service";

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);

    const business = await getPrimaryBusiness();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError("Format form data tidak valid atau berkas kosong.", "BAD_REQUEST", 400);
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return apiError("Berkas 'file' wajib diunggah.", "BAD_REQUEST", 400);
    }

    if (file.size === 0) {
      return apiError("Ukuran berkas tidak boleh 0 byte.", "BAD_REQUEST", 400);
    }

    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      return apiError("Ukuran berkas melebihi batas maksimum 5 MB.", "BAD_REQUEST", 400);
    }

    const rawFolder = (formData.get("folder") as string) || "services/images";
    if (!ALLOWED_STORAGE_FOLDERS.includes(rawFolder as AllowedStorageFolder)) {
      return apiError(
        `Folder tujuan '${rawFolder}' tidak valid. Pilihan: ${ALLOWED_STORAGE_FOLDERS.join(", ")}`,
        "BAD_REQUEST",
        400
      );
    }
    const folder = rawFolder as AllowedStorageFolder;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await uploadMediaAsset({
      businessId: business.id,
      buffer,
      originalName: file.name,
      folder,
    });

    return apiSuccess(asset, "Media berhasil diunggah.", 201);
  } catch (error) {
    return handleApiError(error, "Gagal mengunggah media.");
  }
}
