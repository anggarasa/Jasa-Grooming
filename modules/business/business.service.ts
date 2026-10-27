import {
  findPrimaryBusiness,
  updateBusiness,
  findOperatingHours,
  replaceOperatingHours,
  findBookingSettings,
  upsertBookingSettings,
} from "./business.repository";
import {
  UpdateBusinessProfileInput,
  UpdateOperatingHoursInput,
  UpdateBookingSettingsInput,
} from "./schemas";

export async function getPrimaryBusiness() {
  const business = await findPrimaryBusiness();
  if (!business) {
    throw new Error("Data bisnis belum diinisialisasi dalam basis data.");
  }
  return business;
}

export async function getBusinessProfile() {
  return getPrimaryBusiness();
}

export async function updateBusinessProfile(input: UpdateBusinessProfileInput) {
  const business = await getPrimaryBusiness();

  const updated = await updateBusiness(business.id, {
    name: input.name,
    description: input.description,
    email: input.email || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    address: input.address || null,
    fullAddress: input.fullAddress || null,
    city: input.city || null,
    province: input.province || null,
    postalCode: input.postalCode || null,
    googleMapsUrl: input.googleMapsUrl || null,
    timezone: input.timezone || "Asia/Jakarta",
    logoObjectKey: input.logoObjectKey !== undefined ? input.logoObjectKey : business.logoObjectKey,
    status: input.status !== undefined ? input.status : business.status,
    isActive: input.isActive !== undefined ? input.isActive : business.isActive,
  });

  return updated;
}

export async function getOperatingHours() {
  const business = await getPrimaryBusiness();
  let hours = await findOperatingHours(business.id);

  // Jika belum ada jam operasional sama sekali, inisialisasi default 7 hari (0..6)
  if (hours.length === 0) {
    const defaultDays = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isOpen: i !== 0, // Minggu libur default
      openTime: "09:00",
      closeTime: i === 0 ? "16:00" : "18:00",
      breaks: i === 0 ? [] : [{ startTime: "12:00", endTime: "13:00" }],
    }));

    hours = await replaceOperatingHours(business.id, defaultDays);
  }

  return hours;
}

export async function updateOperatingHours(input: UpdateOperatingHoursInput) {
  const business = await getPrimaryBusiness();

  // Mapping input
  const days = input.hours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    isOpen: h.isOpen,
    openTime: h.openTime,
    closeTime: h.closeTime,
    breaks: (h.breaks || []).map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    })),
  }));

  const updatedHours = await replaceOperatingHours(business.id, days);
  return updatedHours;
}

export async function getBookingSettings() {
  const business = await getPrimaryBusiness();
  let settings = await findBookingSettings(business.id);

  if (!settings) {
    settings = await upsertBookingSettings(business.id, {
      bookingEnabled: true,
      currency: "IDR",
      bookingIntervalMinutes: 30,
      defaultBufferMinutes: 15,
      minimumAdvanceMinutes: 60,
      maximumAdvanceDays: 30,
      cancellationWindowHours: 24,
      autoConfirmBooking: false,
      allowCustomerReschedule: true,
    });
  }

  return settings;
}

export async function updateBookingSettings(input: UpdateBookingSettingsInput) {
  const business = await getPrimaryBusiness();

  const updated = await upsertBookingSettings(business.id, {
    ...(input.bookingEnabled !== undefined && { bookingEnabled: input.bookingEnabled }),
    ...(input.currency !== undefined && { currency: input.currency }),
    ...(input.bookingIntervalMinutes !== undefined && { bookingIntervalMinutes: input.bookingIntervalMinutes }),
    ...(input.defaultBufferMinutes !== undefined && { defaultBufferMinutes: input.defaultBufferMinutes }),
    ...(input.minimumAdvanceMinutes !== undefined && { minimumAdvanceMinutes: input.minimumAdvanceMinutes }),
    ...(input.maximumAdvanceDays !== undefined && { maximumAdvanceDays: input.maximumAdvanceDays }),
    ...(input.cancellationWindowHours !== undefined && { cancellationWindowHours: input.cancellationWindowHours }),
    ...(input.autoConfirmBooking !== undefined && { autoConfirmBooking: input.autoConfirmBooking }),
    ...(input.allowCustomerReschedule !== undefined && { allowCustomerReschedule: input.allowCustomerReschedule }),
  });

  return updated;
}
