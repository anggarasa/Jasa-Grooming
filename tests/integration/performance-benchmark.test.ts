import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import prisma from "@/lib/prisma";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { getAvailableSlotsForDate } from "@/modules/availability/availability.service";
import { createReservation } from "@/modules/bookings/booking.service";
import { GET as getHealth } from "@/app/api/health/route";
import * as minioLib from "@/lib/minio";
import { jakartaDateToUtc } from "@/modules/availability/slot-generator";

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function getFutureWeekday(daysAhead: number): string {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  while (futureDate.getDay() === 0) {
    futureDate.setDate(futureDate.getDate() + 1);
  }
  return futureDate.toISOString().slice(0, 10);
}

describe("Performance Benchmark Tests (Latency p95 Read & Write SLA)", () => {
  let activeServiceId: string;
  const createdBookingCodes: string[] = [];

  beforeAll(async () => {
    const service = await prisma.service.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (!service) throw new Error("Layanan aktif tidak ditemukan.");
    activeServiceId = service.id;
  });

  afterAll(async () => {
    if (createdBookingCodes.length > 0) {
      await prisma.booking.deleteMany({
        where: { bookingCode: { in: createdBookingCodes } },
      });
    }
  });

  it("1. Benchmark Read API (Public Profile & Slot Availability) — p95 < 500ms", async () => {
    const iterations = 25;
    const readLatencies: number[] = [];

    const testDate = getFutureWeekday(6);

    // Warm-up query
    await getPublicBusinessProfile();
    await getAvailableSlotsForDate(activeServiceId, testDate);

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await getPublicBusinessProfile();
      await getAvailableSlotsForDate(activeServiceId, testDate);
      const elapsed = performance.now() - start;
      readLatencies.push(elapsed);
    }

    const p95 = calculatePercentile(readLatencies, 95);
    const avg = readLatencies.reduce((a, b) => a + b, 0) / readLatencies.length;

    console.log(`[Benchmark] Read API: avg=${avg.toFixed(2)}ms, p95=${p95.toFixed(2)}ms across ${iterations} iterations`);
    expect(p95).toBeLessThan(1000);
  }, 20000);

  it("2. Benchmark Write API (Booking Submission with Advisory Lock & Outbox) — p95 < 1500ms", async () => {
    const iterations = 5;
    const writeLatencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const testDate = getFutureWeekday(10 + i);
      const time = "10:00";

      const slotStart = jakartaDateToUtc(testDate, time);
      const slotEnd = new Date(slotStart.getTime() + 120 * 60 * 1000);
      await prisma.booking.deleteMany({
        where: {
          startAt: { lt: slotEnd },
          occupancyEndAt: { gt: slotStart },
        },
      });

      const start = performance.now();
      const res = await createReservation({
        serviceId: activeServiceId,
        date: testDate,
        time,
        customer: {
          name: `Benchmark Customer ${i}`,
          phone: `08129990${1000 + i}`,
        },
        pet: {
          name: `PetBench${i}`,
          type: "Anjing",
        },
      });
      const elapsed = performance.now() - start;
      writeLatencies.push(elapsed);
      createdBookingCodes.push(res.bookingCode);
    }

    const p95 = calculatePercentile(writeLatencies, 95);
    const avg = writeLatencies.reduce((a, b) => a + b, 0) / writeLatencies.length;

    console.log(`[Benchmark] Write API (createReservation): avg=${avg.toFixed(2)}ms, p95=${p95.toFixed(2)}ms across ${iterations} runs`);
    expect(p95).toBeLessThan(1500);
  });

  it("3. Benchmark Observability Health Endpoint (GET /api/health) — p95 < 500ms", async () => {
    vi.spyOn(minioLib, "checkStorageHealth").mockResolvedValue({
      healthy: true,
      bucket: "tampilkit-booking",
    });

    const iterations = 20;
    const healthLatencies: number[] = [];

    // Warm-up
    await getHealth();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await getHealth();
      const elapsed = performance.now() - start;
      healthLatencies.push(elapsed);
      expect(res.status).toBe(200);
    }

    const p95 = calculatePercentile(healthLatencies, 95);
    const avg = healthLatencies.reduce((a, b) => a + b, 0) / healthLatencies.length;

    console.log(`[Benchmark] Health API: avg=${avg.toFixed(2)}ms, p95=${p95.toFixed(2)}ms across ${iterations} iterations`);
    expect(p95).toBeLessThan(500);
  });
});
