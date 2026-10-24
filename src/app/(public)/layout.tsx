import * as React from "react";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { getPublicOperatingHours } from "@/modules/public/public-hours.service";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FloatingWhatsAppButton } from "@/components/public/FloatingWhatsAppButton";

export const instant = false;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [business, operatingStatus] = await Promise.all([
    getPublicBusinessProfile(),
    getPublicOperatingHours(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-accent/20 selection:text-accent">
      <PublicHeader business={business} operatingStatus={operatingStatus} />
      <main className="flex-1">{children}</main>
      <FloatingWhatsAppButton
        phone={business?.whatsapp || business?.phone}
        businessName={business?.name}
      />
      <PublicFooter business={business} operatingStatus={operatingStatus} />
    </div>
  );
}
