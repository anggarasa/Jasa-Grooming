"use client";

import * as React from "react";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import {
  Search,
  RotateCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/format-date";
import { formatIDR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
} from "./BookingStatusBadge";
import { BookingListItem } from "@/modules/bookings/admin-ui.types";

interface ServiceOption {
  id: string;
  name: string;
}

interface BookingsTableProps {
  initialServices?: ServiceOption[];
}

export function BookingsTable({ initialServices = [] }: BookingsTableProps) {
  const [bookings, setBookings] = React.useState<BookingListItem[]>([]);
  const [meta, setMeta] = React.useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("ALL");
  const [date, setDate] = React.useState<string>("");
  const [serviceId, setServiceId] = React.useState<string>("ALL");
  const [page, setPage] = React.useState<number>(1);
  const [services, setServices] = React.useState<ServiceOption[]>(initialServices);

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState<number>(0);

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch services jika belum disediakan
  React.useEffect(() => {
    if (services.length === 0) {
      let isSubscribed = true;
      fetch("/api/admin/services")
        .then((res) => res.json())
        .then((json) => {
          if (isSubscribed && json.success && Array.isArray(json.data)) {
            setServices(
              json.data.map((s: { id: string; name: string }) => ({
                id: s.id,
                name: s.name,
              }))
            );
          }
        })
        .catch(() => {});
      return () => {
        isSubscribed = false;
      };
    }
  }, [services.length]);

  // Fetch bookings list
  React.useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (status && status !== "ALL") {
        params.set("status", status);
      }
      if (date) {
        params.set("date", date);
      }
      if (serviceId && serviceId !== "ALL") {
        params.set("serviceId", serviceId);
      }

      try {
        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        const json = await res.json();

        if (!isSubscribed) return;

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Gagal memuat daftar reservasi.");
        }

        setBookings(json.data.items || []);
        setMeta(
          json.data.meta || {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 1,
          }
        );
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setError(msg);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [page, debouncedSearch, status, date, serviceId, refreshKey]);

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("ALL");
    setDate("");
    setServiceId("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode, nama, nomor telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
              aria-label="Cari reservasi"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              aria-label="Filter status reservasi"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">Semua Status</option>
              <option value={BookingStatus.PENDING}>Menunggu (PENDING)</option>
              <option value={BookingStatus.CONFIRMED}>Dikonfirmasi (CONFIRMED)</option>
              <option value={BookingStatus.CHECKED_IN}>Check-in (CHECKED_IN)</option>
              <option value={BookingStatus.IN_PROGRESS}>Sedang Dikerjakan (IN_PROGRESS)</option>
              <option value={BookingStatus.COMPLETED}>Selesai (COMPLETED)</option>
              <option value={BookingStatus.CANCELLED}>Dibatalkan (CANCELLED)</option>
              <option value={BookingStatus.NO_SHOW}>Tidak Hadir (NO_SHOW)</option>
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <select
              aria-label="Filter jenis layanan"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">Semua Layanan</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter & Reset */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs sm:text-sm h-9"
                aria-label="Pilih tanggal reservasi"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              title="Reset filter"
              aria-label="Reset filter"
              className="h-9 px-2 text-xs"
            >
              <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm flex items-center gap-2 border-b">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-xs h-7"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Coba Lagi
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[120px]">Kode & Sumber</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Anabul</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Total Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        Memuat data reservasi...
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CalendarCheck className="h-10 w-10 text-muted-foreground/60" />
                      <p className="font-semibold text-foreground text-sm">
                        Tidak ada data reservasi
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Tidak ditemukan reservasi yang sesuai dengan filter pencarian.
                      </p>
                      {(search || status !== "ALL" || date || serviceId !== "ALL") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs"
                        >
                          Hapus Filter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  const dateStr = formatIndonesianDate(booking.startAt, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const startTimeStr = formatIndonesianDate(booking.startAt, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const endTimeStr = formatIndonesianDate(booking.endAt, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <TableRow key={booking.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-primary block">
                            #{booking.bookingCode}
                          </span>
                          <BookingSourceBadge source={booking.source} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <span className="font-medium text-foreground block">
                            {dateStr}
                          </span>
                          <span className="text-muted-foreground block text-[11px]">
                            {startTimeStr} - {endTimeStr} WIB
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-medium text-foreground block">
                            {booking.customer?.name || "-"}
                          </span>
                          <span className="text-muted-foreground block text-[11px]">
                            {booking.customer?.phone || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-medium text-foreground block">
                            {booking.pet?.name || "-"}
                          </span>
                          <span className="text-muted-foreground block text-[11px]">
                            {booking.pet?.type || ""}
                            {booking.pet?.breed ? ` • ${booking.pet.breed}` : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-medium text-foreground block">
                            {booking.service?.name || "-"}
                          </span>
                          <span className="text-muted-foreground block text-[11px]">
                            {booking.service?.durationMinutes} menit
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {formatIDR(Number(booking.totalPrice))}
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs text-primary hover:text-accent font-semibold"
                        >
                          <Link href={`/dashboard/bookings/${booking.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Detail
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 text-xs text-muted-foreground">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-foreground">
              {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-foreground">
              {Math.min(meta.page * meta.limit, meta.total)}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            reservasi
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Sebelumnya
            </Button>
            <span className="px-2 font-medium text-foreground">
              Hal {meta.page} / {meta.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="h-8 text-xs"
            >
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
