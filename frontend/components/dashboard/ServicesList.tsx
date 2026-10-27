"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  GroomingService,
  ServiceCategory,
  deleteServiceApi,
  formatRupiah,
  getMediaUrl,
} from "@/lib/business-client";
import { AuthenticatedUser } from "@backend/modules/auth/types";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServicesListProps {
  initialServices: GroomingService[];
  categories: ServiceCategory[];
  user?: AuthenticatedUser;
}

export function ServicesList({
  initialServices,
  categories,
}: ServicesListProps) {
  const router = useRouter();
  const [services, setServices] = React.useState<GroomingService[]>(initialServices);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = React.useState<GroomingService | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Filter client-side
  const filteredServices = React.useMemo(() => {
    return services.filter((srv) => {
      // Filter teks
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = srv.name.toLowerCase().includes(q);
        const matchesDesc = (srv.shortDescription || "").toLowerCase().includes(q);
        const matchesSlug = srv.slug.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesSlug) return false;
      }

      // Filter kategori
      if (selectedCategory !== "ALL" && srv.categoryId !== selectedCategory) {
        return false;
      }

      // Filter status
      if (selectedStatus === "ACTIVE" && !srv.isActive) return false;
      if (selectedStatus === "INACTIVE" && srv.isActive) return false;

      return true;
    });
  }, [services, searchQuery, selectedCategory, selectedStatus]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteServiceApi(deleteTarget.id);
      if (!res.success) {
        toast.error("Gagal Menghapus Layanan", {
          description: res.error?.message || "Terjadi kesalahan saat menghapus layanan.",
        });
        return;
      }

      if (res.data?.deactivated) {
        toast.warning("Layanan Dinonaktifkan", {
          description:
            res.message ||
            `Layanan '${deleteTarget.name}' dinonaktifkan karena memiliki riwayat reservasi.`,
        });
        setServices((prev) =>
          prev.map((s) => (s.id === deleteTarget.id ? { ...s, isActive: false } : s))
        );
      } else {
        toast.success("Layanan Dihapus", {
          description: res.message || `Layanan '${deleteTarget.name}' berhasil dihapus permanen.`,
        });
        setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
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
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scissors className="h-6 w-6 text-accent" />
            Katalog Layanan Grooming
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola paket perawatan hewan, tarif IDR, estimasi durasi kerja, dan foto layanan.
          </p>
        </div>
        <Button
          asChild
          className="bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm"
        >
          <Link href="/dashboard/services/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Layanan Baru
          </Link>
        </Button>
      </div>

      {/* Filter & Search Toolbar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Input Pencarian */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari nama layanan, deskripsi, atau slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Kategori */}
            <div className="w-full md:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="w-full md:w-44">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif Saja</option>
                <option value="INACTIVE">Nonaktif Saja</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Katalog Layanan */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4 text-accent" />
              Daftar Paket & Layanan
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Menampilkan {filteredServices.length} dari {services.length} Layanan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Foto</TableHead>
                  <TableHead>Nama Layanan</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga (IDR)</TableHead>
                  <TableHead className="text-center">Durasi & Jeda</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {services.length === 0 ? (
                        <>
                          Belum ada paket layanan grooming. Klik{" "}
                          <strong>Tambah Layanan Baru</strong> untuk memulai katalog.
                        </>
                      ) : (
                        "Tidak ditemukan layanan yang sesuai dengan filter pencarian Anda."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => {
                    const imgUrl = getMediaUrl(service.imageObjectKey);

                    return (
                      <TableRow key={service.id} className="hover:bg-muted/30">
                        {/* Thumbnail Gambar */}
                        <TableCell>
                          <div className="h-11 w-11 rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center shrink-0">
                            {imgUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={imgUrl}
                                alt={service.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                            )}
                          </div>
                        </TableCell>

                        {/* Nama & Deskripsi */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-sm text-foreground block">
                              {service.name}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground block">
                              /{service.slug}
                            </span>
                            {service.shortDescription && (
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
                                {service.shortDescription}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Kategori */}
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {service.category?.name || "Tanpa Kategori"}
                          </Badge>
                        </TableCell>

                        {/* Harga */}
                        <TableCell className="text-right font-bold text-sm text-foreground">
                          {formatRupiah(service.price)}
                        </TableCell>

                        {/* Durasi & Buffer */}
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1.5 text-xs text-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                            <Clock className="h-3 w-3 text-accent" />
                            <span>{service.durationMinutes} mnt</span>
                            <span className="text-muted-foreground text-[10px]">
                              (+{service.bufferMinutes}m)
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Aktif */}
                        <TableCell className="text-center">
                          <Badge
                            variant={service.isActive ? "active" : "inactive"}
                            className="text-[11px]"
                          >
                            {service.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="Edit Layanan"
                              aria-label={`Edit layanan ${service.name}`}
                            >
                              <Link href={`/dashboard/services/${service.id}/edit`}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(service)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              title="Hapus Layanan"
                              aria-label={`Hapus layanan ${service.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
            <DialogTitle>Hapus Layanan Grooming?</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>
                Apakah Anda yakin ingin menghapus layanan{" "}
                <strong>&apos;{deleteTarget?.name}&apos;</strong>?
              </span>
              <span className="block text-xs text-muted-foreground">
                Jika layanan memiliki riwayat pemesanan pelanggan, sistem akan otomatis melakukan de-aktivasi (bukan penghapusan data permanen) untuk menjaga integritas laporan historis.
              </span>
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
                  Memproses...
                </>
              ) : (
                "Ya, Hapus / Nonaktifkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
