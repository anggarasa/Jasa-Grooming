import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  HeartHandshake,
  CheckCircle2,
  MessageCircle,
  MapPin,
  Search,
  Star,
  Scissors,
  Bath,
  Droplets,
} from "lucide-react";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { getPublicOperatingHours } from "@/modules/public/public-hours.service";
import { getPublicServices } from "@/modules/public/public-services.service";
import { getPublicGallery } from "@/modules/public/public-gallery.service";
import { ServiceCard } from "@/components/public/ServiceCard";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { OperatingHoursTable } from "@/components/public/OperatingHoursTable";
import {
  constructMetadata,
  buildLocalBusinessJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/utils";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  return constructMetadata({
    title: "Perawatan Terbaik untuk Sahabat Berbulu Anda",
    description:
      business?.description ||
      "Layanan pet grooming profesional, higienis, dan terpercaya dengan groomer tersertifikasi untuk anjing dan kucing kesayangan Anda.",
    path: "/",
    businessName: business?.name || "PawCare Grooming",
  });
}

export default async function HomePage() {
  const [business, operatingStatus, services, galleryItems] = await Promise.all([
    getPublicBusinessProfile(),
    getPublicOperatingHours(),
    getPublicServices(),
    getPublicGallery(6),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const city = business?.city || "Jakarta";
  const featuredServices = services.slice(0, 6);
  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya tertarik untuk memesan layanan grooming untuk anabul kesayangan saya.`
  );

  const localBusinessJsonLd = buildLocalBusinessJsonLd(
    business,
    operatingStatus.schedule
  );

  return (
    <>
      {/* Schema.org LocalBusiness Structured Data */}
      {localBusinessJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(localBusinessJsonLd),
          }}
        />
      )}

      {/* 1. HERO SECTION (SCANDINAVIAN BOUTIQUE - MINERAL SAGE) */}
      <section className="relative overflow-hidden bg-[#B4C4B9] pt-10 pb-16 sm:py-20 lg:py-24 border-b border-[#A2B5A8]/50 text-black">
        {/* Subtle decorative background circle */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge Highlight */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-xs px-4 py-1.5 text-xs font-bold text-black shadow-2xs border border-white">
                <Sparkles className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
                <span>STUDIO &amp; SPA GROOMING TERBAIK DI {city.toUpperCase()}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.12] uppercase">
                SEMUA UNTUK ANABUL KESAYANGAN:{" "}
                <span className="block text-white font-extrabold mt-1">
                  Perawatan Terbaik untuk Sahabat Berbulu Anda
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-black/80 max-w-xl font-medium leading-relaxed">
                Manjakan anjing dan kucing kesayangan dengan perawatan higienis, produk organik hypoallergenic, dan sentuhan penuh kasih dari groomer tersertifikasi di {businessName}.
              </p>

              {/* Search Capsule Bar */}
              <div className="pt-2">
                <form
                  action="/services"
                  method="GET"
                  className="flex items-center rounded-full bg-white p-1.5 pl-5 shadow-md border border-white/80 max-w-xl transition-all focus-within:ring-2 focus-within:ring-black"
                >
                  <Search className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Cari perawatan anabul (mandi, potong, kutu, spa)..."
                    className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-black placeholder:text-slate-400 focus:outline-none"
                    aria-label="Cari layanan perawatan anabul"
                  />
                  <button
                    type="submit"
                    className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black text-white hover:bg-neutral-800 transition-all shrink-0 active:scale-95"
                    aria-label="Cari"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              </div>

              {/* Quick Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-black/70 uppercase tracking-wider mr-1">
                  Pilihan Cepat:
                </span>
                <Link
                  href="/services"
                  className="rounded-full bg-black text-white px-3.5 py-1.5 text-xs font-bold transition-transform hover:scale-105"
                >
                  Semua Layanan
                </Link>
                <Link
                  href="/services"
                  className="rounded-full bg-white/70 hover:bg-white text-black px-3.5 py-1.5 text-xs font-semibold transition-all border border-white/60"
                >
                  Mandi Sanitasi
                </Link>
                <Link
                  href="/services"
                  className="rounded-full bg-white/70 hover:bg-white text-black px-3.5 py-1.5 text-xs font-semibold transition-all border border-white/60"
                >
                  Cukur &amp; Styling
                </Link>
                <Link
                  href="/services"
                  className="rounded-full bg-white/70 hover:bg-white text-black px-3.5 py-1.5 text-xs font-semibold transition-all border border-white/60"
                >
                  Spa &amp; Relaksasi
                </Link>
              </div>

              {/* Social Proof Trust Stack & CTA Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111827] hover:bg-black text-white px-7 py-3.5 text-sm font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span>Booking Sekarang</span>
                </Link>

                {/* Social Proof Stack */}
                <div className="flex items-center gap-3 bg-white/40 backdrop-blur-xs px-4 py-2 rounded-full border border-white/50">
                  <div className="flex -space-x-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 border-2 border-white shadow-2xs">
                      🐾
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 border-2 border-white shadow-2xs">
                      🐱
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-800 border-2 border-white shadow-2xs">
                      🐶
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-black block tracking-tight">
                      10.000+ Pelanggan Bahagia
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card / Visual Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Visual Image Container with rounded-[32px] */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[32px] border-4 border-white shadow-2xl bg-neutral-900 group">
                  {/* Real Pet Photo Visual */}
                  <img
                    src="/images/hero/hero-pet.webp"
                    alt={`Foto anabul ceria dan sehat di ${businessName}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                  {/* Brand Tag Top Left */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-black shadow-sm">
                    <span>🐾</span>
                    <span>{businessName}</span>
                  </div>

                  {/* Circular Quality Seal (Top Right) */}
                  <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-black text-white p-2 text-center flex flex-col items-center justify-center shadow-lg border-2 border-white/80">
                    <span className="text-[8px] font-black tracking-widest uppercase">100%</span>
                    <span className="text-[7px] font-extrabold uppercase leading-tight">HIGIENIS &amp; UV</span>
                  </div>

                  {/* Floating Guarantee Card (Bottom) */}
                  <div className="absolute bottom-4 inset-x-4 rounded-[22px] bg-white/95 backdrop-blur-md p-4 shadow-xl border border-white">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                        <span className="text-xs font-bold text-black">100% Sampo Organik &amp; Hypoallergenic</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                        <span className="text-xs font-bold text-black">Groomer Tersertifikasi &amp; Ramah Anabul</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                        <span className="text-xs font-bold text-black">Garansi Perawatan Lembut Bebas Stres</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED SERVICES (LAYANAN TERPOPULER) */}
      <section className="py-16 sm:py-24 bg-[#F5F6F3] border-b border-[#E2E6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#2D4233] bg-[#E2EAE1] px-3 py-1 rounded-full border border-[#D0DDD0]">
                KATALOG PILIHAN
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
                LAYANAN TERPOPULER
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Paket perawatan komprehensif mulai dari mandi sanitasi higienis hingga paket spa mewah untuk kesegaran optimal.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-extrabold text-black shadow-2xs hover:bg-slate-50 transition-all"
              >
                <span>Lihat Semua Layanan ({services.length})</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-[#D5DDD3] p-12 text-center bg-white">
              <p className="text-sm text-slate-500">
                Daftar layanan sedang diperbarui oleh pihak manajemen.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. KATEGORI PERAWATAN (PHOTO CARDS WITH FLOATING BADGES) */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E2E6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#2D4233] bg-[#E2EAE1] px-3.5 py-1 rounded-full border border-[#D0DDD0]">
              SPESIALISASI PERAWATAN
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
              KATEGORI PERAWATAN ANABUL
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pilih spesifikasi perawatan yang tepat sesuai kebutuhan ras, bulu, dan kenyamanan sahabat setia Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="group relative overflow-hidden rounded-[26px] border border-[#E2E6DF] bg-[#F7F8F6] p-6 shadow-xs hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white mb-5">
                <Bath className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-black mb-2">Mandi &amp; Sanitasi</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Pembersihan mendalam kotoran bulu, telinga, potong kuku, dan ekspresi kelenjar anal higienis.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center text-xs font-extrabold text-black hover:underline"
              >
                <span>Lihat Layanan</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="group relative overflow-hidden rounded-[26px] border border-[#E2E6DF] bg-[#F7F8F6] p-6 shadow-xs hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white mb-5">
                <Scissors className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-black mb-2">Styling &amp; Cukur Rapi</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Potong bulu sesuai standar breed atau model lucu (teddy bear, puppy cut, summer shave).
              </p>
              <Link
                href="/services"
                className="inline-flex items-center text-xs font-extrabold text-black hover:underline"
              >
                <span>Lihat Layanan</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="group relative overflow-hidden rounded-[26px] border border-[#E2E6DF] bg-[#F7F8F6] p-6 shadow-xs hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white mb-5">
                <Droplets className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-black mb-2">Spa &amp; Relaksasi</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Terapi microbubble jacuzzi, detoksifikasi kulit, aromaterapi, dan pijat relaksasi anti-stres.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center text-xs font-extrabold text-black hover:underline"
              >
                <span>Lihat Layanan</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="group relative overflow-hidden rounded-[26px] border border-[#E2E6DF] bg-[#F7F8F6] p-6 shadow-xs hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white mb-5">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-black mb-2">Kutu &amp; Jamur Medicated</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Pengobatan khusus dengan sampo medikasi dokter hewan untuk membasmi kutu dan jamur membandel.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center text-xs font-extrabold text-black hover:underline"
              >
                <span>Lihat Layanan</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US (4 PILARS) */}
      <section className="py-16 sm:py-24 bg-[#F5F6F3] border-b border-[#E2E6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#2D4233] bg-[#E2EAE1] px-3.5 py-1 rounded-full border border-[#D0DDD0]">
              KEUNGGULAN PAWCARE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
              MENGAPA MEMPERCAYAKAN PERAWATAN KEPADA KAMI?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Standar kebersihan tinggi, kenyamanan anabul, dan ketenangan pemilik adalah prioritas mutlak kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-[26px] border border-[#E2E6DF] bg-white p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2EAE1] text-[#2D4233] mb-4">
                <Award className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-black text-base text-black mb-2">
                Groomer Tersertifikasi
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Groomer berpengalaman yang terlatih menghadapi beragam karakter hewan dengan sabar dan lembut tanpa paksaan.
              </p>
            </div>

            <div className="rounded-[26px] border border-[#E2E6DF] bg-white p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2EAE1] text-[#2D4233] mb-4">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-black text-base text-black mb-2">
                Fasilitas Higienis &amp; UV Steril
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Peralatan gunting, pisau clipper, dan meja disterilisasi UV setiap pergantian sesi untuk mencegah penularan penyakit.
              </p>
            </div>

            <div className="rounded-[26px] border border-[#E2E6DF] bg-white p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2EAE1] text-[#2D4233] mb-4">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-black text-base text-black mb-2">
                Produk Aman &amp; Ramah Alergi
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Hanya menggunakan sampo organik bersertifikat dengan pH seimbang yang aman bagi kulit sensitif anjing dan kucing.
              </p>
            </div>

            <div className="rounded-[26px] border border-[#E2E6DF] bg-white p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2EAE1] text-[#2D4233] mb-4">
                <HeartHandshake className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-black text-base text-black mb-2">
                Konfirmasi &amp; Antrean Teratur
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Jadwal reservasi tertata rapi sehingga Anda dan hewan kesayangan tidak perlu menunggu lama dalam antrean padat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROMO & NEWSLETTER CAPSULE BANNER */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-[#E8EDE7] p-8 sm:p-12 border border-[#D5DDD3] shadow-xs flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center lg:text-left max-w-xl">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#2D4233]">
                PENASEHAT ANABUL
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                Konsultasikan Perawatan Terbaik untuk Anabul Anda
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Belum yakin paket grooming mana yang cocok? Tanya langsung pada groomer kami secara gratis via WhatsApp resmi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <Link
                href="/booking"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-black text-white px-7 py-3.5 text-xs font-black shadow-sm hover:bg-neutral-800 transition-all"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Reservasi Sekarang</span>
              </Link>
              {waNumber && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-black/30 bg-white text-black px-6 py-3.5 text-xs font-bold shadow-2xs hover:bg-slate-50 transition-all"
                >
                  <MessageCircle className="h-4 w-4 text-[#15803D]" />
                  <span>Konsultasi WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. GALLERY PREVIEW */}
      {galleryItems.length > 0 && (
        <section className="py-16 sm:py-24 bg-[#F5F6F3] border-b border-[#E2E6DF]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div className="space-y-2">
                <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#2D4233] bg-[#E2EAE1] px-3.5 py-1 rounded-full border border-[#D0DDD0]">
                  DOKUMENTASI &amp; FASILITAS
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                  Suasana Salon &amp; Hasil Perawatan
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                  Lihat kebahagiaan anabul setelah dimanjakan dan kebersihan fasilitas salon kami.
                </p>
              </div>

              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-slate-50 transition-all"
              >
                <span>Lihat Semua Galeri</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <GalleryGrid items={galleryItems} />
          </div>
        </section>
      )}

      {/* 7. OPERATING HOURS & LOCATION INFO */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E2E6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col: Shop Address & Map */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#2D4233] bg-[#E2EAE1] px-3.5 py-1 rounded-full border border-[#D0DDD0]">
                  LOKASI &amp; KONTAK
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
                  Kunjungi Gerai Kami
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Lokasi strategis dengan tempat parkir yang aman dan ruang tunggu ber-AC yang nyaman untuk kenyamanan Anda.
                </p>
              </div>

              <div className="rounded-[26px] border border-[#E2E6DF] bg-[#F7F8F6] p-6 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#2D4233] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Alamat Lengkap
                    </h4>
                    <p className="text-sm font-bold text-black mt-0.5 leading-relaxed">
                      {business?.fullAddress || business?.address || "Jakarta, Indonesia"}
                    </p>
                    {business?.googleMapsUrl && (
                      <a
                        href={business.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#2D4233] font-bold hover:underline mt-2"
                      >
                        Buka Petunjuk Arah di Google Maps &rarr;
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E6DF] flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Hotline WhatsApp:</span>
                  <span className="font-extrabold text-black">
                    {business?.whatsapp || business?.phone || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Weekly Schedule Table */}
            <div className="lg:col-span-7">
              <OperatingHoursTable
                schedule={operatingStatus.schedule}
                todayDayOfWeek={operatingStatus.todayHours?.dayOfWeek}
                isOpenNow={operatingStatus.isOpenNow}
                statusText={operatingStatus.statusText}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION (MINERAL SAGE & SOLID BLACK PILL) */}
      <section className="py-16 sm:py-24 bg-[#B4C4B9] text-black relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xs px-4 py-1.5 text-xs font-bold text-black">
            🐾 Anabul Bersih, Sehat, dan Ceria
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-black uppercase">
            Siap Manjakan Hewan Kesayangan Anda Hari Ini?
          </h2>

          <p className="text-sm sm:text-base text-black/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Dapatkan pengalaman grooming berkualitas tanpa stres bagi sahabat berbulu Anda. Pesan jadwal sekarang atau konsultasikan kebutuhan spesifik anabul dengan tim kami.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black hover:bg-neutral-800 text-white font-extrabold text-sm px-8 py-3.5 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>Booking Jadwal Sekarang</span>
            </Link>

            {waNumber && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-slate-50 text-black font-bold text-sm px-7 py-3.5 border border-white shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
              >
                <MessageCircle className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                <span>Chat via WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
