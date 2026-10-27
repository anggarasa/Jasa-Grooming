"use client";

import * as React from "react";
import { Clock, Check, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { formatIDR } from "@/lib/utils";

interface ServicesSectionProps {
  onSelectService: (serviceName: string) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  return (
    <section id="layanan" className="scroll-mt-20 py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="accent" className="mb-3 px-3 py-1 font-semibold">
            Pilihan Paket Grooming
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Layanan Perawatan Lengkap & Transparan
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Semua paket dirancang dengan standar kebersihan tinggi dan produk
            ramah alergi. Tanpa biaya tersembunyi.
          </p>
        </div>

        {/* Services Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {siteConfig.services.map((service) => {
            const isPopular = service.popular;
            return (
              <Card
                key={service.id}
                className={`flex flex-col relative transition-all duration-200 hover:shadow-lg ${
                  isPopular
                    ? "border-2 border-accent shadow-md bg-card"
                    : "border-border/80 bg-card/60"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      Paling Diminati
                    </span>
                  </div>
                )}

                <CardHeader className="pt-8">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{service.category}</span>
                    <span className="inline-flex items-center gap-1 font-medium bg-secondary text-primary px-2.5 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      {service.durationMinutes} Menit
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-primary">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {service.description}
                  </CardDescription>

                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground block font-medium">
                      Mulai dari
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">
                        {formatIDR(service.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / sesi
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pb-6">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                    Manfaat Paket:
                  </div>
                  <ul className="space-y-2.5">
                    {service.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/80"
                      >
                        <div className="h-4 w-4 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    variant={isPopular ? "accent" : "outline"}
                    className={`w-full font-semibold ${
                      isPopular
                        ? "shadow-sm"
                        : "border-primary/20 hover:bg-secondary text-primary"
                    }`}
                    onClick={() => onSelectService(service.name)}
                  >
                    Pilih {service.name}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
