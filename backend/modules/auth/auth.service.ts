import { prisma } from "@backend/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} from "./password.service";
import {
  createSession,
  revokeSession,
  revokeAllUserSessions,
  createAuditLog,
  AuthError,
} from "./session.service";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
} from "./token.service";
import {
  LoginInput,
  loginSchema,
  ChangePasswordInput,
  changePasswordSchema,
} from "./schemas";
import { AuthenticatedUser } from "./types";
import crypto from "node:crypto";

export async function login(
  input: LoginInput,
  metadata?: { ipAddress?: string | null; userAgent?: string | null }
) {
  const validated = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!user) {
    await createAuditLog({
      action: "AUTH_LOGIN_FAILED",
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata: { email: validated.email, reason: "USER_NOT_FOUND" },
    });
    throw new AuthError("Email atau kata sandi tidak valid.", 401);
  }

  const { matches, needsRehash } = await verifyPassword(
    validated.password,
    user.passwordHash
  );

  if (!matches) {
    await createAuditLog({
      userId: user.id,
      action: "AUTH_LOGIN_FAILED",
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata: { reason: "INVALID_CREDENTIALS" },
    });
    throw new AuthError("Email atau kata sandi tidak valid.", 401);
  }

  if (!user.isActive) {
    await createAuditLog({
      userId: user.id,
      action: "AUTH_LOGIN_BLOCKED",
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata: { reason: "ACCOUNT_INACTIVE" },
    });
    throw new AuthError("Akun Anda telah dinonaktifkan.", 403);
  }

  // Jika hash sebelumnya adalah bcrypt, migrasikan transparan ke Argon2id
  if (needsRehash) {
    const newArgonHash = await hashPassword(validated.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newArgonHash },
    });
  }

  // Update lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { session, accessToken, refreshToken } = await createSession({
    userId: user.id,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });

  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
    isActive: user.isActive,
    lastLoginAt: new Date(),
    passwordChangedAt: user.passwordChangedAt,
  };

  return {
    user: authenticatedUser,
    session,
    accessToken,
    refreshToken,
  };
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  currentSessionId?: string,
  metadata?: { ipAddress?: string | null; userAgent?: string | null }
) {
  const validated = changePasswordSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AuthError("Pengguna tidak ditemukan.", 404);
  }

  const { matches } = await verifyPassword(
    validated.currentPassword,
    user.passwordHash
  );

  if (!matches) {
    throw new AuthError("Kata sandi saat ini tidak valid.", 400);
  }

  const policy = validatePasswordPolicy(validated.newPassword);
  if (!policy.valid) {
    throw new AuthError(policy.error || "Kebijakan kata sandi tidak terpenuhi.", 400);
  }

  const newHash = await hashPassword(validated.newPassword);

  // Update password, perbarui tokenVersion untuk membatalkan token lama di perangkat lain
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
      tokenVersion: { increment: 1 },
    },
  });

  // Cabut sesi lain kecuali sesi saat ini
  await revokeAllUserSessions(userId, currentSessionId);

  await createAuditLog({
    userId,
    action: "AUTH_PASSWORD_CHANGED",
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    metadata: { currentSessionId },
  });

  // Jika ada currentSessionId, terbitkan token baru dengan tokenVersion terupdate
  let newAccessToken: string | null = null;
  let newRefreshToken: string | null = null;

  if (currentSessionId) {
    const jti = crypto.randomUUID();
    const [access, refresh] = await Promise.all([
      createAccessToken({
        sub: user.id,
        sid: currentSessionId,
        role: user.role,
        tv: updatedUser.tokenVersion,
      }),
      createRefreshToken({
        sub: user.id,
        sid: currentSessionId,
        jti,
        tv: updatedUser.tokenVersion,
      }),
    ]);

    await prisma.refreshTokenRecord.create({
      data: {
        sessionId: currentSessionId,
        tokenHash: hashToken(refresh),
        isUsed: false,
      },
    });

    newAccessToken = access;
    newRefreshToken = refresh;
  }

  return {
    success: true,
    user: updatedUser,
    newAccessToken,
    newRefreshToken,
  };
}

export async function logout(sessionId?: string, userId?: string) {
  if (sessionId) {
    await revokeSession(sessionId, userId);
  }
}

export async function logoutAll(userId: string) {
  await revokeAllUserSessions(userId);
}
