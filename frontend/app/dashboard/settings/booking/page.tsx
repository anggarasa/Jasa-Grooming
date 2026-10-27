import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/lib/auth/server";
import { getBookingSettings } from "@backend/modules/business/business.service";
import { BookingSettingsForm } from "@/components/dashboard/BookingSettingsForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Pengaturan Reservasi - PawCare Grooming",
  description: "Konfigurasi interval waktu, buffer, dan kebijakan pembatalan reservasi.",
};

export default async function BookingSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const settings = await getBookingSettings();

  const serializedSettings = {
    id: settings.id,
    businessId: settings.businessId,
    bookingEnabled: settings.bookingEnabled,
    currency: settings.currency,
    bookingIntervalMinutes: settings.bookingIntervalMinutes,
    defaultBufferMinutes: settings.defaultBufferMinutes,
    minimumAdvanceMinutes: settings.minimumAdvanceMinutes,
    maximumAdvanceDays: settings.maximumAdvanceDays,
    cancellationWindowHours: settings.cancellationWindowHours,
    autoConfirmBooking: settings.autoConfirmBooking,
    allowCustomerReschedule: settings.allowCustomerReschedule,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };

  return <BookingSettingsForm settings={serializedSettings} user={user} />;
}
