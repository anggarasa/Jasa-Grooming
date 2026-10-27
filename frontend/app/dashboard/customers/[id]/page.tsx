import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  PawPrint,
  CalendarCheck,
  MessageCircle,
  Eye,
  AlertCircle,
} from "lucide-react";
import { formatIndonesianDateOnly, formatIndonesianTime } from "@/lib/format-date";
import { formatIDR, buildWhatsAppUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/dashboard/bookings/BookingStatusBadge";
import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { getCustomerDetail } from "@backend/modules/customers/customer.service";
import { CustomerDetailItem } from "@backend/modules/bookings/admin-ui.types";

export const instant = false;

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  let customer: CustomerDetailItem | null = null;
  try {
    const business = await getPrimaryBusiness();
    customer = (await getCustomerDetail(business.id, id)) as unknown as CustomerDetailItem;
  } catch (error) {
    console.error("Gagal memuat detail pelanggan:", error);
  }

  if (!customer) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-16 text-center animate-in fade-in">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Pelanggan Tidak Ditemukan
        </h1>
        <p className="text-sm text-muted-foreground">
          Data pelanggan dengan ID tersebut tidak dapat ditemukan di database.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/customers">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Kembali ke Direktori Pelanggan
          </Link>
        </Button>
      </div>
    );
  }

  const waUrl = buildWhatsAppUrl(
    customer.phone,
    `Halo ${customer.name}, salam dari PawCare Grooming!`
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href="/dashboard/customers">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Direktori Pelanggan
              </Link>
            </Button>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs font-semibold text-muted-foreground truncate">
              {customer.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-accent" />
            {customer.name}
          </h1>
        </div>

        {customer.phone && (
          <Button
            asChild
            className="motion-admin-press rounded-full font-semibold"
            size="sm"
          >
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Kirim Pesan WhatsApp
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile & Pets */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Nama Lengkap</span>
                <span className="font-semibold text-foreground text-sm">
                  {customer.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Nomor Telepon</span>
                <span className="font-medium text-foreground">
                  {customer.phone}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Email</span>
                <span className="text-foreground">
                  {customer.email || <span className="text-muted-foreground italic">Tidak diisi</span>}
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between text-muted-foreground">
                <span>Terdaftar sejak:</span>
                <span className="font-medium text-foreground">
                  {formatIndonesianDateOnly(customer.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Associated Pets Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-accent" />
                  Anabul Terdaftar
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {customer.pets?.length || 0} Anabul
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {!customer.pets || customer.pets.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Belum ada profil anabul yang tercatat.
                </p>
              ) : (
                customer.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">
                        {pet.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px] scale-95">
                        {pet.type}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground text-[11px] space-y-0.5">
                      {pet.breed && <div>Ras: {pet.breed}</div>}
                      {pet.age !== null && pet.age !== undefined && (
                        <div>Usia: {pet.age} tahun</div>
                      )}
                      <div>
                        Total Kunjungan:{" "}
                        <span className="font-semibold text-primary">
                          {pet._count?.bookings || 0} kali
                        </span>
                      </div>
                    </div>

                    {pet.notes && (
                      <div className="mt-1.5 pt-1.5 border-t border-dashed text-muted-foreground italic text-[11px]">
                        Catatan: &ldquo;{pet.notes}&rdquo;
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Columns: Booking History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-accent" />
                  Riwayat Reservasi ({customer.bookings?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!customer.bookings || customer.bookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground italic">
                  Belum ada riwayat reservasi untuk pelanggan ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Kode</TableHead>
                        <TableHead>Jadwal Kedatangan</TableHead>
                        <TableHead>Anabul</TableHead>
                        <TableHead>Layanan</TableHead>
                        <TableHead>Total Biaya</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.bookings.map((b) => (
                        <TableRow key={b.id} className="hover:bg-muted/20">
                          <TableCell className="whitespace-nowrap font-mono text-xs font-bold text-primary">
                            #{b.bookingCode}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-medium text-foreground block">
                              {formatIndonesianDateOnly(b.startAt)}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              {formatIndonesianTime(b.startAt)}{" "}
                              WIB
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {b.pet?.name || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {b.serviceSnapshotName || b.service?.name || "-"}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">
                            {formatIDR(Number(b.totalPrice))}
                          </TableCell>
                          <TableCell>
                            <BookingStatusBadge status={b.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                              <Link href={`/dashboard/bookings/${b.id}`}>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Rincian
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
