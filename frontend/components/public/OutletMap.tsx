import * as React from "react";

interface OutletMapProps {
  /** Tautan Google Maps bisnis (`googleMapsUrl` dari database); null bila belum diisi. */
  mapsUrl: string | null;
  businessName: string;
  /** Kelas ukuran/posisi kontainer, mis. "aspect-[4/3]" atau "absolute inset-0". */
  className?: string;
}

/**
 * Gambar peta statis (area outlet, dari paket aset) dengan pin, atribusi
 * OpenStreetMap, dan - bila ada - seluruh area peta menjadi tautan ke Google
 * Maps milik bisnis. BUKAN embed interaktif. Pin berada di tengah gambar dan
 * posisi pastinya belum diverifikasi terhadap koordinat bisnis, sehingga
 * petunjuk arah yang sebenarnya selalu lewat tautan Google Maps.
 */
export function OutletMap({ mapsUrl, businessName, className = "" }: OutletMapProps) {
  const content = (
    <>
      <img
        src="/images/map/peta-kelapa-gading.webp"
        alt="Peta jalan di sekitar lokasi outlet"
        width={2400}
        height={1400}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "50% 50%" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      >
        <span className="mb-2 rounded-float bg-white px-3 py-2 text-sm font-semibold leading-tight text-ink shadow-float">
          {businessName}
        </span>
        <span className="flex size-14 items-center justify-center rounded-full bg-forest ring-4 ring-white">
          <img
            src="/images/brand/mark-white.png"
            alt=""
            width={118}
            height={95}
            className="h-7 w-auto"
          />
        </span>
      </span>
    </>
  );

  return (
    <div className={`relative ${className}`}>
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${businessName} - Buka lokasi di Google Maps`}
          className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-forest"
        >
          {content}
        </a>
      ) : (
        <div className="absolute inset-0">{content}</div>
      )}

      <p className="absolute bottom-2 right-2 z-20 rounded-md bg-white/90 px-2 py-1 text-xs text-ink-body">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-1 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        >
          © OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}
