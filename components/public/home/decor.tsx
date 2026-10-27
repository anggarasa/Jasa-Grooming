import * as React from "react";

/**
 * Dekorasi sederhana (jejak kaki, hati, tulang) untuk Beranda.
 * Murni hiasan: aria-hidden, tidak interaktif, tanpa informasi.
 * Digambar dari bentuk geometris dasar (keputusan A-11).
 */
type DecorProps = React.SVGProps<SVGSVGElement>;

export function PawPrintDecor(props: DecorProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <ellipse cx="22" cy="44" rx="9" ry="13" transform="rotate(-22 22 44)" />
      <ellipse cx="40" cy="25" rx="9.5" ry="13.5" transform="rotate(-8 40 25)" />
      <ellipse cx="62" cy="25" rx="9.5" ry="13.5" transform="rotate(8 62 25)" />
      <ellipse cx="80" cy="44" rx="9" ry="13" transform="rotate(22 80 44)" />
      <path d="M50 50c-17 0-30 17-28 30 2 11 16 12 28 8 12 4 26 3 28-8 2-13-11-30-28-30z" />
    </svg>
  );
}

export function HeartDecor(props: DecorProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" />
    </svg>
  );
}

export function BoneDecor(props: DecorProps) {
  return (
    <svg
      viewBox="0 0 100 44"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="20" y="13" width="60" height="18" rx="9" />
      <circle cx="18" cy="12" r="10" />
      <circle cx="18" cy="32" r="10" />
      <circle cx="82" cy="12" r="10" />
      <circle cx="82" cy="32" r="10" />
    </svg>
  );
}
