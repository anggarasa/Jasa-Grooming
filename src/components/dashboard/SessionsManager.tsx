"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  RefreshCw,
  AlertCircle,
  Trash2,
  Clock,
  Globe,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchSessionsApi,
  revokeSessionApi,
  logoutAllApi,
  type SessionItem,
} from "@/lib/auth/client";
import { formatIndonesianDate } from "@/lib/format-date";
import { parseUserAgent } from "@/lib/user-agent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SessionsManagerProps {
  initialSessions?: SessionItem[];
}

export function SessionsManager({ initialSessions = [] }: SessionsManagerProps) {
  const router = useRouter();
  const [sessions, setSessions] = React.useState<SessionItem[]>(initialSessions);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Modal konfirmasi cabut single session
  const [sessionToRevoke, setSessionToRevoke] = React.useState<SessionItem | null>(null);
  const [isRevoking, setIsRevoking] = React.useState(false);

  // Modal konfirmasi logout semua perangkat
  const [logoutAllOpen, setLogoutAllOpen] = React.useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = React.useState(false);

  const loadSessions = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchSessionsApi();
      if (!res.success) {
        setError(res.error || "Gagal memuat daftar sesi aktif.");
        return;
      }
      setSessions(res.data?.sessions || []);
    } catch {
      setError("Terjadi kesalahan jaringan saat memuat data sesi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRevokeSingle = async () => {
    if (!sessionToRevoke) return;
    setIsRevoking(true);
    try {
      const res = await revokeSessionApi(sessionToRevoke.id);
      if (!res.success) {
        toast.error("Gagal Mencabut Sesi", {
          description: res.error || "Terjadi kesalahan saat mencabut sesi.",
        });
        return;
      }

      toast.success("Sesi Berhasil Dicabut", {
        description: "Perangkat tersebut telah dikeluarkan dari sistem.",
      });

      // Update state lokal tanpa fetch ulang penuh
      setSessions((prev) => prev.filter((s) => s.id !== sessionToRevoke.id));
      setSessionToRevoke(null);
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal menghubungi server saat mencabut sesi.",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      const res = await logoutAllApi();
      if (!res.success) {
        toast.error("Gagal Logout Semua Perangkat", {
          description: res.error || "Terjadi kesalahan pada server.",
        });
        setIsLoggingOutAll(false);
        return;
      }

      toast.success("Seluruh Sesi Berhasil Dicabut", {
        description: "Mengarahkan kembali ke halaman login...",
      });

      setLogoutAllOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal menghubungi server saat mencabut seluruh sesi.",
      });
      setIsLoggingOutAll(false);
    }
  };

  const activeCount = sessions.length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Kelola Sesi Aktif
          </h2>
          <p className="text-sm text-muted-foreground">
            Daftar perangkat dan browser yang saat ini memiliki akses login ke akun Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={isLoading}
            className="h-9 gap-1.5"
            aria-label="Segarkan daftar sesi"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setLogoutAllOpen(true)}
            disabled={isLoading || activeCount === 0}
            className="h-9 gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout Semua Perangkat</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Sesi</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSessions}
              className="ml-4 h-7 text-xs"
            >
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-2/3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-3">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  Tidak Ada Sesi Aktif Ditemukan
                </p>
                <p className="text-sm text-muted-foreground">
                  Anda mungkin perlu masuk ulang untuk menyegarkan otentikasi.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const { browser, os, deviceType } = parseUserAgent(session.userAgent);
              const formattedCreated = formatIndonesianDate(session.createdAt);
              const formattedExpires = formatIndonesianDate(session.expiresAt);

              const DeviceIcon =
                deviceType === "mobile"
                  ? Smartphone
                  : deviceType === "tablet"
                  ? Tablet
                  : Laptop;

              return (
                <Card
                  key={session.id}
                  className={`border transition-all ${
                    session.isCurrent
                      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                      : "border-border hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Info Perangkat & IP */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            session.isCurrent
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <DeviceIcon className="h-5 w-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground text-sm sm:text-base">
                              {browser} di {os}
                            </span>
                            {session.isCurrent && (
                              <Badge
                                variant="sessionActive"
                                className="text-[11px] font-semibold gap-1.5 px-2 py-0.5"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Perangkat Saat Ini
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              IP: {session.ipAddress || "127.0.0.1"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Masuk: {formattedCreated}
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground/80">
                            Kedaluwarsa: {formattedExpires}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="flex items-center justify-end sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                        {session.isCurrent ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 bg-emerald-100/60 dark:bg-emerald-950/40 rounded-md">
                            Sesi Aktif Utama
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSessionToRevoke(session)}
                            className="text-destructive hover:bg-destructive-subtle hover:text-destructive border-border h-8 text-xs gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Cabut Sesi</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Tambahan Keamanan */}
      <Card className="border-border bg-muted/20">
        <CardContent className="p-5 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Tentang Manajemen Sesi PawCare Grooming</span>
          </div>
          <p>
            Sistem mencatat setiap akses login menggunakan dual-token rotasi (jose).
            Jika Anda mendeteksi perangkat asing atau lokasi yang tidak dikenali,
            segera klik &quot;Cabut Sesi&quot; dan perbarui kata sandi Anda di menu Keamanan.
          </p>
        </CardContent>
      </Card>

      {/* Modal Konfirmasi: Cabut Sesi Tunggal */}
      <Dialog
        open={!!sessionToRevoke}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cabut Sesi Perangkat?
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Apakah Anda yakin ingin mengakhiri sesi pada perangkat{" "}
              <strong className="text-foreground">
                {sessionToRevoke ? parseUserAgent(sessionToRevoke.userAgent).browser : ""}{" "}
                di {sessionToRevoke ? parseUserAgent(sessionToRevoke.userAgent).os : ""}
              </strong>{" "}
              (IP: {sessionToRevoke?.ipAddress})? Pengguna pada perangkat tersebut akan langsung
              dikeluarkan dari sistem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSessionToRevoke(null)}
              disabled={isRevoking}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeSingle}
              disabled={isRevoking}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Mencabut...
                </>
              ) : (
                "Ya, Cabut Sesi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi: Logout Semua Perangkat */}
      <Dialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Keluar dari Semua Perangkat?
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Tindakan ini akan membatalkan seluruh token dan mengakhiri sesi di semua
              perangkat, termasuk browser yang sedang Anda gunakan saat ini ({activeCount} sesi aktif).
              Anda akan otomatis dialihkan ke halaman login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLogoutAllOpen(false)}
              disabled={isLoggingOutAll}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
            >
              {isLoggingOutAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                "Ya, Keluar dari Semua Perangkat"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
