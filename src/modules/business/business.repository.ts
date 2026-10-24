import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function findPrimaryBusiness() {
  return prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

export async function updateBusiness(
  id: string,
  data: Prisma.BusinessUpdateInput
) {
  return prisma.business.update({
    where: { id },
    data,
  });
}

export async function findOperatingHours(businessId: string) {
  return prisma.businessOperatingHour.findMany({
    where: { businessId },
    include: {
      breaks: {
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { dayOfWeek: "asc" },
  });
}

export interface OperatingBreakInput {
  startTime: string;
  endTime: string;
}

export interface OperatingDayInput {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breaks: OperatingBreakInput[];
}

export async function replaceOperatingHours(
  businessId: string,
  days: OperatingDayInput[]
) {
  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const day of days) {
      const operatingHour = await tx.businessOperatingHour.upsert({
        where: {
          businessId_dayOfWeek: {
            businessId,
            dayOfWeek: day.dayOfWeek,
          },
        },
        update: {
          isOpen: day.isOpen,
          openTime: day.openTime,
          closeTime: day.closeTime,
        },
        create: {
          businessId,
          dayOfWeek: day.dayOfWeek,
          isOpen: day.isOpen,
          openTime: day.openTime,
          closeTime: day.closeTime,
        },
      });

      // Hapus break lama untuk hari tersebut
      await tx.businessOperatingBreak.deleteMany({
        where: { operatingHourId: operatingHour.id },
      });

      // Masukkan break baru jika hari buka dan ada list breaks
      if (day.isOpen && day.breaks.length > 0) {
        await tx.businessOperatingBreak.createMany({
          data: day.breaks.map((b) => ({
            operatingHourId: operatingHour.id,
            startTime: b.startTime,
            endTime: b.endTime,
          })),
        });
      }

      const updated = await tx.businessOperatingHour.findUnique({
        where: { id: operatingHour.id },
        include: {
          breaks: {
            orderBy: { startTime: "asc" },
          },
        },
      });

      results.push(updated!);
    }

    return results;
  });
}

export async function findBookingSettings(businessId: string) {
  return prisma.businessSetting.findUnique({
    where: { businessId },
  });
}

export async function upsertBookingSettings(
  businessId: string,
  data: Prisma.BusinessSettingUpdateInput
) {
  return prisma.businessSetting.upsert({
    where: { businessId },
    update: data,
    create: {
      businessId,
      bookingEnabled: typeof data.bookingEnabled === "boolean" ? data.bookingEnabled : true,
      currency: typeof data.currency === "string" ? data.currency : "IDR",
      bookingIntervalMinutes: typeof data.bookingIntervalMinutes === "number" ? data.bookingIntervalMinutes : 30,
      defaultBufferMinutes: typeof data.defaultBufferMinutes === "number" ? data.defaultBufferMinutes : 15,
      minimumAdvanceMinutes: typeof data.minimumAdvanceMinutes === "number" ? data.minimumAdvanceMinutes : 60,
      maximumAdvanceDays: typeof data.maximumAdvanceDays === "number" ? data.maximumAdvanceDays : 30,
      cancellationWindowHours: typeof data.cancellationWindowHours === "number" ? data.cancellationWindowHours : 24,
      autoConfirmBooking: typeof data.autoConfirmBooking === "boolean" ? data.autoConfirmBooking : false,
      allowCustomerReschedule: typeof data.allowCustomerReschedule === "boolean" ? data.allowCustomerReschedule : true,
    },
  });
}
