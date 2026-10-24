import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard - PawCare Grooming",
  description: "Portal operasional terproteksi untuk tim admin dan pemilik PawCare Grooming.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
