import { NextRequest, NextResponse } from "next/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { requireAuth } from "@/lib/auth/server";
import { revokeAllUserSessions, AuthError } from "@/modules/auth/session.service";
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

  try {
    const user = await requireAuth();
    await revokeAllUserSessions(user.id);

    const response = NextResponse.json(
      {
        success: true,
        message: "Seluruh sesi perangkat berhasil dicabut.",
      },
      { status: 200 }
    );

    clearAuthCookies(response);
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Gagal mencabut seluruh sesi." },
      { status: 500 }
    );
  }
}
