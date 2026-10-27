import * as React from "react";
import { MessageCircle } from "lucide-react";
import { PageCta } from "@/components/public/PageCta";

interface ServicesCtaProps {
  /** Tautan WhatsApp siap pakai; null bila bisnis tidak punya nomor. */
  whatsappUrl: string | null;
}

/** Ajakan menuju booking di akhir halaman Layanan. */
export function ServicesCta({ whatsappUrl }: ServicesCtaProps) {
  return (
    <PageCta
      titleId="services-cta-title"
      title="Sudah Menemukan Paket Yang Cocok?"
      description="Buat reservasi online sekarang, atau tanyakan dulu kebutuhan anabul Anda."
      primary={{ label: "Booking Sekarang", href: "/booking" }}
      secondary={
        whatsappUrl
          ? {
              label: "Konsultasi Via WhatsApp",
              href: whatsappUrl,
              external: true,
              icon: <MessageCircle className="size-4" aria-hidden="true" />,
            }
          : null
      }
    />
  );
}
