"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarStatusBadge,
  CalendarConnectionStatus,
} from "./CalendarStatusBadge";
import {
  Calendar,
  RefreshCw,
  ExternalLink,
  Unlink,
  AlertTriangle,
  Clock,
  Mail,
  Sliders,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export interface GoogleIntegrationStatus {
  isConfigured: boolean;
  isEnabled: boolean;
  status: CalendarConnectionStatus | string;
  isOwner?: boolean;
  connectedAccount?: string | null;
  googleAccountEmail?: string | null;
  selectedCalendar?: {
    id: string | null;
    name: string | null;
    timeZone?: string | null;
  } | null;
  calendarId?: string | null;
  calendarName?: string | null;
  calendarTimezone?: string | null;
  lastSyncAt?: string | null;
  lastErrorAt?: string | null;
  lastErrorMessage?: string | null;
  error?: string | null;
  metrics?: {
    pendingJobs: number;
    failedJobs: number;
    pendingConflicts: number;
  };
}

interface GoogleIntegrationCardProps {
  statusData: GoogleIntegrationStatus;
  onRefreshStatus: () => void;
  onOpenCalendarSelect: () => void;
  onOpenDisconnect: () => void;
}

export function GoogleIntegrationCard({
  statusData,
  onRefreshStatus,
  onOpenCalendarSelect,
  onOpenDisconnect,
}: GoogleIntegrationCardProps) {
  const [isConnecting, setIsConnecting] = React.useState<boolean>(false);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);

  const isOwner = Boolean(statusData.isOwner);
  const isConnected =
    statusData.status === "CONNECTED" ||
    statusData.status === "ACTIVE" ||
    statusData.status === "SYNCING" ||
    statusData.status === "DEGRADED" ||
    statusData.status === "REAUTH_REQUIRED" ||
    statusData.status === "ERROR";

  const accountEmail =
    statusData.connectedAccount || statusData.googleAccountEmail;
  const calendarName =
    statusData.selectedCalendar?.name || statusData.calendarName || "Belum dipilih";
  const calendarTz =
    statusData.selectedCalendar?.timeZone || statusData.calendarTimezone || "Asia/Jakarta";
  const errorMessage = statusData.error || statusData.lastErrorMessage;

  const handleConnect = async () => {
    if (!isOwner) {
      toast.error("Hanya akun dengan role OWNER yang dapat menghubungkan Google Calendar.");
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/integrations/google/connect");
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.url) {
        throw new Error(json.error?.message || "Gagal mendapatkan URL otentikasi Google.");
      }

      // Redirect to Google OAuth consent
      window.location.href = json.data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
      setIsConnecting(false);
    }
  };

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/integrations/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullSync: false }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal menjalankan sinkronisasi.");
      }

      toast.success("Sinkronisasi kalender berhasil dijalankan.");
      onRefreshStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sinkronisasi.";
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (dateString?: string | null) => {
    if (!dateString) return "Belum pernah disinkronkan";
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(d);
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border border-border shadow-xs hover:border-border/80 transition-all">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-center shrink-0 text-primary">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
              <circle cx="8" cy="14" r="1" fill="#4285F4" />
              <circle cx="12" cy="14" r="1" fill="#EA4335" />
              <circle cx="16" cy="14" r="1" fill="#FBBC05" />
              <circle cx="8" cy="18" r="1" fill="#34A853" />
              <circle cx="12" cy="18" r="1" fill="#4285F4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <CardTitle className="text-base font-bold text-foreground">
                Google Calendar
              </CardTitle>
              <CalendarStatusBadge status={statusData.status} />
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Sinkronisasi dua arah reservasi salon & time-blocking ke Google Calendar via OAuth 2.0 PKCE.
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshStatus}
            title="Muat ulang status"
            className="h-8 px-2.5 text-xs text-muted-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1.5">Muat Ulang</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {!statusData.isConfigured && (
          <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Kredensial Google OAuth (<code className="font-mono">GOOGLE_CLIENT_ID</code> & <code className="font-mono">GOOGLE_CLIENT_SECRET</code>) belum dikonfigurasikan pada server. Hubungi administrator sistem.
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && isConnected && (
          <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <span className="font-semibold">Peringatan Sinkronisasi:</span> {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {isConnected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Akun Terhubung
              </div>
              <div className="font-medium text-sm text-foreground truncate" title={accountEmail || undefined}>
                {accountEmail || "-"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                Kalender Terpilih
              </div>
              <div className="font-medium text-sm text-foreground truncate" title={calendarName}>
                {calendarName}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {calendarTz}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1 sm:col-span-2 lg:col-span-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Sinkron Terakhir
              </div>
              <div className="font-mono text-xs text-foreground">
                {formatLastSync(statusData.lastSyncAt)}
              </div>
              {statusData.metrics && (
                <div className="text-[11px] text-muted-foreground flex gap-2 pt-0.5">
                  <span>Antrean: {statusData.metrics.pendingJobs}</span>
                  <span>•</span>
                  <span>Konflik: {statusData.metrics.pendingConflicts}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-muted/10 p-5 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-semibold text-foreground">
                Google Calendar Belum Terhubung
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hubungkan akun Google Calendar pemilik untuk otomatis menyinkronkan jadwal booking, reservasi staff, dan pencegahan bentrok jadwal (FreeBusy).
              </p>
            </div>
            <div className="pt-1">
              <Button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting || !statusData.isConfigured || !isOwner}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghubungkan ke Google...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4 text-accent" />
                    Hubungkan Google Calendar
                  </>
                )}
              </Button>
              {!isOwner && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  * Hanya peran <span className="font-semibold text-foreground">OWNER</span> yang memiliki izin menghubungkan Google OAuth.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {isConnected && (
        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 pb-4 border-t border-border/60 bg-muted/5">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickSync}
              disabled={isSyncing}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sinkronisasi..." : "Sinkronkan Sekarang"}
            </Button>

            {isOwner && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenCalendarSelect}
                className="text-xs"
              >
                <Sliders className="h-3.5 w-3.5 mr-1.5" />
                Ganti Kalender
              </Button>
            )}

            <Button
              asChild
              variant="secondary"
              size="sm"
              className="text-xs"
            >
              <Link href="/dashboard/integrations/google-calendar">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Monitoring & Antrean
              </Link>
            </Button>
          </div>

          {isOwner && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenDisconnect}
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-auto"
            >
              <Unlink className="h-3.5 w-3.5 mr-1.5" />
              Putuskan Koneksi
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
