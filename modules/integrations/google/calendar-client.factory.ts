import { google, calendar_v3 } from "googleapis";
import { prisma } from "@backend/lib/prisma";
import { createOAuth2Client, getValidAccessToken, GoogleAuthError } from "./google-oauth.service";
import { CalendarConnection } from "@prisma/client";

export interface AuthenticatedCalendarContext {
  calendar: calendar_v3.Calendar;
  connection: CalendarConnection;
  selectedCalendarId: string;
}

/**
 * Creates an authenticated Google Calendar API v3 client for a given connection ID.
 * Automatically verifies token freshness and refreshes expired tokens atomically.
 */
export async function getCalendarClient(
  connectionId: string
): Promise<AuthenticatedCalendarContext> {
  const connection = await prisma.calendarConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new GoogleAuthError("Koneksi Google Calendar tidak ditemukan.", 404, "CONNECTION_NOT_FOUND");
  }

  const validAccessToken = await getValidAccessToken(connectionId);
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: validAccessToken });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const selectedCalendarId = connection.calendarId || "primary";

  return {
    calendar,
    connection,
    selectedCalendarId,
  };
}

/**
 * Creates an authenticated Google Calendar client for the active connection of a business
 */
export async function getBusinessCalendarClient(
  businessId: string
): Promise<AuthenticatedCalendarContext | null> {
  const connection = await prisma.calendarConnection.findUnique({
    where: {
      businessId_provider: {
        businessId,
        provider: "GOOGLE",
      },
    },
  });

  if (!connection || connection.status !== "ACTIVE") {
    return null;
  }

  try {
    return await getCalendarClient(connection.id);
  } catch (err) {
    console.warn(`[getBusinessCalendarClient] Gagal membuat authenticated calendar client untuk business ${businessId}:`, err);
    return null;
  }
}

