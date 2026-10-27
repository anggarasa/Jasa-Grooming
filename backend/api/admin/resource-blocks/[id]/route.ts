import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { cancelResourceBlock } from "@backend/modules/bookings/resource-block.service";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const cancelBlockBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    const user = await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();
    const { id } = await params;

    let reason: string | undefined;
    try {
      const body = await request.json();
      const parsed = cancelBlockBodySchema.safeParse(body);
      if (parsed.success) reason = parsed.data.reason;
    } catch {
      // Body opsional pada DELETE
    }

    const cancelled = await cancelResourceBlock({
      id,
      businessId: business.id,
      actorUserId: user.id,
      reason,
    });

    return apiSuccess(cancelled, "Blokir waktu berhasil dibatalkan.");
  } catch (error) {
    return handleApiError(error, "Gagal membatalkan blokir waktu.");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return DELETE(request, { params });
}
