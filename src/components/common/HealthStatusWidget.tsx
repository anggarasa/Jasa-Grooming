"use client";

import * as React from "react";
import { Activity, Database, HardDrive, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface HealthData {
  status: "ok" | "healthy" | "degraded";
  application: string;
  version: string;
  timestamp: string;
  services: {
    database: "healthy" | "unhealthy";
    storage: "healthy" | "unhealthy";
    googleSync?: "healthy" | "disabled" | "degraded";
  };
  checks?: {
    database: "healthy" | "unhealthy";
    storage: "healthy" | "unhealthy";
    googleSync?: "healthy" | "disabled" | "degraded";
  };
  metrics?: {
    outboxPendingJobs?: number;
    outboxLagSeconds?: number;
  };
}

export function HealthStatusWidget({
  onStatusChange,
}: {
  onStatusChange?: (status: "ok" | "healthy" | "degraded" | "checking") => void;
}) {
  const [data, setData] = React.useState<HealthData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadInitialHealth() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json = (await res.json()) as HealthData;
        if (isMounted) {
          if (json && json.status && json.services) {
            setData(json);
            onStatusChange?.(json.status);
          } else {
            setError("Format data status sistem tidak valid.");
            onStatusChange?.("degraded");
          }
        }
      } catch (err) {
        console.error("Gagal memeriksa status sistem:", err);
        if (isMounted) {
          setError("Gagal memuat status sistem secara langsung.");
          onStatusChange?.("degraded");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialHealth();

    return () => {
      isMounted = false;
    };
  }, [onStatusChange]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    onStatusChange?.("checking");

    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = (await res.json()) as HealthData;
      if (json && json.status && json.services) {
        setData(json);
        onStatusChange?.(json.status);
      } else {
        setError("Format data status sistem tidak valid.");
        onStatusChange?.("degraded");
      }
    } catch (err) {
      console.error("Gagal memeriksa status sistem:", err);
      setError("Gagal memuat status sistem secara langsung.");
      onStatusChange?.("degraded");
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = data?.status === "ok" || data?.status === "healthy";

  return (
    <section id="status" className="scroll-mt-20 py-16 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/40 border-b border-border/80 flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-accent">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                    Kesiapan Fondasi Sistem (Phase 01)
                    {loading ? (
                      <Badge variant="outline" className="text-xs">
                        Memeriksa...
                      </Badge>
                    ) : isHealthy ? (
                      <Badge variant="success" className="text-xs font-semibold">
                        Sistem Siap
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Degraded
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pemantauan real-time konektivitas basis data dan media storage
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="text-xs h-8 px-2.5"
                title="Muat Ulang Status"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              {error ? (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Database Card */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-secondary text-primary">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          PostgreSQL Database
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Relasi Booking & Katalog
                        </div>
                      </div>
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      ) : data?.services?.database === "healthy" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Terhubung
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                          <AlertCircle className="h-4 w-4" />
                          Offline
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Storage Card */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-accent/15 text-accent">
                        <HardDrive className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          MinIO S3 Storage
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Aset Foto & Media Anabul
                        </div>
                      </div>
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      ) : data?.services?.storage === "healthy" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Siap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                          <AlertCircle className="h-4 w-4" />
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {data?.timestamp && (
                <div className="mt-4 text-center text-[11px] text-muted-foreground">
                  Pengecekan terakhir: {new Date(data.timestamp).toLocaleString("id-ID")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
