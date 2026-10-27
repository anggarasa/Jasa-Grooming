import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getCurrentSessionId } from "@backend/lib/auth/server";
import {
  getUserActiveSessions,
  revokeSession,
  AuthError,
} from "@backend/modules/auth/session.service";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { revokeSessionSchema } from "@backend/modules/auth/schemas";

export async function GET() {
  try {
    const user = await requireAuth();
    const currentSessionId = await getCurrentSessionId();
    const sessions = await getUserActiveSessions(user.id, currentSessionId ?? undefined);

    return NextResponse.json(
      {
        success: true,
        data: { sessions },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar sesi." },
      { status: 500 }
    );
  }
}

// Mendukung POST /api/auth/sessions/revoke atau POST /api/auth/sessions dengan { sessionId }
export async function POST(request: NextRequest) {
  const csrfCheck = validateCsrfOrigin(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak diizinkan (CSRF invalid)." },
      { status: 403 }
    );
  }

  try {
    const user = await requireAuth();
    const currentSessionId = await getCurrentSessionId();

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

    const parsed = revokeSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "ID sesi wajib disertakan." },
        { status: 400 }
      );
    }

    const success = await revokeSession(parsed.data.sessionId, user.id);
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

    // Jika user mencabut sesi yang sedang digunakannya saat ini, bersihkan cookie
    if (currentSessionId && parsed.data.sessionId === currentSessionId) {
      const { clearAuthCookies } = await import("@backend/lib/auth/cookies");
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
