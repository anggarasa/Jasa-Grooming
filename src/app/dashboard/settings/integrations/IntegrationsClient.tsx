"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GoogleIntegrationCard,
  GoogleIntegrationStatus,
} from "@/components/dashboard/integrations/GoogleIntegrationCard";
import { CalendarSelectModal } from "@/components/dashboard/integrations/CalendarSelectModal";
import { DisconnectConfirmDialog } from "@/components/dashboard/integrations/DisconnectConfirmDialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShieldCheck,
  CalendarCheck2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface IntegrationsClientProps {
  initialStatus: GoogleIntegrationStatus;
}

export function IntegrationsClient({ initialStatus }: IntegrationsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = React.useState<GoogleIntegrationStatus>(initialStatus);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = React.useState<boolean>(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = React.useState<boolean>(false);

  // Check URL query parameters from OAuth callback
  React.useEffect(() => {
    const statusParam = searchParams.get("status");
    const errorParam = searchParams.get("error");

    if (statusParam === "connected") {
      toast.success("Google Calendar berhasil dihubungkan!", {
        description: "Sinkronisasi dua arah telah aktif untuk reservasi PawCare Grooming.",
      });
      // Clean query parameter without page reload
      router.replace("/dashboard/settings/integrations");
    } else if (errorParam) {
      toast.error("Otentikasi Google Calendar Gagal", {
        description: decodeURIComponent(errorParam),
      });
      router.replace("/dashboard/settings/integrations");
    }
  }, [searchParams, router]);

  const refreshStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/google/status");
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setStatus(json.data);
      }
    } catch {
      toast.error("Gagal memperbarui status integrasi.");
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Integrasi Eksternal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola koneksi kalender dan layanan eksternal untuk sinkronisasi reservasi dua arah.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="self-start sm:self-auto text-xs">
          <Link href="/dashboard/integrations/google-calendar">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Monitoring Sinkronisasi
          </Link>
        </Button>
      </div>

      {/* Primary Integration Card */}
      <GoogleIntegrationCard
        statusData={status}
        onRefreshStatus={refreshStatus}
        onOpenCalendarSelect={() => setIsCalendarModalOpen(true)}
        onOpenDisconnect={() => setIsDisconnectDialogOpen(true)}
      />

      {/* Security & Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Keamanan & Kebijakan FreeBusy
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Sistem menggunakan protokol <strong className="text-foreground">OAuth 2.0 PKCE</strong> dengan penyimpanan token terenkripsi <strong className="text-foreground">AES-256-GCM</strong>.
            </p>
            <p>
              Ketersediaan waktu menerapkan prinsip <strong className="text-foreground">fail-closed FreeBusy engine</strong>: jika Google Calendar tidak dapat diakses atau timeout (&lt; 2000ms), slot akan ditutup secara aman demi mencegah overbooking.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck2 className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Durable Outbox & Rekonsiliasi
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Setiap pembuatan, pemindahan jadwal, atau pembatalan reservasi lokal dicatat ke antrean PostgreSQL outbox worker tanpa memperlambat interaksi pelanggan.
            </p>
            <p>
              Jadwal luar yang dibuat langsung di Google Calendar otomatis memblokir slot ketersediaan salon secara inkremental via webhook push notification.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CalendarSelectModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentCalendarId={status.calendarId || status.selectedCalendar?.id || null}
        onSuccess={refreshStatus}
      />

      <DisconnectConfirmDialog
        isOpen={isDisconnectDialogOpen}
        onClose={() => setIsDisconnectDialogOpen(false)}
        onSuccess={refreshStatus}
      />
    </div>
  );
}
