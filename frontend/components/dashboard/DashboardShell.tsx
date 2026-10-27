"use client";

import * as React from "react";
import { AuthenticatedUser } from "@backend/modules/auth/types";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopNav } from "./DashboardTopNav";
import { DashboardCommandMenu } from "./DashboardCommandMenu";
import { useSessionKeepAlive } from "./session-keep-alive";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  user: AuthenticatedUser;
  children: React.ReactNode;
  businessName?: string;
  /** Jumlah lencana per menu (kunci = href), mis. reservasi menunggu konfirmasi. */
  badges?: Record<string, number>;
}

export function DashboardShell({ user, children, businessName, badges }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Perbarui cookie akses (15 menit) secara otomatis agar admin tidak terlempar ke /login.
  useSessionKeepAlive();

  /*
   * Dialog, Sheet, Dropdown, dan Toast dirender lewat portal ke <body>, di luar
   * pembungkus bertema di bawah. Menandai <body> membuat token tema backoffice
   * ikut berlaku di sana sehingga warnanya konsisten.
   */
  React.useEffect(() => {
    document.body.classList.add("theme-admin");
    return () => document.body.classList.remove("theme-admin");
  }, []);

  // Pintasan ⌘K / Ctrl+K membuka pencarian menu dari halaman mana pun.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sidebarUser = { name: user.name, role: user.role };

  return (
    <div className="theme-admin font-brand min-h-screen bg-[var(--admin-canvas)] text-foreground antialiased selection:bg-primary/15 selection:text-primary">
      {/* Desktop Sidebar (tetap, menyatu dengan kanvas) */}
      <div className="hidden lg:block">
        <DashboardSidebar
          className="fixed inset-y-0 left-0 z-40"
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          user={sidebarUser}
          businessName={businessName}
          badges={badges}
        />
      </div>

      {/* Mobile Drawer (Radix Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          overlayClassName="motion-overlay"
          className="motion-sheet-left theme-admin font-brand w-[280px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <div className="sr-only">
            <SheetTitle>Navigasi Menu Dashboard</SheetTitle>
            <SheetDescription>Menu navigasi utama dashboard operasional</SheetDescription>
          </div>
          <DashboardSidebar
            onItemClick={() => setMobileMenuOpen(false)}
            className="w-full"
            user={sidebarUser}
            businessName={businessName}
            badges={badges}
          />
        </SheetContent>
      </Sheet>

      {/*
        Panel konten putih bersudut besar, seperti gambar referensi. Di desktop panel
        ini sendiri yang menggulir (topbar menempel di atasnya); di ponsel halaman
        menggulir seperti biasa agar gestur bawaan browser tetap bekerja.
      */}
      <div
        className={cn(
          "min-w-0 lg:py-3 lg:pr-3 motion-safe:lg:transition-[padding] motion-safe:lg:duration-[220ms] motion-safe:lg:ease-[var(--ease-soft)]",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"
        )}
      >
        <div
          id="dashboard-scroll"
          className="admin-scroll flex min-h-screen flex-col bg-card lg:h-[calc(100dvh-1.5rem)] lg:min-h-0 lg:overflow-y-auto lg:rounded-[var(--radius-admin-panel)] lg:border lg:border-border lg:shadow-[var(--shadow-admin-panel)]"
        >
          <DashboardTopNav
            user={user}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <main className="mx-auto w-full max-w-[1480px] flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      <DashboardCommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
      <Toaster position="top-right" />
    </div>
  );
}
