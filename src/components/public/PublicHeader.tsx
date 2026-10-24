"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PublicBusinessProfile } from "@/modules/public/public-business.service";
import { PublicOperatingStatus } from "@/modules/public/public-hours.service";
import { BrandLogo } from "@/components/common/BrandLogo";

interface PublicHeaderProps {
  business: PublicBusinessProfile | null;
  operatingStatus?: PublicOperatingStatus | null;
}

const NAV_LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "/services" },
  { label: "Galeri", href: "/gallery" },
  { label: "Tentang Kami", href: "/about" },
  { label: "Kontak", href: "/contact" },
];

export function PublicHeader({ business, operatingStatus }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b border-[#A2B5A8]/50 bg-[#B4C4B9]/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full"
          aria-label={`Beranda ${businessName}`}
        >
          {business?.logoObjectKey ? (
            <div className="flex items-center gap-3">
              <img
                src={`/api/media/${business.logoObjectKey}`}
                alt={businessName}
                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-2xs"
              />
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-black text-base sm:text-lg leading-tight uppercase">
                  {businessName}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-[#2D4233] uppercase hidden sm:inline-block">
                  Studio &amp; Spa Grooming
                </span>
              </div>
            </div>
          ) : (
            <BrandLogo size="md" businessName={businessName} subtitle="STUDIO & SPA" />
          )}
        </Link>

        {/* Desktop Navigation (Uppercase minimal pill links) */}
        <nav
          className="hidden lg:flex items-center gap-7 text-xs font-extrabold tracking-wider"
          aria-label="Navigasi Utama"
        >
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors py-1.5 px-1 rounded-sm ${
                  active
                    ? "text-black border-b-2 border-black"
                    : "text-[#111827]/80 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Status (Scandinavian Pills) */}
        <div className="flex items-center gap-3">
          {/* Operating Hours Dot Pill */}
          <div className="hidden xl:flex items-center">
            {isOpen ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/70 text-[#15803D] border border-white/80 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span>Buka Sekarang</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/60 text-slate-700 border border-white/70 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                <span>{statusText}</span>
              </span>
            )}
          </div>

          {/* User Portal / Login Pill */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/80 hover:bg-white text-black px-4 py-2 text-xs font-bold border border-white shadow-2xs transition-all hover:scale-[1.02]"
          >
            <User className="h-3.5 w-3.5 text-black" aria-hidden="true" />
            <span>Masuk</span>
          </Link>

          {/* Booking Pill CTA (Solid Black) */}
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 rounded-full bg-[#111827] hover:bg-black text-white px-5 py-2.5 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            <span>Booking Sekarang</span>
          </Link>

          {/* Mobile Sheet Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full hover:bg-white/50 text-black"
                aria-label="Buka Menu Navigasi"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] pt-8 flex flex-col justify-between bg-white text-black">
              <div>
                <SheetHeader className="text-left pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    {business?.logoObjectKey ? (
                      <div className="flex items-center gap-2.5">
                        <img
                          src={`/api/media/${business.logoObjectKey}`}
                          alt={businessName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <SheetTitle className="font-extrabold text-black text-base uppercase">
                          {businessName}
                        </SheetTitle>
                      </div>
                    ) : (
                      <BrandLogo size="sm" businessName={businessName} subtitle="STUDIO & SPA" />
                    )}
                  </div>
                  <SheetDescription className="text-xs text-muted-foreground mt-1">
                    Layanan Grooming Hewan Profesional
                  </SheetDescription>
                </SheetHeader>

                <nav className="flex flex-col gap-1.5 py-6" aria-label="Navigasi Menu Mobile">
                  {NAV_LINKS.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                          active
                            ? "bg-black text-white"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted mt-2 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Portal Masuk Admin</span>
                  </Link>
                </nav>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="pt-4 border-t border-border space-y-3 pb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span>{statusText}</span>
                </div>
                <Link
                  href="/booking"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-black text-white py-3 text-xs font-extrabold shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Booking Jadwal Sekarang</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
