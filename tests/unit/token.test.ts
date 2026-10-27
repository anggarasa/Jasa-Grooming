import { describe, it, expect } from "vitest";
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from "@backend/modules/auth/token.service";
import { SignJWT } from "jose";
import { env } from "@backend/config/env";

describe("Token Service (JWT with jose)", () => {
  const dummyPayload = {
    sub: "user-test-123",
    sid: "session-test-456",
    role: "OWNER" as const,
    tv: 0,
  };

  it("berhasil membuat dan memverifikasi Access Token valid", async () => {
    const token = await createAccessToken(dummyPayload);
    expect(typeof token).toBe("string");

    const verified = await verifyAccessToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(dummyPayload.sub);
    expect(verified?.sid).toBe(dummyPayload.sid);
    expect(verified?.role).toBe("OWNER");
    expect(verified?.tv).toBe(0);
    expect(verified?.type).toBe("access");
  });

  it("berhasil membuat dan memverifikasi Refresh Token valid", async () => {
    const token = await createRefreshToken({
      sub: dummyPayload.sub,
      sid: dummyPayload.sid,
      jti: "custom-jti-789",
      tv: dummyPayload.tv,
    });
    expect(typeof token).toBe("string");

    const verified = await verifyRefreshToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(dummyPayload.sub);
    expect(verified?.sid).toBe(dummyPayload.sid);
    expect(verified?.jti).toBe("custom-jti-789");
    expect(verified?.type).toBe("refresh");
  });

  it("memisahkan secret access token dan refresh token (cross-verification harus gagal)", async () => {
    const accessToken = await createAccessToken(dummyPayload);
    // Verifikasi access token dengan secret refresh token
    const invalidAsRefresh = await verifyRefreshToken(accessToken);
    expect(invalidAsRefresh).toBeNull();

    const refreshToken = await createRefreshToken({
      sub: dummyPayload.sub,
      sid: dummyPayload.sid,
      jti: "jti-123",
      tv: 0,
    });
    // Verifikasi refresh token dengan secret access token
    const invalidAsAccess = await verifyAccessToken(refreshToken);
    expect(invalidAsAccess).toBeNull();
  });

  it("menolak token yang telah dimanipulasi (tampered signature)", async () => {
    const token = await createAccessToken(dummyPayload);
    const parts = token.split(".");
    // Manipulasi payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...dummyPayload, role: "ADMIN" })
    ).toString("base64url");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const verified = await verifyAccessToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it("menolak token yang telah kedaluwarsa", async () => {
    const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
    const expiredToken = await new SignJWT({
      sub: dummyPayload.sub,
      sid: dummyPayload.sid,
      role: dummyPayload.role,
      tv: dummyPayload.tv,
      type: "access",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(env.JWT_ISSUER)
      .setAudience(env.JWT_AUDIENCE)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(secret);

    const verified = await verifyAccessToken(expiredToken);
    expect(verified).toBeNull();
  });

  it("hashToken menghasilkan SHA-256 hash konsisten berukuran 64 karakter hex", () => {
    const token = "sample-refresh-token-string";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });
});
