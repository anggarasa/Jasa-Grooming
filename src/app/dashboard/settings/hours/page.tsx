import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getOperatingHours } from "@/modules/business/business.service";
import { OperatingHoursForm } from "@/components/dashboard/OperatingHoursForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Jam Operasional - PawCare Grooming",
  description: "Pengaturan jadwal kerja mingguan dan jeda istirahat PawCare Grooming.",
};

export default async function OperatingHoursPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hours = await getOperatingHours();

  // Serialisasi data untuk client component
  const serializedHours = hours.map((h) => ({
    id: h.id,
    businessId: h.businessId,
    dayOfWeek: h.dayOfWeek,
    isOpen: h.isOpen,
    openTime: h.openTime,
    closeTime: h.closeTime,
    breaks: (h.breaks || []).map((b) => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
    })),
  }));

  return <OperatingHoursForm initialHours={serializedHours} user={user} />;
}
