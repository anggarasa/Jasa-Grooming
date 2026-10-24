import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { listCalendarConflicts } from "@/modules/integrations/google/google-conflict.service";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

    const result = await listCalendarConflicts({
      businessId: business.id,
      status,
      page,
      limit,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar konflik kalender.");
  }
}
