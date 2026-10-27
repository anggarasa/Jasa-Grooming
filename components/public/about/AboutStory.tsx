import * as React from "react";
import { CalendarCheck, Clock, MapPin, PawPrint } from "lucide-react";
import { SectionChip } from "@/components/public/home/SectionChip";
import type { ScheduleSummaryRow } from "@/components/public/home/schedule";

interface AboutStoryProps {
  businessName: string;
  city: string | null;
  address: string | null;
  categories: { name: string; serviceCount: number }[];
  schedule: ScheduleSummaryRow[];
}

/**
 * Cerita PawCare. HANYA memakai fakta yang tersedia di aplikasi: deskripsi
 * bisnis, lokasi, kategori dan jumlah layanan, jam buka, serta reservasi online.
 * Tidak ada sejarah brand, tahun berdiri, jumlah pengalaman, sertifikasi,
 * profil staf, atau fasilitas, karena data itu memang belum ada.
 *
 * PERLU KONFIRMASI PEMILIK: kalimat tujuan ("Tujuan kami sederhana…") adalah
 * pernyataan umum yang netral, bukan fakta terverifikasi.
 */
export function AboutStory({
  businessName,
  city,
  address,
  categories,
  schedule,
}: AboutStoryProps) {
  const totalServices = categories.reduce((sum, c) => sum + c.serviceCount, 0);
  const categoryNames = categories.map((c) => c.name.toLowerCase());
  const categoryText =
    categoryNames.length > 1
      ? `${categoryNames.slice(0, -1).join(", ")} dan ${categoryNames[categoryNames.length - 1]}`
      : categoryNames[0];

  const offerSentence = categoryText
    ? `${businessName}${city ? ` berada di ${city} dan` : ""} menyediakan ${categoryText}${
        totalServices > 0 ? `, dengan total ${totalServices} paket layanan` : ""
      }.`
    : null;

  const facts: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
  }[] = [];

  if (address || city) {
    facts.push({
      icon: <MapPin className="size-5" aria-hidden="true" />,
      label: "Lokasi",
      value: address || city,
    });
  }
  if (totalServices > 0) {
    facts.push({
      icon: <PawPrint className="size-5" aria-hidden="true" />,
      label: "Layanan",
      value: `${totalServices} paket perawatan dalam ${categories.length} kategori`,
    });
  }
  if (schedule.length > 0) {
    facts.push({
      icon: <Clock className="size-5" aria-hidden="true" />,
      label: "Jam buka",
      value: (
        <span className="block space-y-0.5">
          {schedule.map((row) => (
            <span key={row.label} className="block">
              {row.label}:{" "}
              <strong className="font-semibold text-forest-ink">
                {row.closed ? "Libur" : row.hours}
              </strong>
            </span>
          ))}
        </span>
      ),
    });
  }
  facts.push({
    icon: <CalendarCheck className="size-5" aria-hidden="true" />,
    label: "Reservasi",
    value: "Tersedia online lewat halaman Booking",
  });

  return (
    <section
      aria-labelledby="about-story-title"
      className="bg-white py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto grid w-full max-w-[1304px] grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-x-14 lg:px-8">
        <div className="lg:col-span-7">
          <SectionChip icon="paw">Tentang PawCare</SectionChip>
          <h2
            id="about-story-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-forest-ink"
          >
            Mengenal {businessName}
          </h2>

          <div className="mt-5 space-y-4 text-base leading-7 text-ink-body sm:text-lg">
            {offerSentence && <p>{offerSentence}</p>}
            <p>
              Tujuan kami sederhana: membuat perawatan anabul terasa mudah bagi
              pemilik dan nyaman bagi anabul.
            </p>
          </div>
        </div>

        <aside
          aria-label="Sekilas PawCare"
          className="self-start rounded-card-xl bg-canvas-tint p-6 ring-1 ring-inset ring-arch-line sm:p-8 lg:col-span-5"
        >
          <h3 className="text-lg font-semibold text-ink">Sekilas PawCare</h3>
          <ul role="list" className="mt-5 space-y-5">
            {facts.map((fact) => (
              <li key={fact.label} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-pill-status text-forest">
                  {fact.icon}
                </span>
                <div className="text-[15px] leading-6 text-ink-body">
                  <span className="block text-sm font-medium text-ink-muted">
                    {fact.label}
                  </span>
                  {fact.value}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
