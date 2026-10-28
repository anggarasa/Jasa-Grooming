import * as React from "react";
import Link from "next/link";
import { Clock, Sparkles, ArrowRight, ArrowUpRight } from "lucide-react";
import { PublicServiceItem } from "@backend/modules/public/public-services.service";

interface ServiceCardProps {
  service: PublicServiceItem;
  priority?: boolean;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const shortDesc =
    service.shortDescription ||
    service.description ||
    "Perawatan grooming berkualitas untuk kebersihan dan kenyamanan hewan kesayangan.";

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-[26px] border border-[#E2E6DF] bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-black/20">
      <div>
        {/* Cover Thumbnail */}
        <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[20px] bg-[#E8EDE7]">
          {service.imageObjectKey ? (
            <img
              src={`/media/${service.imageObjectKey}`}
              alt={`Foto layanan ${service.name}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#E2E6DF] to-[#D5DDD3] p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs text-black mb-2">
                <Sparkles className="h-6 w-6 text-black" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {service.category.name}
              </span>
            </div>
          )}

          {/* Category Pill Tag */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-black/75 backdrop-blur-sm px-3 py-1 text-[11px] font-bold text-white shadow-xs uppercase tracking-wider">
              {service.category.name}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-4 px-1 pb-2">
          {/* Duration & Buffer Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F1] px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-[#E2E6DF]">
              <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
              <span>{service.durationMinutes} Menit</span>
            </span>

            {service.bufferMinutes > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                +{service.bufferMinutes}m buffer
              </span>
            )}
          </div>

          {/* Service Name Heading */}
          <h3 className="text-base sm:text-lg font-black tracking-tight text-black transition-colors group-hover:text-[#2D4233] line-clamp-1">
            <Link
              href={`/services/${encodeURIComponent(service.slug)}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-sm"
            >
              {service.name}
            </Link>
          </h3>

          {/* Service Description */}
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-2">
            {shortDesc}
          </p>
        </div>
      </div>

      {/* Footer / Price & Actions */}
      <div className="border-t border-[#F0F2EE] pt-4 mt-2 px-1 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Harga Layanan</span>
          <span className="text-lg sm:text-xl font-black tracking-tight text-black">
            {service.formattedPrice}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/services/${encodeURIComponent(service.slug)}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-black transition-all hover:bg-slate-50 hover:border-black/30"
          >
            <span>Detail</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-slate-500" aria-hidden="true" />
          </Link>

          <Link
            href={`/booking?service=${encodeURIComponent(service.id)}`}
            className="inline-flex items-center justify-center rounded-full bg-[#111827] px-3 py-2 text-xs font-extrabold text-white transition-all hover:bg-black shadow-xs hover:scale-[1.02]"
          >
            <span>Booking</span>
            <ArrowUpRight className="h-3.5 w-3.5 ml-1 text-white" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
