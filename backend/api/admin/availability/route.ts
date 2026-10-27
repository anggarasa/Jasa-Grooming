import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { apiSuccess, handleApiError } from "@backend/lib/api-response";
import { getAvailableSlotsForDate } from "@backend/modules/availability/availability.service";
import { z } from "zod";

const adminAvailabilityQuerySchema = z.object({
  serviceId: z.string().min(1, "serviceId wajib diisi"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  excludeBookingId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);

    const url = new URL(request.url);
    const serviceId = url.searchParams.get("serviceId") || "";
    const date = url.searchParams.get("date") || "";
    const excludeBookingId = url.searchParams.get("excludeBookingId") || undefined;

    const validated = adminAvailabilityQuerySchema.parse({
      serviceId,
      date,
      excludeBookingId,
    });

    const result = await getAvailableSlotsForDate(
      validated.serviceId,
      validated.date,
      {
        excludeBookingId: validated.excludeBookingId,
        ignoreMinAdvance: true, // Admin can view/book without minimum advance constraint
      }
    );

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil ketersediaan slot waktu admin.");
  }
}
