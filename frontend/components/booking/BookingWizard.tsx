"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingProgress } from "./BookingProgress";
import { Step1ServiceSelect, SERVICE_STATUS_ID } from "./Step1ServiceSelect";
import { Step2DateSelect } from "./Step2DateSelect";
import { Step3TimeSelect } from "./Step3TimeSelect";
import { Step4CustomerForm } from "./Step4CustomerForm";
import { Step5PetForm } from "./Step5PetForm";
import { Step6ReviewConfirm } from "./Step6ReviewConfirm";
import { PublicServiceItem } from "@backend/modules/public/public-services.service";

interface BookingWizardProps {
  services: PublicServiceItem[];
  initialServiceId?: string;
  /** Hari mingguan (0=Minggu … 6=Sabtu) yang libur; hanya untuk tampilan pilihan tanggal. */
  closedDaysOfWeek?: number[];
}

function generateIdempotencyKey(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `idem-${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`;
}

export function BookingWizard({
  services,
  initialServiceId,
  closedDaysOfWeek,
}: BookingWizardProps) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Initialize selected service from props
  const initialService = React.useMemo(() => {
    if (!initialServiceId) return null;
    return services.find((s) => s.id === initialServiceId) || null;
  }, [services, initialServiceId]);

  // Wizard state machine
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = React.useState<number>(initialService ? 2 : 1);

  // Form data state
  const [selectedService, setSelectedService] = React.useState<PublicServiceItem | null>(initialService);
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedTime, setSelectedTime] = React.useState<string>("");
  const [customer, setCustomer] = React.useState<{ name: string; phone: string; email?: string }>({
    name: "",
    phone: "",
    email: "",
  });
  // Isian Tahap 4 yang BELUM tervalidasi, hanya untuk menampilkan kembali apa yang
  // sudah diketik saat pengguna kembali. Tidak pernah dipakai untuk payload/ringkasan
  // (itu hanya `customer`, yang diisi setelah validasi lolos). Hanya di memori.
  const [customerDraft, setCustomerDraft] = React.useState<{ name: string; phone: string; email?: string } | null>(null);
  const [pet, setPet] = React.useState<{
    name: string;
    type: string;
    breed?: string;
    age?: number;
    notes?: string;
  }>({
    name: "",
    type: "Anjing",
    breed: "",
    age: undefined,
    notes: "",
  });
  // Isian Tahap 5 yang BELUM tervalidasi; sama seperti `customerDraft`, hanya untuk
  // menampilkan kembali apa yang sudah diketik. Tidak pernah masuk payload/ringkasan.
  const [petDraft, setPetDraft] = React.useState<{
    name: string;
    type: string;
    breed?: string;
    age?: number;
    notes?: string;
  } | null>(null);
  const [customerNotes, setCustomerNotes] = React.useState<string>("");

  // Submission & Conflict state
  const [idempotencyKey, setIdempotencyKey] = React.useState<string>(() => generateIdempotencyKey());
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const [slotRefreshTrigger, setSlotRefreshTrigger] = React.useState<number>(0);

  // "Mode ubah": aktif saat pengguna menekan "Ubah" di ringkasan (atau memilih jam lain
  // setelah bentrok). Selama aktif, tahap yang sudah lengkap langsung kembali ke
  // Konfirmasi; alur biasa (tanpa mode ini) tidak berubah sama sekali.
  const [returnToSummary, setReturnToSummary] = React.useState<boolean>(false);

  // Scroll to top on step change
  const scrollToTop = () => {
    if (typeof containerRef.current?.scrollIntoView === "function") {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToStep = (stepNumber: number) => {
    if (stepNumber === 6) setReturnToSummary(false);
    setCurrentStep(stepNumber);
    setMaxAccessibleStep((prev) => Math.max(prev, stepNumber));
    scrollToTop();
  };

  const goToStepManually = (stepNumber: number) => {
    setReturnToSummary(false);
    goToStep(stepNumber);
  };

  // Hanya benar bila SEMUA data inti sudah ada, sehingga Konfirmasi tidak pernah kosong.
  const hasOwnerAndPet = customer.name.trim() !== "" && pet.name.trim() !== "";
  const step3ReturnsToSummary = returnToSummary && !!selectedService && !!selectedDate && hasOwnerAndPet;
  const step4ReturnsToSummary =
    returnToSummary && !!selectedService && !!selectedDate && !!selectedTime && pet.name.trim() !== "";

  const handleNextStep1 = () => {
    if (!selectedService) return;
    goToStep(2);
  };

  const handleNextStep2 = () => {
    if (!selectedDate) return;
    goToStep(3);
  };

  const handleNextStep3 = () => {
    if (!selectedTime) return;
    goToStep(step3ReturnsToSummary ? 6 : 4);
  };

  const handleStep4Submit = (data: { name: string; phone: string; email?: string }) => {
    setCustomer(data);
    goToStep(step4ReturnsToSummary ? 6 : 5);
  };

  const handleStep5Submit = (data: {
    name: string;
    type: string;
    breed?: string;
    age?: number;
    notes?: string;
  }) => {
    setPet(data);
    goToStep(6);
  };

  const handleSlotConflictRetry = () => {
    setSubmissionError(null);
    setSlotRefreshTrigger((c) => c + 1);
    setSelectedTime("");
    setReturnToSummary(true); // setelah jam baru dipilih, langsung kembali ke Konfirmasi
    goToStep(3);
  };

  // Final booking submission
  const handleFinalSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setSubmissionError("Data reservasi belum lengkap. Mohon periksa kembali jadwal Anda.");
      return;
    }

    if (isSubmitting) return; // Multi-click protection
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = {
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email?.trim() || undefined,
        },
        pet: {
          name: pet.name.trim(),
          type: pet.type.trim(),
          breed: pet.breed?.trim() || undefined,
          age: pet.age !== undefined && !Number.isNaN(pet.age) ? Number(pet.age) : undefined,
          notes: pet.notes?.trim() || undefined,
        },
        notes: customerNotes.trim() || undefined,
        customerNotes: customerNotes.trim() || undefined,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 409 || json.error?.code === "SLOT_UNAVAILABLE") {
          throw new Error(
            json.error?.message ||
              "Slot waktu yang Anda pilih baru saja dipesan oleh pelanggan lain. Silakan pilih jam lain."
          );
        }
        throw new Error(json.error?.message || json.message || "Gagal membuat reservasi.");
      }

      const bookingCode = json.bookingCode || json.data?.bookingCode;
      const manageToken = json.manageToken || json.data?.manageToken;

      // Navigate to confirmation page
      router.push(`/booking/confirmation?code=${encodeURIComponent(bookingCode)}&token=${encodeURIComponent(manageToken)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat memproses booking.";
      setSubmissionError(msg);
      // Generate new key on failure if necessary
      setIdempotencyKey(generateIdempotencyKey());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-8 max-w-3xl mx-auto">
      {/* Wizard Step Progress Bar */}
      <div className="rounded-card-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
        <BookingProgress
          currentStep={currentStep}
          maxAccessibleStep={maxAccessibleStep}
          onStepClick={(step) => goToStepManually(step)}
        />
      </div>

      {returnToSummary && currentStep < 6 && (
        <p
          role="status"
          className="rounded-card-lg bg-canvas-tint p-4 text-[15px] leading-6 text-ink-body ring-1 ring-inset ring-border"
        >
          Anda sedang mengubah data dari ringkasan. Data lainnya tetap tersimpan, dan Anda akan kembali ke Konfirmasi setelah selesai.
        </p>
      )}

      {/* Step Content Container */}
      <div className="min-h-[380px]">
        {currentStep === 1 && (
          <Step1ServiceSelect
            services={services}
            selectedServiceId={selectedService?.id || null}
            onSelectService={(service) => {
              setSelectedService(service);
              // Clear time if service duration changes
              setSelectedTime("");
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2DateSelect
            closedDaysOfWeek={closedDaysOfWeek}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedTime("");
            }}
          />
        )}

        {currentStep === 3 && selectedService && selectedDate && (
          <Step3TimeSelect
            serviceId={selectedService.id}
            date={selectedDate}
            selectedTime={selectedTime}
            onSelectTime={(time) => setSelectedTime(time)}
            refreshTrigger={slotRefreshTrigger}
          />
        )}

        {currentStep === 4 && (
          <Step4CustomerForm
            initialData={customerDraft ?? customer}
            onDraftChange={setCustomerDraft}
            onSubmitStep={handleStep4Submit}
            formId="booking-customer-form"
          />
        )}

        {currentStep === 5 && (
          <Step5PetForm
            initialData={petDraft ?? pet}
            onDraftChange={setPetDraft}
            onSubmitStep={handleStep5Submit}
            formId="booking-pet-form"
          />
        )}

        {currentStep === 6 && selectedService && (
          <Step6ReviewConfirm
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            customer={customer}
            pet={pet}
            customerNotes={customerNotes}
            onChangeCustomerNotes={setCustomerNotes}
            onEditStep={(step) => {
              setReturnToSummary(true);
              goToStep(step);
            }}
            isSubmitting={isSubmitting}
            errorMessage={submissionError}
            onSubmit={handleFinalSubmit}
            onSlotConflictRetry={handleSlotConflictRetry}
          />
        )}
      </div>

      {/* Navigation Footer Controls for Steps 1 - 5 */}
      {currentStep < 6 && (
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStepManually(currentStep - 1)}
              className="w-full justify-center px-6 font-medium flex items-center gap-1.5 cursor-pointer sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {currentStep === 1 && (
            <Button
              type="button"
              onClick={handleNextStep1}
              disabled={!selectedService}
              aria-describedby={SERVICE_STATUS_ID}
              className="w-full justify-center px-6 font-medium flex items-center gap-1.5 cursor-pointer sm:w-auto"
            >
              <span>Lanjut ke Tanggal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              type="button"
              onClick={handleNextStep2}
              disabled={!selectedDate}
              className="w-full justify-center px-6 font-medium flex items-center gap-1.5 cursor-pointer sm:w-auto"
            >
              <span>Lanjut ke Jam</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              type="button"
              onClick={handleNextStep3}
              disabled={!selectedTime}
              className="w-full justify-center px-6 font-medium flex items-center gap-1.5 cursor-pointer sm:w-auto"
            >
              <span>{step3ReturnsToSummary ? "Simpan & Kembali ke Konfirmasi" : "Lanjut ke Data Pemilik"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {currentStep === 4 && (
            <Button
              type="submit"
              form="booking-customer-form"
              className="w-full justify-center px-6 font-medium flex items-center gap-1.5 cursor-pointer sm:w-auto"
            >
              <span>{step4ReturnsToSummary ? "Simpan & Kembali ke Konfirmasi" : "Lanjut ke Data Anabul"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {currentStep === 5 && (
            <Button
              type="submit"
              form="booking-pet-form"
              className="w-full justify-center px-6 font-medium flex items-center gap-1.5 cursor-pointer sm:w-auto"
            >
              <span>Lanjut ke Konfirmasi</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
