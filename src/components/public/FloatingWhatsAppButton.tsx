"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/utils";

interface FloatingWhatsAppButtonProps {
  phone: string | null | undefined;
  businessName?: string;
}

export function FloatingWhatsAppButton({
  phone,
  businessName = "PawCare Grooming",
}: FloatingWhatsAppButtonProps) {
  if (!phone || phone.trim() === "") {
    return null;
  }

  const defaultMessage = `Halo ${businessName}, saya ingin konsultasi mengenai layanan grooming untuk hewan peliharaan saya.`;
  const waUrl = buildWhatsAppUrl(phone, defaultMessage);

  return (
    <aside aria-label="Bantuan WhatsApp" className="fixed bottom-6 right-6 z-50">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi kami melalui WhatsApp"
        className="group flex items-center gap-2 rounded-full bg-whatsapp px-4 py-3 text-whatsapp-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:bg-whatsapp-hover hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-6 w-6 shrink-0 text-white fill-white" aria-hidden="true" />
        <span className="hidden font-semibold text-sm tracking-wide sm:inline">
          Chat WhatsApp
        </span>
      </a>
    </aside>
  );
}
