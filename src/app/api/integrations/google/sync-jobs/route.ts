import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

    const where = {
      calendarConnection: {
        businessId: business.id,
      },
      ...(status ? { status } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.calendarSyncJob.count({ where }),
      prisma.calendarSyncJob.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingCode: true,
              startAt: true,
              occupancyEndAt: true,
              status: true,
            },
          },
          resourceBlock: {
            select: {
              id: true,
              reason: true,
              startAt: true,
              endAt: true,
            },
          },
        },
      }),
    ]);

    return apiSuccess({
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar job sinkronisasi.");
  }
}
