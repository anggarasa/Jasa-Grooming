import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/lib/auth/server";
import { LoginForm } from "@/components/auth/LoginForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Masuk ke Admin Portal - PawCare Grooming",
  description: "Masuk ke portal manajemen PawCare Grooming untuk mengelola operasional salon hewan.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
