import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionChip } from "@/components/public/home/SectionChip";

/**
 * Ringkasan empat kategori perawatan (teks pemasaran, sama dengan bagian
 * "Layanan Yang Tersedia" di Beranda). Kategori ini TIDAK sama 1:1 dengan
 * kategori di database (Grooming Kucing, Grooming Anjing, Perawatan Khusus),
 * jadi kartu menautkan ke daftar paket di halaman yang sama (#paket), bukan
 * ke filter kategori database. Foto: pengganti dari paket aset (asset-mapping).
 */
const CATEGORIES = [
  {
    title: "Mandi & Perawatan Kebersihan",
    body: "Bersihkan kotoran dan bau tak sedap dengan perawatan menyeluruh agar bulu anabul terasa bersih, lembut, dan segar.",
    photo: {
      src: "/images/photos/p-1597603413826.jpg",
      alt: "Anjing berbulu basah dengan tali ungu berdiri di bak mandi",
      width: 900,
      height: 600,
      objectPosition: "25% 50%",
    },
  },
  {
    title: "Styling & Potong Bulu",
    body: "Rapikan bulu dan bentuk gaya yang sesuai dengan karakter anabul agar tampil makin rapi, menggemaskan, dan percaya diri.",
    photo: {
      src: "/images/photos/p-1719464454959.jpg",
      alt: "Anjing putih kecil digunting bulunya dengan gunting grooming",
      width: 1400,
      height: 934,
      objectPosition: "45% 50%",
    },
  },
  {
    title: "Spa & Relaksasi",
    body: "Manjakan anabul dengan perawatan ekstra yang membantu menjaga kelembutan bulu dan memberikan pengalaman grooming yang lebih nyaman.",
    photo: {
      src: "/images/photos/p-1611173622933.jpg",
      alt: "Anjing berbulu oranye berhanduk ungu di kepala sedang disisir",
      width: 1400,
      height: 934,
      objectPosition: "45% 45%",
    },
  },
  {
    title: "Perawatan Medicated",
    body: "Perawatan khusus untuk membantu menangani masalah kulit dan bulu, seperti kutu atau jamur, sesuai kebutuhan dan arahan profesional.",
    photo: {
      src: "/images/photos/p-1625321150203.jpg",
      alt: "Anjing berbulu cokelat dikeringkan dengan hair dryer dan disisir sikat kayu",
      width: 900,
      height: 600,
      objectPosition: "55% 50%",
    },
  },
];

export function ServicesCategories() {
  return (
    <section
      aria-labelledby="services-categories-title"
      className="bg-white py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
          <SectionChip icon="paw">Kategori Perawatan</SectionChip>
          <h2
            id="services-categories-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-forest-ink"
          >
            Perawatan Untuk Setiap Kebutuhan Anabul.
          </h2>
          <p className="mt-3 text-base leading-7 text-ink-body sm:text-lg">
            Dari kebersihan sehari-hari hingga perawatan khusus, pilih jenis
            perawatan yang paling sesuai, lalu lihat paket yang tersedia.
          </p>
        </div>

        <ul
          role="list"
          className="mt-12 grid grid-cols-1 gap-6 min-[560px]:grid-cols-2 lg:mt-14 lg:grid-cols-4"
        >
          {CATEGORIES.map((cat) => (
            <li key={cat.title}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-card-xl bg-white shadow-float ring-1 ring-inset ring-black/5">
                <img
                  src={cat.photo.src}
                  alt={cat.photo.alt}
                  width={cat.photo.width}
                  height={cat.photo.height}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: cat.photo.objectPosition }}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold leading-snug text-forest-ink">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-body">{cat.body}</p>
                  <Link
                    href="/services#paket"
                    scroll
                    className="mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-[15px] font-medium text-forest after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
                    aria-label={`Lihat paket: ${cat.title}`}
                  >
                    <span>Lihat paket</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
