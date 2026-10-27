import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@backend/lib/prisma";
import {
  generateGoogleAuthUrl,
  getValidAccessToken,
  GOOGLE_CALENDAR_SCOPES,
} from "@backend/modules/integrations/google/google-oauth.service";
import { getBusinessCalendarClient } from "@backend/modules/integrations/google/calendar-client.factory";
import { encrypt } from "@backend/lib/encryption";
import { env } from "@backend/config/env";

// Mock googleapis
const mockRefreshAccessToken = vi.fn();
const mockOAuth2ClientInstance = {
  generateAuthUrl: vi.fn((opts: Record<string, unknown>) => {
    const params = new URLSearchParams();
    if (opts.access_type) params.set("access_type", String(opts.access_type));
    if (opts.prompt) params.set("prompt", String(opts.prompt));
    if (opts.state) params.set("state", String(opts.state));
    if (Array.isArray(opts.scope)) params.set("scope", opts.scope.join(" "));
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }),
  setCredentials: vi.fn(),
  refreshAccessToken: mockRefreshAccessToken,
  getToken: vi.fn(),
};

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(function () {
        return mockOAuth2ClientInstance;
      }),
    },
    calendar: vi.fn().mockReturnValue({
      calendarList: { list: vi.fn() },
      events: { list: vi.fn(), insert: vi.fn() },
      freebusy: { query: vi.fn() },
    }),
    oauth2: vi.fn().mockReturnValue({
      userinfo: {
        get: vi.fn().mockResolvedValue({
          data: { id: "mock-google-id", email: "owner@test.com" },
        }),
      },
    }),
  },
}));

describe("Google OAuth & Token Management Service", () => {
  let testBusinessId: string;
  let testConnectionId: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Ensure dummy OAuth credentials in env
    (env as { GOOGLE_CLIENT_ID: string }).GOOGLE_CLIENT_ID = "mock-client-id";
    (env as { GOOGLE_CLIENT_SECRET: string }).GOOGLE_CLIENT_SECRET = "mock-client-secret";

    // Use isolated test business fixture so primary business is never contaminated
    const business = await prisma.business.upsert({
      where: { slug: "test-fixture-biz-oauth" },
      create: {
        id: "test-fixture-biz-oauth-id",
        name: "Test OAuth Fixture",
        slug: "test-fixture-biz-oauth",
      },
      update: {},
    });
    testBusinessId = business.id;

    // Reset connection
    const conn = await prisma.calendarConnection.upsert({
      where: {
        businessId_provider: {
          businessId: testBusinessId,
          provider: "GOOGLE",
        },
      },
      create: {
        businessId: testBusinessId,
        provider: "GOOGLE",
        calendarId: "primary",
        status: "ACTIVE",
        encryptedAccessToken: encrypt("valid-access-token"),
        encryptedRefreshToken: encrypt("valid-refresh-token"),
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour ahead
      },
      update: {
        status: "ACTIVE",
        calendarId: "primary",
        encryptedAccessToken: encrypt("valid-access-token"),
        encryptedRefreshToken: encrypt("valid-refresh-token"),
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });
    testConnectionId = conn.id;
  });

  afterAll(async () => {
    try {
      await prisma.calendarConnection.deleteMany({
        where: { businessId: "test-fixture-biz-oauth-id" },
      });
      await prisma.business.deleteMany({
        where: { id: "test-fixture-biz-oauth-id" },
      });
    } catch {}
  });

  describe("generateGoogleAuthUrl", () => {
    it("menghasilkan URL otentikasi Google lengkap dengan access_type offline dan prompt consent", () => {
      const url = generateGoogleAuthUrl({
        businessId: testBusinessId,
        userId: "test-user-123",
      });

      expect(url).toContain("accounts.google.com");
      expect(url).toContain("access_type=offline");
      expect(url).toContain("prompt=consent");
      expect(url).toContain("state=");
      expect(GOOGLE_CALENDAR_SCOPES).toContain("https://www.googleapis.com/auth/calendar");
    });
  });

  describe("getValidAccessToken", () => {
    it("mengembalikan token tersimpan secara langsung jika belum kedaluwarsa (> 5 menit)", async () => {
      const token = await getValidAccessToken(testConnectionId);
      expect(token).toBe("valid-access-token");
      expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    });

    it("secara otomatis merefresh token ketika access token mendekati kedaluwarsa (<= 5 menit)", async () => {
      // Set expired or near-expiry token (expired 10 minutes ago)
      await prisma.calendarConnection.update({
        where: { id: testConnectionId },
        data: {
          tokenExpiresAt: new Date(Date.now() - 10 * 60 * 1000),
        },
      });

      mockRefreshAccessToken.mockResolvedValueOnce({
        credentials: {
          access_token: "newly-refreshed-token",
          expiry_date: Date.now() + 3600 * 1000,
        },
      });

      const token = await getValidAccessToken(testConnectionId);
      expect(token).toBe("newly-refreshed-token");
      expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);

      // Pastikan database terupdate dengan token baru
      const updated = await prisma.calendarConnection.findUnique({
        where: { id: testConnectionId },
      });
      expect(updated?.status).toBe("ACTIVE");
      expect(updated?.lastErrorAt).toBeNull();
    });

    it("tidak melempar error 'Token akses tidak tersimpan' jika encryptedAccessToken kosong tetapi encryptedRefreshToken ada, melainkan melakukan refresh", async () => {
      // Kasus di mana encryptedAccessToken null tapi refresh token tersedia
      await prisma.calendarConnection.update({
        where: { id: testConnectionId },
        data: {
          encryptedAccessToken: null,
          tokenExpiresAt: null,
        },
      });

      mockRefreshAccessToken.mockResolvedValueOnce({
        credentials: {
          access_token: "recovered-from-refresh-token",
          expiry_date: Date.now() + 3600 * 1000,
        },
      });

      const token = await getValidAccessToken(testConnectionId);
      expect(token).toBe("recovered-from-refresh-token");
      expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);

      const updated = await prisma.calendarConnection.findUnique({
        where: { id: testConnectionId },
      });
      expect(updated?.encryptedAccessToken).not.toBeNull();
    });

    it("memperbarui status koneksi menjadi NEEDS_REAUTH dan melempar error jika access token dan refresh token sama-sama hilang", async () => {
      await prisma.calendarConnection.update({
        where: { id: testConnectionId },
        data: {
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          tokenExpiresAt: null,
        },
      });

      await expect(getValidAccessToken(testConnectionId)).rejects.toThrowError(
        /Token akses tidak tersimpan/
      );

      const updated = await prisma.calendarConnection.findUnique({
        where: { id: testConnectionId },
      });
      expect(updated?.status).toBe("NEEDS_REAUTH");
      expect(updated?.lastErrorMessage).toContain("Token akses tidak tersimpan");
    });

    it("menolak akses jika status koneksi tidak ACTIVE", async () => {
      await prisma.calendarConnection.update({
        where: { id: testConnectionId },
        data: { status: "DISCONNECTED" },
      });

      await expect(getValidAccessToken(testConnectionId)).rejects.toThrow(
        "Koneksi Google Calendar tidak aktif."
      );
    });
  });

  describe("getBusinessCalendarClient", () => {
    it("mengembalikan null secara aman jika kredensial tidak valid atau otentikasi gagal tanpa melempar uncaught exception", async () => {
      await prisma.calendarConnection.update({
        where: { id: testConnectionId },
        data: {
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
        },
      });

      const client = await getBusinessCalendarClient(testBusinessId);
      expect(client).toBeNull();
    });
  });
});
