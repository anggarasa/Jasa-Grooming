import "server-only";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "@backend/lib/prisma";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  verifyAccessToken,
} from "@backend/modules/auth/token.service";
import { AuthenticatedUser } from "@backend/modules/auth/types";
import { AuthError } from "@backend/modules/auth/session.service";

/**
 * Mengambil data pengguna yang sedang login dari cookie sesi aktif
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const payload = await verifyAccessToken(token);
    if (!payload || !payload.sub) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
      return null;
    }

    // Pastikan session juga masih aktif di DB
    if (payload.sid) {
      const session = await prisma.authSession.findUnique({
        where: { id: payload.sid },
      });
      if (!session || session.isRevoked || session.expiresAt <= new Date()) {
        return null;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.passwordChangedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Mengambil ID sesi saat ini dari cookie access token
 */
export async function getCurrentSessionId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyAccessToken(token);
    return payload?.sid ?? null;
  } catch {
    return null;
  }
}

/**
 * Mengambil data sesi saat ini dari database
 */
export async function getCurrentSession() {
  const sid = await getCurrentSessionId();
  if (!sid) return null;

  return prisma.authSession.findUnique({
    where: { id: sid },
  });
}

/**
 * Guard server-side: memastikan pengguna terotentikasi, melempar AuthError jika tidak
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
  }
  return user;
}

/**
 * Guard server-side: memastikan pengguna memiliki role yang diizinkan
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", 403);
  }
  return user;
}

/**
 * Guard server-side: memastikan pengguna adalah OWNER
 */
export async function assertOwner(): Promise<AuthenticatedUser> {
  return requireRole([Role.OWNER]);
}

/**
 * Mengambil refresh token dari cookie
 */
export async function getRefreshTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}
