import { Metadata } from "next";
import { getCurrentUser } from "@backend/lib/auth/server";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Profil Pengguna - PawCare Grooming",
  description: "Kelola data profil pengguna administrator PawCare Grooming.",
};

export default async function DashboardProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <ProfileForm user={user} />;
}
