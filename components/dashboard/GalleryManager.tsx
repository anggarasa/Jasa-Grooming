"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@/lib/zod-resolver";
import {
  createGalleryItemSchema,
  updateGalleryItemSchema,
  CreateGalleryItemInput,
  UpdateGalleryItemInput,
} from "@backend/modules/gallery/schemas";
import {
  GalleryItem,
  createGalleryItemApi,
  updateGalleryItemApi,
  deleteGalleryItemApi,
  getMediaUrl,
} from "@/lib/business-client";
import { AuthenticatedUser } from "@backend/modules/auth/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUploadDropzone } from "@/components/media/ImageUploadDropzone";

interface GalleryManagerProps {
  initialGallery: GalleryItem[];
  user?: AuthenticatedUser;
}

export function GalleryManager({
  initialGallery,
}: GalleryManagerProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<GalleryItem[]>(initialGallery);
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "ACTIVE">("ALL");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GalleryItem | null>(null);
  const [previewImage, setPreviewImage] = React.useState<GalleryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Form Create
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    control: controlCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreateGalleryItemInput>({
    resolver: zodResolver(createGalleryItemSchema),
    defaultValues: {
      objectKey: "",
      caption: "",
      altText: "",
      displayOrder: items.length,
      isActive: true,
    },
  });

  // Form Edit
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    reset: resetEdit,
  } = useForm<UpdateGalleryItemInput>({
    resolver: zodResolver(updateGalleryItemSchema),
    defaultValues: {
      caption: "",
      altText: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  const filteredItems = React.useMemo(() => {
    if (activeFilter === "ACTIVE") {
      return items.filter((i) => i.isActive);
    }
    return items;
  }, [items, activeFilter]);

  const handleOpenCreate = () => {
    resetCreate({
      objectKey: "",
      caption: "",
      altText: "",
      displayOrder: items.length,
      isActive: true,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item);
    resetEdit({
      caption: item.caption || "",
      altText: item.altText || "",
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });
  };

  const onSubmitCreate = async (data: CreateGalleryItemInput) => {
    if (!data.objectKey) {
      toast.error("Berkas Foto Wajib", {
        description: "Silakan unggah foto terlebih dahulu.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGalleryItemApi(data);
      if (!res.success || !res.data) {
        toast.error("Gagal Mengunggah Foto", {
          description: res.error?.message || "Terjadi kesalahan saat menyimpan foto.",
        });
        return;
      }

      toast.success("Foto Galeri Ditambahkan", {
        description: "Foto baru berhasil disimpan dan masuk ke galeri bisnis.",
      });

      setItems((prev) => [...prev, res.data!]);
      setIsCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server. Silakan coba kembali.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: UpdateGalleryItemInput) => {
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const res = await updateGalleryItemApi(editingItem.id, data);
      if (!res.success || !res.data) {
        toast.error("Gagal Memperbarui Foto", {
          description: res.error?.message || "Terjadi kesalahan saat menyimpan data.",
        });
        return;
      }

      toast.success("Foto Galeri Diperbarui", {
        description: "Keterangan dan status foto berhasil diperbarui.",
      });

      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? res.data! : i))
      );
      setEditingItem(null);
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server. Silakan coba kembali.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteGalleryItemApi(deleteTarget.id);
      if (!res.success) {
        toast.error("Gagal Menghapus Foto", {
          description: res.error?.message || "Terjadi kesalahan saat menghapus foto.",
        });
        return;
      }

      toast.success("Foto Galeri Dihapus", {
        description: "Foto berhasil dihapus dari galeri dan server penyimpanan MinIO.",
      });

      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server. Silakan coba kembali.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-accent" />
            Galeri Foto Bisnis
          </h1>
          <p className="text-sm text-muted-foreground">
            Kumpulan dokumentasi foto gerai toko, groomer profesional, dan hasil perawatan hewan peliharaan.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as "ALL" | "ACTIVE")}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">Semua Foto ({items.length})</option>
            <option value="ACTIVE">Aktif Saja</option>
          </select>

          <Button
            onClick={handleOpenCreate}
            className="bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Unggah Foto Baru
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-16 space-y-3">
            <div className="h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-foreground">
                Belum Ada Foto di Galeri
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Unggah foto fasilitas gerai, area spa kucing & anjing, atau dokumentasi hasil grooming pelanggan.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs mt-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Unggah Foto Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const url = getMediaUrl(item.objectKey);

            return (
              <Card
                key={item.id}
                className="overflow-hidden group hover:shadow-md transition-all flex flex-col border-border"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-[4/3] bg-muted/40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={item.altText || item.caption || "Foto galeri"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                    <span className="bg-slate-950/75 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #{item.displayOrder}
                    </span>
                    <Badge
                      variant={item.isActive ? "active" : "inactive"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-slate-900"
                      onClick={() => setPreviewImage(item)}
                      title="Lihat Pratinjau"
                      aria-label="Lihat Pratinjau Foto"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-slate-900"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Keterangan"
                      aria-label="Edit Keterangan Foto"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => setDeleteTarget(item)}
                      title="Hapus Foto"
                      aria-label="Hapus Foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Caption / Alt Footer */}
                <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-1">
                  <div>
                    <p className="font-medium text-xs text-foreground line-clamp-1">
                      {item.caption || "(Tanpa Keterangan)"}
                    </p>
                    {item.altText && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        Alt: {item.altText}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Unggah Foto Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Unggah Foto Galeri Baru</DialogTitle>
            <DialogDescription>
              Pilih foto resolusi baik, sertakan keterangan dan teks alternatif untuk aksesibilitas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-3 pt-1">
            <Controller
              control={controlCreate}
              name="objectKey"
              render={({ field }) => (
                <ImageUploadDropzone
                  folder="gallery/images"
                  value={field.value}
                  onChange={(key) => field.onChange(key || "")}
                  aspectRatio="thumbnail"
                  label="Berkas Foto"
                  description="Format JPEG, PNG, atau WebP (maks. 5MB)"
                  disabled={isSubmitting}
                />
              )}
            />
            {errorsCreate.objectKey && (
              <p className="text-xs text-destructive">{errorsCreate.objectKey.message}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="gallery-caption" className="text-xs font-medium">Keterangan Foto (Caption)</Label>
              <Input
                id="gallery-caption"
                placeholder="Contoh: Area Mandi Spa Anjing Ras Besar"
                disabled={isSubmitting}
                className="h-9 text-xs"
                {...registerCreate("caption")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gallery-alt" className="text-xs font-medium">Teks Alternatif (Alt Text)</Label>
              <Input
                id="gallery-alt"
                placeholder="Deskripsi foto untuk pembaca layar (screen reader)"
                disabled={isSubmitting}
                className="h-9 text-xs"
                {...registerCreate("altText")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gallery-order" className="text-xs font-medium">Urutan Tampilan</Label>
                <Input
                  id="gallery-order"
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                  {...registerCreate("displayOrder", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="h-9 flex items-center justify-between px-3 rounded-md border border-input bg-background">
                  <span className="text-xs font-medium">Status Aktif</span>
                  <Controller
                    control={controlCreate}
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
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent-hover text-accent-foreground min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan ke Galeri"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Edit Foto */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Keterangan Foto</DialogTitle>
            <DialogDescription>
              Ubah caption, alt text, dan urutan tampilan foto galeri ini.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="aspect-[16/9] max-w-[240px] mx-auto rounded-lg overflow-hidden bg-muted/40 mb-1 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(editingItem.objectKey)}
                alt="Pratinjau"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-caption" className="text-xs font-medium">Keterangan Foto</Label>
              <Input
                id="edit-caption"
                disabled={isSubmitting}
                className="h-9 text-xs"
                {...registerEdit("caption")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-alt" className="text-xs font-medium">Teks Alternatif (Alt Text)</Label>
              <Input
                id="edit-alt"
                disabled={isSubmitting}
                className="h-9 text-xs"
                {...registerEdit("altText")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-order" className="text-xs font-medium">Urutan Tampilan</Label>
                <Input
                  id="edit-order"
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                  {...registerEdit("displayOrder", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="h-9 flex items-center justify-between px-3 rounded-md border border-input bg-background">
                  <span className="text-xs font-medium">Status Aktif</span>
                  <Controller
                    control={controlEdit}
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
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Konfirmasi Hapus */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertCircle className="h-5 w-5" />
            </div>
            <DialogTitle>Hapus Foto dari Galeri?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus foto ini secara permanen dari basis data dan server berkas MinIO. Tindakan tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus Permanen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pratinjau Foto Penuh */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-2xl p-2 bg-slate-950 border-slate-800 text-white">
          <div className="relative aspect-video rounded-md overflow-hidden flex items-center justify-center">
            {previewImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getMediaUrl(previewImage.objectKey)}
                alt={previewImage.altText || previewImage.caption || "Pratinjau foto"}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          {previewImage?.caption && (
            <p className="text-xs text-slate-300 p-2 text-center">
              {previewImage.caption}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
