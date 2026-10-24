import { describe, it, expect } from "vitest";
import { envSchema } from "@/config/env";

describe("Environment Validation (envSchema)", () => {
  const validEnv = {
    NODE_ENV: "test",
    PORT: "3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/test_db",
    MINIO_ENDPOINT: "localhost",
    MINIO_PORT: "9000",
    MINIO_USE_SSL: "false",
    MINIO_ACCESS_KEY: "admin",
    MINIO_SECRET_KEY: "password123",
    MINIO_BUCKET: "tampilkit-booking",
  };

  it("berhasil memvalidasi variabel environment yang lengkap dan valid", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.MINIO_PORT).toBe(9000);
      expect(result.data.MINIO_USE_SSL).toBe(false);
      expect(result.data.MINIO_BUCKET).toBe("tampilkit-booking");
    }
  });

  it("gagal validasi jika DATABASE_URL tidak diisi", () => {
    const invalidEnv = { ...validEnv, DATABASE_URL: "" };
    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it("gagal validasi jika MINIO_ACCESS_KEY tidak diisi", () => {
    const invalidEnv = { ...validEnv, MINIO_ACCESS_KEY: "" };
    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it("melakukan konversi MINIO_USE_SSL string 'true' menjadi boolean true", () => {
    const sslEnv = { ...validEnv, MINIO_USE_SSL: "true" };
    const result = envSchema.safeParse(sslEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.MINIO_USE_SSL).toBe(true);
    }
  });

  it("menerapkan nilai default jika PORT atau MINIO_PORT tidak diberikan", () => {
    const minimalEnv = {
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/test_db",
      MINIO_ACCESS_KEY: "admin",
      MINIO_SECRET_KEY: "password123",
    };
    const result = envSchema.safeParse(minimalEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.MINIO_PORT).toBe(9000);
      expect(result.data.MINIO_USE_SSL).toBe(false);
      expect(result.data.MINIO_BUCKET).toBe("tampilkit-booking");
      expect(result.data.JWT_ACCESS_SECRET).toBeDefined();
      expect(result.data.JWT_REFRESH_SECRET).toBeDefined();
    }
  });

  it("gagal validasi jika JWT_ACCESS_SECRET kurang dari 32 karakter", () => {
    const invalidEnv = { ...validEnv, JWT_ACCESS_SECRET: "short-secret" };
    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it("gagal validasi jika JWT_REFRESH_SECRET kurang dari 32 karakter", () => {
    const invalidEnv = { ...validEnv, JWT_REFRESH_SECRET: "short-secret" };
    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });
});
