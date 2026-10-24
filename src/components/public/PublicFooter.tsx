import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { PublicBusinessProfile } from "@/modules/public/public-business.service";
import { PublicOperatingStatus } from "@/modules/public/public-hours.service";
import { buildWhatsAppUrl } from "@/lib/utils";

interface PublicFooterProps {
  business: PublicBusinessProfile | null;
  operatingStatus?: PublicOperatingStatus | null;
}

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
    <footer className="border-t border-border bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {business?.logoObjectKey ? (
                <img
                  src={`/api/media/${business.logoObjectKey}`}
                  alt={businessName}
                  className="h-10 w-10 rounded-xl object-cover bg-white p-0.5"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground text-xl shadow-xs">
                  🐾
                </div>
              )}
              <span className="text-xl font-bold tracking-tight text-white">
                {businessName}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              {businessDesc}
            </p>

            {waNumber && (
              <div>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-3.5 py-2 text-xs font-semibold text-whatsapp-foreground shadow-xs transition-colors hover:bg-whatsapp-hover"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Chat WhatsApp Kami</span>
                </a>
              </div>
            )}
          </div>

          {/* Col 2: Tautan Cepat */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white">
              Navigasi Cepat
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300" role="list">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Katalog Layanan
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Galeri Foto
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Kontak &amp; Lokasi
                </Link>
              </li>
              <li>
                <Link
                  href="/booking"
                  className="transition-colors hover:text-white hover:underline font-medium text-accent-subtle"
                >
                  Reservasi Jadwal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Jam Operasional */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Jam Operasional</span>
            </h3>

            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Status Sekarang:</span>
                {operatingStatus?.isOpenNow ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Buka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-xs font-semibold text-slate-300 border border-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Tutup
                  </span>
                )}
              </div>

              {operatingStatus?.todayHours ? (
                <p className="text-xs text-slate-400">
                  Hari Ini ({operatingStatus.todayHours.dayName}):{" "}
                  <strong className="text-white">
                    {operatingStatus.todayHours.isOpen
                      ? `${operatingStatus.todayHours.openTime} - ${operatingStatus.todayHours.closeTime} WIB`
                      : "Libur / Tutup"}
                  </strong>
                </p>
              ) : null}

              <p className="text-xs leading-relaxed text-slate-400">
                Reservasi online disarankan minimal beberapa jam sebelum kedatangan agar slot grooming terjamin.
              </p>

              <Link
                href="/contact"
                className="inline-block text-xs text-accent-subtle hover:underline pt-1"
              >
                Lihat Jadwal Lengkap Mingguan &rarr;
              </Link>
            </div>
          </div>

          {/* Col 4: Informasi Kontak & Alamat */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white">
              Hubungi Kami
            </h3>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-xs leading-relaxed">{fullAddress}</span>
              </div>

              {business?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                  <a
                    href={`tel:${business.phone}`}
                    className="text-xs hover:text-white hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>
              )}

              {business?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${business.email}`}
                    className="text-xs hover:text-white hover:underline"
                  >
                    {business.email}
                  </a>
                </div>
              )}

              {business?.googleMapsUrl && (
                <div className="pt-1">
                  <a
                    href={business.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent-subtle hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Buka di Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Admin Link */}
        <div className="mt-12 border-t border-slate-700/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {currentYear} {businessName}. Seluruh hak cipta dilindungi.
          </p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Sistem Booking Terpercaya
            </span>
            <span className="text-slate-600">|</span>
            <Link
              href="/login"
              className="text-slate-400 hover:text-slate-200 hover:underline transition-colors"
            >
              Area Staf / Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
