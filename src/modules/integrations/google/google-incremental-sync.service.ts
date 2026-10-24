import { calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCalendarClient } from "./calendar-client.factory";
import { TAMPILKIT_APP_ID } from "./google-events.service";
import { BookingStatus } from "@prisma/client";

export interface SyncResult {
  fullSync: boolean;
  eventsProcessed: number;
  conflictsDetected: number;
  nextSyncToken: string | null;
}

/**
 * Performs bidirectional incremental synchronization with Google Calendar.
 * Uses syncToken cursor and automatically recovers via full sync if Google returns HTTP 410.
 */
export async function performIncrementalSync(params: {
  connectionId: string;
  forceFullSync?: boolean;
}): Promise<SyncResult> {
  const { connectionId, forceFullSync = false } = params;

  const { calendar, selectedCalendarId, connection } = await getCalendarClient(connectionId);

  const syncState = await prisma.calendarSyncState.findUnique({
    where: { calendarConnectionId: connectionId },
  });

  const syncToken = forceFullSync ? null : syncState?.nextSyncToken;
  const isFullSync = !syncToken;

  await prisma.calendarSyncState.upsert({
    where: { calendarConnectionId: connectionId },
    create: {
      calendarConnectionId: connectionId,
      syncStatus: "SYNCING",
    },
    update: {
      syncStatus: "SYNCING",
      lastError: null,
    },
  });

  let eventsProcessed = 0;
  let conflictsDetected = 0;
  let nextSyncToken: string | null = null;
  let pageToken: string | undefined = undefined;

  try {
    do {
      let response: { data: calendar_v3.Schema$Events };
      try {
        if (syncToken) {
          response = await calendar.events.list({
            calendarId: selectedCalendarId,
            syncToken,
            pageToken,
            maxResults: 250,
          });
        } else {
          // Full sync: look back 30 days and up to 180 days forward
          const timeMin = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
          const timeMax = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString();

          response = await calendar.events.list({
            calendarId: selectedCalendarId,
            timeMin,
            timeMax,
            pageToken,
            maxResults: 250,
            singleEvents: true,
          });
        }
      } catch (err: unknown) {
        const errorObj = err as { code?: number; status?: number };
        const statusCode = errorObj.code || errorObj.status;

        // HTTP 410 GONE: syncToken expired, perform full sync recovery
        if (statusCode === 410) {
          console.warn("[GoogleIncrementalSync] HTTP 410: syncToken expired. Triggering full sync recovery.");
          return performIncrementalSync({ connectionId, forceFullSync: true });
        }
        throw err;
      }

      const items = response.data.items ?? [];
      pageToken = response.data.nextPageToken ?? undefined;
      nextSyncToken = response.data.nextSyncToken ?? null;

      for (const event of items) {
        eventsProcessed++;
        const externalEventId = event.id;
        if (!externalEventId) continue;

        const isCancelled = event.status === "cancelled";
        const privateProps = event.extendedProperties?.private || {};
        const isTampilKitManaged = privateProps.tampilkit_source === TAMPILKIT_APP_ID;

        if (isTampilKitManaged) {
          // 1. Managed Event: Detect external mutation or deletion
          const bookingId = privateProps.tampilkit_booking_id;
          if (bookingId) {
            const booking = await prisma.booking.findUnique({
              where: { id: bookingId },
              include: { customer: true, service: true },
            });

            if (booking && booking.status !== BookingStatus.CANCELLED) {
              if (isCancelled) {
                // Booking was deleted directly on Google Calendar by user!
                conflictsDetected++;
                await prisma.calendarSyncConflict.create({
                  data: {
                    calendarConnectionId: connectionId,
                    bookingId: booking.id,
                    externalEventId,
                    conflictType: "REMOTE_DELETED",
                    localSnapshot: {
                      bookingCode: booking.bookingCode,
                      status: booking.status,
                      startAt: booking.startAt.toISOString(),
                      occupancyEndAt: booking.occupancyEndAt.toISOString(),
                    },
                    remoteSnapshot: {
                      status: "cancelled",
                    },
                  },
                });
              }
            }
          }
        } else {
          // 2. External Calendar Event: update external busy intervals
          if (isCancelled) {
            await prisma.calendarExternalBusyInterval.deleteMany({
              where: {
                calendarConnectionId: connectionId,
                externalEventId,
              },
            });
          } else {
            const startRaw = event.start?.dateTime || event.start?.date;
            const endRaw = event.end?.dateTime || event.end?.date;

            if (startRaw && endRaw) {
              const startAt = new Date(startRaw);
              const endAt = new Date(endRaw);
              // Transparent events do not block time
              const isBusy = event.transparency !== "transparent";

              await prisma.calendarExternalBusyInterval.upsert({
                where: {
                  calendarConnectionId_externalEventId: {
                    calendarConnectionId: connectionId,
                    externalEventId,
                  },
                },
                create: {
                  calendarConnectionId: connectionId,
                  externalEventId,
                  startAt,
                  endAt,
                  isBusy,
                  summary: event.summary || "(Jadwal Google Eksternal)",
                  lastObservedAt: new Date(),
                },
                update: {
                  startAt,
                  endAt,
                  isBusy,
                  summary: event.summary || "(Jadwal Google Eksternal)",
                  lastObservedAt: new Date(),
                },
              });

              // Detect overlap with active bookings
              if (isBusy) {
                const overlappingBookings = await prisma.booking.findMany({
                  where: {
                    businessId: connection.businessId,
                    status: {
                      in: [
                        BookingStatus.CONFIRMED,
                        BookingStatus.PENDING,
                        BookingStatus.CHECKED_IN,
                        BookingStatus.IN_PROGRESS,
                      ],
                    },
                    startAt: { lt: endAt },
                    occupancyEndAt: { gt: startAt },
                  },
                });

                for (const b of overlappingBookings) {
                  conflictsDetected++;
                  await prisma.calendarSyncConflict.create({
                    data: {
                      calendarConnectionId: connectionId,
                      bookingId: b.id,
                      externalEventId,
                      conflictType: "OVERLAPPING_EXTERNAL_EVENT",
                      localSnapshot: {
                        bookingCode: b.bookingCode,
                        startAt: b.startAt.toISOString(),
                        occupancyEndAt: b.occupancyEndAt.toISOString(),
                      },
                      remoteSnapshot: {
                        summary: event.summary,
                        start: startAt.toISOString(),
                        end: endAt.toISOString(),
                      },
                    },
                  });
                }
              }
            }
          }
        }
      }
    } while (pageToken);

    // Update sync state
    const now = new Date();
    await prisma.calendarSyncState.update({
      where: { calendarConnectionId: connectionId },
      data: {
        nextSyncToken,
        syncStatus: "IDLE",
        lastIncrementalSyncAt: now,
        lastSuccessfulSyncAt: now,
        ...(isFullSync ? { lastFullSyncAt: now } : {}),
      },
    });

    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: now,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    return {
      fullSync: isFullSync,
      eventsProcessed,
      conflictsDetected,
      nextSyncToken,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await prisma.calendarSyncState.update({
      where: { calendarConnectionId: connectionId },
      data: {
        syncStatus: "FAILED",
        lastError: errMsg,
      },
    });

    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        lastErrorAt: new Date(),
        lastErrorMessage: `Incremental sync gagal: ${errMsg}`,
      },
    });

    throw err;
  }
}
