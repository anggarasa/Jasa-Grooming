"use client";

import * as React from "react";
import {
  CalendarOff,
  PlusCircle,
  Trash2,
  Loader2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { formatIndonesianDateOnly, formatIndonesianTime } from "@/lib/format-date";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarBlockedTimeItem } from "@backend/modules/bookings/admin-ui.types";

interface ResourceOption {
  id: string;
  name: string;
}

interface BlockedTimesManagerProps {
  initialResources: ResourceOption[];
}

export function BlockedTimesManager({
  initialResources,
}: BlockedTimesManagerProps) {
  const [blocks, setBlocks] = React.useState<CalendarBlockedTimeItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedResourceId, setSelectedResourceId] = React.useState<string>(
    initialResources[0]?.id || ""
  );
  const [startDateTime, setStartDateTime] = React.useState("");
  const [endDateTime, setEndDateTime] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dialogError, setDialogError] = React.useState<string | null>(null);

  // Cancel Block confirmation dialog
  const [cancellingBlockId, setCancellingBlockId] = React.useState<string | null>(null);
  const [isCancelling, setIsCancelling] = React.useState(false);

  React.useEffect(() => {
    let isSubscribed = true;

    const loadBlocks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/resource-blocks?includeCancelled=true");
        const json = await res.json();

        if (!isSubscribed) return;

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Gagal mengambil daftar blokir waktu.");
        }

        setBlocks(json.data || []);
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

    loadBlocks();

    return () => {
      isSubscribed = false;
    };
  }, [refreshKey]);

  const handleOpenDialog = () => {
    // Default waktu mulai sekarang rounded ke jam berikutnya
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);

    const end = new Date(now);
    end.setHours(end.getHours() + 2);

    // Format local datetime string YYYY-MM-DDTHH:mm
    const toInputVal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStartDateTime(toInputVal(now));
    setEndDateTime(toInputVal(end));
    setReason("");
    setDialogError(null);
    setIsDialogOpen(true);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDateTime || !endDateTime) {
      setDialogError("Pilih waktu mulai dan selesai.");
      return;
    }

    const startUtc = new Date(startDateTime).toISOString();
    const endUtc = new Date(endDateTime).toISOString();

    if (new Date(startUtc) >= new Date(endUtc)) {
      setDialogError("Waktu mulai harus sebelum waktu selesai.");
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setDialogError("Alasan pemblokiran minimal 3 karakter.");
      return;
    }

    setIsSubmitting(true);
    setDialogError(null);

    try {
      const res = await fetch("/api/admin/resource-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          startAt: startUtc,
          endAt: endUtc,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal membuat blokir waktu.");
      }

      toast.success("Waktu operasional berhasil diblokir.");
      setIsDialogOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setDialogError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBlock = async () => {
    if (!cancellingBlockId) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/admin/resource-blocks/${cancellingBlockId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Dibatalkan oleh staf admin via portal" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal membatalkan blokir waktu.");
      }

      toast.success("Blokir waktu berhasil dibatalkan.");
      setCancellingBlockId(null);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Daftar Blokir Waktu Operasional
          </h2>
          <p className="text-xs text-muted-foreground">
            Waktu yang diblokir tidak dapat dipilih oleh pelanggan saat memesan slot reservasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={isLoading}
            className="h-9 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          <Button
            type="button"
            onClick={handleOpenDialog}
            className="bg-primary hover:bg-primary/90 text-white h-9 text-xs font-semibold shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Tambah Blokir Waktu
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table of Blocks */}
      <div className="bg-card border border-border rounded-[var(--radius-admin-card)] shadow-[var(--shadow-admin-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Stasiun Grooming</TableHead>
                <TableHead>Waktu Mulai</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Alasan Pemblokiran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        Memuat data pemblokiran waktu...
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CalendarOff className="h-10 w-10 text-muted-foreground/60" />
                      <p className="font-semibold text-foreground text-sm">
                        Belum ada waktu yang diblokir
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Anda dapat memblokir interval waktu untuk keperluan perbaikan fasilitas, sanitasi berkala, atau istirahat darurat.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => {
                  const isCancelled = !!block.cancelledAt;

                  return (
                    <TableRow
                      key={block.id}
                      className={isCancelled ? "opacity-60 bg-muted/20" : "hover:bg-muted/20"}
                    >
                      <TableCell className="font-semibold text-xs text-foreground">
                        {block.resource?.name || "Main Grooming Station"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">
                          {formatIndonesianDateOnly(block.startAt)}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {formatIndonesianTime(block.startAt)}{" "}
                          WIB
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">
                          {formatIndonesianDateOnly(block.endAt)}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {formatIndonesianTime(block.endAt)}{" "}
                          WIB
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs">
                        <p className="text-foreground truncate" title={block.reason}>
                          {block.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        {isCancelled ? (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Dibatalkan
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-amber-600 text-white text-[10px]">
                            Aktif Diblokir
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isCancelled && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCancellingBlockId(block.id)}
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            title="Hapus / Batalkan blokir waktu"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Batalkan
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Tambah Blokir Waktu */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CalendarOff className="h-5 w-5 text-accent" />
              Tambah Blokir Waktu Operasional
            </DialogTitle>
            <DialogDescription>
              Tentukan interval waktu dan alasan pemblokiran stasiun grooming.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBlock} className="space-y-4 py-2">
            {dialogError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{dialogError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="block-resource" className="text-xs font-semibold">
                Stasiun Grooming
              </Label>
              <select
                id="block-resource"
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {initialResources.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="block-start" className="text-xs font-semibold">
                  Waktu Mulai <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="block-start"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="block-end" className="text-xs font-semibold">
                  Waktu Selesai <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="block-end"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="block-reason" className="text-xs font-semibold">
                Alasan Pemblokiran <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="block-reason"
                placeholder="Contoh: Pembersihan & sanitasi mendalam pasca grooming anabul kutuan"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                className="resize-none text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Blokir Waktu"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Pembatalan Blokir */}
      <Dialog
        open={cancellingBlockId !== null}
        onOpenChange={(open) => !open && setCancellingBlockId(null)}
      >
        <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Batalkan Pemblokiran Waktu?
            </DialogTitle>
            <DialogDescription>
              Waktu operasional yang sebelumnya diblokir akan kembali terbuka dan dapat dipesan oleh pelanggan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancellingBlockId(null)}
              disabled={isCancelling}
            >
              Tidak
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isCancelling}
              onClick={handleCancelBlock}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                "Ya, Batalkan Blokir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
