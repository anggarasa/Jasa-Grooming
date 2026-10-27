import * as React from "react";
import { PawPrint, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionChipProps {
  children: React.ReactNode;
  /** "sparkle" = ✨ di kedua sisi (bagian Layanan, Moments); "paw" = jejak kaki di kiri. */
  icon?: "sparkle" | "paw";
  /** Di atas blok hijau gelap: chip putih. */
  onDark?: boolean;
  className?: string;
}

/**
 * Label kecil di atas judul bagian. Statis; BUKAN heading.
 */
export function SectionChip({
  children,
  icon = "sparkle",
  onDark = false,
  className,
}: SectionChipProps) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
        onDark
          ? "bg-white text-forest-ink"
          : "bg-canvas-tint text-forest-ink",
        className
      )}
    >
      {icon === "paw" ? (
        <PawPrint className="size-3.5 text-forest/60" aria-hidden="true" />
      ) : (
        <Sparkles className="size-3.5 text-forest/60" aria-hidden="true" />
      )}
      <span>{children}</span>
      {icon === "sparkle" && (
        <Sparkles className="size-3.5 text-forest/60" aria-hidden="true" />
      )}
    </p>
  );
}
