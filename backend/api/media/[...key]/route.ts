import { NextRequest } from "next/server";
import { Readable } from "stream";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import {
  getMediaStream,
  deleteMediaAsset,
} from "@backend/modules/storage/media.service";

export async function GET(
  _request: NextRequest,
  segmentData: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await segmentData.params;
    if (!key || key.length === 0) {
      return apiError("Kunci media tidak valid.", "BAD_REQUEST", 400);
    }

    const rawKey = key.map((segment) => decodeURIComponent(segment)).join("/");

    const { stream, contentType, size } = await getMediaStream(rawKey);

    // Konversi Node.js Readable stream ke Web ReadableStream
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": size.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("The specified key does not exist") || error.message.includes("NotFound") || error.message.includes("tidak valid"))) {
      return apiError("Media tidak ditemukan.", "NOT_FOUND", 404);
    }
    return handleApiError(error, "Gagal mengambil media.");
  }
}

export async function DELETE(
  request: NextRequest,
  segmentData: { params: Promise<{ key: string[] }> }
) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const { key } = await segmentData.params;
    if (!key || key.length === 0) {
      return apiError("Kunci media tidak valid.", "BAD_REQUEST", 400);
    }

    const rawKey = key.map((segment) => decodeURIComponent(segment)).join("/");
    await deleteMediaAsset(rawKey, business.id);

    return apiSuccess(null, "Media berhasil dihapus.");
  } catch (error) {
    return handleApiError(error, "Gagal menghapus media.");
  }
}
