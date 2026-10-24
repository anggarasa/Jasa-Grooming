"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Sparkles, AlertCircle, HeartHandshake } from "lucide-react";
import { petSchema } from "@/modules/bookings/schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { z } from "zod";

type PetFormData = z.infer<typeof petSchema>;

interface Step5PetFormProps {
  initialData: PetFormData;
  onSubmitStep: (data: PetFormData) => void;
  formId?: string;
}

const COMMON_PET_TYPES = [
  { label: "Anjing", value: "Anjing" },
  { label: "Kucing", value: "Kucing" },
  { label: "Kelinci", value: "Kelinci" },
  { label: "Lainnya", value: "Lainnya" },
];

export function Step5PetForm({
  initialData,
  onSubmitStep,
  formId = "booking-pet-form",
}: Step5PetFormProps) {
  const [selectedType, setSelectedType] = React.useState<string>(initialData.type || "Anjing");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: initialData.name || "",
      type: initialData.type || "Anjing",
      breed: initialData.breed || "",
      age: initialData.age ?? undefined,
      notes: initialData.notes || "",
    },
  });

  const onSubmit = (data: PetFormData) => {
    onSubmitStep({
      name: data.name.trim(),
      type: data.type.trim(),
      breed: data.breed?.trim() || "",
      age: data.age !== undefined && !Number.isNaN(data.age) ? Number(data.age) : undefined,
      notes: data.notes?.trim() || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Profil Anabul Kesayangan
        </h2>
        <p className="text-sm text-muted-foreground">
          Informasi anabul membantu groomer kami mempersiapkan penanganan dan peralatan yang sesuai.
        </p>
      </div>

      <form
        id={formId}
        aria-label="Form Data Anabul"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs"
      >
        {/* Pet Name */}
        <div className="space-y-2">
          <Label htmlFor="pet-name" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>Nama Panggilan Anabul *</span>
          </Label>
          <Input
            id="pet-name"
            placeholder="Contoh: Milo / Luna"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "pet-name-error" : undefined}
            className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.name && (
            <p id="pet-name-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        {/* Pet Type Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground block">
            Jenis Anabul *
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMMON_PET_TYPES.map((t) => {
              const isSelected = selectedType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(t.value);
                    setValue("type", t.value, { shouldValidate: true });
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-xl border py-2 px-3 text-xs font-semibold transition-all cursor-pointer outline-none",
                    isSelected
                      ? "border-accent bg-accent text-white shadow-xs font-bold"
                      : "border-border bg-background text-foreground hover:border-accent/60 hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          {/* Custom type input if "Lainnya" or different */}
          {selectedType === "Lainnya" && (
            <div className="mt-2">
              <Input
                placeholder="Tuliskan jenis hewan (misal: Sugar Glider)"
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setValue("type", e.target.value, { shouldValidate: true });
                }}
                className="text-xs"
              />
            </div>
          )}
          {errors.type && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.type.message}</span>
            </p>
          )}
        </div>

        {/* Breed & Age (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pet-breed" className="text-sm font-semibold text-foreground">
                Ras / Trah
              </Label>
              <span className="text-xs text-muted-foreground font-normal">Opsional</span>
            </div>
            <Input
              id="pet-breed"
              placeholder="Contoh: Golden Retriever, Persia"
              {...register("breed")}
              className={errors.breed ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.breed && (
              <p className="text-xs text-destructive mt-1">{errors.breed.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pet-age" className="text-sm font-semibold text-foreground">
                Usia (Tahun)
              </Label>
              <span className="text-xs text-muted-foreground font-normal">Opsional</span>
            </div>
            <Input
              id="pet-age"
              type="number"
              min={0}
              max={35}
              placeholder="Contoh: 2"
              {...register("age")}
              className={errors.age ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.age && (
              <p className="text-xs text-destructive mt-1">{errors.age.message}</p>
            )}
          </div>
        </div>

        {/* Special Treatment Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pet-notes" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <HeartHandshake className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Catatan Khusus / Kondisi Kesehatan</span>
            </Label>
            <span className="text-xs text-muted-foreground font-normal">Opsional</span>
          </div>
          <Textarea
            id="pet-notes"
            rows={3}
            placeholder="Contoh: Memiliki alergi sampo wangi, sedikit cemas dengan bunyi hair dryer, ada luka bekas operasi di paha kiri."
            {...register("notes")}
            className={errors.notes ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.notes && (
            <p className="text-xs text-destructive mt-1">{errors.notes.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Beri tahu kami jika anabul memiliki riwayat sensitivitas kulit atau sifat khusus agar sesi perawatan berjalan aman dan nyaman.
          </p>
        </div>
      </form>
    </div>
  );
}
