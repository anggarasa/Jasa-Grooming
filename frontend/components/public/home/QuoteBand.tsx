import * as React from "react";
import { PawPrintDecor } from "@/components/public/home/decor";
import { Reveal } from "@/components/public/Reveal";

/**
 * Section C — Banner hijau gelap setelah hero.
 *
 * Kalimat ini adalah teks merek yang playful ("suara si anabul"), BUKAN
 * testimoni pelanggan: tidak diberi nama, bintang, atau atribusi. Pemilik masih
 * perlu mengonfirmasi bahwa kalimat ini copy merek yang disetujui (K-05).
 *
 * Kucing duduk (cutout) di kiri disediakan pemilik pada 26 Okt 2026 (sebelumnya
 * belum ada di paket aset, asset-mapping B-08). Ukuran dan posisinya diukur dari
 * `New Pawcare.png`: tinggi 246px, mulai 123px dari tepi kiri (8,5% dari 1440px),
 * dan ekornya sengaja menjulur 47px ke bawah band seperti di referensi.
 *
 * `overflow-hidden` dipindah ke pembungkus dekorasi saja supaya ekor kucing boleh
 * keluar band; `z-10` pada section menjaga ekor tetap di atas section berikutnya.
 */
export function QuoteBand() {
  return (
    <section
      aria-label="Kata si anabul"
      className="relative z-10 rounded-band bg-forest-deep px-4 py-12 text-center text-white sm:px-6 lg:min-h-[222px] lg:py-[46px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-band"
      >
        <PawPrintDecor className="absolute -left-10 top-[12%] size-44 text-forest-deep-2 sm:size-56 lg:size-64" />
        <PawPrintDecor className="absolute right-[4%] -top-6 hidden size-24 rotate-12 text-forest-deep-2 sm:block lg:size-32" />
        <PawPrintDecor className="absolute -right-10 bottom-[-18%] size-44 -rotate-12 text-forest-deep-2 sm:size-56" />
        <PawPrintDecor className="absolute left-[22%] -bottom-8 hidden size-20 text-forest-deep-2 md:block" />
      </div>

      {/* Hiasan: kutipan di sebelahnya sudah menjelaskan isi bagian ini. */}
      <img
        src="/images/hero/pawcare-kucing-duduk.webp"
        alt=""
        aria-hidden="true"
        width={452}
        height={582}
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -bottom-5 left-2 z-0 h-24 w-auto sm:-bottom-6 sm:left-4 sm:h-[132px] lg:-bottom-10 lg:left-10 lg:h-[120px] wide:-bottom-[47px] wide:left-[8.5%] wide:h-[246px]"
      />

      <Reveal variant="stack" className="relative z-10 mx-auto max-w-[1120px]">
        <p className="text-lg font-light text-on-deep-muted sm:text-[22px]">
          Kata si Anabul
        </p>
        <p className="mt-3 text-[length:clamp(1.375rem,1rem+1.6vw,2.25rem)] font-bold leading-snug text-white">
          “Awalnya takut air. Sekarang malah minta dimandikan.”
        </p>
      </Reveal>
    </section>
  );
}
