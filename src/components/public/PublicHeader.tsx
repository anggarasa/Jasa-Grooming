"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, Clock } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  const businessName = business?.name || "PawCare Grooming";
  const isOpen = operatingStatus?.isOpenNow ?? false;
  const statusText = operatingStatus?.statusText || (isOpen ? "Buka Sekarang" : "Tutup");

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          aria-label={`Beranda ${businessName}`}
        >
          {business?.logoObjectKey ? (
            <img
              src={`/api/media/${business.logoObjectKey}`}
              alt={businessName}
              className="h-10 w-10 rounded-xl object-cover border border-border/80 shadow-xs"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-accent shadow-xs text-xl">
              <span role="img" aria-label="Paw icon">🐾</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-primary text-base sm:text-lg leading-tight">
              {businessName}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline-block">
              Pet Grooming &amp; Care
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm"
          aria-label="Navigasi Utama"
        >
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${
                  active
                    ? "font-semibold text-accent border-b-2 border-accent"
                    : "font-medium text-foreground/80 hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Status */}
        <div className="flex items-center gap-3">
          {/* Operating Hours Badge */}
          <div className="hidden lg:flex items-center">
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-badge-open text-badge-open-foreground border border-badge-open-border shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span>Buka Sekarang</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                <span>{statusText}</span>
              </span>
            )}
          </div>

          {/* Booking CTA Button */}
          <Button
            asChild
            variant="accent"
            size="default"
            className="font-semibold shadow-xs"
          >
            <Link href="/booking">
              <Sparkles className="h-4 w-4 mr-1 text-white" aria-hidden="true" />
              <span>Booking Sekarang</span>
            </Link>
          </Button>

          {/* Mobile Sheet Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Buka Menu Navigasi"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] pt-8 flex flex-col justify-between">
              <div>
                <SheetHeader className="text-left pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    {business?.logoObjectKey ? (
                      <img
                        src={`/api/media/${business.logoObjectKey}`}
                        alt={businessName}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-accent text-base">
                        🐾
                      </div>
                    )}
                    <SheetTitle className="font-bold text-primary text-base">
                      {businessName}
                    </SheetTitle>
                  </div>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Layanan Grooming Hewan Profesional
                  </SheetDescription>
                </SheetHeader>

                <nav className="flex flex-col gap-1 py-4" aria-label="Navigasi Menu Mobile">
                  {NAV_LINKS.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-secondary text-primary font-semibold"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Footer Info */}
              <div className="border-t border-border pt-4 pb-2 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Status Operasional:
                  </span>
                  <span className={`font-semibold ${isOpen ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {statusText}
                  </span>
                </div>

                {business?.whatsapp && (
                  <div className="text-xs text-muted-foreground">
                    WhatsApp:{" "}
                    <span className="font-medium text-foreground">
                      {business.whatsapp}
                    </span>
                  </div>
                )}

                <Button
                  asChild
                  variant="accent"
                  className="w-full font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/booking">
                    <Sparkles className="h-4 w-4 mr-1 text-white" aria-hidden="true" />
                    Booking Jadwal
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
