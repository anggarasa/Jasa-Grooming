import * as React from "react";
import Link from "next/link";
import {
  PawPrint,
  CalendarCheck,
  Calendar,
  Clock,
  PlusCircle,
  CalendarOff,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/server";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { getDashboardOverview } from "@/modules/bookings/admin-booking.service";
import { formatIndonesianDate } from "@/lib/format-date";
import { formatIDR } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookingStatusBadge,
  BookingSourceBadge,
} from "@/components/dashboard/bookings/BookingStatusBadge";
import { BookingListItem } from "@/modules/bookings/admin-ui.types";
import { serializeBookingListItem } from "@/modules/bookings/booking-serializer";

export const instant = false;

export default async function DashboardOverviewPage() {
  const [user, business] = await Promise.all([
    getCurrentUser(),
    getPrimaryBusiness(),
  ]);

  let overview = {
    today: new Date().toISOString().slice(0, 10),
    metrics: {
      todayTotal: 0,
      confirmedToday: 0,
      checkedInToday: 0,
      inProgressToday: 0,
      completedToday: 0,
      cancelledToday: 0,
      upcomingTotal: 0,
    },
    todayBookings: [] as BookingListItem[],
  };

  try {
    const rawOverview = await getDashboardOverview(business.id);
    overview = {
      ...rawOverview,
      todayBookings: rawOverview.todayBookings.map(serializeBookingListItem),
    };
  } catch (error) {
    console.error("Gagal mengambil data dashboard overview:", error);
  }

  const { metrics, todayBookings } = overview;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-slate-900 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Operasional Aktif
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Selamat datang kembali, {user?.name || "Admin"}!
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-xl">
              Portal manajemen janji temu & reservasi PawCare Grooming. Pantau alur
              kedatangan anabul hari ini dan kelola jadwal secara real-time.
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              asChild
              className="bg-accent hover:bg-accent-hover text-white shadow-sm font-semibold"
            >
              <Link href="/dashboard/bookings/new">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Tambah Walk-in
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <Link href="/dashboard/calendar">
                <Calendar className="h-4 w-4 mr-1.5" />
                Buka Kalender
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <Link href="/dashboard/blocked-times">
                <CalendarOff className="h-4 w-4 mr-1.5" />
                Blokir Waktu
              </Link>
            </Button>
          </div>
        </div>

        {/* Decorative background paw */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none text-white">
          <PawPrint className="h-56 w-56 transform rotate-12" />
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Janji Hari Ini */}
        <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {metrics.todayTotal}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total janji</p>
          </CardContent>
        </Card>

        {/* Dikonfirmasi */}
        <Card className="border-border shadow-xs hover:border-blue-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Dikonfirmasi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {metrics.confirmedToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Siap datang</p>
          </CardContent>
        </Card>

        {/* Check-in */}
        <Card className="border-border shadow-xs hover:border-purple-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {metrics.checkedInToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sudah di lokasi</p>
          </CardContent>
        </Card>

        {/* Sedang Dikerjakan */}
        <Card className="border-border shadow-xs hover:border-sky-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Dikerjakan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
              {metrics.inProgressToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Di stasiun grooming</p>
          </CardContent>
        </Card>

        {/* Selesai Hari Ini */}
        <Card className="border-border shadow-xs hover:border-emerald-400 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Selesai
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {metrics.completedToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Selesai dirawat</p>
          </CardContent>
        </Card>

        {/* Mendatang */}
        <Card className="border-border shadow-xs hover:border-accent transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-accent uppercase tracking-wider">
              Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-accent">
              {metrics.upcomingTotal}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Jadwal berikutnya</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments Section */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Jadwal Janji Temu Hari Ini</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Daftar reservasi anabul yang terjadwal untuk hari ini ({overview.today}).
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/bookings">
                Semua Reservasi
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {todayBookings.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">
                  Belum ada janji temu hari ini
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Belum ada reservasi masuk untuk hari ini. Anda dapat menambahkan reservasi pelanggan yang datang langsung (walk-in).
                </p>
              </div>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white">
                <Link href="/dashboard/bookings/new">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  Tambah Reservasi Walk-in
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[110px]">Waktu</TableHead>
                    <TableHead>Kode & Sumber</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Anabul</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayBookings.map((b) => {
                    const startHours = formatIndonesianDate(b.startAt, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const endHours = formatIndonesianDate(b.endAt, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <TableRow key={b.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-foreground text-xs whitespace-nowrap">
                          {startHours} - {endHours} WIB
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-mono text-xs font-bold text-primary block">
                              #{b.bookingCode}
                            </span>
                            <BookingSourceBadge source={b.source} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-medium text-foreground block">
                              {b.customer?.name}
                            </span>
                            <span className="text-muted-foreground block text-[11px]">
                              {b.customer?.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-medium text-foreground block">
                              {b.pet?.name}
                            </span>
                            <span className="text-muted-foreground block text-[11px]">
                              {b.pet?.type} {b.pet?.breed ? `• ${b.pet?.breed}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-medium text-foreground block">
                              {b.service?.name}
                            </span>
                            <span className="text-muted-foreground block text-[11px]">
                              {formatIDR(Number(b.totalPrice))}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                            <Link href={`/dashboard/bookings/${b.id}`}>
                              Detail
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
