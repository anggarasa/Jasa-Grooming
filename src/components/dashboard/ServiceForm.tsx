"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Scissors,
  ArrowLeft,
  Save,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@/lib/zod-resolver";
import {
  createServiceSchema,
  CreateServiceInput,
} from "@/modules/services/schemas";
import {
  GroomingService,
  ServiceCategory,
  createServiceApi,
  updateServiceApi,
} from "@/lib/business-client";
import { AuthenticatedUser } from "@/modules/auth/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageUploadDropzone } from "@/components/media/ImageUploadDropzone";

interface ServiceFormProps {
  mode: "create" | "edit";
  initialService?: GroomingService;
  categories: ServiceCategory[];
  user?: AuthenticatedUser;
}

export function ServiceForm({
  mode,
  initialService,
  categories,
}: ServiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: initialService?.name || "",
      slug: initialService?.slug || "",
      categoryId: initialService?.categoryId || (categories[0]?.id || ""),
      price: initialService?.price ? Number(initialService.price) : 100000,
      durationMinutes: initialService?.durationMinutes ?? 60,
      bufferMinutes: initialService?.bufferMinutes ?? 15,
      shortDescription: initialService?.shortDescription || "",
      fullDescription: initialService?.fullDescription || "",
      imageObjectKey: initialService?.imageObjectKey || null,
      displayOrder: initialService?.displayOrder ?? 0,
      isActive: initialService?.isActive ?? true,
    },
  });

  const nameField = register("name");

  const onSubmit = async (data: CreateServiceInput) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const res = await createServiceApi(data);
        if (!res.success || !res.data) {
          toast.error("Gagal Menambahkan Layanan", {
            description: res.error?.message || "Terjadi kesalahan pada data.",
          });
          return;
        }

        toast.success("Layanan Berhasil Ditambahkan", {
          description: `Paket '${res.data.name}' telah tersimpan di katalog.`,
        });

        router.push("/dashboard/services");
        router.refresh();
      } else {
        if (!initialService) return;
        const res = await updateServiceApi(initialService.id, data);
        if (!res.success || !res.data) {
          toast.error("Gagal Memperbarui Layanan", {
            description: res.error?.message || "Terjadi kesalahan pada data.",
          });
          return;
        }

        toast.success("Layanan Berhasil Diperbarui", {
          description: `Paket '${res.data.name}' berhasil disimpan.`,
        });

        router.push("/dashboard/services");
        router.refresh();
      }
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server. Silakan coba kembali.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
        >
          <Link href="/dashboard/services" aria-label="Kembali ke Katalog Layanan">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scissors className="h-6 w-6 text-accent" />
            {mode === "create" ? "Tambah Layanan Grooming Baru" : "Edit Layanan Grooming"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Lengkapi informasi paket grooming, durasi pengerjaan, dan foto layanan."
              : `Mengubah data paket '${initialService?.name}'.`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Data Utama Layanan */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Utama Layanan</CardTitle>
                <CardDescription>
                  Nama layanan, slug rute, kategori, dan deskripsi publik.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Nama Layanan Grooming</Label>
                  <Input
                    id="service-name"
                    placeholder="Contoh: Complete Spa & Full Grooming"
                    disabled={isSubmitting}
                    className={errors.name ? "border-destructive" : ""}
                    {...nameField}
                    onChange={(e) => {
                      nameField.onChange(e);
                      if (mode === "create") {
                        const generatedSlug = e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .replace(/\s+/g, "-");
                        setValue("slug", generatedSlug, { shouldValidate: true });
                      }
                    }}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-slug">Slug Sistem</Label>
                    <Input
                      id="service-slug"
                      placeholder="complete-spa-full-grooming"
                      disabled={isSubmitting}
                      className={errors.slug ? "border-destructive font-mono text-xs" : "font-mono text-xs"}
                      {...register("slug")}
                    />
                    {errors.slug && (
                      <p className="text-xs text-destructive">{errors.slug.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-category">Kategori Layanan</Label>
                    <select
                      id="service-category"
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...register("categoryId")}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-xs text-destructive">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-short-desc">Deskripsi Singkat (Ringkasan)</Label>
                  <Input
                    id="service-short-desc"
                    placeholder="Contoh: Mandi spa herbal, potong kuku, pembersihan telinga, styling bulu rapi."
                    disabled={isSubmitting}
                    {...register("shortDescription")}
                  />
                  {errors.shortDescription && (
                    <p className="text-xs text-destructive">{errors.shortDescription.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-full-desc">Deskripsi Lengkap & Tahapan Perawatan</Label>
                  <Textarea
                    id="service-full-desc"
                    rows={4}
                    placeholder="Jelaskan secara mendalam proses pengerjaan, manfaat obat/sampo yang digunakan, serta anjuran untuk jenis hewan peliharaan tertentu..."
                    disabled={isSubmitting}
                    {...register("fullDescription")}
                  />
                  {errors.fullDescription && (
                    <p className="text-xs text-destructive">{errors.fullDescription.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Waktu & Harga */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  Tarif Harga & Alokasi Waktu
                </CardTitle>
                <CardDescription>
                  Harga dalam Rupiah (IDR), durasi grooming aktif, dan waktu jeda antar reservasi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Harga IDR */}
                  <div className="space-y-2">
                    <Label htmlFor="service-price">Harga Layanan (Rp)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground text-xs font-semibold">
                        Rp
                      </div>
                      <Input
                        id="service-price"
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="150000"
                        disabled={isSubmitting}
                        className="pl-10 font-bold"
                        {...register("price", { valueAsNumber: true })}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                  </div>

                  {/* Durasi Kerja */}
                  <div className="space-y-2">
                    <Label htmlFor="service-duration">Durasi Pengerjaan (Menit)</Label>
                    <Input
                      id="service-duration"
                      type="number"
                      min={5}
                      max={480}
                      step={5}
                      placeholder="60"
                      disabled={isSubmitting}
                      {...register("durationMinutes", { valueAsNumber: true })}
                    />
                    {errors.durationMinutes && (
                      <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
                    )}
                  </div>

                  {/* Buffer Waktu */}
                  <div className="space-y-2">
                    <Label htmlFor="service-buffer">Buffer Sanitasi (Menit)</Label>
                    <Input
                      id="service-buffer"
                      type="number"
                      min={0}
                      max={120}
                      step={5}
                      placeholder="15"
                      disabled={isSubmitting}
                      {...register("bufferMinutes", { valueAsNumber: true })}
                    />
                    {errors.bufferMinutes && (
                      <p className="text-xs text-destructive">{errors.bufferMinutes.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Foto MinIO & Pengaturan Tambahan */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Foto Layanan Grooming</CardTitle>
                <CardDescription>
                  Foto visual untuk katalog publik dan kartu pilihan paket reservasi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="imageObjectKey"
                  render={({ field }) => (
                    <ImageUploadDropzone
                      folder="services/images"
                      value={field.value}
                      onChange={(newKey) => field.onChange(newKey)}
                      aspectRatio="thumbnail"
                      label="Foto Layanan"
                      description="Format JPEG, PNG, atau WebP (maks. 5MB)"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status & Urutan Tampilan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service-order">Urutan Tampilan</Label>
                  <Input
                    id="service-order"
                    type="number"
                    min={0}
                    disabled={isSubmitting}
                    {...register("displayOrder", { valueAsNumber: true })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Semakin kecil nilainya (misal 0), semakin awal posisi paket di halaman katalog.
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">
                      Status Aktif di Katalog
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Tersedia untuk reservasi publik
                    </span>
                  </div>
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan Layanan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === "create" ? "Simpan Layanan Baru" : "Simpan Perubahan"}
                  </>
                )}
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <Link href="/dashboard/services">Batal & Kembali</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
