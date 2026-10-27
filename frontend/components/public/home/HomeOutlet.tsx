import * as React from "react";
import { Clock, ExternalLink, Mail, MapPin, MessageCircle } from "lucide-react";
import type { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import type { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";
import { buildWhatsAppUrl } from "@/lib/utils";
import { OutletMap } from "@/components/public/OutletMap";
import { SectionChip } from "@/components/public/home/SectionChip";
import { Reveal } from "@/components/public/Reveal";
import { summarizeSchedule } from "@/components/public/home/schedule";

interface HomeOutletProps {
  business: PublicBusinessProfile | null;
  operatingStatus: PublicOperatingStatus;
}

/**
 * Section H — Lokasi. Satu outlet (data bisnis hanya satu), sehingga tab
 * outlet pada referensi tidak dibuat (K-08). Peta = gambar statis dari paket
 * aset (area Kelapa Gading). Peta ini BUKAN embed interaktif: seluruh area
 * peta adalah tautan ke Google Maps milik bisnis (`googleMapsUrl` dari DB), dan
 * atribusi OpenStreetMap wajib tampil. Pin berada di tengah gambar; posisi
 * tepatnya belum diverifikasi terhadap koordinat bisnis, jadi petunjuk arah
 * yang sebenarnya selalu lewat tautan Google Maps.
 */
export function HomeOutlet({ business, operatingStatus }: HomeOutletProps) {
  const businessName = business?.name || "PawCare Grooming";
  const city = business?.city || null;
  const address =
    business?.fullAddress || business?.address || "Jakarta, Indonesia";
  const mapsUrl = business?.googleMapsUrl || null;
  const waNumber = business?.whatsapp || business?.phone || null;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya ingin bertanya tentang layanan grooming.`,
  );
  const rows = summarizeSchedule(operatingStatus.schedule);
  const isOpen = operatingStatus.isOpenNow;

  return (
    <section
      aria-labelledby="home-outlet-title"
      className="bg-white py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <Reveal variant="stack">
        <SectionChip>Kunjungi Kami</SectionChip>
        <h2
          id="home-outlet-title"
          className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
        >
          Temukan <span className="text-forest">Outlet PawCare</span>, Langsung
          Ke Lokasi.
        </h2>
        <p className="mt-3 max-w-[760px] text-base leading-7 text-ink-body sm:text-lg">
          Lihat lokasi di peta, cek jam buka, lalu pilih rute lewat Google Maps.
        </p>
        </Reveal>

        <Reveal className="relative mt-9 overflow-hidden rounded-card-xl bg-canvas-tint lg:min-h-[458px]">
          {/* Kartu informasi: di atas peta pada mobile, melayang di kiri pada desktop */}
          <div className="relative z-10 p-4 lg:m-5 lg:w-[457px] lg:p-0">
            <div className="rounded-card-lg bg-white p-5 shadow-float">
              <p className="inline-flex items-center gap-2 rounded-full bg-chip px-3 py-1.5 text-[13px] font-medium text-ink">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${
                    isOpen ? "bg-status-dot" : "bg-ink-muted"
                  }`}
                />
                <span>{operatingStatus.statusText}</span>
              </p>

              <h3 className="mt-3 text-2xl font-semibold leading-tight text-ink">
                {businessName}
              </h3>
              {city && (
                <p className="mt-1 text-[15px] text-ink-muted">{city}</p>
              )}

              <ul
                role="list"
                className="mt-4 space-y-3 text-[15px] leading-6 text-ink-body"
              >
                <li className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 size-5 shrink-0 text-forest"
                    aria-hidden="true"
                  />
                  <span>{address}</span>
                </li>

                {rows.length > 0 && (
                  <li className="flex items-start gap-3">
                    <Clock
                      className="mt-0.5 size-5 shrink-0 text-forest"
                      aria-hidden="true"
                    />
                    <span className="space-y-1">
                      {rows.map((row) => (
                        <span key={row.label} className="block">
                          {row.closed ? (
                            <>
                              {row.label} ={" "}
                              <strong className="font-semibold text-forest-ink">
                                Libur
                              </strong>
                            </>
                          ) : (
                            <>
                              {row.label} |{" "}
                              <strong className="font-semibold text-forest-ink">
                                {row.hours}
                              </strong>
                              {row.breakText && (
                                <span className="block">
                                  Istirahat | {row.breakText}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      ))}
                    </span>
                  </li>
                )}

                {business?.email && (
                  <li className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 size-5 shrink-0 text-forest"
                      aria-hidden="true"
                    />
                    <span>
                      Email:{" "}
                      <a
                        href={`mailto:${business.email}`}
                        className="rounded-sm font-medium text-forest-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                      >
                        {business.email}
                      </a>
                    </span>
                  </li>
                )}

                {waNumber && (
                  <li className="flex items-start gap-3">
                    <MessageCircle
                      className="mt-0.5 size-5 shrink-0 text-forest"
                      aria-hidden="true"
                    />
                    <span>
                      WhatsApp:{" "}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm font-medium text-forest-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                      >
                        {waNumber}
                      </a>
                    </span>
                  </li>
                )}
              </ul>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="motion-press mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-forest px-6 text-[15px] font-medium text-white transition-colors hover:bg-forest-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
                >
                  <span>Petunjuk Arah</span>
                  <ExternalLink className="motion-nudge-ne size-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Peta */}
          <OutletMap
            mapsUrl={mapsUrl}
            businessName={businessName}
            className="aspect-[4/3] w-full lg:absolute lg:inset-0 lg:aspect-auto"
          />
        </Reveal>
      </div>
    </section>
  );
}
