"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Check, Sparkles, HeartHandshake } from "lucide-react";
import { petSchema } from "@backend/modules/bookings/schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  FieldError,
  RequiredMark,
  RequirementBadge,
  errorFieldClass,
  fieldBase,
  labelClass,
  labelRowClass,
  narrowClass,
} from "@/components/booking/form-ui";
import { z } from "zod";

type PetFormData = z.infer<typeof petSchema>;

interface Step5PetFormProps {
  initialData: PetFormData;
  onSubmitStep: (data: PetFormData) => void;
  /**
   * Dipanggil sekali saat tahap ini ditinggalkan dengan isian TERAKHIR (dirapikan).
   * Hanya untuk menampilkan kembali apa yang sudah diketik; BUKAN data tervalidasi
   * dan tidak dipakai untuk pengiriman. Disimpan di memori saja.
   */
  onDraftChange?: (draft: PetFormData) => void;
  formId?: string;
}

const COMMON_PET_TYPES = [
  { label: "Anjing", value: "Anjing" },
  { label: "Kucing", value: "Kucing" },
  { label: "Kelinci", value: "Kelinci" },
  { label: "Lainnya", value: "Lainnya" },
];
const OTHER = "Lainnya";
const FIXED_TYPES = COMMON_PET_TYPES.map((t) => t.value).filter((v) => v !== OTHER);

/** Memisahkan nilai `type` tersimpan menjadi pilihan tombol + teks jenis kustom. */
function splitType(type: string | undefined): { choice: string; custom: string } {
  const t = (type || "Anjing").trim();
  if (FIXED_TYPES.includes(t)) return { choice: t, custom: "" };
  if (t === OTHER) return { choice: OTHER, custom: "" };
  return { choice: OTHER, custom: t };
}

/** Nilai `type` yang dikirim: jenis kustom bila diisi; jika tidak, "Lainnya" (perilaku sebelumnya). */
function resolveType(choice: string, custom: string): string {
  return choice === OTHER ? custom.trim() || OTHER : choice;
}

const fieldClass = fieldBase;
/** Judul kelompok isian (h3) di dalam form; hanya penataan, tidak menambah field. */
const sectionTitleClass = "text-lg font-semibold leading-snug text-ink";
const sectionClass = "space-y-5";
const sectionDividedClass = "space-y-5 border-t border-border pt-6";
const MAX_NOTES = 500;

/** Panduan memperbaiki isian, ditampilkan bersama pesan galat dari skema. */
const FIX_HINT = {
  name: "Isi nama panggilan anabul, 1–50 karakter. Contoh: Milo.",
  type: "Pilih salah satu jenis di atas, atau tulis jenis hewan di kolom yang muncul (maksimal 30 karakter).",
  breed: "Tulis ras maksimal 50 karakter, atau kosongkan kolom ini.",
  age: "Isi usia dalam tahun berupa bilangan bulat 0–35 (tanpa koma), atau kosongkan kolom ini.",
  notes: "Ringkas catatan menjadi maksimal 500 karakter.",
} as const;

/**
 * Tahap 5 — Data Anabul.
 *
 * Skema `petSchema` (dipakai bersama server) dan nama/id field tidak berubah.
 * Perbaikan perilaku di sisi form:
 *  - Usia yang dikosongkan sekarang tetap kosong (sebelumnya menjadi 0 karena
 *    `z.coerce.number()` mengubah "" menjadi 0).
 *  - Kolom jenis "Lainnya" tidak lagi hilang setelah satu ketikan, dan jenis
 *    kustom tersimpan dengan benar saat pengguna kembali.
 */
export function Step5PetForm({
  initialData,
  onSubmitStep,
  onDraftChange,
  formId = "booking-pet-form",
}: Step5PetFormProps) {
  const initialSplit = React.useMemo(() => splitType(initialData.type), [initialData.type]);
  const [choice, setChoice] = React.useState<string>(initialSplit.choice);
  const [custom, setCustom] = React.useState<string>(initialSplit.custom);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: initialData.name || "",
      type: resolveType(initialSplit.choice, initialSplit.custom),
      breed: initialData.breed || "",
      age: initialData.age ?? undefined,
      notes: initialData.notes || "",
    },
  });

  const notesLength = (useWatch({ control, name: "notes" }) ?? "").length;

  const updateType = (nextChoice: string, nextCustom: string) => {
    setChoice(nextChoice);
    setCustom(nextCustom);
    setValue("type", resolveType(nextChoice, nextCustom), { shouldValidate: true });
  };

  // Navigasi keyboard pilihan jenis (pola radiogroup: panah memindah pilihan).
  const typeRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onTypeKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(COMMON_PET_TYPES.length - 1, index + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, index - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = COMMON_PET_TYPES.length - 1;
    else return;
    e.preventDefault();
    typeRefs.current[next]?.focus();
    updateType(COMMON_PET_TYPES[next].value, custom);
  };
  const selectedTypeIndex = Math.max(0, COMMON_PET_TYPES.findIndex((t) => t.value === choice));

  // Simpan isian terakhir saat tahap ditinggalkan, supaya tidak hilang bila
  // pengguna menekan Kembali sebelum "Lanjut".
  const draftCallback = React.useRef(onDraftChange);
  React.useEffect(() => {
    draftCallback.current = onDraftChange;
  }, [onDraftChange]);
  React.useEffect(() => {
    return () => {
      const v = getValues();
      draftCallback.current?.({
        name: (v.name ?? "").trim(),
        type: (v.type ?? "").trim(),
        breed: (v.breed ?? "").trim(),
        age: typeof v.age === "number" && !Number.isNaN(v.age) ? v.age : undefined,
        notes: (v.notes ?? "").trim(),
      });
    };
  }, [getValues]);

  const onSubmit = (data: PetFormData) => {
    onSubmitStep({
      name: data.name.trim(),
      type: data.type.trim(),
      breed: data.breed?.trim() || "",
      age: data.age !== undefined && !Number.isNaN(data.age) ? Number(data.age) : undefined,
      notes: data.notes?.trim() || "",
    });
  };

  // Pesan usia: pesan dari skema bila berbahasa Indonesia; pesan bawaan zod (Inggris,
  // mis. untuk bilangan desimal) diganti kalimat yang bisa dipahami.
  const ageMessage = errors.age
    ? errors.age.message?.startsWith("Usia anabul")
      ? errors.age.message
      : "Usia anabul harus berupa bilangan bulat"
    : "";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
          Profil Anabul Kesayangan
        </h2>
        <p className="text-[15px] leading-6 text-ink-body">
          Informasi anabul membantu groomer kami mempersiapkan penanganan dan peralatan yang sesuai.
        </p>
      </div>

      <form
        id={formId}
        aria-label="Form Data Anabul"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6 rounded-card-xl bg-white p-5 ring-1 ring-inset ring-border sm:p-6"
      >
        {/* Kelompok 1 — Identitas: nama panggilan + jenis */}
        <section aria-labelledby="pet-section-identity" className={sectionClass}>
          <h3 id="pet-section-identity" className={sectionTitleClass}>
            Identitas Anabul
          </h3>

          {/* Nama panggilan (wajib) */}
          <div className="space-y-2">
            <div className={cn(labelRowClass, narrowClass)}>
              <Label htmlFor="pet-name" className={labelClass}>
                <Sparkles className="size-4 shrink-0 text-forest" aria-hidden="true" />
                <span>
                  Nama Panggilan Anabul <RequiredMark />
                </span>
              </Label>
              <RequirementBadge required />
            </div>
            <Input
              id="pet-name"
              autoCapitalize="words"
              enterKeyHint="next"
              placeholder="Contoh: Milo / Luna"
              {...register("name")}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "pet-name-error" : undefined}
              className={cn(fieldClass, narrowClass, errors.name && errorFieldClass)}
            />
            {errors.name && (
              <FieldError id="pet-name-error" message={errors.name.message ?? ""} fix={FIX_HINT.name} />
            )}
          </div>

          {/* Jenis anabul (wajib) */}
          <div className="space-y-3">
            <div className={cn(labelRowClass, narrowClass)}>
              <p id="pet-type-label" className={labelClass}>
                <span>
                  Jenis Anabul <RequiredMark />
                </span>
              </p>
              <RequirementBadge required />
            </div>
            <div
              role="radiogroup"
              aria-labelledby="pet-type-label"
              aria-describedby={errors.type ? "pet-type-error" : undefined}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {COMMON_PET_TYPES.map((t, index) => {
                const isSelected = choice === t.value;
                return (
                  <button
                    key={t.value}
                    ref={(el) => {
                      typeRefs.current[index] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={index === selectedTypeIndex ? 0 : -1}
                    onClick={() => updateType(t.value, custom)}
                    onKeyDown={(e) => onTypeKeyDown(e, index)}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-card-lg px-3 py-2.5 text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
                      isSelected
                        ? "bg-forest text-white shadow-float"
                        : "bg-white text-ink ring-1 ring-inset ring-border hover:bg-canvas-tint hover:ring-forest/60"
                    )}
                  >
                    {isSelected && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Jenis kustom: tetap tampil selama "Lainnya" terpilih (tidak hilang saat mengetik) */}
            {choice === OTHER && (
              <div className="space-y-2">
                <Label htmlFor="pet-type-custom" className={labelClass}>
                  Tuliskan jenis hewan
                </Label>
                <Input
                  id="pet-type-custom"
                  value={custom}
                  onChange={(e) => updateType(OTHER, e.target.value)}
                  placeholder="Contoh: Sugar Glider"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  aria-describedby={errors.type ? "pet-type-error" : undefined}
                  aria-invalid={!!errors.type}
                  className={cn(fieldClass, narrowClass, errors.type && errorFieldClass)}
                />
                <p className="text-[15px] leading-6 text-ink-muted">
                  Kosongkan bila ingin tetap memakai &ldquo;Lainnya&rdquo;.
                </p>
              </div>
            )}

            {errors.type && (
              <FieldError id="pet-type-error" message={errors.type.message ?? ""} fix={FIX_HINT.type} />
            )}
          </div>

        </section>

        {/* Kelompok 2 — Detail tambahan: ras + usia (keduanya opsional) */}
        <section aria-labelledby="pet-section-detail" className={sectionDividedClass}>
          <h3 id="pet-section-detail" className={sectionTitleClass}>
            Detail Tambahan
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className={labelRowClass}>
                <Label htmlFor="pet-breed" className={labelClass}>
                  Ras / Trah
                </Label>
                <RequirementBadge required={false} />
              </div>
              <Input
                id="pet-breed"
                enterKeyHint="next"
                placeholder="Contoh: Golden Retriever, Persia"
                {...register("breed")}
                aria-invalid={!!errors.breed}
                aria-describedby={errors.breed ? "pet-breed-error" : undefined}
                className={cn(fieldClass, errors.breed && errorFieldClass)}
              />
              {errors.breed && (
                <FieldError id="pet-breed-error" message={errors.breed.message ?? ""} fix={FIX_HINT.breed} />
              )}
            </div>

            <div className="space-y-2">
              <div className={labelRowClass}>
                <Label htmlFor="pet-age" className={labelClass}>
                  Usia (Tahun)
                </Label>
                <RequirementBadge required={false} />
              </div>
              <Input
                id="pet-age"
                type="number"
                inputMode="numeric"
                min={0}
                max={35}
                step={1}
                enterKeyHint="next"
                placeholder="Contoh: 2"
                // Kosong = tidak diisi (undefined), BUKAN 0. Angka 0 tetap sah (anabul < 1 tahun).
                {...register("age", {
                  setValueAs: (v) => {
                    if (v === "" || v === null || v === undefined) return undefined;
                    const n = Number(v);
                    return Number.isNaN(n) ? undefined : n;
                  },
                })}
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "pet-age-error" : undefined}
                className={cn(fieldClass, errors.age && errorFieldClass)}
              />
              {errors.age && <FieldError id="pet-age-error" message={ageMessage} fix={FIX_HINT.age} />}
            </div>
          </div>

        </section>

        {/* Kelompok 3 — Catatan untuk groomer */}
        <section aria-labelledby="pet-section-notes" className={sectionDividedClass}>
          <h3 id="pet-section-notes" className={sectionTitleClass}>
            Catatan untuk Groomer
          </h3>
          <div className="space-y-2">
            <div className={labelRowClass}>
              <Label htmlFor="pet-notes" className={labelClass}>
                <HeartHandshake className="size-4 shrink-0 text-forest" aria-hidden="true" />
                <span>Catatan Khusus / Kondisi Kesehatan</span>
              </Label>
              <RequirementBadge required={false} />
            </div>
            <Textarea
              id="pet-notes"
              rows={4}
              placeholder="Contoh: Memiliki alergi sampo wangi, sedikit cemas dengan bunyi hair dryer, ada luka bekas operasi di paha kiri."
              {...register("notes")}
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? "pet-notes-error" : "pet-notes-hint"}
              className={cn(
                "min-h-28 rounded-xl border-0 bg-white px-4 py-3 text-base text-ink ring-1 ring-inset ring-field-border placeholder:text-ink-muted md:text-base focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-0",
                errors.notes && errorFieldClass
              )}
            />
            <div className="flex items-start justify-between gap-3">
              {errors.notes ? (
                <FieldError id="pet-notes-error" message={errors.notes.message ?? ""} fix={FIX_HINT.notes} />
              ) : (
                <p id="pet-notes-hint" className="text-[15px] leading-6 text-ink-muted">
                  Beri tahu kami jika anabul memiliki riwayat sensitivitas kulit atau sifat khusus agar sesi perawatan berjalan aman dan nyaman.
                </p>
              )}
              <span
                className={cn(
                  "shrink-0 text-[13px] font-medium leading-6 tabular-nums",
                  notesLength > MAX_NOTES ? "text-destructive" : "text-ink-muted"
                )}
              >
                {notesLength}/{MAX_NOTES}
              </span>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
