import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { getCalendarClient } from "./calendar-client.factory";

export interface FreeBusyInterval {
  start: Date;
  end: Date;
}

export interface FreeBusyQueryResult {
  isAvailableChecked: boolean;
  isFailClosed: boolean;
  busyIntervals: FreeBusyInterval[];
}

/**
 * Queries Google Calendar FreeBusy API within an aggressive timeout.
 * Implements a strict FAIL-CLOSED policy: if Google sync is enabled and connection is ACTIVE
 * but the verification fails or times out, the entire queried window is marked busy
 * to prevent accidental double-booking.
 */
export async function queryGoogleFreeBusy(params: {
  businessId: string;
  timeMin: Date;
  timeMax: Date;
}): Promise<FreeBusyQueryResult> {
  const { businessId, timeMin, timeMax } = params;

  // 1. If feature flag is disabled, bypass check cleanly
  if (!env.GOOGLE_CALENDAR_SYNC_ENABLED) {
    return {
      isAvailableChecked: false,
      isFailClosed: false,
      busyIntervals: [],
    };
  }

  // 2. Fetch active connection
  const connection = await prisma.calendarConnection.findFirst({
    where: {
      businessId,
      provider: "GOOGLE",
      status: "ACTIVE",
    },
  });

  if (!connection) {
    // No active calendar connected, freebusy check is bypassed
    return {
      isAvailableChecked: false,
      isFailClosed: false,
      busyIntervals: [],
    };
  }

  const selectedCalendarId = connection.calendarId || "primary";
  const timeoutMs = env.GOOGLE_CALENDAR_FREEBUSY_TIMEOUT_MS || 2000;

  try {
    const { calendar } = await getCalendarClient(connection.id);

    // Run FreeBusy query with timeout promise race
    const queryPromise = calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: selectedCalendarId }],
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("FREEBUSY_TIMEOUT")), timeoutMs);
    });

    const response = await Promise.race([queryPromise, timeoutPromise]);
    const calendarBusy = response.data.calendars?.[selectedCalendarId]?.busy ?? [];

    const busyIntervals: FreeBusyInterval[] = calendarBusy
      .filter((b) => b.start && b.end)
      .map((b) => ({
        start: new Date(b.start!),
        end: new Date(b.end!),
      }));

    return {
      isAvailableChecked: true,
      isFailClosed: false,
      busyIntervals,
    };
  } catch (err: unknown) {
    console.error("[GoogleFreeBusy] FreeBusy check failed, applying fail-closed policy:", err);

    // Fail-Closed policy: Block the whole window
    return {
      isAvailableChecked: true,
      isFailClosed: true,
      busyIntervals: [
        {
          start: timeMin,
          end: timeMax,
        },
      ],
    };
  }
}
