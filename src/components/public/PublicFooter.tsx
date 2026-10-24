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
import { BrandLogo } from "@/components/common/BrandLogo";

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
    <footer className="border-t border-[#E2E6DF] bg-[#F9FAF8] text-slate-800">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div>
              {business?.logoObjectKey ? (
                <div className="flex items-center gap-3">
                  <img
                    src={`/api/media/${business.logoObjectKey}`}
                    alt={businessName}
                    className="h-10 w-10 rounded-full object-cover border border-[#E2E6DF] shadow-2xs"
                  />
                  <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight text-black uppercase">
                      {businessName}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-[#2D4233] uppercase">
                      Studio &amp; Spa Grooming
                    </span>
                  </div>
                </div>
              ) : (
                <BrandLogo theme="default" size="md" businessName={businessName} subtitle="STUDIO & SPA" />
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {businessDesc}
            </p>

            {waNumber && (
              <div className="pt-1">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-black hover:scale-[1.02]"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span>Chat WhatsApp Kami</span>
                </a>
              </div>
            )}
          </div>

          {/* Col 2: Tautan Cepat */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest uppercase text-black">
              Navigasi Cepat
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-slate-600" role="list">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Katalog Layanan
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Galeri Foto
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Kontak &amp; Lokasi
                </Link>
              </li>
              <li>
                <Link
                  href="/booking"
                  className="font-bold text-black hover:underline"
                >
                  Reservasi Jadwal &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Jam Operasional */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest uppercase text-black flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2D4233]" aria-hidden="true" />
              <span>Jam Operasional</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-500">Status Sekarang:</span>
                {operatingStatus?.isOpenNow ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Buka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Tutup
                  </span>
                )}
              </div>

              {operatingStatus?.todayHours ? (
                <p className="text-xs text-slate-700">
                  Hari Ini ({operatingStatus.todayHours.dayName}):{" "}
                  <strong className="text-black font-bold">
                    {operatingStatus.todayHours.isOpen
                      ? `${operatingStatus.todayHours.openTime} - ${operatingStatus.todayHours.closeTime} WIB`
                      : "Libur / Tutup"}
                  </strong>
                </p>
              ) : null}

              <p className="text-xs leading-relaxed text-slate-500">
                Reservasi online disarankan minimal beberapa jam sebelum kedatangan agar slot grooming terjamin.
              </p>

              <Link
                href="/contact"
                className="inline-block text-xs font-bold text-black hover:underline pt-1"
              >
                Lihat Jadwal Lengkap Mingguan &rarr;
              </Link>
            </div>
          </div>

          {/* Col 4: Informasi Kontak & Alamat */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest uppercase text-black">
              Hubungi Kami
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#2D4233] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{fullAddress}</span>
              </div>

              {business?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-[#2D4233] shrink-0" aria-hidden="true" />
                  <a
                    href={`tel:${business.phone}`}
                    className="font-bold text-black hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>
              )}

              {business?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-[#2D4233] shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${business.email}`}
                    className="text-slate-700 hover:text-black hover:underline"
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D4233] hover:underline"
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
        <div className="mt-12 border-t border-[#E2E6DF] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {currentYear} {businessName}. Seluruh hak cipta dilindungi.
          </p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              Sistem Booking Terpercaya
            </span>
            <span className="text-slate-300">|</span>
            <Link
              href="/login"
              className="text-slate-500 hover:text-black hover:underline transition-colors font-medium"
            >
              Area Staf / Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
