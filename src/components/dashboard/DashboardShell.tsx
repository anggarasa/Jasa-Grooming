"use client";

import * as React from "react";
import { AuthenticatedUser } from "@/modules/auth/types";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopNav } from "./DashboardTopNav";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

interface DashboardShellProps {
  user: AuthenticatedUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground antialiased selection:bg-accent/20 selection:text-accent">
      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <DashboardSidebar className="fixed inset-y-0 z-40" />
      </div>

      {/* Mobile Drawer (Radix Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-sidebar border-sidebar-border text-sidebar-foreground"
        >
          <div className="sr-only">
            <SheetTitle>Navigasi Menu Dashboard</SheetTitle>
            <SheetDescription>Menu navigasi utama dashboard operasional</SheetDescription>
          </div>
          <DashboardSidebar
            onItemClick={() => setMobileMenuOpen(false)}
            className="w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <DashboardTopNav
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
