"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarStatusBadge,
  CalendarConnectionStatus,
} from "@/components/dashboard/integrations/CalendarStatusBadge";
import {
  SyncJobsTable,
  SyncJobItem,
} from "@/components/dashboard/integrations/SyncJobsTable";
import {
  ConflictResolutionCard,
  SyncConflictItem,
} from "@/components/dashboard/integrations/ConflictResolutionCard";
import {
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SyncMonitoringClientProps {
  initialStatus: {
    status: CalendarConnectionStatus | string;
    connectedAccount?: string | null;
    selectedCalendar?: { name: string; timeZone: string } | null;
    lastSyncAt?: string | null;
    metrics: {
      pendingJobs: number;
      failedJobs: number;
      pendingConflicts: number;
    };
  };
}

export function SyncMonitoringClient({ initialStatus }: SyncMonitoringClientProps) {
  const [activeTab, setActiveTab] = React.useState<"jobs" | "conflicts">("jobs");
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [isFullSync, setIsFullSync] = React.useState<boolean>(false);

  // Status metrics
  const [status, setStatus] = React.useState(initialStatus);

  // Outbox jobs state
  const [jobs, setJobs] = React.useState<SyncJobItem[]>([]);
  const [jobsLoading, setJobsLoading] = React.useState<boolean>(false);
  const [jobsStatusFilter, setJobsStatusFilter] = React.useState<string>("");
  const [jobsPage, setJobsPage] = React.useState<number>(1);
  const [jobsMeta, setJobsMeta] = React.useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [retryingId, setRetryingId] = React.useState<string | null>(null);

  // Conflicts state
  const [conflicts, setConflicts] = React.useState<SyncConflictItem[]>([]);
  const [conflictsLoading, setConflictsLoading] = React.useState<boolean>(false);
  const [conflictsFilter, setConflictsFilter] = React.useState<string>("PENDING");

  // Fetch status
  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/google/status");
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setStatus(json.data);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  // Fetch jobs
  const fetchJobs = React.useCallback(async (page = 1, statusFilter = "") => {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/integrations/google/sync-jobs?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setJobs(json.data.items || []);
        if (json.data.meta) {
          setJobsMeta(json.data.meta);
        }
      }
    } catch {
      toast.error("Gagal memuat antrean sinkronisasi.");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // Fetch conflicts
  const fetchConflicts = React.useCallback(async (statusFilter = "PENDING") => {
    setConflictsLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/integrations/google/conflicts?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setConflicts(json.data.items || []);
      }
    } catch {
      toast.error("Gagal memuat daftar konflik kalender.");
    } finally {
      setConflictsLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      await Promise.resolve();
      if (!isSubscribed) return;
      fetchJobs(jobsPage, jobsStatusFilter).catch(() => {});
      fetchConflicts(conflictsFilter).catch(() => {});
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [fetchJobs, fetchConflicts, jobsPage, jobsStatusFilter, conflictsFilter]);

  // Handle on-demand sync
  const handleTriggerSync = async (forceFull = false) => {
    setIsSyncing(true);
    setIsFullSync(forceFull);

    try {
      const res = await fetch("/api/integrations/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullSync: forceFull }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal memicu sinkronisasi kalender.");
      }

      toast.success(
        forceFull
          ? "Sinkronisasi penuh berhasil dijalankan."
          : "Sinkronisasi inkremental berhasil diperbarui."
      );

      // Refresh all views
      await Promise.all([
        fetchStatus(),
        fetchJobs(jobsPage, jobsStatusFilter),
        fetchConflicts(conflictsFilter),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sinkronisasi.";
      toast.error(msg);
    } finally {
      setIsSyncing(false);
      setIsFullSync(false);
    }
  };

  // Handle retry job
  const handleRetryJob = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      const res = await fetch(`/api/integrations/google/sync-jobs/${jobId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal mengulang job sinkronisasi.");
      }

      toast.success("Job sinkronisasi berhasil dijadwalkan ulang.");
      await Promise.all([
        fetchJobs(jobsPage, jobsStatusFilter),
        fetchStatus(),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengulang job.";
      toast.error(msg);
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Belum pernah";
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
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Monitoring Sinkronisasi Google Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau antrean outbox worker, latensi sinkronisasi, dan selesaikan bentrok jadwal.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTriggerSync(false)}
            disabled={isSyncing}
            className="text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isSyncing && !isFullSync && "animate-spin")} />
            {isSyncing && !isFullSync ? "Sinkronisasi..." : "Sinkronkan Sekarang"}
          </Button>

          <Button asChild variant="secondary" size="sm" className="text-xs">
            <Link href="/dashboard/settings/integrations">
              <Sliders className="h-3.5 w-3.5 mr-1.5" />
              Pengaturan Integrasi
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Status Koneksi */}
        <Card className="border border-border shadow-xs hover:border-border/80 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status Koneksi
            </CardDescription>
            <div className="pt-1">
              <CalendarStatusBadge status={status.status} />
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-1">
            <div className="truncate font-mono" title={status.connectedAccount || undefined}>
              {status.connectedAccount || "Akun tidak terhubung"}
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Antrean Outbox Pending */}
        <Card className="border border-border shadow-xs hover:border-border/80 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Antrean Pending
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {status.metrics.pendingJobs}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Outbox worker siap proses</span>
          </CardContent>
        </Card>

        {/* KPI 3: Job Gagal / Retrying */}
        <Card className="border border-border shadow-xs hover:border-border/80 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gagal / Retrying
            </CardDescription>
            <CardTitle className={cn(
              "text-2xl font-bold font-mono",
              status.metrics.failedJobs > 0 ? "text-destructive" : "text-foreground"
            )}>
              {status.metrics.failedJobs}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
            <AlertTriangle className={cn("h-3.5 w-3.5", status.metrics.failedJobs > 0 && "text-destructive")} />
            <span>Perlu perhatian manual</span>
          </CardContent>
        </Card>

        {/* KPI 4: Konflik Aktif */}
        <Card className="border border-border shadow-xs hover:border-border/80 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Konflik Jadwal
            </CardDescription>
            <CardTitle className={cn(
              "text-2xl font-bold font-mono",
              status.metrics.pendingConflicts > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {status.metrics.pendingConflicts}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Terakhir: {formatDate(status.lastSyncAt)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2",
            activeTab === "jobs"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Antrean Sinkronisasi (Outbox)</span>
          {status.metrics.pendingJobs > 0 && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
              {status.metrics.pendingJobs}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("conflicts")}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2",
            activeTab === "conflicts"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Resolusi Konflik</span>
          {status.metrics.pendingConflicts > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {status.metrics.pendingConflicts}
            </Badge>
          )}
        </button>
      </div>

      {/* Tab 1 Content: Sync Jobs */}
      {activeTab === "jobs" && (
        <SyncJobsTable
          jobs={jobs}
          isLoading={jobsLoading}
          meta={jobsMeta}
          onPageChange={(p) => {
            setJobsPage(p);
            fetchJobs(p, jobsStatusFilter);
          }}
          onFilterStatus={(s) => {
            setJobsStatusFilter(s);
            setJobsPage(1);
            fetchJobs(1, s);
          }}
          currentStatus={jobsStatusFilter}
          onRetry={handleRetryJob}
          retryingId={retryingId}
        />
      )}

      {/* Tab 2 Content: Conflicts */}
      {activeTab === "conflicts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              {[
                { value: "PENDING", label: "Perlu Resolusi" },
                { value: "RESOLVED", label: "Sudah Selesai" },
                { value: "ALL", label: "Semua Histori" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setConflictsFilter(opt.value);
                    fetchConflicts(opt.value);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    conflictsFilter === opt.value
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchConflicts(conflictsFilter)}
              disabled={conflictsLoading}
              className="text-xs h-8"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", conflictsLoading && "animate-spin")} />
              Perbarui Konflik
            </Button>
          </div>

          {conflictsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span className="text-xs">Memuat daftar konflik kalender...</span>
            </div>
          ) : conflicts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <h4 className="text-sm font-semibold text-foreground">
                Tidak Ada Konflik Jadwal
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Seluruh reservasi lokal PawCare Grooming dan event Google Calendar saat ini selaras tanpa selisih data.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <ConflictResolutionCard
                  key={conflict.id}
                  conflict={conflict}
                  onResolved={() => {
                    fetchConflicts(conflictsFilter);
                    fetchStatus();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
