import { NextRequest } from "next/server";
import { assertOwner } from "@backend/lib/auth/server";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { prisma } from "@backend/lib/prisma";
import { disconnectGoogleAccount } from "@backend/modules/integrations/google/google-disconnect.service";
import { apiSuccess, apiError, handleApiError } from "@backend/lib/api-response";

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Validasi CSRF gagal.", "CSRF_FORBIDDEN", 403);
  }

  try {
    await assertOwner();
    const business = await getPrimaryBusiness();

    const connection = await prisma.calendarConnection.findUnique({
      where: {
        businessId_provider: {
          businessId: business.id,
          provider: "GOOGLE",
        },
      },
    });

    if (!connection) {
      return apiError("Koneksi Google Calendar tidak ditemukan.", "NOT_FOUND", 404);
    }

    await disconnectGoogleAccount(connection.id);

    return apiSuccess(null, "Koneksi Google Calendar berhasil diputuskan secara aman.");
  } catch (error) {
    return handleApiError(error, "Gagal memutuskan koneksi Google Calendar.");
  }
}
