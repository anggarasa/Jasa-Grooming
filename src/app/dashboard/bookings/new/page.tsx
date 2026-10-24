import * as React from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { WalkInBookingForm } from "@/components/dashboard/bookings/WalkInBookingForm";

export const instant = false;

interface RawServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: unknown;
  description: string | null;
}

export default async function NewWalkInBookingPage() {
  let services: RawServiceItem[] = [];

  try {
    const business = await getPrimaryBusiness();
    services = await prisma.service.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Gagal memuat layanan untuk form walk-in:", error);
  }

  const formattedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
    description: s.description,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href="/dashboard/bookings">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Daftar Reservasi
              </Link>
            </Button>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs font-semibold text-muted-foreground">
              Walk-in Baru
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1">
            <UserPlus className="h-6 w-6 text-accent" />
            Buat Reservasi Walk-in
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Buat janji temu untuk pelanggan yang datang langsung ke toko tanpa booking online sebelumnya.
          </p>
        </div>
      </div>

      <WalkInBookingForm services={formattedServices} />
    </div>
  );
}
