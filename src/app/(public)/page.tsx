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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    `Halo ${businessName}, saya tertarik untuk memesan layanan grooming untuk hewan peliharaan saya.`
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

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 via-background to-background py-16 sm:py-24 lg:py-32 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge Highlight */}
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-subtle px-3.5 py-1 text-xs font-semibold text-accent shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span>Salon &amp; Spa Grooming Terbaik di {city}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
                Perawatan Terbaik untuk{" "}
                <span className="text-primary underline decoration-accent decoration-wavy decoration-from-font">
                  Sahabat Berbulu
                </span>{" "}
                Anda
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Manjakan anjing dan kucing kesayangan dengan perawatan higienis, produk organik aman, dan sentuhan penuh kasih dari groomer tersertifikasi di {businessName}.
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  asChild
                  variant="accent"
                  size="lg"
                  className="font-bold text-base shadow-md w-full sm:w-auto h-12 px-7"
                >
                  <Link href="/booking">
                    <Sparkles className="h-5 w-5 mr-2 text-white" aria-hidden="true" />
                    Booking Sekarang
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="font-semibold text-base w-full sm:w-auto h-12 px-6"
                >
                  <Link href="/services">
                    Jelajahi Layanan
                    <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              {/* Highlights Pill Row */}
              <div className="pt-6 border-t border-border/80 grid grid-cols-3 gap-2 sm:gap-4 text-center lg:text-left">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold text-primary block">
                    100% Aman
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Sampo hypoallergenic
                  </span>
                </div>
                <div className="space-y-0.5 border-x border-border/80 px-2">
                  <span className="text-xs sm:text-sm font-bold text-primary block">
                    Sterilisasi UV
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Alat higienis medis
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold text-primary block">
                    Bebas Cemas
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Groomer bersertifikat
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-accent text-2xl shadow-xs">
                      🐾
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">
                        {businessName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {operatingStatus.isOpenNow ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Buka Sekarang
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {operatingStatus.statusText}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                    {operatingStatus.timezone}
                  </span>
                </div>

                {/* Operating hours snippet */}
                {operatingStatus.todayHours && (
                  <div className="rounded-xl bg-muted/50 p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>Jadwal Hari Ini ({operatingStatus.todayHours.dayName}):</span>
                      <span className="text-primary">
                        {operatingStatus.todayHours.isOpen
                          ? `${operatingStatus.todayHours.openTime} - ${operatingStatus.todayHours.closeTime}`
                          : "Tutup"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {business?.fullAddress || business?.address || "Jakarta, Indonesia"}
                    </p>
                  </div>
                )}

                {/* Quick CTA to WhatsApp */}
                <div className="space-y-2 pt-1">
                  <Button
                    asChild
                    className="w-full bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-bold shadow-xs h-11"
                  >
                    <a href={waUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                      Tanya Jadwal via WhatsApp
                    </a>
                  </Button>

                  <p className="text-center text-[11px] text-muted-foreground">
                    Respons cepat di jam operasional toko
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY CHOOSE US (4 PILARS) */}
      <section className="py-16 sm:py-20 bg-background border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Keunggulan PawCare
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Mengapa Mempercayakan Perawatan kepada Kami?
            </h2>
            <p className="text-sm text-muted-foreground">
              Standar kebersihan tinggi, kenyamanan anabul, dan ketenangan pemilik adalah prioritas mutlak kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs hover:border-accent/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Award className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1.5">
                Groomer Tersertifikasi
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Groomer berpengalaman yang terlatih menghadapi beragam karakter hewan dengan sabar dan lembut tanpa paksaan.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs hover:border-accent/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-subtle text-accent mb-4">
                <ShieldCheck className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1.5">
                Fasilitas Higienis &amp; UV Steril
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Peralatan gunting, pisau clipper, dan meja disterilisasi UV setiap pergantian sesi untuk mencegah penularan penyakit.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs hover:border-accent/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary mb-4">
                <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1.5">
                Produk Aman &amp; Ramah Alergi
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Hanya menggunakan sampo organik bersertifikat dengan pH seimbang yang aman bagi kulit sensitif anjing dan kucing.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs hover:border-accent/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground mb-4">
                <HeartHandshake className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1.5">
                Konfirmasi &amp; Antrean Teratur
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Jadwal reservasi tertata rapi sehingga Anda dan hewan kesayangan tidak perlu menunggu lama dalam antrean padat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED SERVICES (3-6 ITEMS) */}
      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Katalog Pilihan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Layanan Grooming Unggulan
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Paket perawatan komprehensif mulai dari mandi sanitasi higienis hingga paket spa mewah untuk kesegaran optimal.
              </p>
            </div>

            <Button asChild variant="outline" className="shrink-0 font-semibold">
              <Link href="/services">
                Lihat Semua Layanan ({services.length})
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
              <p className="text-sm text-muted-foreground">
                Daftar layanan sedang diperbarui oleh pihak manajemen.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. HOW BOOKING WORKS */}
      <section className="py-16 sm:py-20 bg-background border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Alur Reservasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              4 Langkah Mudah Manjakan Anabul
            </h2>
            <p className="text-sm text-muted-foreground">
              Proses pemesanan transparan dan cepat tanpa prosedur rumit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">
                Pilih Layanan
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tentukan paket grooming yang tepat sesuai kebutuhan ras, ukuran, dan bulu anabul.
              </p>
            </div>

            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">
                Tentukan Jadwal
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Pilih hari dan perkiraan jam kedatangan yang paling pas dengan rutinitas Anda.
              </p>
            </div>

            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">
                Konfirmasi Cepat
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Admin mengonfirmasi ketersediaan slot melalui WhatsApp resmi dalam hitungan menit.
              </p>
            </div>

            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm mb-4">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">
                Antar &amp; Rileks
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Antar peliharaan ke salon kami, dan bawa pulang sahabat berbulu yang wangi dan segar!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GALLERY PREVIEW */}
      {galleryItems.length > 0 && (
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Dokumentasi &amp; Fasilitas
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Suasana Salon &amp; Hasil Perawatan
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Lihat kebahagiaan anabul setelah dimanjakan dan kebersihan fasilitas salon kami.
                </p>
              </div>

              <Button asChild variant="outline" className="shrink-0 font-semibold">
                <Link href="/gallery">
                  Lihat Semua Galeri
                  <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <GalleryGrid items={galleryItems} />
          </div>
        </section>
      )}

      {/* 6. OPERATING HOURS & LOCATION INFO */}
      <section className="py-16 sm:py-24 bg-background border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col: Shop Address & Map */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Lokasi &amp; Kontak
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Kunjungi Gerai Kami
                </h2>
                <p className="text-sm text-muted-foreground">
                  Lokasi strategis dengan tempat parkir yang aman dan ruang tunggu ber-AC yang nyaman.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Alamat Lengkap
                    </h4>
                    <p className="text-sm font-semibold text-foreground mt-0.5 leading-relaxed">
                      {business?.fullAddress || business?.address || "Jakarta, Indonesia"}
                    </p>
                    {business?.googleMapsUrl && (
                      <a
                        href={business.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium mt-2"
                      >
                        Buka Petunjuk Arah di Google Maps &rarr;
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Hotline WhatsApp:</span>
                  <span className="font-bold text-foreground">
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

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-accent-subtle backdrop-blur-xs">
            🐾 Anabul Bersih, Sehat, dan Ceria
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Siap Manjakan Hewan Kesayangan Anda Hari Ini?
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Dapatkan pengalaman grooming berkualitas tanpa stres bagi sahabat berbulu Anda. Pesan jadwal sekarang atau konsultasikan kebutuhan spesifik anabul dengan tim kami.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              variant="accent"
              className="font-bold text-base shadow-lg h-12 px-8 w-full sm:w-auto"
            >
              <Link href="/booking">
                <Sparkles className="h-5 w-5 mr-2 text-white" aria-hidden="true" />
                Booking Jadwal Sekarang
              </Link>
            </Button>

            {waNumber && (
              <Button
                asChild
                size="lg"
                className="bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-bold h-12 px-7 w-full sm:w-auto shadow-md"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                  Chat via WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
