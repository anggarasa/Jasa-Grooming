import * as React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, ExternalLink, MessageCircle } from "lucide-react";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";
import { buildWhatsAppUrl } from "@/lib/utils";
import { PawPrintDecor } from "@/components/public/home/decor";
import { Reveal } from "@/components/public/Reveal";

interface PublicFooterProps {
  business: PublicBusinessProfile | null;
  operatingStatus?: PublicOperatingStatus | null;
}

/** Logo putih dari pemilik (docs/redesign/logo pawcare.png), 420×128. */
const LOGO_WHITE = "/images/brand/logo-pawcare-putih.png";

const NAV_LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "/services" },
  { label: "Galeri", href: "/gallery" },
  { label: "Tentang Kami", href: "/about" },
  { label: "Hubungi Kami", href: "/contact" },
  { label: "Reservasi Jadwal", href: "/booking" },
];

/** Kategori marketing yang sama dengan bagian "Layanan Yang Tersedia". */
const SERVICE_LINKS = [
  "Mandi & Kebersihan",
  "Styling & Potong Bulu",
  "Spa & Relaksasi",
  "Perawatan Medicated",
];

const linkClass =
  "rounded-sm text-base text-on-deep-muted transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep";

export function PublicFooter({ business, operatingStatus }: PublicFooterProps) {
  const currentYear = new Date().getFullYear();
  const businessName = business?.name || "PawCare Grooming";
  const businessDesc =
    business?.description ||
    "Layanan perawatan hewan peliharaan profesional, higienis, dan penuh kasih sayang untuk anjing dan kucing kesayangan Anda.";

  const fullAddress =
    business?.fullAddress ||
    [business?.address, business?.city, business?.province, business?.postalCode]
      .filter(Boolean)
      .join(", ") ||
    "Jakarta, Indonesia";

  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya ingin konsultasi mengenai layanan grooming hewan peliharaan.`
  );

  return (
    <footer className="relative isolate overflow-hidden rounded-t-band bg-forest-deep font-brand text-white">
      {/* Dekorasi: jejak kaki besar dan tulisan "PawCare" raksasa (murni hiasan) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
        <PawPrintDecor className="absolute -right-8 -top-8 size-40 rotate-12 text-forest-deep-2 sm:size-56" />
        <PawPrintDecor className="absolute right-[18%] top-[18%] hidden size-16 -rotate-12 text-forest-deep-2 md:block" />
        <span className="absolute inset-x-0 -bottom-[0.28em] block text-center text-[clamp(7rem,24vw,21rem)] font-bold leading-none tracking-tight text-forest-deep-2">
          PawCare
        </span>
      </div>

      <div className="mx-auto w-full max-w-[1304px] px-4 pb-6 pt-14 sm:px-6 lg:px-8 lg:pt-[63px]">
        <Reveal
          variant="stack"
          className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:gap-x-16"
        >
          {/* Kolom 1: merek */}
          <div className="max-w-[420px] space-y-4">
            <img
              src={LOGO_WHITE}
              alt={businessName}
              width={420}
              height={128}
              className="-ml-1 h-12 w-auto"
            />
            <p className="text-base leading-7 text-on-deep-muted">
              {businessDesc}
            </p>
            {waNumber && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="motion-press inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-forest transition-colors hover:bg-pill-status focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>Chat WhatsApp Kami</span>
              </a>
            )}
          </div>

          {/* Kolom 2: navigasi */}
          <div>
            <h2 className="text-lg font-semibold">Navigasi</h2>
            <ul role="list" className="mt-4 space-y-2.5">
              {NAV_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: layanan */}
          <div>
            <h2 className="text-lg font-semibold">Layanan</h2>
            <ul role="list" className="mt-4 space-y-2.5">
              {SERVICE_LINKS.map((label) => (
                <li key={label}>
                  <Link href="/services" className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 4: kontak & jam (menggantikan "Ikuti kami": URL sosial belum ada di data) */}
          <div className="max-w-[300px] space-y-3 text-base text-on-deep-muted">
            <h2 className="text-lg font-semibold text-white">Hubungi Kami</h2>

            <div className="flex items-start gap-2.5 pt-1">
              <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
              <span className="leading-6">{fullAddress}</span>
            </div>

            {business?.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <a
                  href={`tel:${business.phone}`}
                  className="rounded-sm text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {business.phone}
                </a>
              </div>
            )}

            {business?.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${business.email}`}
                  className="rounded-sm hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {business.email}
                </a>
              </div>
            )}

            {operatingStatus?.todayHours && (
              <p className="leading-6">
                Hari ini ({operatingStatus.todayHours.dayName}):{" "}
                <strong className="font-semibold text-white">
                  {operatingStatus.todayHours.isOpen
                    ? `${operatingStatus.todayHours.openTime} - ${operatingStatus.todayHours.closeTime} WIB`
                    : "Libur / Tutup"}
                </strong>
              </p>
            )}

            <div className="flex flex-col items-start gap-1.5 pt-1">
              <Link href="/contact" className={`${linkClass} font-medium text-white`}>
                Lihat jadwal lengkap →
              </Link>
              {business?.googleMapsUrl && (
                <a
                  href={business.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-1.5`}
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Buka di Google Maps
                </a>
              )}
            </div>
          </div>
        </Reveal>

        {/* Baris bawah: hak cipta (tanpa tautan login: halaman login hanya untuk owner/staf) */}
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/15! pt-6 text-sm text-on-deep-muted sm:flex-row sm:items-center lg:mt-[72px]">
          <p>
            &copy; {currentYear} {businessName}. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
