import { prisma } from "@/lib/prisma";

export interface PublicBusinessProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  fullAddress: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  googleMapsUrl: string | null;
  timezone: string;
  logoObjectKey: string | null;
}

export interface PublicBookingSettings {
  bookingEnabled: boolean;
  currency: string;
  bookingIntervalMinutes: number;
  defaultBufferMinutes: number;
  minimumAdvanceMinutes: number;
  maximumAdvanceDays: number;
  cancellationWindowHours: number;
  allowCustomerReschedule: boolean;
}

/**
 * Mengambil profil bisnis publik aktif tanpa membocorkan credential/audit internal.
 */
export async function getPublicBusinessProfile(): Promise<PublicBusinessProfile | null> {
  const business = await prisma.business.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      email: true,
      phone: true,
      whatsapp: true,
      address: true,
      fullAddress: true,
      city: true,
      province: true,
      postalCode: true,
      googleMapsUrl: true,
      timezone: true,
      logoObjectKey: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return business;
}

/**
 * Mengambil aturan booking publik untuk validasi form dan batas reservasi.
 */
export async function getPublicBookingSettings(): Promise<PublicBookingSettings | null> {
  const business = await prisma.business.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      settings: {
        select: {
          bookingEnabled: true,
          currency: true,
          bookingIntervalMinutes: true,
          defaultBufferMinutes: true,
          minimumAdvanceMinutes: true,
          maximumAdvanceDays: true,
          cancellationWindowHours: true,
          allowCustomerReschedule: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!business || !business.settings) {
    return null;
  }

  return business.settings;
}
