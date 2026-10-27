import * as React from "react";
import Link from "next/link";
import { CalendarOff, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import prisma from "@backend/lib/prisma";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { BlockedTimesManager } from "@/components/dashboard/blocked-times/BlockedTimesManager";

export const instant = false;

export default async function AdminBlockedTimesPage() {
  let resources: { id: string; name: string }[] = [];

  try {
    const business = await getPrimaryBusiness();
    resources = await prisma.bookingResource.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Gagal memuat stasiun grooming untuk blocked-times:", error);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarOff className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manajemen Blokir Waktu Operasional
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Blokir sementara waktu operasional stasiun grooming untuk keperluan perbaikan, sterilisasi, atau pemeliharaan alat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/calendar">
              <Calendar className="h-4 w-4 mr-1.5" />
              Lihat di Kalender
            </Link>
          </Button>
        </div>
      </div>

      <BlockedTimesManager initialResources={resources} />
    </div>
  );
}
