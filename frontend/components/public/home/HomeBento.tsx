import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Bath, PawPrint, Scissors, Stethoscope } from "lucide-react";
import { SectionChip } from "@/components/public/home/SectionChip";
import { Reveal } from "@/components/public/Reveal";
import { PawPrintDecor } from "@/components/public/home/decor";

/**
 * Section F — Ringkasan kategori layanan: foto besar di kiri, empat kartu
 * kategori (2×2) di kanan. Semua kartu menuju /services (satu-satunya route
 * katalog; kategori marketing ini tidak sama 1:1 dengan kategori database,
 * K-15). Foto bento memakai pengganti sementara dari paket aset (A-05); foto
 * asli referensi (kucing + anak anjing di rumput) belum tersedia.
 *
 * Keempat kartu BERTAMPILAN SAMA (putih) saat diam, dan menyala hijau saat
 * di-hover. Kartu hijau pada gambar referensi menggambarkan keadaan hover,
 * bukan tampilan bawaan kartu pertama (dikonfirmasi pemilik, 26 Okt 2026).
 */
const CATEGORIES = [
  {
    title: "Mandi & Perawatan Kebersihan",
    body: "Bersihkan kotoran dan bau tak sedap dengan perawatan menyeluruh agar bulu anabul terasa bersih, lembut, dan segar.",
    icon: Bath,
  },
  {
    title: "Styling & Potong Bulu",
    body: "Rapikan bulu dan bentuk gaya yang sesuai dengan karakter anabul agar tampil makin rapi, menggemaskan, dan percaya diri.",
    icon: Scissors,
  },
  {
    title: "Spa & Relaksasi",
    body: "Manjakan anabul dengan perawatan ekstra yang membantu menjaga kelembutan bulu dan memberikan pengalaman grooming yang lebih nyaman.",
    icon: PawPrint,
  },
  {
    title: "Perawatan Medicated",
    body: "Perawatan khusus untuk membantu menangani masalah kulit dan bulu, seperti kutu atau jamur, sesuai kebutuhan dan arahan profesional.",
    icon: Stethoscope,
  },
];

export function HomeBento() {
  return (
    <section
      aria-labelledby="home-bento-title"
      className="relative overflow-hidden bg-white py-14 sm:py-16 lg:py-[75px]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <PawPrintDecor className="absolute left-[4%] top-12 hidden size-16 -rotate-12 text-forest/[0.06] md:block" />
        <PawPrintDecor className="absolute right-[4%] top-14 hidden size-16 rotate-12 text-forest/[0.06] md:block" />
        <PawPrintDecor className="absolute left-[19%] top-[150px] hidden size-14 rotate-6 text-forest/[0.06] lg:block" />
      </div>

      <div className="relative mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <Reveal variant="stack" className="mx-auto flex max-w-[1000px] flex-col items-center text-center">
          <SectionChip icon="paw">Layanan Yang Tersedia</SectionChip>
          <h2
            id="home-bento-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-forest-ink"
          >
            Semua Kebutuhan Memanjakan Anabul, Dalam Satu Tempat.
          </h2>
          <p className="mt-3 text-base leading-7 text-ink-body sm:text-lg">
            Dari perawatan kebersihan hingga perawatan khusus, temukan layanan
            yang sesuai dengan kebutuhan anabul agar mereka selalu bersih,
            nyaman, dan tampil menawan.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-[540px_minmax(0,1fr)]">
          <Reveal as="figure" variant="image" className="m-0">
            <img
              src="/images/photos/p-1678153188688.jpg"
              alt="Anjing berbulu krem berbandana hijau di depan latar hijau"
              width={900}
              height={600}
              loading="lazy"
              decoding="async"
              className="aspect-[3/2] w-full rounded-card-lg object-cover"
              style={{ objectPosition: "50% 40%" }}
            />
            <figcaption className="mx-auto mt-4 rounded-card-lg bg-canvas-tint px-4 py-3 text-center text-[15px] leading-7 text-ink-body ring-1 ring-inset ring-arch-line sm:text-base">
              Temukan pilihan perawatan yang dirancang untuk menjaga kebersihan,
              kenyamanan, dan penampilan anabul kesayanganmu.
            </figcaption>
          </Reveal>

          <ul role="list" className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:auto-rows-fr">
            {CATEGORIES.map((cat, index) => {
              const Icon = cat.icon;
              // Warna isi kartu memudar bersamaan dengan lapisan hijau (160ms) agar teks
              // tidak pernah sempat putih di atas latar yang masih putih.
              const fade = "transition-colors duration-[160ms] ease-soft";
              return (
                <Reveal as="li" key={cat.title} stagger={[index % 2]}>
                  <Link
                    href="/services"
                    className="motion-lift group relative isolate flex h-full min-h-[220px] flex-col rounded-card-lg bg-white p-4 text-forest-ink shadow-float ring-1 ring-inset ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 sm:p-5"
                  >
                    {/*
                     * Latar hijau yang menyala saat hover. Gradien berada di lapisan
                     * terpisah karena `background-image` tidak bisa ditransisikan; yang
                     * dipudarkan adalah opacity lapisan ini. Hover Tailwind v4 hanya
                     * aktif di perangkat ber-pointer, jadi layar sentuh tidak berubah.
                     */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-10 rounded-card-lg bg-gradient-to-b from-forest-grad-a to-forest-grad-b opacity-0 transition-opacity duration-[160ms] ease-soft group-hover:opacity-100"
                    />
                    <span className="flex items-start justify-between">
                      <Icon
                        className={`size-6 ${fade} group-hover:text-white`}
                        aria-hidden="true"
                      />
                      <span
                        aria-hidden="true"
                        className={`flex size-9 items-center justify-center rounded-full bg-forest text-white ${fade} group-hover:bg-white group-hover:text-forest`}
                      >
                        <ArrowUpRight className="motion-nudge-ne size-4" />
                      </span>
                    </span>
                    <span className="mt-auto block pt-4">
                      <span
                        className={`block text-lg font-semibold leading-snug ${fade} group-hover:text-white`}
                      >
                        {cat.title}
                      </span>
                      <span
                        className={`mt-2 block text-[13.5px] leading-5 text-ink-body ${fade} group-hover:text-on-deep-muted`}
                      >
                        {cat.body}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
