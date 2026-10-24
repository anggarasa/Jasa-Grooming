import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { User, AuthSession, Prisma } from "@prisma/client";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "./token.service";
import { AuthSessionSummary } from "./types";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
export const GRACE_PERIOD_MS = 30 * 1000; // 30 detik toleransi request konkuren benign

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export class SecurityReuseError extends AuthError {
  constructor(message = "Terdeteksi penggunaan ulang refresh token. Seluruh sesi telah dicabut demi keamanan.") {
    super(message, 401);
    this.name = "SecurityReuseError";
  }
}

/**
 * Mencatat log audit otentikasi ke database
 */
export async function createAuditLog(params: {
  userId?: string | null;
  action: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    return await prisma.authAuditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Audit log failure tidak boleh memutus flow utama
    console.error("Gagal menulis audit log:", error);
    return null;
  }
}

/**
 * Membuat sesi baru dan menerbitkan pasangan access & refresh token awal
 */
export async function createSession(params: {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<{
  session: AuthSession;
  accessToken: string;
  refreshToken: string;
  user: User;
}> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  if (!user || !user.isActive) {
    throw new AuthError("Pengguna tidak ditemukan atau berstatus tidak aktif.", 403);
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // Buat session di DB
  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      userAgent: params.userAgent ?? null,
      ipAddress: params.ipAddress ?? null,
      expiresAt,
    },
  });

  const jti = crypto.randomUUID();
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
      tv: user.tokenVersion,
    }),
    createRefreshToken({
      sub: user.id,
      sid: session.id,
      jti,
      tv: user.tokenVersion,
    }),
  ]);

  // Simpan record refresh token hash
  await prisma.refreshTokenRecord.create({
    data: {
      sessionId: session.id,
      tokenHash: hashToken(refreshToken),
      isUsed: false,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "AUTH_LOGIN_SUCCESS",
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    metadata: { sessionId: session.id },
  });

  return {
    session,
    accessToken,
    refreshToken,
    user,
  };
}

/**
 * Melakukan rotasi atomik refresh token dengan deteksi reuse & toleransi benign concurrent grace period
 */
export async function rotateRefreshToken(params: {
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  session: AuthSession;
  user: User;
}> {
  const payload = await verifyRefreshToken(params.refreshToken);
  if (!payload) {
    throw new AuthError("Refresh token tidak valid atau telah kedaluwarsa.");
  }

  const tokenHash = hashToken(params.refreshToken);

  // Cari record refresh token beserta session dan user
  const tokenRecord = await prisma.refreshTokenRecord.findUnique({
    where: { tokenHash },
    include: {
      session: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!tokenRecord) {
    throw new AuthError("Sesi refresh token tidak ditemukan.");
  }

  const { session } = tokenRecord;
  const { user } = session;

  // Cek apakah sesi telah dicabut atau pengguna dinonaktifkan
  if (session.isRevoked) {
    throw new AuthError("Sesi telah dicabut. Silakan masuk kembali.");
  }

  if (session.expiresAt <= new Date()) {
    throw new AuthError("Sesi telah kedaluwarsa.");
  }

  if (!user.isActive) {
    throw new AuthError("Akun pengguna tidak aktif.", 403);
  }

  if (user.tokenVersion !== payload.tv) {
    throw new AuthError("Kredensial sesi tidak lagi berlaku. Silakan masuk kembali.");
  }

  const now = new Date();

  // Deteksi jika token sudah pernah digunakan (consumed)
  if (tokenRecord.isUsed) {
    const isWithinGracePeriod =
      tokenRecord.replacedAt &&
      now.getTime() - tokenRecord.replacedAt.getTime() <= GRACE_PERIOD_MS;

    if (isWithinGracePeriod) {
      // Kasus benign request konkuren (misal 2 tab browser refresh bersamaan)
      // Terbitkan accessToken valid tanpa membatalkan session family
      const accessToken = await createAccessToken({
        sub: user.id,
        sid: session.id,
        role: user.role,
        tv: user.tokenVersion,
      });

      return {
        accessToken,
        refreshToken: params.refreshToken,
        session,
        user,
      };
    }

    // MELEWATI GRACE PERIOD -> REUSE DETECTED!
    // Cabut seluruh family session ini untuk mencegah eksploitasi token curian
    await prisma.authSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    await createAuditLog({
      userId: user.id,
      action: "AUTH_TOKEN_REUSE_DETECTED",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        sessionId: session.id,
        reusedTokenRecordId: tokenRecord.id,
      },
    });

    throw new SecurityReuseError();
  }

  // Rotasi normal secara atomik menggunakan Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // Verifikasi ulang di dalam transaksi untuk menangani race condition konkuren bersamaan
    const freshRecord = await tx.refreshTokenRecord.findUnique({
      where: { id: tokenRecord.id },
    });

    if (!freshRecord) {
      throw new AuthError("Sesi refresh token tidak ditemukan.");
    }

    if (freshRecord.isUsed) {
      const isWithinGrace =
        freshRecord.replacedAt &&
        now.getTime() - freshRecord.replacedAt.getTime() <= GRACE_PERIOD_MS;

      if (isWithinGrace) {
        const accessToken = await createAccessToken({
          sub: user.id,
          sid: session.id,
          role: user.role,
          tv: user.tokenVersion,
        });

        return {
          accessToken,
          refreshToken: params.refreshToken,
          session,
          user,
        };
      }

      await tx.authSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });

      throw new SecurityReuseError();
    }

    const newJti = crypto.randomUUID();
    const newRefreshToken = await createRefreshToken({
      sub: user.id,
      sid: session.id,
      jti: newJti,
      tv: user.tokenVersion,
    });
    const newTokenHash = hashToken(newRefreshToken);

    const newRecord = await tx.refreshTokenRecord.create({
      data: {
        sessionId: session.id,
        tokenHash: newTokenHash,
        isUsed: false,
      },
    });

    await tx.refreshTokenRecord.update({
      where: { id: tokenRecord.id },
      data: {
        isUsed: true,
        replacedByTokenId: newRecord.id,
        replacedAt: now,
      },
    });

    const updatedSession = await tx.authSession.update({
      where: { id: session.id },
      data: {
        updatedAt: now,
        userAgent: params.userAgent ?? session.userAgent,
        ipAddress: params.ipAddress ?? session.ipAddress,
      },
    });

    const accessToken = await createAccessToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
      tv: user.tokenVersion,
    });

    await createAuditLog({
      userId: user.id,
      action: "AUTH_TOKEN_ROTATED",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { sessionId: session.id },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      session: updatedSession,
      user,
    };
  });
}

/**
 * Mencabut sesi tertentu (misal logout perangkat tunggal)
 */
export async function revokeSession(
  sessionId: string,
  userId?: string
): Promise<boolean> {
  const session = await prisma.authSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return false;
  }

  if (userId && session.userId !== userId) {
    throw new AuthError("Tidak memiliki otoritas untuk mencabut sesi ini.", 403);
  }

  await prisma.authSession.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });

  await createAuditLog({
    userId: session.userId,
    action: "AUTH_SESSION_REVOKED",
    metadata: { sessionId },
  });

  return true;
}

/**
 * Mencabut seluruh sesi pengguna (logout all devices), dengan opsi mengecualikan sesi saat ini
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  const result = await prisma.authSession.updateMany({
    where: {
      userId,
      isRevoked: false,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { isRevoked: true },
  });

  await createAuditLog({
    userId,
    action: exceptSessionId ? "AUTH_REVOKE_OTHER_SESSIONS" : "AUTH_LOGOUT_ALL",
    metadata: { revokedCount: result.count, exceptSessionId },
  });

  return result.count;
}

/**
 * Mengambil daftar sesi aktif milik pengguna
 */
export async function getUserActiveSessions(
  userId: string,
  currentSessionId?: string
): Promise<AuthSessionSummary[]> {
  const sessions = await prisma.authSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    expiresAt: s.expiresAt,
    isCurrent: s.id === currentSessionId,
  }));
}
