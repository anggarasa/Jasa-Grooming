import { z } from "zod";

// Load .env.local dan .env secara otomatis di Node.js runtime/test/worker jika belum terisi
if (typeof process !== "undefined") {
  try {
    if (typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile(".env.local");
      } catch {
        // Abaikan jika file .env.local tidak ditemukan
      }
      try {
        process.loadEnvFile(".env");
      } catch {
        // Abaikan jika file .env tidak ditemukan
      }
    }
  } catch {
    // Abaikan jika gagal memuat file env
  }
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z
    .preprocess((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() === "true";
      return false;
    }, z.boolean())
    .default(false),
  MINIO_ACCESS_KEY: z.string().min(1, "MINIO_ACCESS_KEY is required"),
  MINIO_SECRET_KEY: z.string().min(1, "MINIO_SECRET_KEY is required"),
  MINIO_BUCKET: z.string().default("tampilkit-booking"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long")
    .default("pawcare-access-secret-key-min-32-chars-long-tampilkit"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters long")
    .default("pawcare-refresh-secret-key-min-32-chars-long-tampilkit"),
  JWT_ISSUER: z.string().default("pawcare-grooming"),
  JWT_AUDIENCE: z.string().default("pawcare-admin"),

  // Google Calendar Integration (Phase 07)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:3000/api/integrations/google/callback"),
  GOOGLE_OAUTH_STATE_SECRET: z
    .string()
    .min(32, "GOOGLE_OAUTH_STATE_SECRET must be at least 32 characters long")
    .default("google-oauth-state-secret-min-32-chars-long-tampilkit"),
  GOOGLE_TOKEN_ENCRYPTION_KEY: z
    .string()
    .min(32, "GOOGLE_TOKEN_ENCRYPTION_KEY must be at least 32 characters long")
    .default("pawcare-google-token-encryption-key-min-32-chars!"),
  GOOGLE_CALENDAR_SYNC_ENABLED: z
    .preprocess((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() === "true";
      return false;
    }, z.boolean())
    .default(false),
  GOOGLE_CALENDAR_WEBHOOK_URL: z.string().url().optional(),
  GOOGLE_CALENDAR_WEBHOOK_TOKEN: z.string().optional(),
  GOOGLE_CALENDAR_SYNC_INTERVAL_MINUTES: z.coerce.number().default(15),
  GOOGLE_CALENDAR_RETRY_MAX_ATTEMPTS: z.coerce.number().default(5),
  GOOGLE_CALENDAR_FREEBUSY_TIMEOUT_MS: z.coerce.number().default(2000),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(customEnv?: Record<string, unknown>): Env {
  const envSource = customEnv ?? process.env;
  const parsed = envSchema.safeParse(envSource);

  if (!parsed.success) {
    console.error(
      "❌ Konfigurasi Environment Tidak Valid:",
      JSON.stringify(parsed.error.format(), null, 2)
    );
    throw new Error(
      `Variabel environment tidak valid: ${Object.keys(
        parsed.error.flatten().fieldErrors
      ).join(", ")}`
    );
  }

  return parsed.data;
}

export const env = validateEnv();
export { envSchema, validateEnv };
