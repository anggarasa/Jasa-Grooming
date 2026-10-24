import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { revokeSession, AuthError } from "@/modules/auth/session.service";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";

export async function DELETE(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const csrfCheck = validateCsrfOrigin(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak diizinkan (CSRF invalid)." },
      { status: 403 }
    );
  }

  try {
    const user = await requireAuth();
    const { id: rawSessionId } = await segmentData.params;
    const sessionId = rawSessionId ? rawSessionId.trim() : "";

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Parameter ID sesi tidak valid." },
        { status: 400 }
      );
    }

    const { getCurrentSessionId } = await import("@/lib/auth/server");
    const currentSessionId = await getCurrentSessionId();

    const success = await revokeSession(sessionId, user.id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak ditemukan." },
        { status: 404 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: "Sesi berhasil dicabut." },
      { status: 200 }
    );

    if (currentSessionId && sessionId === currentSessionId) {
      const { clearAuthCookies } = await import("@/lib/auth/cookies");
      clearAuthCookies(response);
    }

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: "Gagal mencabut sesi." },
      { status: 500 }
    );
  }
}
