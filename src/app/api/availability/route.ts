import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableSlotsForDate,
  AvailabilityError,
} from "@/modules/availability/availability.service";
import { handleApiError, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    if (!serviceId || !date) {
      return apiError(
        "Parameter serviceId dan date (YYYY-MM-DD) wajib diisi.",
        "BAD_REQUEST",
        400
      );
    }

    const result = await getAvailableSlotsForDate(serviceId, date);

    return NextResponse.json({
      success: true,
      date: result.date,
      slots: result.slots,
      data: result,
    });
  } catch (error) {
    if (error instanceof AvailabilityError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleApiError(error, "Gagal mengambil ketersediaan slot.");
  }
}
