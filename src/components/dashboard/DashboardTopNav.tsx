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
import { AuthenticatedUser } from "@/modules/auth/types";

interface DashboardTopNavProps {
  user: AuthenticatedUser;
  onOpenMobileMenu?: () => void;
}

const titlesByPath: Record<string, { title: string; category: string }> = {
  "/dashboard": { title: "Ringkasan Operasional", category: "Dashboard" },
  "/dashboard/profile": { title: "Profil Pengguna", category: "Akun" },
  "/dashboard/security": { title: "Keamanan & Kata Sandi", category: "Keamanan" },
  "/dashboard/sessions": { title: "Kelola Sesi Aktif", category: "Keamanan" },
};

export function DashboardTopNav({ user, onOpenMobileMenu }: DashboardTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const routeInfo = titlesByPath[pathname] || {
    title: "Admin Portal",
    category: "Dashboard",
  };

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
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Kiri: Mobile Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>PawCare</span>
            <span>/</span>
            <span>{routeInfo.category}</span>
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-foreground tracking-tight line-clamp-1">
            {routeInfo.title}
          </h1>
        </div>
      </div>

      {/* Kanan: Badge Role & User Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <Badge
          variant={isOwner ? "owner" : "admin"}
          className="hidden sm:inline-flex capitalize font-semibold px-2.5 py-0.5 tracking-wide text-xs"
        >
          {isOwner ? "Pemilik (Owner)" : "Admin"}
        </Badge>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-full sm:rounded-lg hover:bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Buka menu akun"
            >
              {/* Avatar Initials */}
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-medium text-foreground line-clamp-1">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {user.email}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  {user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <div className="pt-1.5 sm:hidden">
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
                className="cursor-pointer flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Profil Saya</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/security"
                className="cursor-pointer flex items-center gap-2"
              >
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span>Keamanan Sandi</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/sessions"
                className="cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span>Sesi Aktif</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive-subtle/30 flex items-center gap-2"
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
