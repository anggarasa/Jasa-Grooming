"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  Mail,
  PawPrint,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RotateCw,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/format-date";
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
import { Badge } from "@/components/ui/badge";
import {
  CustomerListItem,
  CustomerPetSummary,
} from "@/modules/bookings/admin-ui.types";

export function CustomersTable() {
  const [customers, setCustomers] = React.useState<CustomerListItem[]>([]);
  const [meta, setMeta] = React.useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState<number>(0);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  React.useEffect(() => {
    let isSubscribed = true;

    const loadCustomers = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      try {
        const res = await fetch(`/api/admin/customers?${params.toString()}`);
        const json = await res.json();

        if (!isSubscribed) return;

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Gagal memuat data pelanggan.");
        }

        setCustomers(json.data.items || []);
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

    loadCustomers();

    return () => {
      isSubscribed = false;
    };
  }, [page, debouncedSearch, refreshKey]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pelanggan berdasarkan nama, nomor telepon, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
              aria-label="Cari data pelanggan"
            />
          </div>
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="text-xs h-9"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm flex items-center justify-between border-b">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)} className="text-xs h-7">
              Coba Lagi
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Pelanggan</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Anabul Terdaftar</TableHead>
                <TableHead>Total Kunjungan</TableHead>
                <TableHead>Kunjungan Terakhir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        Memuat data pelanggan...
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="h-10 w-10 text-muted-foreground/60" />
                      <p className="font-semibold text-foreground text-sm">
                        Tidak ada pelanggan ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Data pelanggan akan otomatis terdata saat ada reservasi masuk (online maupun walk-in).
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ID: {c.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{c.phone}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                            <Mail className="h-3 w-3" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {c.pets && c.pets.length > 0 ? (
                          c.pets.map((p: CustomerPetSummary) => (
                            <Badge
                              key={p.id}
                              variant="outline"
                              className="text-[11px] px-2 py-0 h-5"
                            >
                              <PawPrint className="h-2.5 w-2.5 mr-1 text-accent" />
                              {p.name} ({p.type})
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs text-primary">
                        {c.totalBookings} kunjungan
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {c.lastBooking?.startAt
                          ? formatIndonesianDate(c.lastBooking.startAt, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Belum ada"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-primary font-semibold">
                        <Link href={`/dashboard/customers/${c.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Detail
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
            pelanggan
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
