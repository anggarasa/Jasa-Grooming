import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { listCustomers } from "@/modules/customers/customer.service";
import { customerListQuerySchema } from "@/modules/bookings/admin-schemas";

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();

    const url = new URL(request.url);
    const queryParams: Record<string, string | undefined> = {};
    url.searchParams.forEach((val, key) => {
      if (val !== "") queryParams[key] = val;
    });

    const parsedQuery = customerListQuerySchema.parse(queryParams);
    const result = await listCustomers(business.id, parsedQuery);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil daftar pelanggan.");
  }
}
