import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireAuth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { updateProfileSchema } from "@/modules/auth/schemas";
import { AuthError } from "@/modules/auth/session.service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Sesi tidak ditemukan atau telah kedaluwarsa.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          passwordChangedAt: user.passwordChangedAt,
        },
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function PATCH(request: NextRequest) {
  const csrfCheck = validateCsrfOrigin(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak diizinkan (CSRF invalid)." },
      { status: 403 }
    );
  }

  try {
    const user = await requireAuth();

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

    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Format input profil tidak valid.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: validated.data.name },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profil berhasil diperbarui.",
        data: {
          user: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: updated.role,
            lastLoginAt: updated.lastLoginAt,
            passwordChangedAt: updated.passwordChangedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Kesalahan PATCH /api/auth/me:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}

