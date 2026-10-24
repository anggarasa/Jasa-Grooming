"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

interface NavbarProps {
  onOpenBooking: (serviceName?: string) => void;
  systemStatus?: "ok" | "degraded" | "checking";
}

export function Navbar({ onOpenBooking, systemStatus = "ok" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <Link
          href="#"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-accent shadow-sm">
            <span className="text-xl" role="img" aria-label="Paw icon">
              🐾
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-primary text-base sm:text-lg">
              {siteConfig.name}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline-block">
              Pet Grooming Jakarta
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-foreground/80 transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* System Health Badge */}
          <Link href="#status" className="hidden sm:flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="bg-card text-xs font-normal border-border/80 flex items-center gap-1.5 py-1 px-2.5 hover:bg-muted transition-colors"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  systemStatus === "ok"
                    ? "bg-emerald-500 animate-pulse"
                    : systemStatus === "degraded"
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
                aria-hidden="true"
              />
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {systemStatus === "ok" ? "Sistem Online" : "Cek Layanan"}
              </span>
            </Badge>
          </Link>

          {/* Primary CTA */}
          <Button
            size="default"
            variant="accent"
            onClick={() => onOpenBooking()}
            className="font-semibold shadow-sm"
          >
            <Sparkles className="h-4 w-4 mr-1 text-white" />
            Booking Sekarang
          </Button>

          {/* Mobile Navigation Sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Buka Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] pt-10">
              <SheetHeader className="text-left pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-accent">
                    🐾
                  </div>
                  <SheetTitle className="font-bold text-primary">
                    {siteConfig.name}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-4 py-6">
                <div className="flex flex-col gap-2">
                  {siteConfig.navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mt-2 space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Jam Operasional:
                    <div className="font-medium text-foreground">
                      {siteConfig.operationalHours}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Hotline:
                    <div className="font-medium text-foreground">
                      {siteConfig.phone}
                    </div>
                  </div>
                  <Button
                    variant="accent"
                    className="w-full font-semibold mt-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenBooking();
                    }}
                  >
                    Booking Jadwal
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
