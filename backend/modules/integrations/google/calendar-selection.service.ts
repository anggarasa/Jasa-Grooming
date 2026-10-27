import { prisma } from "@backend/lib/prisma";
import { getCalendarClient } from "./calendar-client.factory";
import { GoogleAuthError } from "./google-oauth.service";

export interface AccessibleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  timeZone?: string;
  accessRole?: string;
}

/**
 * Lists all calendars accessible by the connected Google account
 */
export async function listAccessibleCalendars(
  connectionId: string
): Promise<AccessibleCalendar[]> {
  const { calendar } = await getCalendarClient(connectionId);

  try {
    const response = await calendar.calendarList.list({
      minAccessRole: "writer", // Only return calendars we can write events to
    });

    const items = response.data.items ?? [];
    return items.map((c) => ({
      id: c.id ?? "",
      summary: c.summary ?? "(Tanpa Nama)",
      description: c.description ?? undefined,
      primary: Boolean(c.primary),
      timeZone: c.timeZone ?? undefined,
      accessRole: c.accessRole ?? undefined,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil daftar kalender.";
    throw new GoogleAuthError(`Gagal mengambil kalender Google: ${msg}`, 400, "CALENDAR_LIST_FAILED");
  }
}

/**
 * Updates selected calendar for the active connection and resets sync cursor
 */
export async function selectCalendar(params: {
  connectionId: string;
  calendarId: string;
}) {
  const { connectionId, calendarId } = params;

  if (!calendarId || calendarId.trim().length === 0) {
    throw new GoogleAuthError("ID Kalender wajib disertakan.", 400, "VALIDATION_ERROR");
  }

  const { calendar } = await getCalendarClient(connectionId);

  // Verify calendar exists and get metadata
  let calendarSummary = calendarId;
  let calendarTimeZone = "Asia/Jakarta";

  try {
    const calMeta = await calendar.calendars.get({ calendarId });
    calendarSummary = calMeta.data.summary || calendarId;
    calendarTimeZone = calMeta.data.timeZone || "Asia/Jakarta";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kalender tidak ditemukan di Google.";
    throw new GoogleAuthError(`Kalender tidak ditemukan: ${msg}`, 404, "CALENDAR_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Update calendar connection
    const updated = await tx.calendarConnection.update({
      where: { id: connectionId },
      data: {
        calendarId,
        calendarName: calendarSummary,
        calendarTimezone: calendarTimeZone,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    // 2. Reset sync cursor so a fresh initial sync will occur
    await tx.calendarSyncState.upsert({
      where: { calendarConnectionId: connectionId },
      create: {
        calendarConnectionId: connectionId,
        nextSyncToken: null,
        syncStatus: "IDLE",
      },
      update: {
        nextSyncToken: null,
        syncStatus: "IDLE",
      },
    });

    // 3. Clear existing busy intervals for previous calendar to prevent stale data
    await tx.calendarExternalBusyInterval.deleteMany({
      where: { calendarConnectionId: connectionId },
    });

    return updated;
  });
}
