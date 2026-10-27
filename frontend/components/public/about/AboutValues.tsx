import * as React from "react";
import { Droplets, Eye, Heart, MessageCircle } from "lucide-react";
import { SectionChip } from "@/components/public/home/SectionChip";

/**
 * Empat nilai yang dijaga. Teks sengaja berupa PRINSIP umum yang netral, bukan
 * klaim terukur: tanpa sertifikasi, metode medis, prosedur sterilisasi, jumlah
 * pengalaman, atau profil staf.
 *
 * - "Perhatian" merujuk pada kolom catatan khusus yang memang ada di form
 *   booking; "Komunikasi" merujuk pada tautan kelola reservasi yang memang ada.
 * PERLU KONFIRMASI PEMILIK: redaksi keempat nilai ini.
 */
const VALUES = [
  {
    icon: Heart,
    title: "Kenyamanan Anabul",
    body: "Setiap anabul punya karakter yang berbeda. Kenyamanan mereka menjadi hal pertama yang kami perhatikan selama perawatan.",
  },
  {
    icon: Droplets,
    title: "Kebersihan",
    body: "Perawatan dimulai dari kebersihan bulu dan kulit. Kebersihan kami jaga sebagai bagian dari setiap layanan.",
  },
  {
    icon: Eye,
    title: "Perhatian",
    body: "Kami memperhatikan kebutuhan tiap anabul, mulai dari jenis, ras, dan usia hingga catatan khusus yang Anda tuliskan saat reservasi.",
  },
  {
    icon: MessageCircle,
    title: "Komunikasi dengan Pemilik",
    body: "Anda bisa bertanya lebih dulu sebelum memesan, dan memeriksa reservasi kapan saja lewat tautan kelola reservasi.",
  },
];

export function AboutValues() {
  return (
    <section
      aria-labelledby="about-values-title"
      className="bg-canvas py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
          <SectionChip icon="paw">Nilai Kami</SectionChip>
          <h2
            id="about-values-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
          >
            Yang Kami Jaga Setiap Hari.
          </h2>
        </div>

        <ul
          role="list"
          className="mt-12 grid grid-cols-1 gap-6 min-[560px]:grid-cols-2 lg:mt-14 lg:grid-cols-4"
        >
          {VALUES.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="flex flex-col rounded-card-xl bg-white p-6 shadow-float ring-1 ring-inset ring-black/5"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-forest text-white">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-[15px] leading-6 text-ink-body">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
