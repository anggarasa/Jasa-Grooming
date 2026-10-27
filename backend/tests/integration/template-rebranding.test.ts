import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@backend/lib/prisma";
import {
  getPublicBusinessProfile,
  getPublicBookingSettings,
} from "@backend/modules/public/public-business.service";
import { getAvailableSlotsForDate } from "@backend/modules/availability/availability.service";
import { jakartaDateToUtc } from "@backend/modules/availability/slot-generator";
import { createReservation } from "@backend/modules/bookings/booking.service";
import { rescheduleBooking } from "@backend/modules/bookings/reschedule.service";

describe("Template Reusability Validation — 'Studio Barber' Rebranding Proof", () => {
  let businessId: string;
  let originalBusiness: {
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
  };
  let barberCategoryId: string;
  let barberServiceId: string;
  let barberResourceId: string;
  const createdBookingCodes: string[] = [];

  beforeAll(async () => {
    const business = await prisma.business.findFirst({
      where: { isActive: true },
      include: { settings: true },
    });
    if (!business) throw new Error("Bisnis utama tidak ditemukan.");
    businessId = business.id;

    originalBusiness = {
      name: business.name,
      slug: business.slug,
      description: business.description,
      address: business.address,
    };

    // 1. Rebrand Business Profile murni via data
    await prisma.business.update({
      where: { id: businessId },
      data: {
        name: "Studio Barber & Gentlemen's Grooming",
        slug: "studio-barber-rebrand-test",
        description: "Barbershop premium untuk pria modern dengan layanan potong rambut klasik dan perawatan jenggot.",
        address: "Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan",
      },
    });

    // 2. Sesuaikan Pengaturan Reservasi Barbershop
    await prisma.businessSetting.upsert({
      where: { businessId },
      update: {
        bookingIntervalMinutes: 45,
        defaultBufferMinutes: 15,
        minimumAdvanceMinutes: 60,
        maximumAdvanceDays: 30,
        autoConfirmBooking: true,
      },
      create: {
        businessId,
        bookingIntervalMinutes: 45,
        defaultBufferMinutes: 15,
        minimumAdvanceMinutes: 60,
        maximumAdvanceDays: 30,
        autoConfirmBooking: true,
      },
    });

    // 3. Tambahkan Kategori Layanan Barbershop
    const category = await prisma.serviceCategory.create({
      data: {
        businessId,
        name: "Cukur & Styling Rambut Pria",
        slug: `cukur-pria-${Date.now()}`,
        description: "Layanan pangkas rambut pria dewasa dan styling pomade.",
        displayOrder: 1,
        isActive: true,
      },
    });
    barberCategoryId = category.id;

    // 4. Tambahkan Layanan Barbershop
    const service = await prisma.service.create({
      data: {
        businessId,
        categoryId: barberCategoryId,
        name: "Gentleman Classic Cut & Hot Towel",
        slug: `classic-cut-${Date.now()}`,
        description: "Potong rambut presisi, cuci rambut, pijat relaksasi kepala, dan handuk hangat.",
        durationMinutes: 45,
        bufferMinutes: 15,
        price: 85000,
        isActive: true,
      },
    });
    barberServiceId = service.id;

    // 5. Tambahkan Stasiun/Kursi Barber
    const resource = await prisma.bookingResource.create({
      data: {
        businessId,
        name: "Kursi Barber 1 (Master Barber)",
        isActive: true,
      },
    });
    barberResourceId = resource.id;
  });

  afterAll(async () => {
    // Bersihkan booking uji coba
    if (createdBookingCodes.length > 0) {
      await prisma.booking.deleteMany({
        where: { bookingCode: { in: createdBookingCodes } },
      });
    }

    // Bersihkan resource, layanan, dan kategori barber
    if (barberResourceId) {
      await prisma.bookingResource.deleteMany({ where: { id: barberResourceId } });
    }
    if (barberServiceId) {
      await prisma.service.deleteMany({ where: { id: barberServiceId } });
    }
    if (barberCategoryId) {
      await prisma.serviceCategory.deleteMany({ where: { id: barberCategoryId } });
    }

    // Pulihkan profil bisnis semula
    if (businessId && originalBusiness) {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          name: originalBusiness.name,
          slug: originalBusiness.slug,
          description: originalBusiness.description,
          address: originalBusiness.address,
        },
      });
      await prisma.businessSetting.update({
        where: { businessId },
        data: {
          bookingIntervalMinutes: 30,
          defaultBufferMinutes: 15,
          minimumAdvanceMinutes: 60,
          maximumAdvanceDays: 30,
          autoConfirmBooking: false,
        },
      });
    }
  });

  it("1. Profil Publik merefleksikan identitas Barbershop secara instan tanpa ubah kode", async () => {
    const profile = await getPublicBusinessProfile();
    const settings = await getPublicBookingSettings();
    expect(profile).toBeDefined();
    expect(profile!.name).toBe("Studio Barber & Gentlemen's Grooming");
    expect(profile!.description).toContain("Barbershop premium");
    expect(settings?.bookingIntervalMinutes).toBe(45);
  });

  it("2. Generator Slot ketersediaan menghitung interval 45 menit sesuai data Barbershop", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    while (futureDate.getDay() === 0) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const testDate = futureDate.toISOString().slice(0, 10);

    const result = await getAvailableSlotsForDate(barberServiceId, testDate);

    expect(result.isOpen).toBe(true);
    expect(result.slots.length).toBeGreaterThan(0);

    // Slot pertama harus ada dan berdurasi sesuai layanan barber (45 menit)
    const firstSlot = result.slots[0];
    expect(firstSlot).toBeDefined();
    expect(firstSlot.time).toBeDefined();
  });

  it("3. Reservasi layanan Barbershop berhasil dibuat dengan snapshot tarif & durasi yang valid", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    while (futureDate.getDay() === 0) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const testDate = futureDate.toISOString().slice(0, 10);
    const targetTime = "10:00";

    const slotStart = jakartaDateToUtc(testDate, targetTime);
    const slotEnd = new Date(slotStart.getTime() + 120 * 60 * 1000);
    await prisma.booking.deleteMany({
      where: {
        startAt: { lt: slotEnd },
        occupancyEndAt: { gt: slotStart },
      },
    });

    const res = await createReservation({
      serviceId: barberServiceId,
      date: testDate,
      time: targetTime,
      customer: {
        name: "Budi Santoso",
        phone: "081288887777",
        email: "budi.santoso@example.test",
      },
      pet: {
        name: "Gentleman Client",
        type: "Gentleman",
      },
      notes: "Cukur rapi samping undercut klasik",
    });

    expect(res.bookingCode).toBeDefined();
    createdBookingCodes.push(res.bookingCode);

    expect(res.booking.serviceName).toBe("Gentleman Classic Cut & Hot Towel");
    expect(res.booking.durationMinutes).toBe(45);
    expect(res.booking.totalPrice).toBe(85000);
    expect(res.booking.customer.name).toBe("Budi Santoso");

    // Verifikasi di database
    const dbBooking = await prisma.booking.findUnique({
      where: { bookingCode: res.bookingCode },
    });
    expect(dbBooking).toBeDefined();
    expect(Number(dbBooking!.totalPrice)).toBe(85000);
    expect(dbBooking!.serviceNameSnapshot).toBe("Gentleman Classic Cut & Hot Towel");
  });

  it("4. Reschedule reservasi Barbershop berjalan mulus ke slot jam berikutnya", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    while (futureDate.getDay() === 0) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const testDate = futureDate.toISOString().slice(0, 10);
    const initialTime = "13:30";
    const newTime = "14:30";

    const slotStart = jakartaDateToUtc(testDate, initialTime);
    const slotEnd = new Date(slotStart.getTime() + 180 * 60 * 1000);
    await prisma.booking.deleteMany({
      where: {
        startAt: { lt: slotEnd },
        occupancyEndAt: { gt: slotStart },
      },
    });

    const created = await createReservation({
      serviceId: barberServiceId,
      date: testDate,
      time: initialTime,
      customer: {
        name: "Ahmad Dani",
        phone: "081299995555",
      },
      pet: {
        name: "Gentleman Client",
        type: "Gentleman",
      },
    });
    createdBookingCodes.push(created.bookingCode);

    const rescheduled = await rescheduleBooking({
      bookingId: created.booking.id,
      newDate: testDate,
      newTime,
      reason: "Pelanggan meminta jam setelah rapat kantor selesai",
    });

    expect(rescheduled).toBeDefined();
    expect(rescheduled.bookingCode).toBe(created.bookingCode);

    const verifyDb = await prisma.booking.findUnique({
      where: { id: created.booking.id },
    });
    expect(verifyDb).toBeDefined();
    expect(verifyDb!.serviceDurationSnapshot).toBe(45);
  });
});
