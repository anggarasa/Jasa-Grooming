import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@backend/lib/prisma";
import { hashPassword } from "@backend/modules/auth/password.service";
import {
  createSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  getUserActiveSessions,
  SecurityReuseError,
  GRACE_PERIOD_MS,
} from "@backend/modules/auth/session.service";
import { Role } from "@prisma/client";

describe("Auth Session Service (Integration with PostgreSQL)", () => {
  const testEmail = "test-session-runner@pawcare.test";
  let testUserId = "";

  beforeAll(async () => {
    // Bersihkan user pengujian jika ada
    await prisma.user.deleteMany({ where: { email: testEmail } });

    const passwordHash = await hashPassword("TestPassword2026!#");
    const user = await prisma.user.create({
      data: {
        name: "Test User Runner",
        email: testEmail,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it("berhasil membuat sesi baru dan menyimpan record refresh token", async () => {
    const { session, accessToken, refreshToken } = await createSession({
      userId: testUserId,
      userAgent: "Vitest Agent 1.0",
      ipAddress: "127.0.0.1",
    });

    expect(session.id).toBeDefined();
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // Verifikasi di DB
    const savedSession = await prisma.authSession.findUnique({
      where: { id: session.id },
      include: { refreshTokens: true },
    });
    expect(savedSession).not.toBeNull();
    expect(savedSession?.isRevoked).toBe(false);
    expect(savedSession?.refreshTokens.length).toBe(1);
    expect(savedSession?.refreshTokens[0].isUsed).toBe(false);
  });

  it("melakukan rotasi atomik dan menandai token lama sebagai used", async () => {
    const initial = await createSession({
      userId: testUserId,
      userAgent: "Vitest Agent 1.0",
      ipAddress: "127.0.0.1",
    });

    const rotated = await rotateRefreshToken({
      refreshToken: initial.refreshToken,
      ipAddress: "127.0.0.1",
    });

    expect(rotated.refreshToken).not.toBe(initial.refreshToken);
    expect(rotated.accessToken).toBeDefined();

    // Cek di DB
    const sessionRecords = await prisma.refreshTokenRecord.findMany({
      where: { sessionId: initial.session.id },
      orderBy: { createdAt: "asc" },
    });
    expect(sessionRecords.length).toBe(2);
    expect(sessionRecords[0].isUsed).toBe(true);
    expect(sessionRecords[1].isUsed).toBe(false);
    expect(sessionRecords[0].replacedByTokenId).toBe(sessionRecords[1].id);
  });

  it("mentolerir benign concurrent refresh dalam batas grace period", async () => {
    const initial = await createSession({
      userId: testUserId,
      userAgent: "Browser Tab 1",
      ipAddress: "127.0.0.1",
    });

    // Request rotasi pertama (tab 1)
    await rotateRefreshToken({
      refreshToken: initial.refreshToken,
    });

    // Request kedua dengan token yang sama (tab 2 yang terlambat beberapa milidetik)
    const concurrentResult = await rotateRefreshToken({
      refreshToken: initial.refreshToken,
    });

    expect(concurrentResult.accessToken).toBeDefined();
    expect(concurrentResult.session.isRevoked).toBe(false);
  });

  it("mendeteksi reuse token yang melewati grace period dan mencabut seluruh family sesi", async () => {
    const initial = await createSession({
      userId: testUserId,
      userAgent: "Attacker Victim",
      ipAddress: "127.0.0.1",
    });

    // Rotasi pertama
    await rotateRefreshToken({
      refreshToken: initial.refreshToken,
    });

    // Manipulasi replacedAt agar melewati grace period (> 30 detik lalu)
    const oldRecord = await prisma.refreshTokenRecord.findFirst({
      where: { sessionId: initial.session.id, isUsed: true },
    });
    expect(oldRecord).not.toBeNull();

    await prisma.refreshTokenRecord.update({
      where: { id: oldRecord!.id },
      data: {
        replacedAt: new Date(Date.now() - (GRACE_PERIOD_MS + 5000)),
      },
    });

    // Attacker mencoba menggunakan initial.refreshToken yang sudah consumed dan melewati grace period
    await expect(
      rotateRefreshToken({ refreshToken: initial.refreshToken })
    ).rejects.toThrow(SecurityReuseError);

    // Verifikasi family sesi telah dicabut di DB
    const revokedSession = await prisma.authSession.findUnique({
      where: { id: initial.session.id },
    });
    expect(revokedSession?.isRevoked).toBe(true);
  });

  it("mencabut sesi tunggal dan seluruh sesi pengguna", async () => {
    const s1 = await createSession({ userId: testUserId });
    const s2 = await createSession({ userId: testUserId });

    const activeBefore = await getUserActiveSessions(testUserId);
    expect(activeBefore.some((s) => s.id === s1.session.id)).toBe(true);

    // Cabut s1
    await revokeSession(s1.session.id, testUserId);
    const activeAfterSingleRevoke = await getUserActiveSessions(testUserId);
    expect(activeAfterSingleRevoke.some((s) => s.id === s1.session.id)).toBe(false);
    expect(activeAfterSingleRevoke.some((s) => s.id === s2.session.id)).toBe(true);

    // Cabut seluruh sesi
    await revokeAllUserSessions(testUserId);
    const activeAfterAllRevoke = await getUserActiveSessions(testUserId);
    expect(activeAfterAllRevoke.length).toBe(0);
  });
});
