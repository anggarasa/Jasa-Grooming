import * as React from "react";
import Link from "next/link";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicServiceItem } from "@/modules/public/public-services.service";

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
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-md">
      <div>
        {/* Cover Thumbnail */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {service.imageObjectKey ? (
            <img
              src={`/api/media/${service.imageObjectKey}`}
              alt={`Foto layanan ${service.name}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-secondary/60 to-muted p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-primary mb-2">
                <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {service.category.name}
              </span>
            </div>
          )}

          {/* Category Pill Tag */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
              {service.category.name}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* Duration & Buffer Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <Badge
              variant="duration"
              className="text-[11px] font-medium flex items-center gap-1 py-0.5 px-2"
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{service.durationMinutes} Menit</span>
            </Badge>

            {service.bufferMinutes > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                +{service.bufferMinutes}m buffer
              </span>
            )}
          </div>

          {/* Service Name Heading */}
          <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
            <Link
              href={`/services/${encodeURIComponent(service.slug)}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {service.name}
            </Link>
          </h3>

          {/* Service Description */}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {shortDesc}
          </p>
        </div>
      </div>

      {/* Footer / Price & Actions */}
      <div className="border-t border-border/70 p-5 pt-4 bg-muted/20">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xs font-medium text-muted-foreground">Harga Layanan</span>
          <span className="text-xl font-extrabold tracking-tight text-primary">
            {service.formattedPrice}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs font-medium"
          >
            <Link href={`/services/${encodeURIComponent(service.slug)}`}>
              Detail
              <ArrowRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
            </Link>
          </Button>

          <Button
            asChild
            variant="accent"
            size="sm"
            className="w-full text-xs font-semibold shadow-xs"
          >
            <Link href={`/booking?service=${encodeURIComponent(service.id)}`}>
              Booking
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
