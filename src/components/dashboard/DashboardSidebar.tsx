"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  CalendarOff,
  Scissors,
  FolderTree,
  Users,
  Building2,
  Clock,
  Sliders,
  Image as ImageIcon,
  User,
  Lock,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/common/BrandLogo";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  badge?: string;
  exactMatch?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Menu Operasional",
    items: [
      {
        title: "Ringkasan",
        href: "/dashboard",
        icon: LayoutDashboard,
        exactMatch: true,
      },
      {
        title: "Semua Layanan",
        href: "/dashboard/services",
        icon: Scissors,
        exactMatch: true,
      },
      {
        title: "Kategori Layanan",
        href: "/dashboard/services/categories",
        icon: FolderTree,
      },
      {
        title: "Galeri Bisnis",
        href: "/dashboard/gallery",
        icon: ImageIcon,
      },
      {
        title: "Pemesanan",
        href: "/dashboard/bookings",
        icon: CalendarCheck,
      },
      {
        title: "Kalender",
        href: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        title: "Pelanggan",
        href: "/dashboard/customers",
        icon: Users,
      },
      {
        title: "Blokir Waktu",
        href: "/dashboard/blocked-times",
        icon: CalendarOff,
      },
      {
        title: "Sinkronisasi Google",
        href: "/dashboard/integrations/google-calendar",
        icon: RefreshCw,
      },
    ],
  },
  {
    title: "Pengaturan Bisnis",
    items: [
      {
        title: "Profil Bisnis",
        href: "/dashboard/settings/business",
        icon: Building2,
      },
      {
        title: "Jam Operasional",
        href: "/dashboard/settings/hours",
        icon: Clock,
      },
      {
        title: "Pengaturan Reservasi",
        href: "/dashboard/settings/booking",
        icon: Sliders,
      },
      {
        title: "Integrasi Eksternal",
        href: "/dashboard/settings/integrations",
        icon: Link2,
      },
    ],
  },
  {
    title: "Akun & Keamanan",
    items: [
      {
        title: "Profil Saya",
        href: "/dashboard/profile",
        icon: User,
      },
      {
        title: "Keamanan Akun",
        href: "/dashboard/security",
        icon: Lock,
      },
      {
        title: "Sesi Aktif",
        href: "/dashboard/sessions",
        icon: ShieldCheck,
      },
    ],
  },
];

interface DashboardSidebarProps {
  onItemClick?: () => void;
  className?: string;
}

export function DashboardSidebar({ onItemClick, className }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isItemActive = (item: NavItem) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-64 select-none",
        className
      )}
    >
      {/* Branding */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <BrandLogo theme="inverted" size="sm" businessName="PawCare Grooming" subtitle="Admin Portal v1.0" />
      </div>

      {/* Nav Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = !item.disabled && isItemActive(item);

              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sidebar-muted/60 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-sidebar-border text-sidebar-muted bg-sidebar-hover/40"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                    active
                      ? "bg-sidebar-active text-sidebar-active-foreground font-semibold shadow-xs"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-sidebar-active-foreground"
                          : "text-sidebar-muted group-hover:text-sidebar-foreground"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Public Landing Link Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
        >
          <span className="truncate">Lihat Website Publik</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
