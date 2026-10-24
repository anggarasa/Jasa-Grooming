import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { listCategories } from "@/modules/categories/categories.service";
import { ServiceForm } from "@/components/dashboard/ServiceForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Tambah Layanan Baru - PawCare Grooming",
  description: "Buat paket layanan perawatan grooming hewan peliharaan baru.",
};

export default async function NewServicePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const rawCategories = await listCategories({ isActive: true });

  const serializedCategories = rawCategories.map((c) => ({
    id: c.id,
    businessId: c.businessId,
    name: c.name,
    slug: c.slug,
    description: c.description,
    displayOrder: c.displayOrder,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <ServiceForm
      mode="create"
      categories={serializedCategories}
      user={user}
    />
  );
}
