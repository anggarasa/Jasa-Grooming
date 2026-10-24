import { calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { Booking, Customer, Pet, Service, ResourceBlock } from "@prisma/client";

export const TAMPILKIT_APP_ID = "PAWCARE_GROOMING";

export interface BookingWithDetails extends Booking {
  customer?: Customer | null;
  pet?: Pet | null;
  service?: Service | null;
}

/**
 * Builds Google Calendar event resource payload for a booking
 */
export function buildBookingEventPayload(booking: BookingWithDetails): calendar_v3.Schema$Event {
  const serviceName = booking.service?.name || booking.serviceNameSnapshot || "Layanan Grooming";
  const customerName = booking.customer?.name || "Pelanggan";
  const petName = booking.pet?.name || "Hewan";
  const petType = booking.pet?.type || "";

  const summary = `Grooming — ${serviceName} — ${booking.bookingCode}`;
  const description = [
    `Kode Reservasi: ${booking.bookingCode}`,
    `Layanan: ${serviceName}`,
    `Pelanggan: ${customerName}`,
    `Hewan: ${petName} (${petType})`,
    `Status: ${booking.status}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary,
    description,
    start: {
      dateTime: booking.startAt.toISOString(),
      timeZone: "Asia/Jakarta",
    },
    end: {
      // Station occupancy end time (service duration + buffer)
      dateTime: booking.occupancyEndAt.toISOString(),
      timeZone: "Asia/Jakarta",
    },
    extendedProperties: {
      private: {
        tampilkit_source: TAMPILKIT_APP_ID,
        tampilkit_type: "BOOKING",
        tampilkit_booking_id: booking.id,
        tampilkit_booking_code: booking.bookingCode,
      },
    },
  };
}

/**
 * Builds Google Calendar event resource payload for a resource block
 */
export function buildResourceBlockPayload(block: ResourceBlock): calendar_v3.Schema$Event {
  return {
    summary: `[Blokir Operasional] ${block.reason}`,
    description: `Pemblokiran stasiun grooming untuk keperluan: ${block.reason}`,
    start: {
      dateTime: block.startAt.toISOString(),
      timeZone: "Asia/Jakarta",
    },
    end: {
      dateTime: block.endAt.toISOString(),
      timeZone: "Asia/Jakarta",
    },
    extendedProperties: {
      private: {
        tampilkit_source: TAMPILKIT_APP_ID,
        tampilkit_type: "RESOURCE_BLOCK",
        tampilkit_resource_block_id: block.id,
      },
    },
  };
}

/**
 * Inserts or updates a managed Google Calendar event for a booking
 */
export async function syncBookingToGoogle(params: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  calendarConnectionId: string;
  booking: BookingWithDetails;
}) {
  const { calendar, calendarId, calendarConnectionId, booking } = params;

  // Check if mapping already exists
  const mapping = await prisma.calendarEventMapping.findUnique({
    where: { bookingId: booking.id },
  });

  const eventPayload = buildBookingEventPayload(booking);

  if (mapping && mapping.externalEventId) {
    try {
      const response = await calendar.events.patch({
        calendarId,
        eventId: mapping.externalEventId,
        requestBody: eventPayload,
      });

      await prisma.calendarEventMapping.update({
        where: { id: mapping.id },
        data: {
          externalEventEtag: response.data.etag ?? null,
          syncStatus: "SYNCED",
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
      });

      return response.data;
    } catch (err: unknown) {
      const errorObj = err as { code?: number; status?: number };
      const statusCode = errorObj.code || errorObj.status;
      // If event was deleted in remote calendar (404/410), re-create it
      if (statusCode === 404 || statusCode === 410) {
        const createRes = await calendar.events.insert({
          calendarId,
          requestBody: eventPayload,
        });

        await prisma.calendarEventMapping.update({
          where: { id: mapping.id },
          data: {
            externalEventId: createRes.data.id!,
            externalEventEtag: createRes.data.etag ?? null,
            syncStatus: "SYNCED",
            lastSyncedAt: new Date(),
            lastSyncError: null,
          },
        });

        return createRes.data;
      }
      throw err;
    }
  } else {
    // Insert new event
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventPayload,
    });

    await prisma.calendarEventMapping.upsert({
      where: { bookingId: booking.id },
      create: {
        calendarConnectionId,
        bookingId: booking.id,
        externalEventId: response.data.id!,
        externalEventEtag: response.data.etag ?? null,
        syncStatus: "SYNCED",
        lastSyncedAt: new Date(),
      },
      update: {
        externalEventId: response.data.id!,
        externalEventEtag: response.data.etag ?? null,
        syncStatus: "SYNCED",
        lastSyncedAt: new Date(),
        lastSyncError: null,
      },
    });

    return response.data;
  }
}

/**
 * Deletes a managed Google Calendar event for a cancelled booking
 */
export async function deleteBookingFromGoogle(params: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  bookingId: string;
}) {
  const { calendar, calendarId, bookingId } = params;

  const mapping = await prisma.calendarEventMapping.findUnique({
    where: { bookingId },
  });

  if (!mapping || !mapping.externalEventId) {
    return;
  }

  try {
    await calendar.events.delete({
      calendarId,
      eventId: mapping.externalEventId,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: number; status?: number };
    const statusCode = errorObj.code || errorObj.status;
    // If already 404 or 410, it is cleanly gone
    if (statusCode !== 404 && statusCode !== 410) {
      throw err;
    }
  }

  await prisma.calendarEventMapping.delete({
    where: { id: mapping.id },
  });
}

/**
 * Inserts or updates a managed Google Calendar event for a ResourceBlock
 */
export async function syncResourceBlockToGoogle(params: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  calendarConnectionId: string;
  block: ResourceBlock;
}) {
  const { calendar, calendarId, calendarConnectionId, block } = params;

  const mapping = await prisma.calendarEventMapping.findUnique({
    where: { resourceBlockId: block.id },
  });

  const payload = buildResourceBlockPayload(block);

  if (mapping && mapping.externalEventId) {
    try {
      const response = await calendar.events.patch({
        calendarId,
        eventId: mapping.externalEventId,
        requestBody: payload,
      });

      await prisma.calendarEventMapping.update({
        where: { id: mapping.id },
        data: {
          externalEventEtag: response.data.etag ?? null,
          syncStatus: "SYNCED",
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
      });

      return response.data;
    } catch (err: unknown) {
      const errorObj = err as { code?: number; status?: number };
      const statusCode = errorObj.code || errorObj.status;
      if (statusCode === 404 || statusCode === 410) {
        const createRes = await calendar.events.insert({
          calendarId,
          requestBody: payload,
        });

        await prisma.calendarEventMapping.update({
          where: { id: mapping.id },
          data: {
            externalEventId: createRes.data.id!,
            externalEventEtag: createRes.data.etag ?? null,
            syncStatus: "SYNCED",
            lastSyncedAt: new Date(),
            lastSyncError: null,
          },
        });

        return createRes.data;
      }
      throw err;
    }
  } else {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: payload,
    });

    await prisma.calendarEventMapping.upsert({
      where: { resourceBlockId: block.id },
      create: {
        calendarConnectionId,
        resourceBlockId: block.id,
        externalEventId: response.data.id!,
        externalEventEtag: response.data.etag ?? null,
        syncStatus: "SYNCED",
        lastSyncedAt: new Date(),
      },
      update: {
        externalEventId: response.data.id!,
        externalEventEtag: response.data.etag ?? null,
        syncStatus: "SYNCED",
        lastSyncedAt: new Date(),
        lastSyncError: null,
      },
    });

    return response.data;
  }
}

/**
 * Deletes a managed Google Calendar event for a cancelled ResourceBlock
 */
export async function deleteResourceBlockFromGoogle(params: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  resourceBlockId: string;
}) {
  const { calendar, calendarId, resourceBlockId } = params;

  const mapping = await prisma.calendarEventMapping.findUnique({
    where: { resourceBlockId },
  });

  if (!mapping || !mapping.externalEventId) {
    return;
  }

  try {
    await calendar.events.delete({
      calendarId,
      eventId: mapping.externalEventId,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: number; status?: number };
    const statusCode = errorObj.code || errorObj.status;
    if (statusCode !== 404 && statusCode !== 410) {
      throw err;
    }
  }

  await prisma.calendarEventMapping.delete({
    where: { id: mapping.id },
  });
}
