import React from "react";

export interface BrandLogoProps {
  /**
   * Varian tampilan logo:
   * - horizontal: Mark di samping wordmark (default untuk navbar & header)
   * - stacked: Mark di atas wordmark (cocok untuk hero/splash/center)
   * - mark-only: Hanya emblem vektor tanpa teks (cocok untuk favicon/mobile icon)
   */
  variant?: "horizontal" | "stacked" | "mark-only";
  /**
   * Ukuran logo
   */
  size?: "sm" | "md" | "lg";
  /**
   * Tema kontras logo:
   * - default: Untuk latar belakang terang (Deep Obsidian & Mineral Sage)
   * - inverted: Untuk latar belakang gelap (Pure White & Light Sage)
   */
  theme?: "default" | "inverted";
  /**
   * Nama bisnis kustom jika ingin override dari default PawCare
   */
  businessName?: string;
  /**
   * Subtitle kustom (misal: "STUDIO & SPA" atau "PET GROOMING")
   */
  subtitle?: string;
  className?: string;
}

export function BrandLogo({
  variant = "horizontal",
  size = "md",
  theme = "default",
  businessName = "PawCare",
  subtitle = "STUDIO & SPA",
  className = "",
}: BrandLogoProps) {
  const isInverted = theme === "inverted";

  // Dimensi emblem berdasarkan ukuran
  const dimensions = {
    sm: { box: 32, mark: 30, textTitle: "text-sm sm:text-base font-extrabold", textSub: "text-[8px] sm:text-[9px]" },
    md: { box: 40, mark: 36, textTitle: "text-base sm:text-lg font-black", textSub: "text-[9px] sm:text-[10px]" },
    lg: { box: 48, mark: 44, textTitle: "text-xl sm:text-2xl font-black", textSub: "text-[10px] sm:text-xs" },
  }[size];

  // Palet warna vektor SVG sesuai tema
  const primaryColor = isInverted ? "#FFFFFF" : "#111827";
  const accentColor = isInverted ? "#B4C4B9" : "#2D3E33";
  const containerBg = isInverted ? "rgba(255, 255, 255, 0.12)" : "#111827";
  const containerStroke = isInverted ? "rgba(255, 255, 255, 0.2)" : "#000000";

  // Emblem Vektor SVG Minimalist Modern (Circular Crest with Geometric Curves)
  const emblem = (
    <svg
      width={dimensions.mark}
      height={dimensions.mark}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      aria-hidden="true"
    >
      {/* Outer rounded pill / circle badge */}
      <circle
        cx="22"
        cy="22"
        r="20"
        fill={containerBg}
        stroke={containerStroke}
        strokeWidth="1.5"
      />

      {/* Modern geometric monogram wave curves (stylized P & C caring gesture) */}
      <path
        d="M13 28V15C13 15 17 13 22 13C27 13 30 15.5 30 19.5C30 23.5 26.5 25.5 21.5 25.5H13"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 26C26.5 28.5 23.5 30.5 19.5 30.5C15 30.5 11.5 27 11.5 22.5"
        stroke={accentColor}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="30" cy="14" r="2.2" fill="#F59E0B" />
    </svg>
  );

  if (variant === "mark-only") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {emblem}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex ${
        variant === "stacked"
          ? "flex-col items-center text-center gap-1.5"
          : "items-center gap-2.5"
      } ${className}`}
    >
      {emblem}
      <div className="flex flex-col text-left justify-center">
        <span
          className={`tracking-tight leading-none uppercase ${dimensions.textTitle}`}
          style={{ color: primaryColor }}
        >
          {businessName}
        </span>
        <span
          className={`font-bold tracking-[0.22em] uppercase mt-1 leading-none ${dimensions.textSub}`}
          style={{ color: isInverted ? "#E5E7EB" : "#4B5563" }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
}

export default BrandLogo;
