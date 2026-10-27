import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { requireAuth, getCurrentSessionId } from "@backend/lib/auth/server";
import { changePassword } from "@backend/modules/auth/auth.service";
import { changePasswordSchema } from "@backend/modules/auth/schemas";
import { checkRateLimit } from "@backend/modules/auth/rate-limit.service";
import { setAuthCookies } from "@backend/lib/auth/cookies";
import { AuthError } from "@backend/modules/auth/session.service";

function getClientMetadata(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return { ipAddress: ip, userAgent };
}

export async function POST(request: NextRequest) {
  // 1. Validasi CSRF
  const csrfCheck = validateCsrfOrigin(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak diizinkan (CSRF invalid)." },
      { status: 403 }
    );
  }

  try {
    // 2. Autentikasi Pengguna
    const user = await requireAuth();

    // 3. Rate Limit per Pengguna (5x per 15 menit)
    const rateLimit = checkRateLimit(`change-password:${user.id}`, 5, 15 * 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak permintaan ganti kata sandi. Coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

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

    const validated = changePasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Format input kata sandi tidak valid.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getClientMetadata(request);
    const currentSessionId = await getCurrentSessionId();

    const result = await changePassword(
      user.id,
      validated.data,
      currentSessionId ?? undefined,
      { ipAddress, userAgent }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Kata sandi berhasil diperbarui. Seluruh sesi di perangkat lain telah dicabut.",
      },
      { status: 200 }
    );

    // Perbarui cookies dengan tokenVersion baru agar sesi ini tetap aktif
    if (result.newAccessToken && result.newRefreshToken) {
      setAuthCookies(response, {
        accessToken: result.newAccessToken,
        refreshToken: result.newRefreshToken,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Kesalahan change-password:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui kata sandi." },
      { status: 500 }
    );
  }
}
