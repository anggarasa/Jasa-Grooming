import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@backend/lib/auth/server";
import { apiSuccess, handleApiError } from "@backend/lib/api-response";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { getCustomerDetail } from "@backend/modules/customers/customer.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole([Role.OWNER, Role.ADMIN]);
    const business = await getPrimaryBusiness();
    const { id } = await params;

    const customer = await getCustomerDetail(business.id, id);

    return apiSuccess(customer);
  } catch (error) {
    return handleApiError(error, "Gagal mengambil profil pelanggan.");
  }
}
