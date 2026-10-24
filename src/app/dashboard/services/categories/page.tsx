import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { listCategories } from "@/modules/categories/categories.service";
import { CategoryManager } from "@/components/dashboard/CategoryManager";

export const instant = false;

export const metadata: Metadata = {
  title: "Kategori Layanan - PawCare Grooming",
  description: "Manajemen kategori katalog layanan perawatan hewan peliharaan.",
};

export default async function ServiceCategoriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const rawCategories = await listCategories();

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
    _count: c._count,
  }));

  return (
    <CategoryManager
      initialCategories={serializedCategories}
      user={user}
    />
  );
}
