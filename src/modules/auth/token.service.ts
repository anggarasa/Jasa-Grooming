import { SignJWT, jwtVerify } from "jose";
import crypto from "node:crypto";
import { env } from "@/config/env";
import { AccessTokenPayload, RefreshTokenPayload } from "./types";

export const ACCESS_TOKEN_EXPIRATION = "15m";
export const REFRESH_TOKEN_EXPIRATION = "7d";
export const ACCESS_COOKIE_NAME = "tk_access";
export const REFRESH_COOKIE_NAME = "tk_refresh";

// Helper konversi secret string ke Uint8Array untuk jose
function getAccessSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_ACCESS_SECRET);
}

function getRefreshSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_REFRESH_SECRET);
}

/**
 * Buat Access Token JWT (15 menit)
 */
export async function createAccessToken(
  payload: Omit<AccessTokenPayload, "type" | "iss" | "aud">
): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    sid: payload.sid,
    role: payload.role,
    tv: payload.tv,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(getAccessSecretKey());
}

/**
 * Buat Refresh Token JWT (7 hari)
 */
export async function createRefreshToken(
  payload: Omit<RefreshTokenPayload, "type" | "iss" | "aud">
): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    sid: payload.sid,
    jti: payload.jti || crypto.randomUUID(),
    tv: payload.tv,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .sign(getRefreshSecretKey());
}

/**
 * Verifikasi Access Token JWT
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecretKey(), {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (payload.type !== "access" || !payload.sub || !payload.sid) {
      return null;
    }

    return {
      sub: payload.sub as string,
      sid: payload.sid as string,
      role: payload.role as AccessTokenPayload["role"],
      tv: typeof payload.tv === "number" ? payload.tv : 0,
      type: "access",
      iss: payload.iss,
      aud: Array.isArray(payload.aud) ? payload.aud[0] : payload.aud,
    };
  } catch {
    return null;
  }
}

/**
 * Verifikasi Refresh Token JWT
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecretKey(), {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (payload.type !== "refresh" || !payload.sub || !payload.sid) {
      return null;
    }

    return {
      sub: payload.sub as string,
      sid: payload.sid as string,
      jti: payload.jti as string,
      tv: typeof payload.tv === "number" ? payload.tv : 0,
      type: "refresh",
      iss: payload.iss,
      aud: Array.isArray(payload.aud) ? payload.aud[0] : payload.aud,
    };
  } catch {
    return null;
  }
}

/**
 * Hash refresh token (SHA-256) untuk persistensi unik di database tanpa menyimpan token mentah
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
