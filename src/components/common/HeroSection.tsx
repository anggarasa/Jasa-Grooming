"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Calendar, ShieldCheck, Heart, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface HeroSectionProps {
  onOpenBooking: () => void;
}

export function HeroSection({ onOpenBooking }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background py-16 sm:py-24 lg:py-28">
      {/* Decorative gradient blur background */}
      <div
        className="pointer-events-none absolute -top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-[-100px] -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headlines & CTAs */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Top pill badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-accent">
              <Sparkles className="h-4 w-4" />
              <span>Standar Grooming Medis & Bersih di Jakarta</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15]">
              Perawatan Terbaik untuk{" "}
              <span className="text-accent underline decoration-accent/30 decoration-wavy decoration-2">
                Sahabat Berbulu
              </span>{" "}
              Anda
            </h1>

            {/* Subheadline */}
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              Jadikan momen grooming anabul menyenangkan tanpa cemas. Ditangani
              langsung oleh groomer bersertifikat dengan fasilitas steril, sampo
              organik hypoallergenic, dan ruang ber-AC yang nyaman.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4">
              <Button
                size="lg"
                variant="accent"
                onClick={onOpenBooking}
                className="w-full sm:w-auto font-semibold text-base px-8 h-12 shadow-md hover:shadow-lg transition-all"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Booking Sekarang
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-6 h-12 border-primary/20 hover:bg-secondary text-primary"
              >
                <Link href="#layanan">Lihat Layanan & Tarif</Link>
              </Button>
            </div>

            {/* Micro social proof under CTA */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border/80 pt-6 text-left w-full max-w-lg">
              <div>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-lg sm:text-xl">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span>4.9 / 5</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  500+ Ulasan Puas
                </div>
              </div>
              <div className="border-l border-border pl-4">
                <div className="font-bold text-primary text-lg sm:text-xl">
                  1.500+
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Anabul Terlayani
                </div>
              </div>
              <div className="border-l border-border pl-4">
                <div className="font-bold text-accent text-lg sm:text-xl">
                  100%
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Bahan Organik
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Main Card with Pet Visual Preview */}
              <Card className="border-2 border-primary/10 shadow-xl overflow-hidden bg-white dark:bg-card">
                <div className="relative h-64 sm:h-72 bg-gradient-to-tr from-primary to-slate-800 p-6 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-accent text-accent-foreground border-none font-semibold px-3 py-1">
                      Salon & Spa Hewan
                    </Badge>
                    <span className="text-3xl">🐶 🐱</span>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wider text-accent font-semibold">
                      Spesialisasi Anjing & Kucing
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      PawCare Grooming Center
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Kenyamanan dan kebersihan menyeluruh untuk anabul tercinta
                    </p>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center text-xs text-foreground/90 gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>Sanitasi alat UV-C steril sebelum setiap sesi</span>
                    </div>
                    <div className="flex items-center text-xs text-foreground/90 gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>Blower pengering suhu terkontrol anti kepanasan</span>
                    </div>
                    <div className="flex items-center text-xs text-foreground/90 gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>Groomer sabar & ramah hewan bersertifikat</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      className="w-full text-xs font-semibold py-2 h-auto text-primary"
                      onClick={onOpenBooking}
                    >
                      Pilih Jadwal Grooming Hari Ini
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Trust Badge */}
              <div className="absolute -bottom-5 -left-4 sm:-left-6 rounded-xl border border-border bg-white dark:bg-card p-3 shadow-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    Garansi Sanitasi
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    100% Alat Steril & Bersih
                  </div>
                </div>
              </div>

              {/* Floating Rating Badge */}
              <div className="absolute -top-4 -right-2 sm:-right-4 rounded-xl border border-border bg-white dark:bg-card p-3 shadow-lg flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <Heart className="h-4 w-4 fill-current" />
                </div>
                <div className="text-xs font-bold text-foreground">
                  Care With Heart
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
