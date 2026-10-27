import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Clock, Sparkles } from "lucide-react";
import type { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";
import { BoneDecor, HeartDecor, PawPrintDecor } from "@/components/public/home/decor";

interface HomeHeroProps {
  businessName: string;
  operatingStatus: PublicOperatingStatus;
}

/**
 * Section B — Hero. Teks kiri, foto husky + kucing besar di kanan yang sedikit
 * melewati tepi bawah hero ke banner kutipan (sesuai referensi).
 *
 * Dua kartu melayang berisi FAKTA yang dapat diverifikasi dari aplikasi
 * (booking online dan jam buka dari database), bukan klaim "+1000 Orang" atau
 * "100% Higienis & UV" dari gambar referensi (K-05 belum dikonfirmasi pemilik).
 */
export function HomeHero({ businessName, operatingStatus }: HomeHeroProps) {
  const today = operatingStatus.todayHours;
  const openToday = Boolean(today?.isOpen);

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative bg-canvas"
    >
      {/* Dekorasi samar: dipotong di dalam hero, tidak menutupi konten */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <PawPrintDecor className="motion-drift absolute left-[51%] top-[24%] hidden size-10 text-forest/[0.07] lg:block" />
        <PawPrintDecor className="motion-drift absolute right-[3%] top-[3%] size-11 rotate-12 text-forest/[0.07] [--drift-duration:12s]" />
        <PawPrintDecor className="motion-drift absolute left-[51%] bottom-[7%] hidden size-8 -rotate-12 text-forest/[0.07] [--drift-duration:11s] lg:block" />
        <HeartDecor className="motion-enter absolute left-[44%] top-[43%] hidden size-7 text-[#EAD7C6] [--enter-delay:760ms] [--enter-distance:6px] lg:block" />
        <BoneDecor className="motion-enter absolute right-[13%] top-[20%] hidden w-12 rotate-[28deg] text-[#EAD7C6] [--enter-delay:840ms] [--enter-distance:6px] lg:block" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1304px] grid-cols-1 px-4 sm:px-6 lg:min-h-[591px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:px-8">
        {/* Teks */}
        <div className="flex flex-col justify-center py-10 sm:py-14 lg:py-12 lg:pr-6">
          <h1
            id="home-hero-title"
            className="text-[1.75rem] font-bold leading-[1.33] tracking-tight text-forest sm:text-[2rem] md:text-[2.25rem] xl:text-[2.8rem]"
          >
            <span className="motion-enter block">Lebih Bersih. Lebih Wangi.</span>{" "}
            <span className="motion-enter block [--enter-delay:90ms]">Lebih Disayang.</span>
          </h1>

          <p className="motion-enter mt-6 max-w-[540px] text-base leading-7 text-ink-body [--enter-delay:190ms] sm:text-lg">
            Perawatan anabul kesayangan dengan grooming penuh perhatian, agar
            selalu bersih, nyaman, dan tampil lebih segar. Kami hadir untuk
            memberikan pengalaman terbaik bagi setiap anabul.
          </p>

          <div className="motion-enter mt-7 flex flex-col gap-3 [--enter-delay:280ms] sm:flex-row sm:flex-wrap">
            <Link
              href="/booking"
              className="motion-press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <span>Booking Sekarang</span>
              <Sparkles className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/services"
              className="motion-press inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-forest ring-1 ring-inset ring-forest transition-colors hover:bg-canvas-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <span>Lihat Layanan</span>
              <ArrowUpRight className="motion-nudge-ne size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Foto + kartu melayang */}
        <div className="relative flex items-end justify-center pb-0 lg:min-h-[420px] lg:justify-end">
          <div className="relative -mb-5 flex w-full max-w-[460px] flex-col sm:max-w-[560px] lg:block lg:max-w-[640px] xl:-mr-[clamp(0px,calc((100vw-1240px)/2-20px),78px)] xl:w-[640px] xl:max-w-none">
            {/* Kartu: sebaris di atas foto pada layar kecil; melayang di atas foto pada desktop */}
            <div className="mb-4 flex gap-3 lg:mb-0 lg:contents">
              <div className="motion-enter flex flex-1 items-center gap-3 rounded-float bg-white px-3 py-2.5 shadow-float [--enter-delay:520ms] [--enter-distance:10px] lg:absolute lg:-left-[11%] lg:top-[9%] lg:z-20 lg:flex-none">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pill-status text-forest">
                  <CalendarCheck className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-tight">
                  <span className="block font-semibold text-ink">Booking Online</span>
                  <span className="block text-xs text-ink-muted sm:text-[13px]">
                    Pilih jadwal yang tersedia
                  </span>
                </p>
              </div>

              <div className="motion-enter flex flex-1 items-center gap-3 rounded-float bg-white px-3 py-2.5 shadow-float [--enter-delay:600ms] [--enter-distance:10px] lg:absolute lg:right-[2%] lg:top-[52%] lg:z-20 lg:flex-none">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pill-status text-forest">
                  <Clock className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-tight">
                  <span className="block font-semibold text-ink">
                    {openToday ? "Buka Hari Ini" : operatingStatus.statusText}
                  </span>
                  {openToday && today && (
                    <span className="block text-xs text-ink-muted sm:text-[13px]">
                      {today.openTime} – {today.closeTime} · {businessName}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <img
              src="/images/hero/pawcare-hero-husky-cat.webp"
              alt="Anjing husky dan kucing abu-abu bergaris beristirahat bersama"
              width={1400}
              height={1183}
              fetchPriority="high"
              decoding="async"
              className="motion-enter-photo relative z-10 block h-auto w-full [--enter-delay:120ms]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
