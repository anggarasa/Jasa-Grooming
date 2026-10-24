import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import {
  createResourceBlock,
  listResourceBlocks,
} from "@/modules/bookings/resource-block.service";
import { createResourceBlockSchema } from "@/modules/bookings/admin-schemas";

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const url = new URL(request.url);
    const resourceId = url.searchParams.get("resourceId") || undefined;
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;
    const includeCancelled = url.searchParams.get("includeCancelled") === "true";

    const blocks = await listResourceBlocks({
      businessId: business.id,
      resourceId,
      startDate,
      endDate,
      includeCancelled,
    });

    return apiSuccess(blocks);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar blokir waktu.");
  }
}

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Permintaan tidak diizinkan (CSRF invalid).", "FORBIDDEN", 403);
  }

  try {
    const user = await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format data permintaan tidak valid atau body kosong.", "BAD_REQUEST", 400);
    }

    const validated = createResourceBlockSchema.parse(body);
    const created = await createResourceBlock({
      businessId: business.id,
      resourceId: validated.resourceId,
      startAt: validated.startAt,
      endAt: validated.endAt,
      reason: validated.reason,
      actorUserId: user.id,
    });

    return apiSuccess(created, "Blokir waktu berhasil dibuat.", 201);
  } catch (error) {
    return handleApiError(error, "Gagal membuat blokir waktu.");
  }
}
