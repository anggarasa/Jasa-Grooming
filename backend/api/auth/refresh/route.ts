import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken, AuthError } from "@backend/modules/auth/session.service";
import { REFRESH_COOKIE_NAME } from "@backend/modules/auth/token.service";
import { checkRateLimit } from "@backend/modules/auth/rate-limit.service";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { setAuthCookies, clearAuthCookies } from "@backend/lib/auth/cookies";

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

  // 2. Rate limit refresh (30 per 60s per IP)
  const { ipAddress, userAgent } = getClientMetadata(request);
  const rateLimit = checkRateLimit(`refresh:${ipAddress}`, 30, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak permintaan refresh token." },
      { status: 429 }
    );
  }

  // 3. Ambil refresh token dari cookie
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    const errorResponse = NextResponse.json(
      { success: false, error: "Refresh token tidak ditemukan di sesi." },
      { status: 401 }
    );
    clearAuthCookies(errorResponse);
    return errorResponse;
  }

  try {
    const { accessToken, refreshToken: newRefreshToken, user } =
      await rotateRefreshToken({
        refreshToken,
        ipAddress,
        userAgent,
      });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        message: "Token berhasil diperbarui.",
      },
      { status: 200 }
    );

    // Update kedua cookie
    setAuthCookies(response, {
      accessToken,
      refreshToken: newRefreshToken,
    });

    return response;
  } catch (error) {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error:
          error instanceof AuthError
            ? error.message
            : "Gagal memperbarui sesi otentikasi.",
      },
      { status: error instanceof AuthError ? error.statusCode : 401 }
    );

    // Bersihkan cookie yang tidak valid/dicabut
    clearAuthCookies(errorResponse);
    return errorResponse;
  }
}
