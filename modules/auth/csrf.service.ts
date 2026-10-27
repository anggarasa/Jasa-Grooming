import { NextRequest } from "next/server";
import { env } from "@backend/config/env";

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validasi CSRF berbasis Origin / Referer untuk metode mutasi (POST, PUT, PATCH, DELETE).
 */
export function validateCsrfOrigin(request: NextRequest): CsrfValidationResult {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const rawHost = request.headers.get("host") || request.headers.get("x-forwarded-host");
  const hostHeader = rawHost ? rawHost.split(",")[0].trim() : null;

  // Siapkan daftar host/origin yang diizinkan
  const allowedOrigins: string[] = [];
  try {
    const configuredUrl = new URL(env.NEXT_PUBLIC_APP_URL);
    allowedOrigins.push(configuredUrl.origin.toLowerCase());
  } catch {
    // fallback jika env format tidak valid
  }

  // Jika ada host header, tambahkan http & https variant
  if (hostHeader) {
    allowedOrigins.push(`http://${hostHeader.toLowerCase()}`);
    allowedOrigins.push(`https://${hostHeader.toLowerCase()}`);
  }

  // 1. Cek Origin Header jika ada
  if (originHeader) {
    try {
      const parsedOrigin = new URL(originHeader).origin.toLowerCase();
      if (allowedOrigins.includes(parsedOrigin)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Origin tidak diizinkan: ${originHeader}`,
      };
    } catch {
      return {
        valid: false,
        reason: "Format Origin header tidak valid",
      };
    }
  }

  // 2. Fallback ke Referer Header jika Origin tidak dikirim
  if (refererHeader) {
    try {
      const parsedRefererOrigin = new URL(refererHeader).origin.toLowerCase();
      if (allowedOrigins.includes(parsedRefererOrigin)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Referer origin tidak diizinkan: ${refererHeader}`,
      };
    } catch {
      return {
        valid: false,
        reason: "Format Referer header tidak valid",
      };
    }
  }

  // Jika mutasi tidak menyertakan Origin maupun Referer
  return {
    valid: false,
    reason: "Header Origin atau Referer wajib ada untuk request mutasi",
  };
}
