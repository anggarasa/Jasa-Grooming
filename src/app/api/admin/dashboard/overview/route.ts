import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { getDashboardOverview } from "@/modules/bookings/admin-booking.service";

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
