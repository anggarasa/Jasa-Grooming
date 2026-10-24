import { Metadata } from "next";
import { SecurityForm } from "@/components/dashboard/SecurityForm";

export const metadata: Metadata = {
  title: "Keamanan Akun - PawCare Grooming",
  description: "Ubah kata sandi dan amankan akses administrator PawCare Grooming.",
};

export default function DashboardSecurityPage() {
  return <SecurityForm />;
}
