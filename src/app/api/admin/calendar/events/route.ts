import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { getCalendarEvents } from "@/modules/bookings/admin-booking.service";
import { calendarRangeQuerySchema } from "@/modules/bookings/admin-schemas";

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const url = new URL(request.url);
    const start = url.searchParams.get("start") || "";
    const end = url.searchParams.get("end") || "";
    const resourceId = url.searchParams.get("resourceId") || undefined;

    const validated = calendarRangeQuerySchema.parse({ start, end, resourceId });

    const result = await getCalendarEvents({
      businessId: business.id,
      startStr: validated.start,
      endStr: validated.end,
      resourceId: validated.resourceId,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil data kalender.");
  }
}
