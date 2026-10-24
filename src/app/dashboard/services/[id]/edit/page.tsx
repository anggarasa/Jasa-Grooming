import * as React from "react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getServiceById } from "@/modules/services/services.service";
import { listCategories } from "@/modules/categories/categories.service";
import { ServiceForm } from "@/components/dashboard/ServiceForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit Layanan - PawCare Grooming",
  description: "Ubah data paket layanan perawatan grooming hewan peliharaan.",
};

export default async function EditServicePage(
  props: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await props.params;
  if (!id) {
    notFound();
  }

  let rawService;
  try {
    rawService = await getServiceById(id);
  } catch {
    notFound();
  }

  if (!rawService) {
    notFound();
  }

  const rawCategories = await listCategories();

  const serializedService = {
    id: rawService.id,
    businessId: rawService.businessId,
    categoryId: rawService.categoryId,
    name: rawService.name,
    slug: rawService.slug,
    shortDescription: rawService.shortDescription,
    fullDescription: rawService.fullDescription,
    price: rawService.price.toString(),
    durationMinutes: rawService.durationMinutes,
    bufferMinutes: rawService.bufferMinutes,
    imageObjectKey: rawService.imageObjectKey,
    displayOrder: rawService.displayOrder,
    isActive: rawService.isActive,
    createdAt: rawService.createdAt.toISOString(),
    updatedAt: rawService.updatedAt.toISOString(),
    category: rawService.category
      ? {
          id: rawService.category.id,
          name: rawService.category.name,
          slug: rawService.category.slug,
        }
      : undefined,
  };

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
      mode="edit"
      initialService={serializedService}
      categories={serializedCategories}
      user={user}
    />
  );
}
