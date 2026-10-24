import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/modules/auth/token.service";
import { revokeSession } from "@/modules/auth/session.service";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  // 1. Validasi CSRF
  const csrfCheck = validateCsrfOrigin(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak diizinkan (CSRF invalid)." },
      { status: 403 }
    );
  }

  // 2. Ambil token untuk mengidentifikasi sessionId
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  let sessionId: string | null = null;
  let userId: string | null = null;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      sessionId = payload.sid;
      userId = payload.sub;
    }
  }

  if (!sessionId && refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      sessionId = payload.sid;
      userId = payload.sub;
    }
  }

  if (sessionId) {
    await revokeSession(sessionId, userId ?? undefined);
  }

  const response = NextResponse.json(
    {
      success: true,
      message: "Berhasil keluar dari sesi saat ini.",
    },
    { status: 200 }
  );

  clearAuthCookies(response);
  return response;
}
