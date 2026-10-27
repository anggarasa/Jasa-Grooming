import * as React from "react";
import type { Metadata } from "next";
import {
  ExternalLink,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { getPublicOperatingHours } from "@backend/modules/public/public-hours.service";
import { OperatingHoursTable } from "@/components/public/OperatingHoursTable";
import { OutletMap } from "@/components/public/OutletMap";
import { PageHero } from "@/components/public/PageHero";
import { PageCta } from "@/components/public/PageCta";
import { ContactFaq, type ContactFaqItem } from "@/components/public/contact/ContactFaq";
import { SectionChip } from "@/components/public/home/SectionChip";
import { summarizeSchedule } from "@/components/public/home/schedule";
import Link from "next/link";
import {
  constructMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/utils";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: `Hubungi Kami - ${businessName}`,
    description: `Alamat lengkap, nomor WhatsApp, email, dan jadwal jam operasional mingguan salon hewan ${businessName}.`,
    path: "/contact",
    businessName,
  });
}

export default async function ContactPage() {
  const [business, operatingStatus] = await Promise.all([
    getPublicBusinessProfile(),
    getPublicOperatingHours(),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const fullAddress =
    business?.fullAddress ||
    [business?.address, business?.city, business?.province, business?.postalCode]
      .filter(Boolean)
      .join(", ") ||
    "Jakarta, Indonesia";

  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya ingin menanyakan informasi lokasi dan booking jadwal grooming.`
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Hubungi Kami", url: `${baseUrl}/contact` },
  ]);

  const focusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";

  const rows: { icon: React.ReactNode; label: string; content: React.ReactNode }[] = [
    {
      icon: <MapPin className="size-5" aria-hidden="true" />,
      label: "Alamat Gerai",
      content: (
        <p className="mt-0.5 text-base font-semibold leading-6 text-ink">{fullAddress}</p>
      ),
    },
  ];
  if (business?.phone) {
    rows.push({
      icon: <Phone className="size-5" aria-hidden="true" />,
      label: "Telepon Salon",
      content: (
        <a
          href={`tel:${business.phone}`}
          className={`mt-0.5 block rounded-sm text-base font-semibold text-forest-ink hover:underline ${focusClass}`}
        >
          {business.phone}
        </a>
      ),
    });
  }
  if (business?.email) {
    rows.push({
      icon: <Mail className="size-5" aria-hidden="true" />,
      label: "Email Resmi",
      content: (
        <a
          href={`mailto:${business.email}`}
          className={`mt-0.5 block rounded-sm text-base font-semibold text-forest-ink hover:underline ${focusClass}`}
        >
          {business.email}
        </a>
      ),
    });
  }

  // Jawaban FAQ hanya dirangkai dari data yang nyata (jadwal, alamat, kontak,
  // alur booking). Tidak ada janji waktu respons atau kebijakan yang belum ada.
  const scheduleRows = summarizeSchedule(operatingStatus.schedule);
  const tzSuffix = operatingStatus.timezone === "Asia/Jakarta" ? " WIB" : "";
  const hoursAnswer =
    scheduleRows.length > 0 ? (
      <ul role="list" className="space-y-1">
        {scheduleRows.map((row) => (
          <li key={row.label}>
            <strong className="font-semibold text-ink">{row.label}:</strong>{" "}
            {row.closed
              ? "Tutup"
              : `${row.hours}${tzSuffix}${row.breakText ? ` (jeda ${row.breakText})` : ""}`}
          </li>
        ))}
      </ul>
    ) : null;

  const contactNames = [
    waNumber ? "WhatsApp" : null,
    business?.phone ? "telepon" : null,
    business?.email ? "email" : null,
  ].filter(Boolean) as string[];

  const faqItems: ContactFaqItem[] = [];
  if (hoursAnswer) {
    faqItems.push({ question: "Jam berapa gerai buka?", answer: hoursAnswer });
  }
  faqItems.push({
    question: "Di mana lokasi gerai?",
    answer: (
      <p>
        {fullAddress}.
        {business?.googleMapsUrl && " Gunakan tombol petunjuk arah di bagian Lokasi untuk membuka Google Maps."}
      </p>
    ),
  });
  faqItems.push({
    question: "Bagaimana cara membuat reservasi?",
    answer: (
      <p>
        Reservasi dilakukan online dalam enam langkah: pilih layanan, tanggal, dan jam, lalu isi
        data pemilik dan data anabul, dan terakhir periksa ringkasan sebelum membuat reservasi.{" "}
        <Link href="/booking" className="font-semibold text-forest-ink underline underline-offset-2">
          Mulai booking
        </Link>
        .
      </p>
    ),
  });
  faqItems.push({
    question: "Di mana saya bisa melihat harga dan durasi layanan?",
    answer: (
      <p>
        Setiap paket perawatan menampilkan harga dan durasinya di halaman{" "}
        <Link href="/services" className="font-semibold text-forest-ink underline underline-offset-2">
          Layanan
        </Link>
        .
      </p>
    ),
  });
  if (contactNames.length > 0) {
    faqItems.push({
      question: "Saya masih ingin bertanya sebelum booking. Hubungi ke mana?",
      answer: (
        <p>
          Anda bisa menghubungi kami lewat {contactNames.join(", ").replace(/, ([^,]*)$/, " atau $1")}{" "}
          pada bagian kontak di halaman ini.
        </p>
      ),
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <PageHero
        titleId="contact-hero-title"
        imageClassName="lg:max-w-[470px]"
        eyebrow="Hubungi Kami"
        titleLines={["Kami Senang Bisa", "Membantu."]}
        description={`Punya pertanyaan tentang layanan, jadwal, atau lokasi? Hubungi ${businessName} lewat kontak di bawah ini, atau langsung kunjungi gerai kami.`}
        image={{
          src: "/images/hero/pawcare-hero-puppy-kitten.webp",
          alt: "Anak anjing hitam-putih dan anak kucing calico menoleh ke atas bersama",
          width: 1400,
          height: 1281,
        }}
      />

      {/* Kontak & jam operasional */}
      <section
        aria-labelledby="contact-info-title"
        className="bg-white py-14 sm:py-16 lg:py-[75px]"
      >
        <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-6 rounded-card-xl bg-white p-6 shadow-float ring-1 ring-inset ring-black/5 sm:p-8 lg:col-span-5">
              <h2 id="contact-info-title" className="text-xl font-semibold text-ink">
                Kontak Kami
              </h2>

              <ul role="list" className="space-y-5">
                {rows.map((row) => (
                  <li key={row.label} className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-pill-status text-forest">
                      {row.icon}
                    </span>
                    <div>
                      <span className="block text-sm font-medium text-ink-muted">
                        {row.label}
                      </span>
                      {row.content}
                    </div>
                  </li>
                ))}
              </ul>

              {waNumber && (
                <div className="border-t border-arch-line pt-6">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-hover ${focusClass}`}
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                    <span>Chat via WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-5 lg:col-span-7">
              <div>
                <h2 className="text-xl font-semibold text-ink">Jam Operasional</h2>
                <p className="mt-1 text-[15px] text-ink-body">
                  Zona waktu operasional toko:{" "}
                  <strong className="font-semibold text-ink">{operatingStatus.timezone}</strong>
                </p>
              </div>

              <OperatingHoursTable
                schedule={operatingStatus.schedule}
                todayDayOfWeek={operatingStatus.todayHours?.dayOfWeek}
                isOpenNow={operatingStatus.isOpenNow}
                statusText={operatingStatus.statusText}
                showStatusBadge={true}
              />

              <div className="flex items-start gap-3 rounded-card-lg bg-canvas-tint p-4 ring-1 ring-inset ring-arch-line">
                <Info className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden="true" />
                <p className="text-[15px] leading-6 text-ink-body">
                  <strong className="font-semibold text-ink">Tips Kedatangan: </strong>
                  Kami sarankan tiba 10 menit sebelum jam reservasi agar anabul memiliki waktu beradaptasi dengan lingkungan salon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lokasi */}
      <section
        aria-labelledby="contact-location-title"
        className="bg-canvas-tint py-14 sm:py-16 lg:py-[75px]"
      >
        <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-start">
              <SectionChip>Lokasi</SectionChip>
              <h2
                id="contact-location-title"
                className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
              >
                Kunjungi Gerai Kami.
              </h2>
              <p className="mt-3 flex max-w-[640px] items-start gap-2 text-base leading-7 text-ink-body sm:text-lg">
                <MapPin className="mt-1.5 size-5 shrink-0 text-forest" aria-hidden="true" />
                <span>{fullAddress}</span>
              </p>
            </div>

            {business?.googleMapsUrl && (
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-forest px-7 text-base font-medium text-white transition-colors hover:bg-forest-hover ${focusClass}`}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                <span>Buka Petunjuk di Google Maps</span>
              </a>
            )}
          </div>

          <OutletMap
            mapsUrl={business?.googleMapsUrl || null}
            businessName={businessName}
            className="mt-8 aspect-[4/3] overflow-hidden rounded-card-xl sm:aspect-[16/7] lg:mt-10"
          />
        </div>
      </section>

      <ContactFaq items={faqItems} />

      <PageCta
        titleId="contact-cta-title"
        title="Siap Membuat Jadwal untuk Anabul?"
        description="Pilih layanan, tanggal, dan jam yang sesuai langsung secara online."
        primary={{ label: "Booking Sekarang", href: "/booking" }}
        secondary={{ label: "Lihat Layanan", href: "/services" }}
      />
    </>
  );
}
