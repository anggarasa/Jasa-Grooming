import { assertOwner } from "@backend/lib/auth/server";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { prisma } from "@backend/lib/prisma";
import { listAccessibleCalendars } from "@backend/modules/integrations/google/calendar-selection.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";

export async function GET() {
  try {
    await assertOwner();
    const business = await getPrimaryBusiness();

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

    const calendars = await listAccessibleCalendars(connection.id);

    return apiSuccess({
      selectedCalendarId: connection.calendarId || "primary",
      calendars,
    });
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar kalender Google.");
  }
}
