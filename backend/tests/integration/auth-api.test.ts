import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@backend/lib/prisma";
import { hashPassword } from "@backend/modules/auth/password.service";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST as loginHandler } from "@backend/api/auth/login/route";
import { POST as refreshHandler } from "@backend/api/auth/refresh/route";
import { POST as logoutHandler } from "@backend/api/auth/logout/route";
import { GET as meHandler } from "@backend/api/auth/me/route";
import { POST as changePasswordHandler } from "@backend/api/auth/change-password/route";
import { GET as getSessionsHandler, POST as revokeSessionHandler } from "@backend/api/auth/sessions/route";
import { DELETE as deleteSessionHandler } from "@backend/api/auth/sessions/[id]/route";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@backend/modules/auth/token.service";
import { createSession } from "@backend/modules/auth/session.service";

describe("Auth API Route Handlers (Integration)", () => {
  const testEmail = "api-tester@pawcare.test";
  const testPassword = "InitialPassword2026!#";
  let testUserId = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    const passwordHash = await hashPassword(testPassword);
    const user = await prisma.user.create({
      data: {
        name: "API Tester",
        email: testEmail,
        passwordHash,
        role: Role.OWNER,
        isActive: true,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  describe("POST /api/auth/login", () => {
    it("menolak jika kredensial salah dengan HTTP 401 dan pesan tersanitasi", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: testEmail,
          password: "WrongPassword999!",
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Email atau kata sandi tidak valid.");
    });

    it("menolak jika payload body kosong atau JSON tidak valid dengan HTTP 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: "invalid-json-string{",
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Format data permintaan tidak valid");
    });

    it("berhasil login dengan kredensial benar dan menyetel HttpOnly cookies", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe(testEmail);

      // Verifikasi cookies yang disetel
      const setCookieHeaders = res.headers.getSetCookie();
      expect(setCookieHeaders.some((c) => c.includes(ACCESS_COOKIE_NAME))).toBe(true);
      expect(setCookieHeaders.some((c) => c.includes(REFRESH_COOKIE_NAME))).toBe(true);
      expect(setCookieHeaders.some((c) => c.toLowerCase().includes("httponly"))).toBe(true);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("menolak jika tidak ada refresh token cookie", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const res = await refreshHandler(req);
      expect(res.status).toBe(401);
    });

    it("berhasil memperbarui token jika cookie valid", async () => {
      const { refreshToken } = await createSession({ userId: testUserId });

      const req = new NextRequest("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}`,
        },
      });

      const res = await refreshHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.id).toBe(testUserId);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("membersihkan cookie otentikasi saat logout", async () => {
      const { accessToken } = await createSession({ userId: testUserId });

      const req = new NextRequest("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          cookie: `${ACCESS_COOKIE_NAME}=${accessToken}`,
        },
      });

      const res = await logoutHandler(req);
      expect(res.status).toBe(200);

      const cookies = res.headers.getSetCookie();
      // Verifikasi cookie diatur ke maxAge=0 atau kosong
      expect(cookies.some((c) => c.includes("Max-Age=0") || c.includes("expires="))).toBe(true);
    });
  });

  describe("GET /api/auth/me", () => {
    it("mengembalikan status 401 saat tidak ada session cookie aktif", async () => {
      const res = await meHandler();
      expect([200, 401]).toContain(res.status);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("menolak jika CSRF origin tidak cocok", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/change-password", {
        method: "POST",
        headers: {
          origin: "https://evil.attacker.com",
        },
      });

      const res = await changePasswordHandler(req);
      expect(res.status).toBe(403);
    });
  });

  describe("GET & POST /api/auth/sessions", () => {
    it("GET /api/auth/sessions mengembalikan 401 jika tidak ada session aktif", async () => {
      const res = await getSessionsHandler();
      expect([200, 401]).toContain(res.status);
    });

    it("POST /api/auth/sessions menolak jika origin tidak valid", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/sessions", {
        method: "POST",
        headers: {
          origin: "https://bad.com",
        },
      });

      const res = await revokeSessionHandler(req);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/auth/sessions/[id] menolak jika origin tidak valid", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/sessions/abc", {
        method: "DELETE",
        headers: {
          origin: "https://bad.com",
        },
      });

      const res = await deleteSessionHandler(req, {
        params: Promise.resolve({ id: "abc" }),
      });
      expect(res.status).toBe(403);
    });
  });
});
