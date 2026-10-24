import * as React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";

const CURRENT_YEAR = 2026;

export function Footer() {
  return (
    <footer id="kontak" className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-accent">
                🐾
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="text-xs text-muted-foreground pt-1">
              {siteConfig.legalName} &bull; TampilKit Booking Modular Template
            </div>
          </div>

          {/* Navigasi Cepat */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Navigasi
            </h4>
            <ul className="space-y-2.5 text-sm">
              {siteConfig.navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jam Operasional */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Jam Operasional
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">
                    Senin – Minggu
                  </div>
                  <div className="text-xs">09:00 – 19:00 WIB</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed pt-2">
                *Reservasi akhir diterima 1 jam sebelum jam tutup operasional.
              </p>
            </div>
          </div>

          {/* Kontak & Lokasi */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Kontak Kami
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">
                  {siteConfig.address}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <a
                  href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`}
                  className="text-xs hover:text-accent transition-colors"
                >
                  {siteConfig.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-accent shrink-0" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-xs hover:text-accent transition-colors"
                >
                  {siteConfig.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <div>
            &copy; {CURRENT_YEAR} {siteConfig.name}. Hak Cipta Dilindungi
            Undang-Undang.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/login" className="hover:text-accent transition-colors font-medium">
              Admin Portal
            </Link>
            <span>&bull;</span>
            <span>Next.js App Router</span>
            <span>&bull;</span>
            <span>PostgreSQL & MinIO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
