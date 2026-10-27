import * as React from "react";
import Link from "next/link";
import { Calendar, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/components/dashboard/calendar/CalendarView";

export const instant = false;

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Kalender Reservasi
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visualisasi jadwal janji temu anabul dalam tampilan Harian, Mingguan, dan Bulanan beserta pemblokiran waktu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/bookings">Daftar Tabel</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white">
            <Link href="/dashboard/bookings/new">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Tambah Walk-in
            </Link>
          </Button>
        </div>
      </div>

      <CalendarView />
    </div>
  );
}
