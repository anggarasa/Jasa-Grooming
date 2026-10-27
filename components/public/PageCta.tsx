import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PawPrintDecor } from "@/components/public/home/decor";

export interface PageCtaAction {
  label: string;
  href: string;
  /** Tautan keluar (WhatsApp, peta): dibuka di tab baru. */
  external?: boolean;
  icon?: React.ReactNode;
}

interface PageCtaProps {
  titleId: string;
  title: string;
  description: string;
  /** Tombol utama (putih). */
  primary: PageCtaAction;
  /** Tombol kedua (outline putih); opsional. */
  secondary?: PageCtaAction | null;
}

const base =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep";

function Action({
  action,
  className,
}: {
  action: PageCtaAction;
  className: string;
}) {
  const content = (
    <>
      {action.icon}
      <span>{action.label}</span>
    </>
  );
  return action.external ? (
    <a
      href={action.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </a>
  ) : (
    <Link href={action.href} className={className}>
      {content}
    </Link>
  );
}

/**
 * Blok ajakan hijau gelap di akhir halaman publik (gaya band galeri Beranda).
 * Dipakai ulang oleh halaman Layanan, Tentang Kami, dll.
 */
export function PageCta({
  titleId,
  title,
  description,
  primary,
  secondary,
}: PageCtaProps) {
  return (
    <div className="bg-white px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8 lg:pb-[75px]">
      <section
        aria-labelledby={titleId}
        className="relative mx-auto w-full max-w-[1240px] overflow-hidden rounded-card-xl bg-forest-deep px-6 py-12 text-center text-white sm:px-10 lg:py-14"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <PawPrintDecor className="absolute -left-8 -top-6 size-40 -rotate-12 text-forest-deep-2" />
          <PawPrintDecor className="absolute -bottom-10 -right-6 size-48 rotate-12 text-forest-deep-2" />
        </div>
        <div className="relative mx-auto max-w-[720px]">
          <h2
            id={titleId}
            className="text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight"
          >
            {title}
          </h2>
          <p className="mt-3 text-base leading-7 text-on-deep-muted sm:text-lg">
            {description}
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Action
              action={{
                ...primary,
                icon: primary.icon ?? <ArrowUpRight className="size-4 order-last" aria-hidden="true" />,
              }}
              className={`${base} bg-white text-forest hover:bg-pill-status`}
            />
            {secondary && (
              <Action
                action={secondary}
                className={`${base} text-white ring-1 ring-inset ring-white hover:bg-white/15`}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
