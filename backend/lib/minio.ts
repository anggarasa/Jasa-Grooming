import "server-only";
import { Client } from "minio";
import crypto from "crypto";
import { env } from "@backend/config/env";

const globalForMinio = globalThis as unknown as {
  minioClient: Client | undefined;
};

export const minioClient =
  globalForMinio.minioClient ??
  new Client({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minioClient = minioClient;
}

export const STORAGE_BUCKET = env.MINIO_BUCKET;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadOptions {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
  maxSizeBytes?: number;
}

export interface UploadResult {
  objectKey: string;
  size: number;
  mimeType: string;
  bucket: string;
}

export interface StorageHealthStatus {
  healthy: boolean;
  bucket: string;
  message?: string;
}

/**
 * Memastikan bucket MinIO telah dibuat di storage server
 */
export async function ensureBucketExists(
  bucketName: string = STORAGE_BUCKET
): Promise<void> {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1");
  }
}

/**
 * Health check untuk koneksi storage MinIO
 */
export async function checkStorageHealth(
  bucketName: string = STORAGE_BUCKET
): Promise<StorageHealthStatus> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout terhubung ke MinIO")), 2000)
    );
    await Promise.race([ensureBucketExists(bucketName), timeoutPromise]);
    return {
      healthy: true,
      bucket: bucketName,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal terhubung ke storage MinIO";
    return {
      healthy: false,
      bucket: bucketName,
      message,
    };
  }
}

/**
 * Generate object key unik dan aman (mencegah path traversal & collision)
 */
export function generateUniqueObjectKey(
  originalName: string,
  folder: string = "uploads"
): string {
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "") || "uploads";
  const extensionMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "bin";
  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();

  return `${sanitizedFolder}/${timestamp}-${uniqueId}.${extension}`;
}

/**
 * Upload file buffer ke MinIO dengan validasi tipe dan ukuran
 */
export async function uploadFile(
  options: UploadOptions
): Promise<UploadResult> {
  const {
    buffer,
    originalName,
    mimeType,
    folder = "uploads",
    maxSizeBytes = MAX_FILE_SIZE_BYTES,
  } = options;

  // 0. Validasi Buffer File
  if (!buffer || buffer.length === 0) {
    throw new Error("File buffer tidak boleh kosong.");
  }

  // 1. Validasi MIME Type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    throw new Error(
      `Tipe file tidak didukung: ${mimeType}. Hanya format gambar (JPEG, PNG, WebP, SVG) dan PDF yang diperbolehkan.`
    );
  }

  // 2. Validasi Ukuran File
  if (buffer.length > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    throw new Error(`Ukuran file melebihi batas maksimum ${maxMb} MB.`);
  }

  // 3. Pastikan bucket tersedia
  await ensureBucketExists(STORAGE_BUCKET);

  // 4. Generate random safe key
  const objectKey = generateUniqueObjectKey(originalName, folder);

  // 5. Upload ke bucket
  await minioClient.putObject(
    STORAGE_BUCKET,
    objectKey,
    buffer,
    buffer.length,
    {
      "Content-Type": mimeType,
      "X-Original-Filename": encodeURIComponent(originalName),
    }
  );

  return {
    objectKey,
    size: buffer.length,
    mimeType,
    bucket: STORAGE_BUCKET,
  };
}

/**
 * Hapus object dari MinIO storage
 */
export async function deleteFile(
  objectKey: string,
  bucketName: string = STORAGE_BUCKET
): Promise<void> {
  if (!objectKey) return;
  await minioClient.removeObject(bucketName, objectKey);
}

/**
 * Dapatkan Presigned URL untuk download/akses aman sementara (default 1 jam)
 */
export async function getPresignedDownloadUrl(
  objectKey: string,
  expirySeconds: number = 3600,
  bucketName: string = STORAGE_BUCKET
): Promise<string> {
  if (!objectKey || typeof objectKey !== "string" || objectKey.trim() === "") {
    throw new Error("objectKey harus berupa string yang valid.");
  }
  return await minioClient.presignedGetObject(
    bucketName,
    objectKey,
    expirySeconds
  );
}

/**
 * Dapatkan Presigned URL untuk upload langsung dari client (default 15 menit)
 */
export async function getPresignedUploadUrl(
  objectKey: string,
  expirySeconds: number = 900,
  bucketName: string = STORAGE_BUCKET
): Promise<string> {
  if (!objectKey || typeof objectKey !== "string" || objectKey.trim() === "") {
    throw new Error("objectKey harus berupa string yang valid.");
  }
  return await minioClient.presignedPutObject(
    bucketName,
    objectKey,
    expirySeconds
  );
}

export default minioClient;
