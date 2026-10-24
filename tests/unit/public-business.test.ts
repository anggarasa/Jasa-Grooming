import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPublicBusinessProfile,
  getPublicBookingSettings,
} from "@/modules/public/public-business.service";
import {
  getPublicOperatingHours,
  evaluateOperatingStatus,
  getJakartaCurrentTime,
  PublicOperatingHourDay,
} from "@/modules/public/public-hours.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    business: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Public Business & Operating Hours Services (Unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicBusinessProfile", () => {
    it("mengembalikan data profil bisnis publik aman tanpa credential", async () => {
      const mockBusiness = {
        id: "biz-1",
        name: "PawCare Grooming",
        slug: "pawcare-grooming",
        description: "Layanan salon hewan",
        email: "info@pawcare.test",
        phone: "0812345678",
        whatsapp: "62812345678",
        address: "Jl. Melati 1",
        fullAddress: "Jl. Melati 1, Jakarta",
        city: "Jakarta",
        province: "DKI Jakarta",
        postalCode: "12345",
        googleMapsUrl: "https://maps.google.com",
        timezone: "Asia/Jakarta",
        logoObjectKey: "logo.png",
      };

      vi.mocked(prisma.business.findFirst).mockResolvedValueOnce(
        mockBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findFirst>>
      );

      const result = await getPublicBusinessProfile();

      expect(result).not.toBeNull();
      expect(result?.name).toBe("PawCare Grooming");
      expect(result?.slug).toBe("pawcare-grooming");
      expect(result?.logoObjectKey).toBe("logo.png");
      expect(prisma.business.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it("mengembalikan null jika tidak ada bisnis aktif yang terdaftar", async () => {
      vi.mocked(prisma.business.findFirst).mockResolvedValueOnce(null);

      const result = await getPublicBusinessProfile();
      expect(result).toBeNull();
    });
  });

  describe("getPublicBookingSettings", () => {
    it("mengembalikan aturan booking publik untuk bisnis aktif", async () => {
      vi.mocked(prisma.business.findFirst).mockResolvedValueOnce({
        id: "biz-1",
        settings: {
          bookingEnabled: true,
          currency: "IDR",
          bookingIntervalMinutes: 30,
          defaultBufferMinutes: 15,
          minimumAdvanceMinutes: 60,
          maximumAdvanceDays: 30,
          cancellationWindowHours: 24,
          allowCustomerReschedule: true,
        },
      } as unknown as Awaited<ReturnType<typeof prisma.business.findFirst>>);

      const settings = await getPublicBookingSettings();

      expect(settings).not.toBeNull();
      expect(settings?.bookingEnabled).toBe(true);
      expect(settings?.currency).toBe("IDR");
      expect(settings?.bookingIntervalMinutes).toBe(30);
    });

    it("mengembalikan null jika setting booking belum dikonfigurasi", async () => {
      vi.mocked(prisma.business.findFirst).mockResolvedValueOnce(null);

      const settings = await getPublicBookingSettings();
      expect(settings).toBeNull();
    });
  });

  describe("evaluateOperatingStatus & getJakartaCurrentTime", () => {
    const sampleSchedule: PublicOperatingHourDay[] = [
      {
        dayOfWeek: 1, // Senin
        dayName: "Senin",
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
        breaks: [{ startTime: "12:00", endTime: "13:00" }],
        formattedHours: "09:00 - 18:00",
      },
      {
        dayOfWeek: 0, // Minggu
        dayName: "Minggu",
        isOpen: false,
        openTime: "09:00",
        closeTime: "18:00",
        breaks: [],
        formattedHours: "Tutup",
      },
    ];

    it("menilai 'Tutup Hari Ini' jika hari tersebut diliburkan", () => {
      const status = evaluateOperatingStatus(sampleSchedule, {
        dayOfWeek: 0,
        timeString: "10:00",
        hours: 10,
        minutes: 0,
      });

      expect(status.isOpenNow).toBe(false);
      expect(status.statusText).toBe("Tutup Hari Ini");
    });

    it("menilai 'Buka Sekarang' saat berada di dalam jam buka dan di luar waktu break", () => {
      const status = evaluateOperatingStatus(sampleSchedule, {
        dayOfWeek: 1,
        timeString: "10:30",
        hours: 10,
        minutes: 30,
      });

      expect(status.isOpenNow).toBe(true);
      expect(status.statusText).toBe("Buka Sekarang");
    });

    it("menilai 'Sedang Istirahat' saat berada di dalam rentang break", () => {
      const status = evaluateOperatingStatus(sampleSchedule, {
        dayOfWeek: 1,
        timeString: "12:30",
        hours: 12,
        minutes: 30,
      });

      expect(status.isOpenNow).toBe(false);
      expect(status.statusText).toBe("Sedang Istirahat");
    });

    it("menilai 'Tutup Sekarang' jika sebelum jam buka atau setelah jam tutup", () => {
      const statusEarly = evaluateOperatingStatus(sampleSchedule, {
        dayOfWeek: 1,
        timeString: "08:30",
        hours: 8,
        minutes: 30,
      });
      expect(statusEarly.isOpenNow).toBe(false);
      expect(statusEarly.statusText).toBe("Tutup Sekarang");

      const statusLate = evaluateOperatingStatus(sampleSchedule, {
        dayOfWeek: 1,
        timeString: "19:00",
        hours: 19,
        minutes: 0,
      });
      expect(statusLate.isOpenNow).toBe(false);
      expect(statusLate.statusText).toBe("Tutup Sekarang");
    });

    it("getJakartaCurrentTime menghasilkan jam, menit, dan dayOfWeek yang valid", () => {
      const currentTime = getJakartaCurrentTime();
      expect(currentTime.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(currentTime.dayOfWeek).toBeLessThanOrEqual(6);
      expect(currentTime.timeString).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("getPublicOperatingHours", () => {
    it("mengembalikan jadwal mingguan lengkap 7 hari dan status saat ini", async () => {
      vi.mocked(prisma.business.findFirst).mockResolvedValueOnce({
        id: "biz-1",
        timezone: "Asia/Jakarta",
        operatingHours: [
          {
            id: "h-1",
            dayOfWeek: 1,
            isOpen: true,
            openTime: "09:00",
            closeTime: "18:00",
            breaks: [{ id: "b-1", startTime: "12:00", endTime: "13:00" }],
          },
        ],
      } as unknown as Awaited<ReturnType<typeof prisma.business.findFirst>>);

      const hoursData = await getPublicOperatingHours();

      expect(hoursData.schedule).toHaveLength(7);
      expect(hoursData.timezone).toBe("Asia/Jakarta");
      expect(hoursData.schedule[1].dayName).toBe("Senin");
      expect(hoursData.schedule[1].isOpen).toBe(true);
      expect(hoursData.schedule[0].dayName).toBe("Minggu");
      expect(hoursData.schedule[0].isOpen).toBe(false);
    });
  });
});
