import * as React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { getBusinessProfile } from "@/modules/business/business.service";
import { BusinessProfileForm } from "@/components/dashboard/BusinessProfileForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Profil Bisnis - PawCare Grooming",
  description: "Pengaturan identitas bisnis, kontak, dan logo operasional toko.",
};

export default async function BusinessProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getBusinessProfile();

  // Serialisasi data untuk client component
  const serializedBusiness = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    email: business.email,
    phone: business.phone,
    whatsapp: business.whatsapp,
    address: business.address,
    fullAddress: business.fullAddress,
    city: business.city,
    province: business.province,
    postalCode: business.postalCode,
    googleMapsUrl: business.googleMapsUrl,
    timezone: business.timezone,
    logoObjectKey: business.logoObjectKey,
    status: (business.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    isActive: business.isActive,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  };

  return <BusinessProfileForm business={serializedBusiness} user={user} />;
}
