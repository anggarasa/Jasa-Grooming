import * as React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  PlusCircle,
  CalendarOff,
  ArrowRight,
  Scissors,
  Wallet,
} from "lucide-react";
import { getCurrentUser } from "@backend/lib/auth/server";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import {
  getDashboardOverview,
  listAdminBookings,
} from "@backend/modules/bookings/admin-booking.service";
import { formatIndonesianTime } from "@/lib/format-date";
import { formatIDR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
import { BookingListItem } from "@backend/modules/bookings/admin-ui.types";
import { serializeBookingListItem } from "@backend/modules/bookings/booking-serializer";
import {
  addDays,
  buildDailySeries,
  compareToYesterday,
  percentOf,
  serviceBreakdown,
  sourceSplit,
  type DayPoint,
  type StatBooking,
} from "@backend/modules/bookings/dashboard-stats";
import { StatCard, type DeltaTone } from "@/components/dashboard/overview/StatCard";
import { ReportChart } from "@/components/dashboard/overview/ReportChart";
import { ProgressGauge } from "@/components/dashboard/overview/ProgressGauge";
import { BreakdownCard } from "@/components/dashboard/overview/BreakdownCard";

export const instant = false;

/** Warna bertingkat dari hijau merek untuk rincian per layanan. */
const SERVICE_COLORS = ["#1B5C49", "#3B8B72", "#7FC1A6", "#B7DECB", "#D9ECE2"];

/** Ambil seluruh reservasi dalam rentang tanggal lewat fungsi daftar yang sudah ada (maks. 5×100 baris). */
async function loadWindowBookings(businessId: string, startDate: string, endDate: string) {
  const collected: StatBooking[] = [];
  for (let page = 1; page <= 5; page += 1) {
    const result = await listAdminBookings(businessId, {
      page,
      limit: 100,
      startDate,
      endDate,
      sortBy: "startAt",
      sortOrder: "asc",
    });
    for (const item of result.items) {
      collected.push({
        startAt: item.startAt,
        status: item.status,
        source: item.source,
        price: Number(item.totalPrice),
        serviceName: item.serviceNameSnapshot || item.service?.name || "Layanan",
      });
    }
    if (page >= result.meta.totalPages) break;
  }
  return collected;
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

/** Teks pembanding "dibanding kemarin" untuk jumlah. */
function countCaption(today: number, yesterday: number): { text: string; tone: DeltaTone } {
  if (today === 0 && yesterday === 0) return { text: "Belum ada data hari ini", tone: "none" };
  const { delta, pct, same } = compareToYesterday(today, yesterday);
  if (same) return { text: "Sama seperti kemarin", tone: "flat" };
  const pctText = pct === null ? "" : ` (${signed(pct)}%)`;
  return { text: `${signed(delta)}${pctText} dibanding kemarin`, tone: delta > 0 ? "up" : "down" };
}

/** Teks pembanding "dibanding kemarin" untuk rupiah. */
function moneyCaption(today: number, yesterday: number): { text: string; tone: DeltaTone } {
  if (today === 0 && yesterday === 0) return { text: "Belum ada pendapatan selesai", tone: "none" };
  const delta = today - yesterday;
  if (delta === 0) return { text: "Sama seperti kemarin", tone: "flat" };
  return {
    text: `${delta > 0 ? "+" : "−"}${formatIDR(Math.abs(delta))} dibanding kemarin`,
    tone: delta > 0 ? "up" : "down",
  };
}

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

  // Data 14 hari untuk grafik: dari data reservasi yang sudah ada. Bila gagal, grafik
  // tetap tampil kosong dan sisa halaman tidak terpengaruh.
  let windowBookings: StatBooking[] = [];
  try {
    windowBookings = await loadWindowBookings(
      business.id,
      addDays(overview.today, -6),
      addDays(overview.today, 7)
    );
  } catch (error) {
    console.error("Gagal mengambil data grafik dashboard:", error);
  }

  const series: DayPoint[] = buildDailySeries(windowBookings, overview.today);
  const todayIndex = Math.max(0, series.findIndex((point) => point.isToday));
  const todayPoint = series[todayIndex];
  const yesterdayPoint = series[Math.max(0, todayIndex - 1)];

  // Pendapatan selesai hari ini dihitung dari daftar hari ini (sumber yang sama dengan tabel).
  const completedRevenueToday = todayBookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
  const activeToday = todayPoint.active;
  const completedShare = percentOf(metrics.completedToday, activeToday);
  const sources = sourceSplit(todayBookings);

  const todayCaption = countCaption(metrics.todayTotal, yesterdayPoint.total);
  const doneCaption = moneyCaption(completedRevenueToday, yesterdayPoint.completedRevenue);

  const noShowToday = todayBookings.filter((b) => b.status === "NO_SHOW").length;
  const pendingToday = todayBookings.filter((b) => b.status === "PENDING").length;
  const services = serviceBreakdown(windowBookings, 4);
  const serviceTotal = services.reduce((sum, s) => sum + s.count, 0);

  return (
    // Animasi masuk halaman ditangani `src/app/dashboard/template.tsx` (berlaku di semua menu).
    <div className="space-y-5 lg:space-y-6">
      {/*
        Kepala halaman — mengikuti gambar referensi: judul di kiri, tombol aksi di kanan.
        Seluruh teks dan tautan aksi sama seperti sebelum redesign.
      */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-status-dot" />
            Sistem Operasional Aktif
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Selamat datang kembali, {user?.name || "Admin"}!
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Portal manajemen janji temu & reservasi PawCare Grooming. Pantau alur
            kedatangan anabul hari ini dan kelola jadwal secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0 lg:flex-nowrap">
          <Button asChild className="motion-admin-press font-semibold">
            <Link href="/dashboard/bookings/new">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Tambah Walk-in
            </Link>
          </Button>
          <Button asChild variant="outline" className="motion-admin-press">
            <Link href="/dashboard/calendar">
              <Calendar className="mr-1.5 h-4 w-4" />
              Buka Kalender
            </Link>
          </Button>
          <Button asChild variant="outline" className="motion-admin-press">
            <Link href="/dashboard/blocked-times">
              <CalendarOff className="mr-1.5 h-4 w-4" />
              Blokir Waktu
            </Link>
          </Button>
        </div>
      </div>

      {/* Kartu ringkasan: batang mini = 14 hari data nyata, hari ini ditandai lebih tua */}
      <div className="motion-admin-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Janji Hari Ini"
          value={String(metrics.todayTotal)}
          caption={todayCaption.text}
          tone={todayCaption.tone}
          series={series.map((p) => p.total)}
          highlightIndex={todayIndex}
          seriesLabel="Jumlah janji per hari, 6 hari lalu sampai 7 hari ke depan"
        />
        <StatCard
          icon={CalendarClock}
          label="Mendatang"
          value={String(metrics.upcomingTotal)}
          caption="Menunggu & dikonfirmasi ke depan"
          series={series.map((p) => p.upcoming)}
          highlightIndex={todayIndex}
          seriesLabel="Janji menunggu dan dikonfirmasi per hari ke depan"
        />
        <StatCard
          icon={CheckCircle2}
          label="Selesai Hari Ini"
          value={String(metrics.completedToday)}
          caption={
            activeToday > 0
              ? `${completedShare}% dari ${activeToday} janji aktif`
              : "Belum ada janji aktif"
          }
          tone={metrics.completedToday > 0 ? "up" : "none"}
          series={series.map((p) => p.completed)}
          highlightIndex={todayIndex}
          seriesLabel="Janji selesai per hari"
        />
        <StatCard
          icon={Wallet}
          label="Pendapatan Selesai"
          value={formatIDR(completedRevenueToday)}
          caption={doneCaption.text}
          tone={doneCaption.tone}
          series={series.map((p) => p.completedRevenue)}
          highlightIndex={todayIndex}
          seriesLabel="Pendapatan dari janji selesai per hari"
        />
      </div>

      {/* Grafik + gauge */}
      {/*
        `grid-cols-1` (= minmax(0,1fr)) WAJIB: tanpa itu kolom tunggal memakai lebar `auto` dan
        lebar minimum grafik/tabel memaksa halaman melebar melebihi layar ponsel.
      */}
      <div className="motion-admin-stagger grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ReportChart series={series} />
        <ProgressGauge
          title="Progres Hari Ini"
          percent={completedShare}
          centerLabel="Pendapatan selesai"
          centerValue={formatIDR(completedRevenueToday)}
          legend={[
            { label: "Online", value: sources.online, color: "var(--primary)" },
            { label: "Walk-in", value: sources.walkIn + sources.admin, color: "var(--chart-bar-top)" },
          ]}
          footnote={
            activeToday > 0
              ? `${metrics.completedToday} dari ${activeToday} janji aktif hari ini sudah selesai.`
              : "Belum ada janji aktif hari ini."
          }
          href="/dashboard/bookings"
          linkLabel="Lihat Semua Reservasi"
        />
      </div>

      {/* Tabel + rincian */}
      <div className="motion-admin-stagger grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border-border">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground"
              >
                <CalendarCheck className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Jadwal Janji Temu Hari Ini</h2>
                <p className="text-xs text-muted-foreground">
                  Daftar reservasi anabul yang terjadwal untuk hari ini ({overview.today}).
                </p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="motion-admin-press self-start sm:self-auto">
              <Link href="/dashboard/bookings">
                Semua Reservasi
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <CardContent className="p-0">
            {todayBookings.length === 0 ? (
              <div className="space-y-3 px-4 py-12 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Belum ada janji temu hari ini
                  </h3>
                  <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                    Belum ada reservasi masuk untuk hari ini. Anda dapat menambahkan reservasi pelanggan yang datang langsung (walk-in).
                  </p>
                </div>
                <Button asChild size="sm" className="motion-admin-press">
                  <Link href="/dashboard/bookings/new">
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Tambah Reservasi Walk-in
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="[&_td]:px-3 [&_th]:px-3 [&_tr>*:first-child]:pl-5 [&_tr>*:last-child]:pr-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu & Kode</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Anabul</TableHead>
                      <TableHead>Layanan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayBookings.map((b) => {
                      const startHours = formatIndonesianTime(b.startAt);
                      const endHours = formatIndonesianTime(b.endAt);

                      return (
                        <TableRow key={b.id} className="motion-admin-row">
                          <TableCell>
                            {/* Waktu, kode, dan sumber dalam satu sel agar tabel muat di kolom kiri. */}
                            <div className="space-y-1">
                              <span className="block whitespace-nowrap text-xs font-semibold text-foreground">
                                {startHours} - {endHours} WIB
                              </span>
                              <span className="block whitespace-nowrap font-mono text-[11px] font-bold text-primary">
                                #{b.bookingCode}
                              </span>
                              <BookingSourceBadge source={b.source} className="px-2 py-0 text-[10px]" />
                            </div>
                          </TableCell>
                          <TableCell>
                            {/* Avatar inisial seperti pola tabel pada gambar referensi. */}
                            <div className="flex items-center gap-2.5">
                              <span
                                aria-hidden="true"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary"
                              >
                                {(b.customer?.name || "?")
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </span>
                              <div className="min-w-0 text-xs">
                                <span className="block truncate font-medium text-foreground">
                                  {b.customer?.name}
                                </span>
                                <span className="block text-[11px] text-muted-foreground">
                                  {b.customer?.phone}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="block font-medium text-foreground">{b.pet?.name}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {b.pet?.type} {b.pet?.breed ? `• ${b.pet?.breed}` : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="block font-medium text-foreground">{b.service?.name}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {formatIDR(Number(b.totalPrice))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <BookingStatusBadge status={b.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              asChild
                              size="icon"
                              variant="ghost"
                              className="motion-admin-press h-9 w-9 rounded-full"
                            >
                              <Link
                                href={`/dashboard/bookings/${b.id}`}
                                aria-label={`Detail reservasi ${b.bookingCode}`}
                                title="Detail reservasi"
                              >
                                <ArrowRight className="h-4 w-4" />
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

        <div className="space-y-5">
          <BreakdownCard
            icon={ClipboardList}
            title="Status Janji Hari Ini"
            totalLabel="Total janji"
            totalValue={String(metrics.todayTotal)}
            emptyText="Belum ada janji hari ini."
            rows={[
              { label: "Menunggu", value: pendingToday, color: "var(--badge-booking-pending-dot)" },
              { label: "Dikonfirmasi", value: metrics.confirmedToday, color: "var(--badge-booking-confirmed-dot)" },
              { label: "Check-in", value: metrics.checkedInToday, color: "var(--badge-booking-checked-in-dot)" },
              { label: "Dikerjakan", value: metrics.inProgressToday, color: "var(--badge-booking-in-progress-dot)" },
              { label: "Selesai", value: metrics.completedToday, color: "var(--badge-booking-completed-dot)" },
              { label: "Dibatalkan", value: metrics.cancelledToday, color: "var(--badge-booking-cancelled-dot)" },
              { label: "Tidak Hadir", value: noShowToday, color: "var(--badge-booking-no-show-dot)" },
            ]}
          />

          <BreakdownCard
            icon={Scissors}
            title="Layanan Terlaris · 14 Hari"
            totalLabel="Reservasi aktif"
            totalValue={String(serviceTotal)}
            emptyText="Belum ada reservasi aktif pada 14 hari ini."
            rows={services.map((s, i) => ({
              label: s.name,
              value: s.count,
              color: SERVICE_COLORS[i % SERVICE_COLORS.length],
              hint: formatIDR(s.revenue),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
