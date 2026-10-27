"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  PawPrint,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { navSections, isNavItemActive } from "./nav-config";

/** Pengguna yang ditampilkan pada kartu di dasar sidebar. */
export interface SidebarUser {
  name: string;
  /** "OWNER" | "ADMIN" — ditampilkan sebagai teks biasa. */
  role: string;
}

interface DashboardSidebarProps {
  onItemClick?: () => void;
  className?: string;
  /** Mode ikon saja (hanya desktop). */
  collapsed?: boolean;
  /** Bila diberikan, tombol ciutkan/lebarkan ditampilkan. */
  onToggleCollapsed?: () => void;
  user?: SidebarUser | null;
  /** Nama bisnis pada kartu di bawah logo. */
  businessName?: string;
  /** Jumlah per menu, kunci = href. Hanya angka > 0 yang ditampilkan. */
  badges?: Record<string, number>;
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Pemilik",
  ADMIN: "Admin",
};

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export function DashboardSidebar({
  onItemClick,
  className,
  collapsed = false,
  onToggleCollapsed,
  user,
  businessName = "PawCare Grooming",
  badges,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full select-none flex-col bg-sidebar text-sidebar-foreground",
        "motion-safe:transition-[width] motion-safe:duration-[220ms] motion-safe:ease-[var(--ease-soft)]",
        collapsed ? "w-[76px]" : "w-[264px]",
        className
      )}
    >
      {/*
        Logo PawCare resmi (versi hijau, rasio asli 420x128). Tingginya yang dikunci;
        lebar mengikuti otomatis (`w-auto`), dan `max-w-none` mencegah gambar
        dipepatkan oleh wadah flex. Saat sidebar diciutkan, hanya ikon di sisi kiri
        logo yang ditampilkan (dipotong, bukan diregangkan).
      */}
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          onClick={onItemClick}
          aria-label="PawCare Grooming — ke Ringkasan"
          className={cn(
            "flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            collapsed && "w-10 overflow-hidden"
          )}
        >
          <img
            src="/images/brand/logo-pawcare-hijau.png"
            alt="PawCare Grooming"
            width={420}
            height={128}
            className="h-10 w-auto max-w-none shrink-0"
          />
        </Link>

        {onToggleCollapsed && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Ciutkan sidebar"
            aria-expanded={true}
            className="motion-admin-press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {onToggleCollapsed && collapsed && (
        <div className="flex justify-center px-3 pb-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Lebarkan sidebar"
            aria-expanded={false}
            className="motion-admin-press flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      {/* Kartu bisnis — menuju Profil Bisnis (bukan pengalih tim; aplikasi ini satu bisnis). */}
      <div className="shrink-0 px-3 pb-3">
        <Link
          href="/dashboard/settings/business"
          onClick={onItemClick}
          title={collapsed ? businessName : undefined}
          className={cn(
            "motion-admin-press group flex items-center gap-3 rounded-2xl border border-sidebar-border bg-white/60 p-2.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center p-2"
          )}
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          >
            <PawPrint className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[11px] text-sidebar-muted">Bisnis</span>
                <span className="block truncate text-sm font-semibold">{businessName}</span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-sidebar-muted motion-safe:transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
          {collapsed && <span className="sr-only">{businessName} — Profil Bisnis</span>}
        </Link>
      </div>

      {/* Menu */}
      <nav
        aria-label="Menu dashboard"
        className="admin-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4"
      >
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {collapsed ? (
              <div aria-hidden="true" className="mx-3 mb-2 border-t border-sidebar-border" />
            ) : (
              <div className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const active = !item.disabled && isNavItemActive(item, pathname);
              const count = badges?.[item.href] ?? 0;

              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-sm text-sidebar-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </div>
                    {item.badge && !collapsed && (
                      <Badge
                        variant="outline"
                        className="border-sidebar-border bg-sidebar-hover/40 px-1.5 py-0 text-[10px] text-sidebar-muted"
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
                  title={collapsed ? item.title : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "motion-admin-nav group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-active font-semibold text-sidebar-active-foreground shadow-[var(--shadow-admin-nav)]"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "motion-admin-nav h-[18px] w-[18px] shrink-0",
                      active
                        ? "text-[var(--sidebar-indicator)]"
                        : "text-sidebar-muted group-hover:text-sidebar-foreground"
                    )}
                  />
                  {collapsed ? (
                    <span className="sr-only">{item.title}</span>
                  ) : (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}

                  {count > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground",
                        collapsed && "absolute right-2 top-1.5 h-4 min-w-4 px-1 text-[10px]"
                      )}
                    >
                      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
                      <span className="sr-only">{count} menunggu konfirmasi</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Dasar: tautan situs publik + kartu pengguna */}
      <div className="shrink-0 space-y-1 border-t border-sidebar-border px-3 py-3">
        <Link
          href="/"
          target="_blank"
          title={collapsed ? "Lihat Website Publik" : undefined}
          className={cn(
            "motion-admin-nav flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center px-0"
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {collapsed ? (
            <span className="sr-only">Lihat Website Publik</span>
          ) : (
            <span className="truncate">Lihat Website Publik</span>
          )}
        </Link>

        {user && (
          <Link
            href="/dashboard/profile"
            onClick={onItemClick}
            title={collapsed ? user.name : undefined}
            className={cn(
              "motion-admin-press flex items-center gap-3 rounded-2xl p-2 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed && "justify-center"
            )}
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initialsOf(user.name)}
              {/* Titik hijau = sesi aktif (pengguna ini memang sedang masuk). */}
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--admin-canvas)] bg-status-dot"
              />
            </span>
            {!collapsed ? (
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-semibold">{user.name}</span>
                <span className="block truncate text-xs text-sidebar-muted">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </span>
            ) : (
              <span className="sr-only">
                {user.name}, {ROLE_LABEL[user.role] ?? user.role}
              </span>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
