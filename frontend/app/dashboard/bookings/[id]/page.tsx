import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminBookingDetail } from "@backend/modules/bookings/admin-booking.service";
import { BookingDetailView } from "@/components/dashboard/bookings/BookingDetailView";
import { AdminBookingDetailItem } from "@backend/modules/bookings/admin-ui.types";
import { serializeAdminBookingDetail } from "@backend/modules/bookings/booking-serializer";

export const instant = false;

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;

  let booking: AdminBookingDetailItem | null = null;
  try {
    const rawBooking = await getAdminBookingDetail(id);
    booking = serializeAdminBookingDetail(rawBooking);
  } catch (error) {
    console.error("Gagal mengambil detail booking admin:", error);
  }

  if (!booking) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-16 text-center animate-in fade-in">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Reservasi Tidak Ditemukan
        </h1>
        <p className="text-sm text-muted-foreground">
          Data reservasi dengan ID tersebut tidak dapat ditemukan atau mungkin telah dihapus.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/bookings">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Kembali ke Daftar Reservasi
          </Link>
        </Button>
      </div>
    );
  }

  return <BookingDetailView initialBooking={booking} />;
}
