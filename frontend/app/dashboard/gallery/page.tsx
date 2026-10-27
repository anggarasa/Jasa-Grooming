import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/lib/auth/server";
import { listGallery } from "@backend/modules/gallery/gallery.service";
import { GalleryManager } from "@/components/dashboard/GalleryManager";

export const instant = false;

export const metadata: Metadata = {
  title: "Galeri Bisnis - PawCare Grooming",
  description: "Manajemen dokumentasi foto gerai, peralatan, dan hasil grooming PawCare.",
};

export default async function GalleryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const rawGallery = await listGallery();

  const serializedGallery = rawGallery.map((item) => ({
    id: item.id,
    businessId: item.businessId,
    objectKey: item.objectKey,
    caption: item.caption,
    altText: item.altText,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return <GalleryManager initialGallery={serializedGallery} user={user} />;
}
