import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateUniqueObjectKey,
  uploadFile,
  checkStorageHealth,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  minioClient,
  MAX_FILE_SIZE_BYTES,
} from "@backend/lib/minio";

describe("MinIO Storage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateUniqueObjectKey", () => {
    it("menghasilkan key dengan folder dan format yang benar", () => {
      const key = generateUniqueObjectKey("foto-anjing.png", "pets");
      expect(key.startsWith("pets/")).toBe(true);
      expect(key.endsWith(".png")).toBe(true);
      expect(key.length).toBeGreaterThan(20);
    });

    it("melakukan sanitasi folder dari karakter terlarang", () => {
      const key = generateUniqueObjectKey("test.jpg", "../../../secret/");
      expect(key.includes("..")).toBe(false);
      expect(key.startsWith("secret/")).toBe(true);
    });

    it("menangani file tanpa ekstensi dengan fallback .bin", () => {
      const key = generateUniqueObjectKey("unknown_file", "docs");
      expect(key.endsWith(".bin")).toBe(true);
    });
  });

  describe("uploadFile validation", () => {
    it("menolak MIME type yang tidak didukung", async () => {
      const buffer = Buffer.from("dummy data");
      await expect(
        uploadFile({
          buffer,
          originalName: "malicious.exe",
          mimeType: "application/x-msdownload",
        })
      ).rejects.toThrow("Tipe file tidak didukung");
    });

    it("menolak file yang ukurannya melebihi batas", async () => {
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
      await expect(
        uploadFile({
          buffer: largeBuffer,
          originalName: "big-photo.jpg",
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow("Ukuran file melebihi batas");
    });

    it("berhasil memproses upload jika file valid dengan mock client", async () => {
      vi.spyOn(minioClient, "bucketExists").mockResolvedValue(true);
      vi.spyOn(minioClient, "putObject").mockResolvedValue({
        etag: "mock-etag",
        versionId: "1",
      });

      const buffer = Buffer.from("valid-image-content");
      const result = await uploadFile({
        buffer,
        originalName: "avatar.png",
        mimeType: "image/png",
        folder: "avatars",
      });

      expect(result.objectKey.startsWith("avatars/")).toBe(true);
      expect(result.objectKey.endsWith(".png")).toBe(true);
      expect(result.size).toBe(buffer.length);
      expect(result.mimeType).toBe("image/png");
      expect(minioClient.putObject).toHaveBeenCalledTimes(1);
    });
  });

  describe("checkStorageHealth", () => {
    it("mengembalikan status healthy jika bucket tersedia", async () => {
      vi.spyOn(minioClient, "bucketExists").mockResolvedValue(true);
      const health = await checkStorageHealth("tampilkit-booking");
      expect(health.healthy).toBe(true);
      expect(health.bucket).toBe("tampilkit-booking");
    });

    it("mengembalikan status unhealthy jika koneksi gagal", async () => {
      vi.spyOn(minioClient, "bucketExists").mockRejectedValue(
        new Error("Connection refused")
      );
      const health = await checkStorageHealth("tampilkit-booking");
      expect(health.healthy).toBe(false);
      expect(health.message).toContain("Connection refused");
    });
  });

  describe("edge cases & presigned url validation", () => {
    it("fallback ke folder 'uploads' jika folder hanya berisi karakter terlarang", () => {
      const key = generateUniqueObjectKey("test.png", "///...///");
      expect(key.startsWith("uploads/")).toBe(true);
    });

    it("menolak upload jika buffer kosong", async () => {
      await expect(
        uploadFile({
          buffer: Buffer.alloc(0),
          originalName: "empty.png",
          mimeType: "image/png",
        })
      ).rejects.toThrow("File buffer tidak boleh kosong.");
    });

    it("menolak getPresignedDownloadUrl jika objectKey kosong", async () => {
      await expect(getPresignedDownloadUrl("")).rejects.toThrow(
        "objectKey harus berupa string yang valid."
      );
    });

    it("menolak getPresignedUploadUrl jika objectKey kosong", async () => {
      await expect(getPresignedUploadUrl("   ")).rejects.toThrow(
        "objectKey harus berupa string yang valid."
      );
    });
  });
});
