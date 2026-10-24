import { NextRequest, NextResponse } from "next/server";
import {
  getBookingByGuestToken,
  TokenAuthError,
} from "@/modules/bookings/token.service";
import { handleApiError, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return apiError(
        "Token akses reservasi wajib disertakan pada query parameter.",
        "BAD_REQUEST",
        400
      );
    }

    const bookingDto = await getBookingByGuestToken(token);

    return NextResponse.json({
      success: true,
      booking: bookingDto,
      data: bookingDto,
    });
  } catch (error) {
    if (error instanceof TokenAuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleApiError(error, "Gagal mengambil data reservasi.");
  }
}
