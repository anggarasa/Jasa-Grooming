import { NextRequest } from "next/server";
import { z } from "zod";
import { assertOwner } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { prisma } from "@/lib/prisma";
import { selectCalendar } from "@/modules/integrations/google/calendar-selection.service";
import { registerCalendarWatchChannel } from "@/modules/integrations/google/google-webhook.service";
import { enqueueCalendarSyncJob } from "@/modules/integrations/google/google-sync-outbox.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const selectCalendarSchema = z.object({
  calendarId: z.string().min(1, "ID kalender wajib diisi."),
});

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Validasi CSRF gagal.", "CSRF_FORBIDDEN", 403);
  }

  try {
    await assertOwner();
    const business = await getPrimaryBusiness();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format JSON permintaan tidak valid.", "BAD_REQUEST", 400);
    }

    const { calendarId } = selectCalendarSchema.parse(body);

    const connection = await prisma.calendarConnection.findUnique({
      where: {
        businessId_provider: {
          businessId: business.id,
          provider: "GOOGLE",
        },
      },
    });

    if (!connection || connection.status !== "ACTIVE") {
      return apiError(
        "Koneksi Google Calendar belum terhubung atau tidak aktif.",
        "CONNECTION_NOT_ACTIVE",
        400
      );
    }

    const updated = await selectCalendar({
      connectionId: connection.id,
      calendarId,
    });

    // Re-register watch channel on new calendar
    try {
      await registerCalendarWatchChannel(connection.id);
    } catch (watchErr) {
      console.warn("[SelectCalendar] Watch registration deferred:", watchErr);
    }

    // Trigger full sync on new calendar
    try {
      await enqueueCalendarSyncJob(prisma, {
        businessId: business.id,
        operationType: "FULL_SYNC",
      });
    } catch (syncErr) {
      console.warn("[SelectCalendar] Full sync enqueue deferred:", syncErr);
    }

    return apiSuccess(
      {
        calendarId: updated.calendarId,
        calendarName: updated.calendarName,
        calendarTimezone: updated.calendarTimezone,
      },
      "Kalender Google berhasil dipilih."
    );
  } catch (error) {
    return handleApiError(error, "Gagal memilih kalender Google.");
  }
}
