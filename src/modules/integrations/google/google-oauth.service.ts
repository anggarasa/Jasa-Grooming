import { google } from "googleapis";
import type { Credentials } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { encrypt, decrypt, generateOAuthState, verifyOAuthState } from "@/lib/encryption";
import { CalendarConnection } from "@prisma/client";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = "GOOGLE_AUTH_ERROR"
  ) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

/**
 * Creates a configured OAuth2 client instance using environment variables
 */
export function createOAuth2Client() {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new GoogleAuthError(
      "Kredensial Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) belum dikonfigurasikan.",
      500,
      "MISSING_OAUTH_CREDENTIALS"
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates Google OAuth consent screen URL with signed state
 */
export function generateGoogleAuthUrl(params: { businessId: string; userId: string }): string {
  const oauth2Client = createOAuth2Client();
  const state = generateOAuthState(params);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_CALENDAR_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

/**
 * Exchanges authorization code for tokens, extracts account info, and saves encrypted credentials
 */
export async function handleOAuthCallback(params: {
  code: string;
  state: string;
}): Promise<CalendarConnection> {
  const { code, state } = params;

  // 1. Verify signed OAuth state (CSRF / Replay protection)
  const statePayload = verifyOAuthState(state);
  const { businessId } = statePayload;

  // 2. Exchange authorization code for tokens
  const oauth2Client = createOAuth2Client();
  let tokens: Credentials;
  try {
    const response = await oauth2Client.getToken(code);
    tokens = response.tokens;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menukar authorization code.";
    throw new GoogleAuthError(`Pertukaran kode Google OAuth gagal: ${msg}`, 400, "CODE_EXCHANGE_FAILED");
  }

  if (!tokens.access_token) {
    throw new GoogleAuthError("Token akses Google tidak diterima.", 400, "MISSING_ACCESS_TOKEN");
  }

  oauth2Client.setCredentials(tokens);

  // 3. Fetch user email / profile info
  let googleAccountId: string | null = null;
  let googleAccountEmail: string | null = null;
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    googleAccountId = userInfo.data.id ?? null;
    googleAccountEmail = userInfo.data.email ?? null;
  } catch {
    // Non-fatal if userinfo fails, proceed with connection
  }

  // 4. Encrypt sensitive credentials
  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined;
  // Default to 1 hour if expiry_date is omitted by provider
  const tokenExpiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000);
  const grantedScopes = tokens.scope ? tokens.scope.split(" ") : GOOGLE_CALENDAR_SCOPES;

  // 5. Atomic database upsert
  return prisma.$transaction(async (tx) => {
    // Find existing connection to preserve refresh token if Google didn't return a new one
    const existing = await tx.calendarConnection.findUnique({
      where: {
        businessId_provider: {
          businessId,
          provider: "GOOGLE",
        },
      },
    });

    const finalEncryptedRefreshToken = encryptedRefreshToken || existing?.encryptedRefreshToken;

    if (!finalEncryptedRefreshToken) {
      console.warn("[GoogleOAuth] No refresh token obtained. Re-authentication will be required when access token expires.");
    }

    const connection = await tx.calendarConnection.upsert({
      where: {
        businessId_provider: {
          businessId,
          provider: "GOOGLE",
        },
      },
      create: {
        businessId,
        provider: "GOOGLE",
        googleAccountId,
        googleAccountEmail,
        calendarId: "primary", // default to primary
        calendarName: "Primary Google Calendar",
        encryptedAccessToken,
        encryptedRefreshToken: finalEncryptedRefreshToken,
        tokenExpiresAt,
        grantedScopes,
        status: "ACTIVE",
        lastSyncAt: new Date(),
      },
      update: {
        googleAccountId,
        googleAccountEmail,
        encryptedAccessToken,
        ...(finalEncryptedRefreshToken ? { encryptedRefreshToken: finalEncryptedRefreshToken } : {}),
        tokenExpiresAt,
        grantedScopes,
        status: "ACTIVE",
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    // Ensure sync state record exists
    await tx.calendarSyncState.upsert({
      where: { calendarConnectionId: connection.id },
      create: {
        calendarConnectionId: connection.id,
        syncStatus: "IDLE",
      },
      update: {
        syncStatus: "IDLE",
        lastError: null,
      },
    });

    return connection;
  });
}

/**
 * Refreshes an expired or near-expiry access token atomically
 */
export async function getValidAccessToken(connectionId: string): Promise<string> {
  const connection = await prisma.calendarConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new GoogleAuthError("Koneksi kalender tidak ditemukan.", 404, "CONNECTION_NOT_FOUND");
  }

  if (connection.status !== "ACTIVE") {
    throw new GoogleAuthError("Koneksi Google Calendar tidak aktif.", 400, "CONNECTION_INACTIVE");
  }

  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minutes before expiry
  const expiresAt = connection.tokenExpiresAt ? connection.tokenExpiresAt.getTime() : 0;

  // If token is still valid for at least 5 minutes and encrypted token exists, try decrypting
  if (connection.encryptedAccessToken && expiresAt > now + bufferMs) {
    try {
      const decrypted = decrypt(connection.encryptedAccessToken);
      if (decrypted) {
        return decrypted;
      }
    } catch (err) {
      console.warn("[GoogleOAuth] Failed to decrypt active access token, falling back to refresh:", err);
    }
  }

  // Atomically evaluate and refresh inside database transaction to prevent concurrent race condition
  let refreshErrorToThrow: GoogleAuthError | null = null;
  let reauthReason: string | null = null;

  try {
    const token = await prisma.$transaction(async (tx) => {
      const lockedConn = await tx.calendarConnection.findUnique({
        where: { id: connectionId },
      });

      if (!lockedConn) {
        throw new GoogleAuthError("Koneksi kalender tidak ditemukan.", 404, "CONNECTION_NOT_FOUND");
      }

      const lockedExpiresAt = lockedConn.tokenExpiresAt ? lockedConn.tokenExpiresAt.getTime() : 0;
      if (lockedExpiresAt > Date.now() + bufferMs && lockedConn.encryptedAccessToken) {
        try {
          const decrypted = decrypt(lockedConn.encryptedAccessToken);
          if (decrypted) {
            return decrypted;
          }
        } catch (err) {
          console.warn("[GoogleOAuth] Failed to decrypt locked access token:", err);
        }
      }

      if (!lockedConn.encryptedRefreshToken) {
        reauthReason = "Token akses tidak tersimpan atau refresh token tidak tersedia. Diperlukan otentikasi ulang.";
        refreshErrorToThrow = new GoogleAuthError(
          "Token akses tidak tersimpan. Silakan hubungkan ulang Google Calendar.",
          401,
          "MISSING_TOKEN"
        );
        return "";
      }

      let refreshToken: string;
      try {
        refreshToken = decrypt(lockedConn.encryptedRefreshToken);
      } catch {
        reauthReason = "Kunci enkripsi refresh token tidak valid. Diperlukan otentikasi ulang.";
        refreshErrorToThrow = new GoogleAuthError(
          "Kredensial Google Calendar tidak dapat didekripsi. Silakan hubungkan ulang.",
          401,
          "DECRYPTION_FAILED"
        );
        return "";
      }

      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      try {
        const refreshed = await oauth2Client.refreshAccessToken();
        const newTokens = refreshed.credentials;

        if (!newTokens.access_token) {
          throw new Error("Google tidak mengembalikan token akses baru.");
        }

        const newEncryptedAccessToken = encrypt(newTokens.access_token);
        const newExpiresAt = newTokens.expiry_date
          ? new Date(newTokens.expiry_date)
          : new Date(Date.now() + 3600 * 1000);

        const newEncryptedRefreshToken = newTokens.refresh_token
          ? encrypt(newTokens.refresh_token)
          : undefined;

        await tx.calendarConnection.update({
          where: { id: connectionId },
          data: {
            encryptedAccessToken: newEncryptedAccessToken,
            ...(newEncryptedRefreshToken ? { encryptedRefreshToken: newEncryptedRefreshToken } : {}),
            tokenExpiresAt: newExpiresAt,
            status: "ACTIVE",
            lastErrorAt: null,
            lastErrorMessage: null,
          },
        });

        return newTokens.access_token;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal me-refresh token.";
        reauthReason = `Token refresh gagal: ${msg}`;
        refreshErrorToThrow = new GoogleAuthError(
          `Gagal me-refresh token akses: ${msg}`,
          401,
          "TOKEN_REFRESH_FAILED"
        );
        return "";
      }
    });

    if (refreshErrorToThrow) {
      throw refreshErrorToThrow;
    }

    return token;
  } finally {
    if (reauthReason && refreshErrorToThrow) {
      try {
        await prisma.calendarConnection.update({
          where: { id: connectionId },
          data: {
            status: "NEEDS_REAUTH",
            lastErrorAt: new Date(),
            lastErrorMessage: reauthReason,
          },
        });
      } catch (updateErr) {
        console.warn("[GoogleOAuth] Failed to commit NEEDS_REAUTH status:", updateErr);
      }
    }
  }
}
