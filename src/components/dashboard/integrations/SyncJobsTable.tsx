"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "./JobStatusBadge";
import {
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SyncJobItem {
  id: string;
  operationType: string;
  aggregateVersion?: number;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  booking?: {
    id: string;
    bookingCode: string;
    startAt: string;
    occupancyEndAt: string;
    status: string;
  } | null;
  resourceBlock?: {
    id: string;
    reason: string;
    startAt: string;
    endAt: string;
  } | null;
}

interface SyncJobsTableProps {
  jobs: SyncJobItem[];
  isLoading: boolean;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
  onFilterStatus: (status: string) => void;
  currentStatus: string;
  onRetry: (jobId: string) => Promise<void>;
  retryingId: string | null;
}

const OPERATION_LABELS: Record<string, string> = {
  CREATE: "Event Baru",
  RESCHEDULE: "Jadwal Ulang",
  CANCEL: "Hapus / Batal",
  RESOURCE_BLOCK_CREATE: "Blokir Waktu",
  RESOURCE_BLOCK_DELETE: "Hapus Blokir",
  FULL_SYNC: "Sinkronisasi Penuh",
};

export function SyncJobsTable({
  jobs,
  isLoading,
  meta,
  onPageChange,
  onFilterStatus,
  currentStatus,
  onRetry,
  retryingId,
}: SyncJobsTableProps) {
  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "PENDING", label: "Menunggu" },
    { value: "PROCESSING", label: "Diproses" },
    { value: "COMPLETED", label: "Selesai" },
    { value: "FAILED", label: "Gagal" },
    { value: "DEAD_LETTER", label: "Dead-Letter" },
  ];

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {statusOptions.map((opt) => {
            const isActive = currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterStatus(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground font-medium self-end sm:self-auto">
          Total Antrean: <span className="font-semibold text-foreground font-mono">{meta.total}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[120px] text-xs">ID / Waktu</TableHead>
              <TableHead className="text-xs">Operasi</TableHead>
              <TableHead className="text-xs">Target & Keterangan</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Percobaan</TableHead>
              <TableHead className="text-xs">Jadwal Coba</TableHead>
              <TableHead className="text-right text-xs">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    <span className="text-xs">Memuat antrean sinkronisasi...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="h-7 w-7 text-muted-foreground/50" />
                    <span className="text-xs">Tidak ada job antrean sinkronisasi yang sesuai.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const isFailed = job.status === "FAILED" || job.status === "DEAD_LETTER";
                const isRetrying = retryingId === job.id;
                const shortId = job.id.slice(-6).toUpperCase();

                return (
                  <TableRow key={job.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">
                      <div className="font-semibold text-foreground">#{shortId}</div>
                      <div className="text-[11px] text-muted-foreground font-sans">
                        {formatDate(job.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {OPERATION_LABELS[job.operationType] || job.operationType}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs">
                      {job.booking ? (
                        <div>
                          <span className="font-mono font-semibold text-accent">
                            {job.booking.bookingCode}
                          </span>
                          <span className="text-muted-foreground text-[11px] block">
                            Slot: {formatDate(job.booking.startAt)}
                          </span>
                        </div>
                      ) : job.resourceBlock ? (
                        <div>
                          <span className="font-medium text-foreground">
                            {job.resourceBlock.reason || "Blokir Waktu"}
                          </span>
                          <span className="text-muted-foreground text-[11px] block">
                            {formatDate(job.resourceBlock.startAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">
                          Sinkronisasi Sistem
                        </span>
                      )}

                      {job.lastError && (
                        <div className="mt-1 flex items-start gap-1 text-[11px] text-destructive max-w-xs truncate" title={job.lastError}>
                          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                          <span className="truncate">{job.lastError}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className={cn(job.attemptCount >= job.maxAttempts ? "text-destructive font-semibold" : "")}>
                        {job.attemptCount}
                      </span>
                      {" / "}
                      <span>{job.maxAttempts}</span>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatDate(job.nextAttemptAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      {isFailed ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRetry(job.id)}
                          disabled={isRetrying}
                          className="h-7 px-2 text-xs text-accent border-accent/40 hover:bg-accent/10"
                        >
                          {isRetrying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Ulangi
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 text-xs">
            <span className="text-muted-foreground">
              Halaman <span className="font-semibold text-foreground font-mono">{meta.page}</span> dari{" "}
              <span className="font-semibold text-foreground font-mono">{meta.totalPages}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(meta.page - 1)}
                disabled={meta.page <= 1 || isLoading}
                className="h-7 px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(meta.page + 1)}
                disabled={meta.page >= meta.totalPages || isLoading}
                className="h-7 px-2"
              >
                Berikutnya
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
