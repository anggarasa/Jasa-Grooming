import "server-only";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@backend/lib/prisma";
import {
  minioClient,
  STORAGE_BUCKET,
  ensureBucketExists,
} from "@backend/lib/minio";
import { detectImageMagicBytes } from "./magic-bytes";

export const ALLOWED_STORAGE_FOLDERS = [
  "business/logos",
  "services/images",
  "gallery/images",
] as const;

export type AllowedStorageFolder = (typeof ALLOWED_STORAGE_FOLDERS)[number];

export const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadMediaParams {
  businessId: string;
  buffer: Buffer;
  originalName: string;
  folder: AllowedStorageFolder;
}

export interface UploadMediaResult {
  id: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
  url: string;
}

/**
 * Validasi dan upload media gambar ke MinIO serta simpan metadata ke MediaAsset
 */
export async function uploadMediaAsset(
  params: UploadMediaParams
): Promise<UploadMediaResult> {
  const { businessId, buffer, originalName, folder } = params;

  // 1. Validasi Buffer & Ukuran
  if (!buffer || buffer.length === 0) {
    throw new Error("Berkas gambar tidak boleh kosong.");
  }

  if (buffer.length > MAX_MEDIA_SIZE_BYTES) {
    throw new Error("Ukuran berkas melebihi batas maksimum 5 MB.");
  }

  // 2. Validasi Folder
  if (!ALLOWED_STORAGE_FOLDERS.includes(folder)) {
    throw new Error(
      `Folder penyimpanan '${folder}' tidak valid. Pilihan: ${ALLOWED_STORAGE_FOLDERS.join(
        ", "
      )}`
    );
  }

  // 3. Validasi Magic Bytes (JPEG, PNG, WebP)
  const validation = detectImageMagicBytes(buffer);
  if (!validation.valid || !validation.mimeType || !validation.extension) {
    throw new Error(validation.error || "Format gambar tidak didukung.");
  }

  // 4. Pastikan bucket tersedia di MinIO
  await ensureBucketExists(STORAGE_BUCKET);

  // 5. Generate safe unique object key: {folder}/{timestamp}-{uuid}.{ext}
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const objectKey = `${folder}/${timestamp}-${uuid}.${validation.extension}`;

  // 6. Simpan ke MinIO
  await minioClient.putObject(
    STORAGE_BUCKET,
    objectKey,
    buffer,
    buffer.length,
    {
      "Content-Type": validation.mimeType,
      "X-Original-Filename": encodeURIComponent(originalName),
      "X-Business-Id": businessId,
    }
  );

  // 7. Catat metadata di PostgreSQL (MediaAsset)
  const asset = await prisma.mediaAsset.create({
    data: {
      businessId,
      objectKey,
      originalName: originalName.slice(0, 200),
      mimeType: validation.mimeType,
      sizeBytes: buffer.length,
      folder,
    },
  });

  return {
    id: asset.id,
    objectKey: asset.objectKey,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    folder: asset.folder,
    url: `/api/media/${encodeURIComponent(asset.objectKey)}`,
  };
}

/**
 * Mengambil stream gambar dari MinIO
 */
export async function getMediaStream(
  objectKey: string
): Promise<{ stream: Readable; contentType: string; size: number }> {
  if (
    !objectKey ||
    typeof objectKey !== "string" ||
    objectKey.trim() === "" ||
    objectKey.includes("..") ||
    objectKey.includes("\0") ||
    objectKey.startsWith("/") ||
    objectKey.startsWith("\\")
  ) {
    throw new Error("objectKey tidak valid.");
  }

  let normalizedKey = objectKey.trim();

  // Jika key tidak mengandung slash ('/'), periksa apakah merupakan ID MediaAsset
  if (!normalizedKey.includes("/")) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: normalizedKey },
    });
    if (asset) {
      normalizedKey = asset.objectKey;
    }
  }

  // 1. Cek fallback berkas lokal (misalnya di folder public/media/)
  // Aset publik kini ada di frontend/public; lokasi lama tetap dicoba sebagai cadangan.
  const localCandidates = [
    path.join(process.cwd(), "frontend", "public", "media", normalizedKey),
    path.join(process.cwd(), "frontend", "public", normalizedKey),
    path.join(process.cwd(), "public", "media", normalizedKey),
    path.join(process.cwd(), "public", normalizedKey),
  ];

  for (const candidatePath of localCandidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidatePath)) {
      const stat = fs.statSync(/*turbopackIgnore: true*/ candidatePath);
      if (stat.isFile()) {
        const stream = fs.createReadStream(/*turbopackIgnore: true*/ candidatePath);
        let contentType = "application/octet-stream";
        if (normalizedKey.endsWith(".webp")) contentType = "image/webp";
        else if (normalizedKey.endsWith(".jpg") || normalizedKey.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (normalizedKey.endsWith(".png")) contentType = "image/png";
        else if (normalizedKey.endsWith(".svg")) contentType = "image/svg+xml";

        return {
          stream,
          contentType,
          size: stat.size,
        };
      }
    }
  }

  const stat = await minioClient.statObject(STORAGE_BUCKET, normalizedKey);
  const stream = await minioClient.getObject(STORAGE_BUCKET, normalizedKey);

  const contentType =
    (stat.metaData && stat.metaData["content-type"]) ||
    (stat.metaData && stat.metaData["Content-Type"]) ||
    "application/octet-stream";

  return {
    stream,
    contentType,
    size: stat.size,
  };
}

/**
 * Hapus media dari MinIO dan database
 */
export async function deleteMediaAsset(
  objectKeyOrId: string,
  businessId?: string
): Promise<void> {
  if (!objectKeyOrId || typeof objectKeyOrId !== "string" || objectKeyOrId.trim() === "") return;

  if (
    objectKeyOrId.includes("..") ||
    objectKeyOrId.includes("\0") ||
    objectKeyOrId.startsWith("/") ||
    objectKeyOrId.startsWith("\\")
  ) {
    throw new Error("objectKey tidak valid.");
  }

  let normalizedKey = objectKeyOrId.trim();

  // Cek apakah input adalah ID dari tabel MediaAsset
  if (!normalizedKey.includes("/")) {
    const assetById = await prisma.mediaAsset.findUnique({
      where: { id: normalizedKey },
    });
    if (assetById) {
      normalizedKey = assetById.objectKey;
    }
  }

  // Verifikasi aset di MediaAsset database untuk mencegah IDOR
  const existingAsset = await prisma.mediaAsset.findFirst({
    where: { objectKey: normalizedKey },
  });

  if (existingAsset) {
    if (businessId && existingAsset.businessId !== businessId) {
      throw new Error("Anda tidak memiliki izin untuk menghapus media milik bisnis lain.");
    }

    await prisma.mediaAsset.delete({
      where: { id: existingAsset.id },
    });
  }

  try {
    await minioClient.removeObject(STORAGE_BUCKET, normalizedKey);
  } catch (err) {
    console.warn(`Gagal menghapus file MinIO untuk key: ${normalizedKey}`, err);
  }
}

