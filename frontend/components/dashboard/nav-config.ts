import type * as React from "react";
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
  RefreshCw,
  Link2,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  badge?: string;
  exactMatch?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Daftar menu backoffice — SATU sumber untuk sidebar dan kotak pencarian (⌘K),
 * sehingga keduanya selalu sama. Isinya identik dengan menu sebelum redesign:
 * 3 bagian, 16 item, urutan dan tautan tidak berubah.
 */
export const navSections: NavSection[] = [
  {
    title: "Menu Operasional",
    items: [
      { title: "Ringkasan", href: "/dashboard", icon: LayoutDashboard, exactMatch: true },
      { title: "Semua Layanan", href: "/dashboard/services", icon: Scissors, exactMatch: true },
      { title: "Kategori Layanan", href: "/dashboard/services/categories", icon: FolderTree },
      { title: "Galeri Bisnis", href: "/dashboard/gallery", icon: ImageIcon },
      { title: "Pemesanan", href: "/dashboard/bookings", icon: CalendarCheck },
      { title: "Kalender", href: "/dashboard/calendar", icon: Calendar },
      { title: "Pelanggan", href: "/dashboard/customers", icon: Users },
      { title: "Blokir Waktu", href: "/dashboard/blocked-times", icon: CalendarOff },
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
      { title: "Profil Bisnis", href: "/dashboard/settings/business", icon: Building2 },
      { title: "Jam Operasional", href: "/dashboard/settings/hours", icon: Clock },
      { title: "Pengaturan Reservasi", href: "/dashboard/settings/booking", icon: Sliders },
      { title: "Integrasi Eksternal", href: "/dashboard/settings/integrations", icon: Link2 },
    ],
  },
  {
    title: "Akun & Keamanan",
    items: [
      { title: "Profil Saya", href: "/dashboard/profile", icon: User },
      { title: "Keamanan Akun", href: "/dashboard/security", icon: Lock },
      { title: "Sesi Aktif", href: "/dashboard/sessions", icon: ShieldCheck },
    ],
  },
];

/** Apakah `pathname` berada di bawah item menu ini (aturan sama seperti sidebar lama). */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exactMatch) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
