"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  Coffee,
} from "lucide-react";
import { toast } from "sonner";
import {
  OperatingHour,
  OperatingBreak,
  updateOperatingHoursApi,
} from "@/lib/business-client";
import { AuthenticatedUser } from "@/modules/auth/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const DAY_NAMES: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  0: "Minggu",
};

// Urutan hari tampilan Senin s/d Minggu
const DISPLAY_DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface OperatingHoursFormProps {
  initialHours: OperatingHour[];
  user: AuthenticatedUser;
}

export function OperatingHoursForm({
  initialHours,
  user,
}: OperatingHoursFormProps) {
  const router = useRouter();
  const isOwner = user.role === "OWNER";
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  // Susun state 7 hari dari initialHours
  const [hours, setHours] = React.useState<OperatingHour[]>(() => {
    return DISPLAY_DAYS_ORDER.map((dayNum) => {
      const found = initialHours.find((h) => h.dayOfWeek === dayNum);
      if (found) {
        return {
          id: found.id,
          businessId: found.businessId,
          dayOfWeek: found.dayOfWeek,
          isOpen: found.isOpen,
          openTime: found.openTime || "09:00",
          closeTime: found.closeTime || "18:00",
          breaks: found.breaks ? [...found.breaks] : [],
        };
      }
      return {
        dayOfWeek: dayNum,
        isOpen: dayNum !== 0,
        openTime: "09:00",
        closeTime: dayNum === 0 ? "16:00" : "18:00",
        breaks: dayNum === 0 ? [] : [{ startTime: "12:00", endTime: "13:00" }],
      };
    });
  });

  const validateAll = (): boolean => {
    const errs: Record<string, string> = {};

    for (const day of hours) {
      if (!day.isOpen) continue;

      const dayKey = `day_${day.dayOfWeek}`;

      if (day.openTime >= day.closeTime) {
        errs[`${dayKey}_time`] = `Jam buka (${day.openTime}) harus lebih awal dari jam tutup (${day.closeTime}).`;
      }

      for (let i = 0; i < day.breaks.length; i++) {
        const b = day.breaks[i];
        const breakKey = `${dayKey}_break_${i}`;

        if (b.startTime >= b.endTime) {
          errs[breakKey] = `Waktu istirahat (${b.startTime}-${b.endTime}) tidak valid (mulai harus lebih awal).`;
        }
        if (b.startTime < day.openTime) {
          errs[breakKey] = `Waktu istirahat (${b.startTime}) tidak boleh sebelum jam buka (${day.openTime}).`;
        }
        if (b.endTime > day.closeTime) {
          errs[breakKey] = `Waktu istirahat (${b.endTime}) tidak boleh setelah jam tutup (${day.closeTime}).`;
        }

        // Cek overlap antar break
        for (let j = i + 1; j < day.breaks.length; j++) {
          const other = day.breaks[j];
          if (b.startTime < other.endTime && b.endTime > other.startTime) {
            errs[`${dayKey}_break_${j}`] = `Istirahat (${b.startTime}-${b.endTime}) bentrok dengan (${other.startTime}-${other.endTime}).`;
          }
        }
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleToggleOpen = (dayOfWeek: number, checked: boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, isOpen: checked } : h))
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const handleAddBreak = (dayOfWeek: number) => {
    setHours((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek !== dayOfWeek) return h;
        const newBreak: OperatingBreak = {
          startTime: "12:00",
          endTime: "13:00",
        };
        return {
          ...h,
          breaks: [...h.breaks, newBreak],
        };
      })
    );
  };

  const handleRemoveBreak = (dayOfWeek: number, index: number) => {
    setHours((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek !== dayOfWeek) return h;
        const nextBreaks = h.breaks.filter((_, i) => i !== index);
        return { ...h, breaks: nextBreaks };
      })
    );
  };

  const handleBreakTimeChange = (
    dayOfWeek: number,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setHours((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek !== dayOfWeek) return h;
        const nextBreaks = [...h.breaks];
        nextBreaks[index] = { ...nextBreaks[index], [field]: value };
        return { ...h, breaks: nextBreaks };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      toast.error("Akses Ditolak", {
        description: "Hanya akun Pemilik (Owner) yang dapat mengubah jadwal jam kerja.",
      });
      return;
    }

    if (!validateAll()) {
      toast.error("Validasi Jadwal Gagal", {
        description: "Periksa kembali jam kerja dan waktu istirahat yang ditandai merah.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        hours: hours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          isOpen: h.isOpen,
          openTime: h.openTime,
          closeTime: h.closeTime,
          breaks: h.breaks.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
          })),
        })),
      };

      const res = await updateOperatingHoursApi(payload);
      if (!res.success) {
        toast.error("Gagal Menyimpan Jadwal", {
          description: res.error?.message || "Terjadi kesalahan saat menyimpan jam kerja.",
        });
        return;
      }

      toast.success("Jadwal Berhasil Diperbarui", {
        description: "Pengaturan 7 hari jam operasional dan waktu istirahat telah aktif.",
      });

      setValidationErrors({});
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server. Silakan coba kembali.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-accent" />
            Jam Operasional & Istirahat
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi jam buka toko mingguan dan jeda istirahat multi-slot untuk alokasi reservasi groomer.
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[150px] shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Jadwal
              </>
            )}
          </Button>
        )}
      </div>

      {!isOwner && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-xs">Akses Lihat Saja (Read-Only)</AlertTitle>
          <AlertDescription className="text-xs">
            Perubahan jam kerja dan waktu istirahat hanya dapat dilakukan oleh akun <strong>Pemilik (Owner)</strong>.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {hours.map((day) => {
          const dayName = DAY_NAMES[day.dayOfWeek];
          const dayKey = `day_${day.dayOfWeek}`;
          const timeError = validationErrors[`${dayKey}_time`];

          return (
            <Card
              key={day.dayOfWeek}
              className={cn(
                "transition-all",
                day.isOpen
                  ? "border-border bg-card"
                  : "border-border/60 bg-muted/20 opacity-80"
              )}
            >
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Baris Utama: Hari + Toggle Buka/Tutup + Jam Buka/Tutup */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold text-xs">
                      {dayName.slice(0, 3)}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-foreground block">
                        {dayName}
                      </span>
                      <Badge
                        variant={day.isOpen ? "open" : "closed"}
                        className="text-[10px] mt-0.5"
                      >
                        {day.isOpen ? "Buka" : "Libur / Tutup"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Switch Buka/Tutup */}
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`switch-${day.dayOfWeek}`}
                        checked={day.isOpen}
                        onCheckedChange={(c) => handleToggleOpen(day.dayOfWeek, c)}
                        disabled={!isOwner || isSubmitting}
                      />
                      <label
                        htmlFor={`switch-${day.dayOfWeek}`}
                        className="text-xs font-medium cursor-pointer select-none text-muted-foreground"
                      >
                        {day.isOpen ? "Operasional" : "Tutup"}
                      </label>
                    </div>

                    {/* Input Waktu Buka - Tutup */}
                    {day.isOpen && (
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground font-medium">Buka:</span>
                          <input
                            type="time"
                            value={day.openTime}
                            onChange={(e) =>
                              handleTimeChange(day.dayOfWeek, "openTime", e.target.value)
                            }
                            disabled={!isOwner || isSubmitting}
                            className="bg-transparent text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-accent rounded px-1"
                          />
                        </div>
                        <span className="text-muted-foreground text-xs">—</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground font-medium">Tutup:</span>
                          <input
                            type="time"
                            value={day.closeTime}
                            onChange={(e) =>
                              handleTimeChange(day.dayOfWeek, "closeTime", e.target.value)
                            }
                            disabled={!isOwner || isSubmitting}
                            className="bg-transparent text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-accent rounded px-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {timeError && (
                  <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-md">
                    {timeError}
                  </p>
                )}

                {/* Sub-section: Waktu Istirahat (Hanya jika Buka) */}
                {day.isOpen && (
                  <div className="pt-3 border-t border-border/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Coffee className="h-3.5 w-3.5 text-amber-600" />
                        <span>Waktu Istirahat (Slot Reservasi Diblokir):</span>
                      </div>
                      {isOwner && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddBreak(day.dayOfWeek)}
                          disabled={isSubmitting}
                          className="h-7 text-xs px-2.5 text-accent border-accent/30 hover:bg-accent/10"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Tambah Istirahat
                        </Button>
                      )}
                    </div>

                    {day.breaks.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic pl-1">
                        Tidak ada jeda istirahat pada hari ini (layanan beroperasi nonstop).
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {day.breaks.map((b, idx) => {
                          const breakKey = `${dayKey}_break_${idx}`;
                          const breakError = validationErrors[breakKey];

                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors",
                                breakError
                                  ? "border-destructive bg-destructive/10"
                                  : "border-badge-break-border bg-schedule-break"
                              )}
                            >
                              <span className="font-medium text-amber-900 dark:text-amber-200">
                                #{idx + 1}
                              </span>
                              <input
                                type="time"
                                value={b.startTime}
                                onChange={(e) =>
                                  handleBreakTimeChange(
                                    day.dayOfWeek,
                                    idx,
                                    "startTime",
                                    e.target.value
                                  )
                                }
                                disabled={!isOwner || isSubmitting}
                                className="bg-transparent font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent rounded px-1"
                              />
                              <span className="text-muted-foreground">—</span>
                              <input
                                type="time"
                                value={b.endTime}
                                onChange={(e) =>
                                  handleBreakTimeChange(
                                    day.dayOfWeek,
                                    idx,
                                    "endTime",
                                    e.target.value
                                  )
                                }
                                disabled={!isOwner || isSubmitting}
                                className="bg-transparent font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent rounded px-1"
                              />

                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBreak(day.dayOfWeek, idx)}
                                  disabled={isSubmitting}
                                  className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                  title="Hapus Waktu Istirahat"
                                  aria-label={`Hapus istirahat ${idx + 1}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {isOwner && (
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[180px] h-11 text-sm font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan Jadwal...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Seluruh Jadwal
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
