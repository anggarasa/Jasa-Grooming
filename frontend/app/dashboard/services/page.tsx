import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/lib/auth/server";
import { listServices } from "@backend/modules/services/services.service";
import { listCategories } from "@backend/modules/categories/categories.service";
import { ServicesList } from "@/components/dashboard/ServicesList";

export const instant = false;

export const metadata: Metadata = {
  title: "Katalog Layanan - PawCare Grooming",
  description: "Daftar paket layanan perawatan grooming hewan peliharaan.",
};

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [rawServices, rawCategories] = await Promise.all([
    listServices(),
    listCategories(),
  ]);

  const serializedServices = rawServices.map((s) => ({
    id: s.id,
    businessId: s.businessId,
    categoryId: s.categoryId,
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    fullDescription: s.fullDescription,
    price: s.price.toString(),
    durationMinutes: s.durationMinutes,
    bufferMinutes: s.bufferMinutes,
    imageObjectKey: s.imageObjectKey,
    displayOrder: s.displayOrder,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    category: s.category
      ? {
          id: s.category.id,
          name: s.category.name,
          slug: s.category.slug,
        }
      : undefined,
    _count: s._count,
  }));

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
    <ServicesList
      initialServices={serializedServices}
      categories={serializedCategories}
      user={user}
    />
  );
}
