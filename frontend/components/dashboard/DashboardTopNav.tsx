"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  User as UserIcon,
  Lock,
  ShieldCheck,
  LogOut,
  Loader2,
  ChevronDown,
  Search,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutApi } from "@/lib/auth/client";
import { AuthenticatedUser } from "@backend/modules/auth/types";

interface DashboardTopNavProps {
  user: AuthenticatedUser;
  onOpenMobileMenu?: () => void;
  /** Membuka kotak pencarian menu (⌘K). Bila tidak diberikan, tombol cari disembunyikan. */
  onOpenSearch?: () => void;
}

const titlesByPath: Record<string, { title: string; category: string }> = {
  "/dashboard": { title: "Ringkasan Operasional", category: "Dashboard" },
  "/dashboard/profile": { title: "Profil Pengguna", category: "Akun" },
  "/dashboard/security": { title: "Keamanan & Kata Sandi", category: "Keamanan" },
  "/dashboard/sessions": { title: "Kelola Sesi Aktif", category: "Keamanan" },
  "/dashboard/bookings": { title: "Manajemen Reservasi", category: "Operasional" },
  "/dashboard/bookings/new": { title: "Reservasi Walk-in Baru", category: "Operasional" },
  "/dashboard/calendar": { title: "Kalender Operasional", category: "Operasional" },
  "/dashboard/customers": { title: "Data Pelanggan", category: "Operasional" },
  "/dashboard/blocked-times": { title: "Blokir Waktu", category: "Operasional" },
  "/dashboard/services": { title: "Katalog Layanan", category: "Layanan" },
  "/dashboard/services/new": { title: "Tambah Layanan", category: "Layanan" },
  "/dashboard/services/categories": { title: "Kategori Layanan", category: "Layanan" },
  "/dashboard/gallery": { title: "Galeri Bisnis", category: "Layanan" },
  "/dashboard/settings/business": { title: "Profil Bisnis", category: "Pengaturan" },
  "/dashboard/settings/hours": { title: "Jam Operasional", category: "Pengaturan" },
  "/dashboard/settings/booking": { title: "Pengaturan Reservasi", category: "Pengaturan" },
  "/dashboard/settings/integrations": { title: "Integrasi Eksternal", category: "Pengaturan" },
  "/dashboard/integrations/google-calendar": {
    title: "Sinkronisasi Google Calendar",
    category: "Integrasi",
  },
};

/**
 * Judul untuk rute dinamis (detail reservasi, edit layanan, detail pelanggan)
 * yang tidak bisa dicocokkan persis. Diperiksa berurutan setelah pencocokan tepat.
 */
const titlesByPrefix: { prefix: string; title: string; category: string }[] = [
  { prefix: "/dashboard/bookings/", title: "Detail Reservasi", category: "Operasional" },
  { prefix: "/dashboard/customers/", title: "Detail Pelanggan", category: "Operasional" },
  { prefix: "/dashboard/services/", title: "Edit Layanan", category: "Layanan" },
];

function resolveRouteInfo(pathname: string) {
  const exact = titlesByPath[pathname];
  if (exact) return exact;
  const prefixed = titlesByPrefix.find((entry) => pathname.startsWith(entry.prefix));
  if (prefixed) return { title: prefixed.title, category: prefixed.category };
  return { title: "Admin Portal", category: "Dashboard" };
}

export function DashboardTopNav({ user, onOpenMobileMenu, onOpenSearch }: DashboardTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const routeInfo = resolveRouteInfo(pathname);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
      toast.success("Berhasil Keluar", {
        description: "Sesi Anda telah berhasil diakhiri.",
      });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Gagal Keluar", {
        description: "Terjadi kesalahan saat mengakhiri sesi. Coba lagi.",
      });
      setIsLoggingOut(false);
    }
  };

  // Ambil inisial nama untuk avatar
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const isOwner = user.role === "OWNER";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6">
      {/* Kiri: hamburger (mobile) + breadcrumb. Judul halaman sendiri (h1) ada di isi halaman. */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground sm:inline">{routeInfo.category}</span>
          <span aria-hidden="true" className="hidden text-muted-foreground/50 sm:inline">
            /
          </span>
          <span aria-current="page" className="truncate font-semibold text-primary">
            {routeInfo.title}
          </span>
        </nav>
      </div>

      {/* Kanan: pencarian menu, situs publik, peran, akun */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Cari menu (⌘K atau Ctrl+K)"
            className="motion-admin-press hidden h-10 w-56 items-center gap-2.5 rounded-full border border-border bg-muted px-3.5 text-sm text-muted-foreground hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex lg:w-72"
          >
            <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">Cari menu…</span>
            <kbd
              aria-hidden="true"
              className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium"
            >
              ⌘K
            </kbd>
          </button>
        )}
        {onOpenSearch && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenSearch}
            aria-label="Cari menu"
            className="h-10 w-10 rounded-full border border-border text-muted-foreground md:hidden"
          >
            <Search className="h-[18px] w-[18px]" />
          </Button>
        )}

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Lihat website publik"
          title="Lihat website publik"
          className="motion-admin-press hidden h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
        </Link>

        {/* Role Badge */}
        <Badge
          variant={isOwner ? "owner" : "admin"}
          className="hidden px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide xl:inline-flex"
        >
          {isOwner ? "Pemilik (Owner)" : "Admin"}
        </Badge>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="motion-admin-press flex cursor-pointer items-center gap-1.5 rounded-full border border-transparent p-0.5 pr-2 outline-none hover:border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Buka menu akun"
            >
              {/* Avatar Initials */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-xs">
                {initials}
              </div>
              {/* Nama & email tetap ada untuk pembaca layar; tampilan visualnya ada di kartu sidebar. */}
              <span className="sr-only">{user.name}</span>
              <span className="sr-only">{user.email}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="mt-1 w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  {user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <div className="pt-1.5 xl:hidden">
                  <Badge variant={isOwner ? "owner" : "admin"} className="text-[10px]">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/profile"
                className="flex cursor-pointer items-center gap-2"
              >
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Profil Saya</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/security"
                className="flex cursor-pointer items-center gap-2"
              >
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span>Keamanan Sandi</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/sessions"
                className="flex cursor-pointer items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span>Sesi Aktif</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex cursor-pointer items-center gap-2 text-destructive focus:bg-destructive-subtle/30 focus:text-destructive"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
