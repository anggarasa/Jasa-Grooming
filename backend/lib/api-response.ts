import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@backend/modules/auth/session.service";

export interface ApiResponseSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiSuccess<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
      data,
    },
    { status }
  );
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Global API error handler helper to standardize errors across routes
 */
export function handleApiError(error: unknown, fallbackMessage = "Terjadi kesalahan internal server.") {
  if (error instanceof AuthError) {
    const code = error.statusCode === 401 ? "UNAUTHORIZED" : error.statusCode === 403 ? "FORBIDDEN" : "AUTH_ERROR";
    return apiError(error.message, code, error.statusCode);
  }

  if (error instanceof ZodError) {
    return apiError("Validasi input gagal.", "VALIDATION_ERROR", 400, error.flatten().fieldErrors);
  }

  if (error instanceof Error) {
    const customStatus = (error as { statusCode?: number }).statusCode;
    const customCode = (error as { code?: string }).code;
    if (customStatus && typeof customStatus === "number") {
      return apiError(error.message, customCode || "ERROR", customStatus);
    }

    const isPrismaError = error.constructor?.name?.startsWith("PrismaClient") || error.name?.includes("Prisma");
    if (isPrismaError) {
      console.error("Prisma Database Error:", error);
      if (error.message.includes("Unique constraint")) {
        return apiError("Data dengan informasi tersebut sudah terdaftar.", "CONFLICT", 409);
      }
      return apiError("Terjadi kesalahan pada basis data server.", "DATABASE_ERROR", 500);
    }

    if (error.message.includes("tidak ditemukan") || error.message.includes("Not found") || error.message.includes("404")) {
      return apiError(error.message, "NOT_FOUND", 404);
    }
    if (error.message.includes("sudah digunakan") || error.message.includes("Unique constraint")) {
      return apiError(error.message, "CONFLICT", 409);
    }
    return apiError(error.message, "BAD_REQUEST", 400);
  }

  console.error("Unhandled API Error:", error);
  return apiError(fallbackMessage, "INTERNAL_SERVER_ERROR", 500);
}
