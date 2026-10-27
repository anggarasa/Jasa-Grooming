import { NextRequest, NextResponse } from "next/server";
import { assertOwner } from "@backend/lib/auth/server";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { generateGoogleAuthUrl } from "@backend/modules/integrations/google/google-oauth.service";
import { apiSuccess, handleApiError } from "@backend/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await assertOwner();
    const business = await getPrimaryBusiness();

    const authUrl = generateGoogleAuthUrl({
      businessId: business.id,
      userId: user.id,
    });

    const url = new URL(request.url);
    if (url.searchParams.get("redirect") === "true") {
      return NextResponse.redirect(authUrl);
    }

    return apiSuccess({ url: authUrl }, "URL otentikasi Google berhasil dibuat.");
  } catch (error) {
    return handleApiError(error, "Gagal membuat URL otentikasi Google.");
  }
}
