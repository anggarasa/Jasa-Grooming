// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingDetailView } from "@/components/dashboard/bookings/BookingDetailView";
import { serializeAdminBookingDetail } from "@backend/modules/bookings/booking-serializer";
import { BookingStatus, Prisma } from "@prisma/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("BookingDetailView with Serialized Booking Data", () => {
  it("merender detail booking tanpa runtime error saat menerima plain object yang diserialisasi dari Prisma Decimal", () => {
    const rawPrismaBooking = {
      id: "booking-plain-1",
      bookingCode: "GRM-20261024-SAFE",
      status: BookingStatus.CONFIRMED,
      source: "ONLINE",
      startAt: new Date("2026-10-24T09:00:00.000Z"),
      endAt: new Date("2026-10-24T10:00:00.000Z"),
      totalPrice: new Prisma.Decimal("175000.00"),
      servicePriceSnapshot: new Prisma.Decimal("175000.00"),
      serviceNameSnapshot: "Full Grooming VIP",
      serviceDurationSnapshot: 60,
      customerId: "cust-1",
      petId: "pet-1",
      serviceId: "srv-1",
      resourceId: "res-1",
      customerNotes: "Anabul ramah",
      internalNotes: "Voucher diskon telah diverifikasi",
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date("2026-10-23T10:00:00.000Z"),
      updatedAt: new Date("2026-10-23T10:00:00.000Z"),
      customer: {
        id: "cust-1",
        name: "Jessica Iskandar",
        phone: "081234567890",
        email: "jessica@example.com",
      },
      pet: {
        id: "pet-1",
        name: "Snowy",
        type: "Anjing",
        breed: "Samoyed",
        age: 2,
        notes: "Bulu tebal",
      },
      service: {
        id: "srv-1",
        name: "Full Grooming VIP",
        durationMinutes: 60,
        price: new Prisma.Decimal("175000.00"),
      },
      resource: {
        id: "res-1",
        name: "Station Alpha",
      },
      statusHistories: [],
      rescheduleHistories: [],
      auditLogs: [],
    };

    const serializedBooking = serializeAdminBookingDetail(rawPrismaBooking);

    render(<BookingDetailView initialBooking={serializedBooking} />);

    // Verifikasi kode booking dan status tampil
    expect(screen.getAllByText(/GRM-20261024-SAFE/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Jessica Iskandar")).toBeDefined();
    expect(screen.getByText("Snowy")).toBeDefined();
    expect(screen.getByText("Full Grooming VIP")).toBeDefined();

    // Verifikasi harga terformat dengan benar dari Decimal yang diserialisasi
    expect(screen.getByText("Rp 175.000")).toBeDefined();
  });
});
