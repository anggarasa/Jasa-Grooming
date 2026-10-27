import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { apiSuccess, handleApiError } from "@backend/lib/api-response";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { getDashboardOverview } from "@backend/modules/bookings/admin-booking.service";

export async function GET() {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();
    const overview = await getDashboardOverview(business.id);

    return apiSuccess(overview);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil data dashboard overview.");
  }
}
