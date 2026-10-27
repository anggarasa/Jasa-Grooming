import { redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { getCurrentUser } from "@backend/lib/auth/server";
import prisma from "@backend/lib/prisma";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard - PawCare Grooming",
  description: "Portal operasional terproteksi untuk tim admin dan pemilik PawCare Grooming.",
};

/**
 * Data ringan untuk kerangka (sidebar): nama bisnis dan jumlah reservasi yang
 * menunggu konfirmasi (lencana pada menu Pemesanan). Hanya BACA data yang sudah
 * ada; bila gagal, kerangka tetap tampil dengan nilai bawaan — kegagalan di sini
 * tidak boleh membuat seluruh dashboard tidak bisa dibuka.
 */
async function loadShellData() {
  let businessName = "PawCare Grooming";
  const badges: Record<string, number> = {};
  try {
    const business = await getPrimaryBusiness();
    businessName = business.name || businessName;
    const pending = await prisma.booking.count({
      where: { businessId: business.id, status: BookingStatus.PENDING },
    });
    if (pending > 0) badges["/dashboard/bookings"] = pending;
  } catch (error) {
    console.error("Gagal memuat data kerangka dashboard:", error);
  }
  return { businessName, badges };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { businessName, badges } = await loadShellData();

  return (
    <DashboardShell user={user} businessName={businessName} badges={badges}>
      {children}
    </DashboardShell>
  );
}
