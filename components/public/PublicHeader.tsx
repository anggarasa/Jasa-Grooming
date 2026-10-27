"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";

interface PublicHeaderProps {
  business: PublicBusinessProfile | null;
  operatingStatus?: PublicOperatingStatus | null;
}

const NAV_LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "/services" },
  { label: "Galeri", href: "/gallery" },
  { label: "Tentang Kami", href: "/about" },
  { label: "Hubungi Kami", href: "/contact" },
];

/** Logo hijau dari pemilik (docs/redesign/logo pawcare hijau.png), 420×128. */
const LOGO_GREEN = "/images/brand/logo-pawcare-hijau.png";

/** Ambang scroll (px) untuk mengaktifkan / mematikan latar blur. Dua nilai (histeresis) mencegah berkedip di sekitar ambang. */
const SCROLL_ON = 16;
const SCROLL_OFF = 8;

export function PublicHeader({ business, operatingStatus }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Status scroll yang efisien: satu listener pasif + requestAnimationFrame, dan setState
  // HANYA dipanggil saat melewati ambang (bukan di setiap event scroll).
  React.useEffect(() => {
    let frame = 0;
    let current = false;
    const update = () => {
      frame = 0;
      const next = current ? window.scrollY > SCROLL_OFF : window.scrollY > SCROLL_ON;
      if (next !== current) {
        current = next;
        setScrolled(next);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    // Posisi awal (mis. halaman dimuat ulang di tengah, atau scroll dipulihkan setelah Kembali).
    frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const businessName = business?.name || "PawCare Grooming";
  const isOpen = operatingStatus?.isOpenNow;
  const statusText = operatingStatus?.statusText || "Tutup";

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Pengganti ruang header: header fixed tidak lagi mengambil ruang di alur dokumen,
          sehingga tata letak halaman tetap sama persis seperti desain yang disetujui. */}
      <div aria-hidden="true" className="h-16 w-full shrink-0 lg:h-[79px]" />
      <header
        data-public-header=""
        data-scrolled={scrolled ? "true" : "false"}
        className="fixed inset-x-0 top-0 z-40 w-full font-brand"
      >
        {/* Lapisan latar (SATU-SATUNYA yang di-blur). Saudara dari konten, bukan induknya, dan
            tidak menangkap pointer; logo, menu, dan tombol berada di lapisan di atasnya. */}
        <div aria-hidden="true" className="public-header-bg pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex h-16 w-full max-w-[1304px] items-center justify-between px-4 sm:px-6 lg:h-[79px] lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            aria-label={`Beranda ${businessName}`}
          >
            <img
              src={LOGO_GREEN}
              alt={businessName}
              width={420}
              height={128}
              className="-ml-1 h-11 w-auto lg:h-[54px]"
            />
          </Link>

          {/*
            Tab navigasi desktop: hijau, menempel ke tepi atas, sudut atas melebar.
            Sudut kiri-bawah & kanan-bawah sedikit melengkung (permintaan pemilik, 26 Okt 2026).
          */}
          <nav
            className="absolute left-1/2 top-0 hidden h-[79px] -translate-x-1/2 items-center gap-6 rounded-b-[20px] bg-forest px-8 text-base text-white lg:flex xl:gap-7 xl:px-10"
            aria-label="Navigasi Utama"
          >
            <span
              aria-hidden="true"
              className="absolute -left-[34px] top-0 size-[34px] bg-[radial-gradient(circle_at_0_100%,transparent_33px,var(--color-forest)_34px)]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-[34px] top-0 size-[34px] bg-[radial-gradient(circle_at_100%_100%,transparent_33px,var(--color-forest)_34px)]"
            />
            {NAV_LINKS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-sm py-1 underline-offset-[6px] decoration-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest ${
                    active ? "font-medium underline" : ""
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Aksi kanan: status buka (xl) + CTA booking + menu mobile */}
          <div className="flex items-center gap-3">
            <p className="hidden items-center gap-2 text-sm font-medium text-ink-body 2xl:flex">
              <span
                className={`size-2.5 rounded-full ${
                  isOpen ? "bg-status-dot" : "bg-ink-muted"
                }`}
                aria-hidden="true"
              />
              <span>{isOpen ? "Buka Sekarang" : statusText}</span>
            </p>

            <Link
              href="/booking"
              className="motion-press hidden h-11 items-center gap-2 rounded-full bg-pill-status px-5 text-sm font-semibold text-forest-ink transition-colors hover:bg-chip-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 sm:inline-flex"
            >
              <Calendar className="size-4" aria-hidden="true" />
              <span>Booking Sekarang</span>
            </Link>

            {/* Pemicu menu mobile */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-full text-forest hover:bg-pill-status lg:hidden"
                  aria-label="Buka Menu Navigasi"
                >
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                overlayClassName="motion-overlay"
                className="motion-sheet-right flex w-[300px] flex-col justify-between border-0 bg-forest pt-8 font-brand text-white sm:w-[350px]"
              >
                <div>
                  <SheetHeader className="border-b border-white/20! pb-4 text-left">
                    <SheetTitle className="text-base font-bold text-white">
                      {businessName}
                    </SheetTitle>
                    <SheetDescription className="mt-1 text-sm text-on-deep-muted">
                      Layanan Grooming Hewan Profesional
                    </SheetDescription>
                  </SheetHeader>

                  <nav
                    className="flex flex-col gap-1 py-6"
                    aria-label="Navigasi Menu Mobile"
                  >
                    {NAV_LINKS.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-12 items-center rounded-full px-5 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                            active
                              ? "bg-white font-semibold text-forest"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="space-y-3 border-t border-white/20! pb-6 pt-4">
                  <div className="flex items-center gap-2 text-sm text-on-deep-muted">
                    <Clock className="size-4 shrink-0" aria-hidden="true" />
                    <span>{statusText}</span>
                  </div>
                  <Link
                    href="/booking"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-forest transition-colors hover:bg-pill-status focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest"
                  >
                    <Calendar className="size-4" aria-hidden="true" />
                    <span>Booking Jadwal Sekarang</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
