import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Heart,
  ShieldCheck,
  Award,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { getPublicGallery } from "@/modules/public/public-gallery.service";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import {
  constructMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: `Tentang Kami - Profil & Nilai ${businessName}`,
    description: `Pelajari komitmen, standar kebersihan, dan dedikasi tim groomer profesional ${businessName} dalam merawat sahabat berbulu Anda.`,
    path: "/about",
    businessName,
  });
}

export default async function AboutPage() {
  const [business, galleryItems] = await Promise.all([
    getPublicBusinessProfile(),
    getPublicGallery(4),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Tentang Kami", url: `${baseUrl}/about` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      {/* Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent">
              <Heart className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dedikasi Penuh Kasih untuk Anabul</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
              Merawat Setiap Hewan Seperti Keluarga Sendiri
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {business?.description ||
                "PawCare Grooming lahir dari kecintaan tulus terhadap hewan peliharaan, menghadirkan tempat perawatan higienis, aman, dan menenangkan tanpa stres bagi anjing dan kucing."}
            </p>
          </div>
        </div>
      </div>

      {/* Core Brand Values */}
      <section className="py-16 sm:py-24 bg-background border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Filosofi &amp; Standar Kerja
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              4 Komitmen Utama {businessName}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                <Heart className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Perlakuan Sabar &amp; Tanpa Kekerasan
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Kami tidak pernah menggunakan obat penenang atau paksaan kasar. Pendekatan santai dan positif digunakan agar setiap anabul merasa aman dan tidak trauma selama proses grooming.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                <ShieldCheck className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Protokol Higienis Ketat &amp; UV Steril
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ruangan, bak mandi, dan meja grooming dibersihkan dengan disinfektan ramah hewan secara teratur. Seluruh mata pisau dan gunting disterilkan dengan sinar UV medis setiap pergantian pasien.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Produk Alami Bersertifikasi
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Kami mengutamakan kesehatan jangka panjang bulu dan kulit hewan. Hanya sampo organik tanpa paraben dan pewangi buatan berbahaya yang digunakan di salon kami.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                <Award className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Tenaga Ahli Groomer Terakreditasi
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tim groomer kami menguasai anatomi, teknik gunting standar kompetisi ras, serta memiliki ketajaman mendeteksi indikasi awal masalah kulit dan telinga pada hewan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Gallery Showcase */}
      {galleryItems.length > 0 && (
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Fasilitas Kami
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Sekilas Suasana Salon &amp; Ruang Tunggu
                </h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/gallery">
                  Buka Galeri Lengkap &rarr;
                </Link>
              </Button>
            </div>

            <GalleryGrid items={galleryItems} />
          </div>
        </section>
      )}

      {/* Final Action */}
      <section className="py-16 sm:py-20 bg-background text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Ingin Konsultasi Perawatan untuk Anabul Anda?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tim kami siap menyambut dan memberikan rekomendasi perawatan terbaik sesuai usia, ras, dan kondisi bulu peliharaan Anda.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="accent" size="lg" className="font-bold shadow-xs">
              <Link href="/booking">
                Booking Jadwal Sekarang
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                Hubungi Kontak &amp; Lokasi
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
