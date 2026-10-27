import * as React from "react";
import { Award, CalendarCheck, ShieldCheck, Sparkles } from "lucide-react";
import { SectionChip } from "@/components/public/home/SectionChip";
import { Reveal } from "@/components/public/Reveal";

/**
 * Section E — "Kenapa di PawCare": grid 4×2 ubin lengkung berselang-seling
 * foto dan kartu teks (urutan sama dengan referensi).
 *
 * Empat judul + deskripsi memakai teks yang SUDAH ADA di Beranda aplikasi
 * (milik pemilik). Isinya adalah klaim bisnis (sertifikasi, sterilisasi UV,
 * produk bersertifikat) yang belum dikonfirmasi pemilik (K-05); teks tidak
 * dikarang ulang di sini. Alt foto hanya menjelaskan isi gambar, tanpa klaim.
 */
type Tile =
  | {
      kind: "photo";
      src: string;
      alt: string;
      objectPosition: string;
    }
  | {
      kind: "text";
      title: string;
      body: string;
      icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    };

const TILES: Tile[] = [
  {
    kind: "photo",
    src: "/images/keunggulan/pawcare-keunggulan-01-groomer-tersertifikasi.webp",
    alt: "Seorang pria menyisir anjing putih kecil di atas meja grooming",
    objectPosition: "50% 70%",
  },
  {
    kind: "text",
    title: "Fasilitas Higienis & UV Steril",
    body: "Peralatan gunting, pisau clipper, dan meja disterilisasi UV setiap pergantian sesi untuk mencegah penularan penyakit.",
    icon: Sparkles,
  },
  {
    kind: "photo",
    src: "/images/keunggulan/pawcare-keunggulan-03-produk-aman.webp",
    alt: "Bulldog tampak senang di dalam bak berbusa saat dimandikan",
    objectPosition: "50% 60%",
  },
  {
    kind: "text",
    title: "Konfirmasi & Antrean Teratur",
    body: "Jadwal reservasi tertata rapi sehingga Anda dan hewan kesayangan tidak perlu menunggu lama dalam antrean padat.",
    icon: CalendarCheck,
  },
  {
    kind: "text",
    title: "Groomer Tersertifikasi",
    body: "Groomer berpengalaman yang terlatih menghadapi beragam karakter hewan dengan sabar dan lembut tanpa paksaan.",
    icon: Award,
  },
  {
    kind: "photo",
    src: "/images/keunggulan/pawcare-keunggulan-02-higienis-steril-uv.webp",
    alt: "Beberapa alat cukur bulu listrik tersusun di atas meja putih",
    objectPosition: "50% 50%",
  },
  {
    kind: "text",
    title: "Produk Aman & Ramah Alergi",
    body: "Hanya menggunakan sampo organik bersertifikat dengan pH seimbang yang aman bagi kulit sensitif anjing dan kucing.",
    icon: ShieldCheck,
  },
  {
    kind: "photo",
    src: "/images/keunggulan/pawcare-keunggulan-04-jadwal-tanpa-antre.webp",
    alt: "Anjing berbulu keemasan menoleh ke samping",
    objectPosition: "50% 40%",
  },
];

/** Lengkung setengah lingkaran: atas untuk baris 1, bawah untuk baris 2. */
const ARCH_TOP = "rounded-tl-[50%_53%] rounded-tr-[50%_53%] rounded-b-[14px]";
const ARCH_BOTTOM = "rounded-bl-[50%_53%] rounded-br-[50%_53%] rounded-t-[14px]";

export function HomeFeatures() {
  return (
    <section
      aria-labelledby="home-features-title"
      className="bg-canvas py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <Reveal variant="stack" className="mx-auto flex max-w-[980px] flex-col items-center text-center">
          <SectionChip icon="paw">Kenapa di PawCare</SectionChip>
          <h2
            id="home-features-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
          >
            <span className="text-forest">Nyaman</span> Untuk Anabul,{" "}
            <span className="text-forest">Tenang</span> Untuk Kamu.
          </h2>
          <p className="mt-3 text-base leading-7 text-ink-body sm:text-lg">
            Kami percaya setiap anabul berhak mendapatkan perawatan terbaik. Di
            PawCare, kami mengutamakan kenyamanan, kebersihan, dan perhatian
            ekstra agar setiap kunjungan jadi pengalaman yang menyenangkan.
          </p>
        </Reveal>

        <ul
          role="list"
          className="mt-12 grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-4 lg:mt-14"
        >
          {TILES.map((tile, index) => {
            const shape = index < 4 ? ARCH_TOP : ARCH_BOTTOM;
            if (tile.kind === "photo") {
              return (
                <Reveal
                  as="li"
                  key={tile.src}
                  variant="image"
                  stagger={[index % 2, index % 4]}
                  className={`relative min-h-[280px] overflow-hidden bg-canvas-tint ${shape}`}
                >
                  <img
                    src={tile.src}
                    alt={tile.alt}
                    width={590}
                    height={700}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: tile.objectPosition }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </Reveal>
              );
            }
            const Icon = tile.icon;
            return (
              <Reveal
                as="li"
                key={tile.title}
                stagger={[index % 2, index % 4]}
                className={`flex min-h-[280px] flex-col items-center bg-canvas-tint px-6 text-center ring-1 ring-inset ring-arch-line ${index < 4 ? "pt-[53px] pb-6" : "pt-8 pb-[64px]"} ${shape}`}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-white">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold leading-snug text-ink">
                  {tile.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[22px] text-ink-body">
                  {tile.body}
                </p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
