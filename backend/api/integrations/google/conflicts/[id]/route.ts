import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { getCalendarConflictDetail } from "@backend/modules/integrations/google/google-conflict.service";
import { apiSuccess, handleApiError } from "@backend/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const { id } = await params;

    const conflict = await getCalendarConflictDetail(id);

    return apiSuccess(conflict);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil detail konflik kalender.");
  }
}
