"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  User,
  PawPrint,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { TimeSlot } from "@backend/modules/availability/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string | null;
}

interface WalkInBookingFormProps {
  services: ServiceOption[];
  defaultDate?: string;
}

export function WalkInBookingForm({
  services,
  defaultDate,
}: WalkInBookingFormProps) {
  const router = useRouter();

  // Form State
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>(
    services[0]?.id || ""
  );

  const getTodayStr = () => {
    const now = new Date();
    const jakartaNoon = new Date(now.getTime() + 7 * 3600 * 1000);
    return jakartaNoon.toISOString().slice(0, 10);
  };

  const [date, setDate] = React.useState<string>(defaultDate || getTodayStr());
  const [selectedTime, setSelectedTime] = React.useState<string>("");

  // Slots State
  const [slots, setSlots] = React.useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState<boolean>(false);
  const [slotError, setSlotError] = React.useState<string | null>(null);

  // Customer State
  const [customerName, setCustomerName] = React.useState<string>("");
  const [customerPhone, setCustomerPhone] = React.useState<string>("");
  const [customerEmail, setCustomerEmail] = React.useState<string>("");

  // Pet State
  const [petName, setPetName] = React.useState<string>("");
  const [petType, setPetType] = React.useState<string>("Kucing");
  const [petBreed, setPetBreed] = React.useState<string>("");
  const [petAge, setPetAge] = React.useState<string>("");
  const [petNotes, setPetNotes] = React.useState<string>("");

  // Notes & Setting
  const [internalNotes, setInternalNotes] = React.useState<string>("");
  const [autoConfirm, setAutoConfirm] = React.useState<boolean>(true);

  // Submit State
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Fetch slots whenever service or date changes
  React.useEffect(() => {
    if (!selectedServiceId || !date) return;

    let isSubscribed = true;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSlotError(null);
      setSelectedTime("");

      try {
        const res = await fetch(
          `/api/admin/availability?serviceId=${encodeURIComponent(
            selectedServiceId
          )}&date=${encodeURIComponent(date)}`
        );
        const json = await res.json();

        if (!isSubscribed) return;

        if (json.success && json.data) {
          setSlots(json.data.slots || []);
        } else {
          setSlotError(json.error?.message || "Gagal memuat slot waktu.");
          setSlots([]);
        }
      } catch {
        if (isSubscribed) {
          setSlotError("Gagal mengambil ketersediaan slot waktu.");
          setSlots([]);
        }
      } finally {
        if (isSubscribed) {
          setIsLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isSubscribed = false;
    };
  }, [selectedServiceId, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedServiceId) {
      setErrorMsg("Pilih layanan terlebih dahulu.");
      return;
    }
    if (!selectedTime) {
      setErrorMsg("Pilih slot jam reservasi.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg("Nama dan nomor telepon pelanggan wajib diisi.");
      return;
    }
    if (!petName.trim() || !petType.trim()) {
      setErrorMsg("Nama dan jenis anabul wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        serviceId: selectedServiceId,
        date,
        time: selectedTime,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || undefined,
        },
        pet: {
          name: petName.trim(),
          type: petType.trim(),
          breed: petBreed.trim() || undefined,
          age: petAge ? parseInt(petAge, 10) : undefined,
          notes: petNotes.trim() || undefined,
        },
        internalNotes: internalNotes.trim() || undefined,
        autoConfirm,
        source: "WALK_IN",
      };

      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal membuat reservasi walk-in.");
      }

      toast.success("Reservasi walk-in berhasil dibuat!");
      const newBookingId = json.data?.booking?.id;
      if (newBookingId) {
        router.push(`/dashboard/bookings/${newBookingId}`);
      } else {
        router.push("/dashboard/bookings");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status tiap langkah dihitung dari isian nyata, dipakai bilah langkah di atas.
  const wizardSteps = [
    {
      label: "Layanan & Waktu",
      icon: Scissors,
      done: Boolean(selectedServiceId && selectedTime),
    },
    {
      label: "Data Pemilik",
      icon: User,
      done: Boolean(customerName.trim() && customerPhone.trim()),
    },
    {
      label: "Profil Anabul",
      icon: PawPrint,
      done: Boolean(petName.trim()),
    },
  ];
  const activeStepIndex = wizardSteps.findIndex((s) => !s.done);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bilah langkah */}
      <Card className="border-border">
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
          {wizardSteps.map((step, index) => {
            const StepIcon = step.icon;
            const current = index === activeStepIndex;
            const state = step.done ? "done" : current ? "current" : "todo";
            return (
              <div key={step.label} className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border " +
                      (step.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : current
                          ? "border-primary bg-primary-subtle text-primary"
                          : "border-border bg-muted text-muted-foreground")
                    }
                  >
                    {step.done ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </span>
                  <span
                    className={
                      "text-sm font-semibold " +
                      (step.done || current ? "text-foreground" : "text-muted-foreground")
                    }
                  >
                    {step.label}
                  </span>
                </div>
                <div className="admin-step-line" data-state={state} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Service & Schedule & Pet & Customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Pilih Layanan & Jadwal */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-accent" />
                  1. Pilih Layanan & Waktu
                </CardTitle>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  Langkah 1 dari 3
                </span>
              </div>
              <CardDescription className="text-xs">
                Tentukan paket grooming dan jam kedatangan anabul.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Service Select */}
              <div className="space-y-2">
                <Label htmlFor="walkin-service" className="text-xs font-semibold">
                  Layanan Grooming <span className="text-destructive">*</span>
                </Label>
                <select
                  id="walkin-service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} — {formatIDR(Number(svc.price))} ({svc.durationMinutes} menit)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="walkin-date" className="text-xs font-semibold">
                    Tanggal Kedatangan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="walkin-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Slot Jam Tersedia <span className="text-destructive">*</span>
                    </Label>
                    {isLoadingSlots && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Memeriksa...
                      </span>
                    )}
                  </div>

                  {slotError && (
                    <p className="text-xs text-destructive">{slotError}</p>
                  )}

                  {!isLoadingSlots && slots.length === 0 && !slotError && (
                    <p className="text-xs text-muted-foreground italic py-1">
                      Tidak ada slot tersedia pada tanggal ini.
                    </p>
                  )}

                  {!isLoadingSlots && slots.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 border rounded-md">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`text-xs py-1.5 px-1 rounded font-medium border text-center transition-all ${
                              !slot.available
                                ? "opacity-30 bg-muted cursor-not-allowed border-transparent text-muted-foreground"
                                : isSelected
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-white hover:bg-secondary text-foreground border-border"
                            }`}
                            title={slot.available ? "Pilih slot" : `Tidak tersedia (${slot.reason})`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {selectedTime && (
                <div className="rounded-md bg-accent/10 border border-accent/20 p-2.5 text-xs text-accent-foreground flex items-center justify-between">
                  <span>Slot waktu terpilih:</span>
                  <span className="font-bold text-accent">
                    {date} pukul {selectedTime} WIB
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Data Pelanggan */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" />
                  2. Data Pemilik / Pelanggan
                </CardTitle>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  Langkah 2 dari 3
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="walkin-cust-name" className="text-xs font-semibold">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="walkin-cust-name"
                    placeholder="Contoh: Budi Santoso"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="walkin-cust-phone" className="text-xs font-semibold">
                    Nomor WhatsApp / Telepon <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="walkin-cust-phone"
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="walkin-cust-email" className="text-xs font-semibold">
                  Email (Opsional)
                </Label>
                <Input
                  id="walkin-cust-email"
                  type="email"
                  placeholder="Contoh: budi@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Data Anabul */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-accent" />
                  3. Profil Anabul
                </CardTitle>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  Langkah 3 dari 3
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="walkin-pet-name" className="text-xs font-semibold">
                    Nama Anabul <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="walkin-pet-name"
                    placeholder="Contoh: Milo"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="walkin-pet-type" className="text-xs font-semibold">
                    Jenis Hewan <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="walkin-pet-type"
                    value={petType}
                    onChange={(e) => setPetType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Kucing">Kucing</option>
                    <option value="Anjing">Anjing</option>
                    <option value="Kelinci">Kelinci</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="walkin-pet-breed" className="text-xs font-semibold">
                    Ras (Opsional)
                  </Label>
                  <Input
                    id="walkin-pet-breed"
                    placeholder="Contoh: Persian, Poodle"
                    value={petBreed}
                    onChange={(e) => setPetBreed(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="walkin-pet-age" className="text-xs font-semibold">
                    Usia (Tahun)
                  </Label>
                  <Input
                    id="walkin-pet-age"
                    type="number"
                    min="0"
                    max="30"
                    placeholder="Contoh: 2"
                    value={petAge}
                    onChange={(e) => setPetAge(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="walkin-pet-notes" className="text-xs font-semibold">
                    Catatan Khusus Anabul (Kesehatan / Perilaku)
                  </Label>
                  <Input
                    id="walkin-pet-notes"
                    placeholder="Contoh: Takut air panas, kulit sensitif jamur"
                    value={petNotes}
                    onChange={(e) => setPetNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Summary & Confirmation */}
        <div className="space-y-6">
          <Card className="border-border sticky top-6">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Ringkasan Walk-in
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Layanan:</span>
                  <span className="font-semibold text-foreground text-right">
                    {selectedService?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Durasi Pengerjaan:</span>
                  <span className="font-medium text-foreground">
                    {selectedService?.durationMinutes || 0} menit
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Jadwal:</span>
                  <span className="font-medium text-foreground">
                    {date} {selectedTime ? `• ${selectedTime} WIB` : ""}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b font-semibold">
                  <span className="text-foreground">Total Biaya:</span>
                  <span className="text-base font-bold text-primary">
                    {selectedService ? formatIDR(Number(selectedService.price)) : "Rp 0"}
                  </span>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="walkin-internal-notes" className="text-xs font-semibold">
                  Catatan Internal Staf
                </Label>
                <Textarea
                  id="walkin-internal-notes"
                  placeholder="Catatan tim toko..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                  className="resize-none text-xs"
                />
              </div>

              {/* Auto Confirm Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="walkin-autoconfirm"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-accent"
                />
                <label
                  htmlFor="walkin-autoconfirm"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Langsung konfirmasi (status CONFIRMED)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 space-y-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedTime || !customerName.trim() || !petName.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat Reservasi...
                    </>
                  ) : (
                    "Buat Reservasi Walk-in"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full text-xs"
                >
                  <Link href="/dashboard/bookings">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Batal & Kembali
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
