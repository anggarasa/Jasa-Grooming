"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ConflictStatusBadge,
  ConflictTypeBadge,
} from "./ConflictStatusBadge";
import {
  RotateCw,
  CheckCircle,
  Clock,
  Store,
  Calendar,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface SyncConflictItem {
  id: string;
  conflictType: string;
  localSnapshot: Record<string, unknown>;
  remoteSnapshot: Record<string, unknown>;
  status: string;
  detectedAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  resolvedByUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  booking?: {
    id: string;
    bookingCode: string;
    customer?: { name: string; phone: string } | null;
    pet?: { name: string } | null;
    service?: { name: string } | null;
    startAt: string;
    occupancyEndAt: string;
    status?: string;
  } | null;
  resourceBlock?: {
    id: string;
    reason: string;
    startAt: string;
    endAt: string;
  } | null;
}

interface ConflictResolutionCardProps {
  conflict: SyncConflictItem;
  onResolved: () => void;
}

export function ConflictResolutionCard({
  conflict,
  onResolved,
}: ConflictResolutionCardProps) {
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [activeAction, setActiveAction] = React.useState<"KEEP_LOCAL" | "OVERWRITE_LOCAL" | null>(null);

  const isPending = conflict.status === "PENDING";

  const handleResolve = async (actionType: "KEEP_LOCAL" | "OVERWRITE_LOCAL") => {
    setIsSubmitting(true);
    setActiveAction(actionType);

    try {
      const res = await fetch(`/api/integrations/google/conflicts/${conflict.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType === "KEEP_LOCAL" ? "RESTORE_LOCAL_TO_GOOGLE" : "MARK_RESOLVED",
          resolution: actionType,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal menyelesaikan konflik.");
      }

      toast.success(
        actionType === "KEEP_LOCAL"
          ? "Data lokal berhasil dijadwalkan untuk dipulihkan ke Google Calendar."
          : "Konflik berhasil ditandai selesai (mengikuti Google Calendar)."
      );
      onResolved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyelesaikan konflik.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // Extract snapshots safely
  const local = conflict.localSnapshot || {};
  const remote = conflict.remoteSnapshot || {};

  return (
    <Card className="border border-border shadow-xs overflow-hidden">
      <CardHeader className="bg-muted/15 pb-4 border-b border-border/70">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <ConflictTypeBadge type={conflict.conflictType} />
              <ConflictStatusBadge status={conflict.status} />
              <span className="font-mono text-xs text-muted-foreground">
                #{conflict.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <Clock className="h-3.5 w-3.5" />
              Terdeteksi: {formatDate(conflict.detectedAt)}
            </CardDescription>
          </div>

          {conflict.booking && (
            <div className="text-right sm:text-right">
              <span className="text-xs font-mono font-semibold text-accent block">
                {conflict.booking.bookingCode}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {conflict.booking.customer?.name || "Pelanggan Toko"}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Side-by-Side Diff Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Local PawCare Store State */}
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 space-y-3 dark:border-teal-500/30 dark:bg-teal-950/20">
            <div className="flex items-center justify-between pb-2 border-b border-teal-500/15">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-800 dark:text-teal-300">
                <Store className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Data Lokal (PawCare Store)
              </div>
              <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300">
                Lokal
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Judul / Booking:</span>
                <span className="font-medium text-foreground">
                  {String(local.bookingCode || local.reason || conflict.booking?.bookingCode || "-")}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Layanan & Anabul:</span>
                <span className="text-foreground">
                  {conflict.booking?.service?.name ? `${conflict.booking.service.name} (${conflict.booking.pet?.name || "Pet"})` : String(local.serviceName || "-")}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Waktu Mulai:</span>
                <span className="font-mono text-foreground">
                  {formatDate(String(local.startAt || conflict.booking?.startAt || ""))}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Waktu Selesai:</span>
                <span className="font-mono text-foreground">
                  {formatDate(String(local.occupancyEndAt || local.endAt || conflict.booking?.occupancyEndAt || ""))}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Status Lokal:</span>
                <span className="font-semibold text-foreground">
                  {String(local.status || conflict.booking?.status || "-")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Remote Google Calendar State */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3 dark:border-blue-500/30 dark:bg-blue-950/20">
            <div className="flex items-center justify-between pb-2 border-b border-blue-500/15">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Data Google Calendar
              </div>
              <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300">
                Google
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Ringkasan Event:</span>
                <span className="font-medium text-foreground">
                  {String(remote.summary || "(Event Dihapus atau Tidak Ditemukan)")}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Status Remote:</span>
                <span className="text-foreground font-semibold">
                  {String(remote.status || (conflict.conflictType === "REMOTE_DELETED" ? "cancelled / deleted" : "-"))}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Waktu Mulai (Google):</span>
                <span className="font-mono text-foreground">
                  {formatDate(String(remote.start || remote.startAt || ""))}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Waktu Selesai (Google):</span>
                <span className="font-mono text-foreground">
                  {formatDate(String(remote.end || remote.endAt || ""))}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">External ETag / ID:</span>
                <span className="font-mono text-[11px] text-muted-foreground truncate block" title={String(remote.etag || remote.id || "")}>
                  {String(remote.etag || remote.id || "-")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Notes & Resolution Details */}
        {isPending ? (
          <div className="space-y-2 pt-1">
            <Label htmlFor={`notes-${conflict.id}`} className="text-xs font-medium text-muted-foreground">
              Catatan Resolusi (Opsional)
            </Label>
            <Textarea
              id={`notes-${conflict.id}`}
              placeholder="Tuliskan catatan alasan resolusi bentrok jadwal ini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-xs"
              disabled={isSubmitting}
            />
          </div>
        ) : (
          <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>
                Diselesaikan pada <span className="font-medium text-foreground">{formatDate(conflict.resolvedAt)}</span>
                {conflict.resolvedByUser?.name && (
                  <span> oleh <span className="font-medium text-foreground">{conflict.resolvedByUser.name}</span></span>
                )}
              </span>
            </div>
            {conflict.resolutionNotes && (
              <p className="text-muted-foreground italic pl-6">
                &ldquo;{conflict.resolutionNotes}&rdquo;
              </p>
            )}
          </div>
        )}
      </CardContent>

      {isPending && (
        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 pb-4 border-t border-border/70 bg-muted/5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Pilih aksi yang harus diterapkan untuk menyelesaikan selisih jadwal:</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleResolve("OVERWRITE_LOCAL")}
              disabled={isSubmitting}
              className="text-xs border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10"
            >
              {isSubmitting && activeAction === "OVERWRITE_LOCAL" ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ikuti Google / Tandai Selesai"
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleResolve("KEEP_LOCAL")}
              disabled={isSubmitting}
              className="motion-admin-press text-xs"
            >
              {isSubmitting && activeAction === "KEEP_LOCAL" ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Memulihkan...
                </>
              ) : (
                <>
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                  Pulihkan ke Google
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
