import { NextRequest, NextResponse } from "next/server";
import { login } from "@/modules/auth/auth.service";
import { loginSchema } from "@/modules/auth/schemas";
import { checkRateLimit, resetRateLimit } from "@/modules/auth/rate-limit.service";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { setAuthCookies } from "@/lib/auth/cookies";
import { AuthError } from "@/modules/auth/session.service";

function getClientMetadata(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return { ipAddress: ip, userAgent };
}

export async function POST(request: NextRequest) {
  // 1. Validasi CSRF Origin
  const csrfCheck = validateCsrfOrigin(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak diizinkan (CSRF invalid)." },
      { status: 403 }
    );
  }

  // 2. Proteksi Brute-Force Rate Limiting (5x dalam 60 detik per IP)
  const { ipAddress, userAgent } = getClientMetadata(request);
  const rateLimit = checkRateLimit(`login:${ipAddress}`, 5, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Terlalu banyak percobaan masuk. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.retryAfterSeconds.toString(),
        },
      }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Format data permintaan tidak valid atau body kosong.",
        },
        { status: 400 }
      );
    }

    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Input tidak valid.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { user, accessToken, refreshToken } = await login(validated.data, {
      ipAddress,
      userAgent,
    });

    // Reset rate limiter setelah login sukses
    resetRateLimit(`login:${ipAddress}`);

    const response = NextResponse.json(
      {
        success: true,
        data: { user },
        message: "Berhasil masuk ke sistem.",
      },
      { status: 200 }
    );

    // Set secure HttpOnly cookies
    setAuthCookies(response, { accessToken, refreshToken });

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Kesalahan internal login handler:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server saat memproses login.",
      },
      { status: 500 }
    );
  }
}
