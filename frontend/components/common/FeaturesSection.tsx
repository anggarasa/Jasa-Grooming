"use client";

import * as React from "react";
import { ShieldCheck, Award, Sparkles, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

const iconMap = {
  ShieldCheck: ShieldCheck,
  Award: Award,
  Sparkles: Sparkles,
  Clock: Clock,
};

export function FeaturesSection() {
  return (
    <section
      id="keunggulan"
      className="scroll-mt-20 py-16 sm:py-24 bg-secondary/30 border-y border-border/70"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-3 px-3 py-1 font-semibold bg-background">
            Standar Kualitas PawCare
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Kenapa Pemilik Anabul Memilih PawCare?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Kami mengutamakan keselamatan, ketenangan, dan kenyamanan hewan
            peliharaan Anda dengan fasilitas modern dan groomer berdedikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.features.map((feature, idx) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap] || Sparkles;
            return (
              <Card
                key={idx}
                className="bg-card border-border/70 hover:shadow-md transition-shadow"
              >
                <CardHeader className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold text-primary">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
