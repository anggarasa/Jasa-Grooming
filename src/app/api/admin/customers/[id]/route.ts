import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { getCustomerDetail } from "@/modules/customers/customer.service";

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
