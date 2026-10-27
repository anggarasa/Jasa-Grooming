import * as React from "react";
import { ChevronDown } from "lucide-react";
import { SectionChip } from "@/components/public/home/SectionChip";

export interface ContactFaqItem {
  question: string;
  answer: React.ReactNode;
}

interface ContactFaqProps {
  items: ContactFaqItem[];
}

/**
 * Pertanyaan umum. Dibuat dengan elemen <details> bawaan browser sehingga
 * dapat dibuka dengan Enter/Spasi tanpa JavaScript tambahan. Isi jawaban
 * dirangkai oleh halaman dari data bisnis yang nyata (jadwal, alamat, kontak,
 * alur booking); tidak ada janji waktu respons atau kebijakan yang belum ada.
 */
export function ContactFaq({ items }: ContactFaqProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="contact-faq-title"
      className="bg-white py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
          <SectionChip>Pertanyaan Umum</SectionChip>
          <h2
            id="contact-faq-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
          >
            Hal yang Sering Ditanyakan.
          </h2>
        </div>

        <div className="mx-auto mt-10 flex max-w-[860px] flex-col gap-3 lg:mt-12">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-card-lg bg-canvas-tint ring-1 ring-inset ring-arch-line open:bg-white open:shadow-float"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card-lg px-5 py-4 text-left text-base font-semibold leading-snug text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 sm:px-6 sm:text-lg [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <ChevronDown
                  className="size-5 shrink-0 text-forest transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 pb-5 text-[15px] leading-7 text-ink-body sm:px-6 sm:text-base">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
