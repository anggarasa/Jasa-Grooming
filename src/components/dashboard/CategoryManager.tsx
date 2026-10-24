"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@/lib/zod-resolver";
import {
  createServiceCategorySchema,
  CreateServiceCategoryInput,
} from "@/modules/categories/schemas";
import {
  ServiceCategory,
  createServiceCategoryApi,
  updateServiceCategoryApi,
  deleteServiceCategoryApi,
} from "@/lib/business-client";
import { AuthenticatedUser } from "@/modules/auth/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CategoryManagerProps {
  initialCategories: ServiceCategory[];
  user?: AuthenticatedUser;
}

export function CategoryManager({
  initialCategories,
}: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = React.useState<ServiceCategory[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<ServiceCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ServiceCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateServiceCategoryInput>({
    resolver: zodResolver(createServiceCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      displayOrder: 0,
      isActive: true,
    },
  });
  const nameField = register("name");

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({
      name: "",
      slug: "",
      description: "",
      displayOrder: categories.length,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };

  const onSubmitForm = async (data: CreateServiceCategoryInput) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await updateServiceCategoryApi(editingCategory.id, data);
        if (!res.success || !res.data) {
          toast.error("Gagal Memperbarui Kategori", {
            description: res.error?.message || "Terjadi kesalahan pada data.",
          });
          return;
        }

        toast.success("Kategori Diperbarui", {
          description: `Kategori '${res.data.name}' berhasil diperbarui.`,
        });

        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? res.data! : c))
        );
      } else {
        const res = await createServiceCategoryApi(data);
        if (!res.success || !res.data) {
          toast.error("Gagal Menambahkan Kategori", {
            description: res.error?.message || "Terjadi kesalahan pada data.",
          });
          return;
        }

        toast.success("Kategori Ditambahkan", {
          description: `Kategori '${res.data.name}' berhasil dibuat.`,
        });

        setCategories((prev) => [...prev, res.data!]);
      }

      setIsDialogOpen(false);
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
      const res = await deleteServiceCategoryApi(deleteTarget.id);
      if (!res.success) {
        toast.error("Gagal Menghapus Kategori", {
          description: res.error?.message || "Terjadi kesalahan saat menghapus kategori.",
        });
        return;
      }

      if (res.data?.deactivated) {
        toast.warning("Kategori Dinonaktifkan", {
          description:
            res.message ||
            `Kategori '${deleteTarget.name}' dinonaktifkan (bukan dihapus) karena masih memiliki layanan terkait.`,
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === deleteTarget.id ? { ...c, isActive: false } : c
          )
        );
      } else {
        toast.success("Kategori Dihapus", {
          description: res.message || `Kategori '${deleteTarget.name}' berhasil dihapus.`,
        });
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      }

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
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-accent" />
            Kategori Layanan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelompokkan layanan grooming seperti Basic Care, Spa & Medicated, Grooming Lengkap, dsb.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-accent" />
              Daftar Kategori Layanan
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Total: {categories.length} Kategori
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Urutan</TableHead>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead className="hidden md:table-cell">Slug</TableHead>
                  <TableHead className="hidden sm:table-cell">Deskripsi</TableHead>
                  <TableHead className="text-center">Jml Layanan</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground text-sm"
                    >
                      Belum ada kategori layanan yang dibuat. Klik tombol <strong>Tambah Kategori</strong> di atas.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-xs text-muted-foreground">
                        #{cat.displayOrder}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm text-foreground block">
                          {cat.name}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-xs truncate">
                        {cat.description || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {cat._count?.services || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={cat.isActive ? "active" : "inactive"}
                          className="text-[11px]"
                        >
                          {cat.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(cat)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit Kategori"
                            aria-label={`Edit kategori ${cat.name}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(cat)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Hapus Kategori"
                            aria-label={`Hapus kategori ${cat.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog Tambah / Edit Kategori */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Perbarui Kategori Layanan" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Sesuaikan data kategori layanan di bawah ini."
                : "Buat pengelompokan layanan baru untuk katalog grooming."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nama Kategori</Label>
              <Input
                id="category-name"
                placeholder="Contoh: Paket Full Grooming"
                disabled={isSubmitting}
                className={errors.name ? "border-destructive" : ""}
                {...nameField}
                onChange={(e) => {
                  nameField.onChange(e);
                  if (!editingCategory) {
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

            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug URL</Label>
              <Input
                id="category-slug"
                placeholder="paket-full-grooming"
                disabled={isSubmitting}
                className={errors.slug ? "border-destructive font-mono text-xs" : "font-mono text-xs"}
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-desc">Deskripsi (Opsional)</Label>
              <Textarea
                id="category-desc"
                rows={2}
                placeholder="Penjelasan singkat mengenai kategori layanan ini..."
                disabled={isSubmitting}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-order">Urutan Tampilan</Label>
                <Input
                  id="category-order"
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  {...register("displayOrder", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <span className="text-xs font-medium">Status Aktif</span>
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
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : editingCategory ? (
                  "Simpan Perubahan"
                ) : (
                  "Buat Kategori"
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
            <DialogTitle>Hapus Kategori Layanan?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori{" "}
              <strong>&apos;{deleteTarget?.name}&apos;</strong>?
            </DialogDescription>
            {deleteTarget && (deleteTarget._count?.services || 0) > 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                <strong>Peringatan:</strong> Terdapat{" "}
                <strong>{deleteTarget._count?.services}</strong> layanan grooming yang
                terhubung ke kategori ini. Kategori tidak dapat dihapus jika masih ada layanan terkait.
              </div>
            )}
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
                "Ya, Hapus Kategori"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
