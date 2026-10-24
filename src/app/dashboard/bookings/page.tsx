import * as React from "react";
import Link from "next/link";
import { PlusCircle, Calendar, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingsTable } from "@/components/dashboard/bookings/BookingsTable";
import prisma from "@/lib/prisma";
import { getPrimaryBusiness } from "@/modules/business/business.service";

export const instant = false;

export default async function AdminBookingsPage() {
  let services: { id: string; name: string }[] = [];

  try {
    const business = await getPrimaryBusiness();
    services = await prisma.service.findMany({
      where: {
        businessId: business.id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Gagal memuat daftar layanan untuk filter booking:", error);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manajemen Reservasi
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau seluruh data reservasi, kelola status pengerjaan anabul, dan lakukan penyesuaian jadwal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/calendar">
              <Calendar className="h-4 w-4 mr-1.5" />
              Tampilan Kalender
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <Link href="/dashboard/bookings/new">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Tambah Walk-in
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabel Master Reservasi */}
      <BookingsTable initialServices={services} />
    </div>
  );
}
