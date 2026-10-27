import { NextRequest, NextResponse } from "next/server";
import {
  createReservation,
  SlotUnavailableError,
  BookingValidationError,
} from "@backend/modules/bookings/booking.service";
import { IdempotencyError } from "@backend/modules/bookings/idempotency.service";
import { handleApiError, apiError } from "@backend/lib/api-response";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(
      "Format data permintaan tidak valid atau body JSON kosong.",
      "BAD_REQUEST",
      400
    );
  }

  const idempotencyKey =
    request.headers.get("Idempotency-Key") ||
    request.headers.get("idempotency-key") ||
    request.headers.get("x-idempotency-key") ||
    null;

  try {
    const result = await createReservation(body as unknown as Parameters<typeof createReservation>[0], idempotencyKey);

    return NextResponse.json(
      {
        success: true,
        message: "Reservasi berhasil dibuat.",
        bookingCode: result.bookingCode,
        manageToken: result.manageToken,
        booking: result.booking,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof BookingValidationError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof IdempotencyError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleApiError(error, "Gagal memproses reservasi grooming.");
  }
}
