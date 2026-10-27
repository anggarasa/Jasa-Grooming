import * as React from "react";
import { SectionChip } from "@/components/public/home/SectionChip";

/**
 * Alur booking singkat. Enam langkah dan namanya diambil dari alur booking
 * yang benar-benar ada (`components/booking/BookingProgress.tsx`); deskripsi
 * hanya merangkum isi tiap langkah. Tidak ada janji konfirmasi otomatis atau
 * waktu respons, karena status akhir ditentukan sistem/pengelola.
 */
const STEPS = [
  { title: "Pilih Layanan", body: "Pilih paket perawatan yang sesuai." },
  { title: "Pilih Tanggal", body: "Tentukan tanggal kunjungan." },
  { title: "Pilih Jam", body: "Pilih jam yang masih tersedia." },
  { title: "Data Pemilik", body: "Isi nama dan kontak Anda." },
  { title: "Data Anabul", body: "Isi data anabul yang akan dirawat." },
  { title: "Konfirmasi", body: "Periksa ringkasan, lalu buat reservasi." },
];

export function ServicesFlow() {
  return (
    <section
      aria-labelledby="services-flow-title"
      className="bg-white py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
          <SectionChip>Alur Booking</SectionChip>
          <h2
            id="services-flow-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
          >
            Booking Dalam Enam Langkah.
          </h2>
          <p className="mt-3 text-base leading-7 text-ink-body sm:text-lg">
            Semua dilakukan online, dari memilih paket sampai membuat reservasi.
          </p>
        </div>

        <ol
          role="list"
          className="mt-12 grid grid-cols-1 gap-5 min-[560px]:grid-cols-2 lg:mt-14 lg:grid-cols-3"
        >
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex items-start gap-4 rounded-card-lg bg-canvas-tint p-5 ring-1 ring-inset ring-arch-line"
            >
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-lg font-semibold text-white"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold leading-snug text-ink">
                  <span className="sr-only">{`Langkah ${index + 1}: `}</span>
                  {step.title}
                </h3>
                <p className="mt-1 text-[15px] leading-6 text-ink-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
