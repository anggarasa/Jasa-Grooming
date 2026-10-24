"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  number: number;
  title: string;
  shortTitle: string;
  description?: string;
}

export const BOOKING_STEPS: WizardStep[] = [
  { number: 1, title: "Pilih Layanan", shortTitle: "Layanan" },
  { number: 2, title: "Pilih Tanggal", shortTitle: "Tanggal" },
  { number: 3, title: "Pilih Jam", shortTitle: "Jam" },
  { number: 4, title: "Data Pemilik", shortTitle: "Pemilik" },
  { number: 5, title: "Data Anabul", shortTitle: "Anabul" },
  { number: 6, title: "Konfirmasi", shortTitle: "Review" },
];

interface BookingProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  maxAccessibleStep?: number;
}

export function BookingProgress({
  currentStep,
  onStepClick,
  maxAccessibleStep = currentStep,
}: BookingProgressProps) {
  return (
    <nav aria-label="Progres reservasi" className="w-full">
      {/* Mobile view: Compact Progress Bar & step label */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Langkah {currentStep} dari {BOOKING_STEPS.length}
          </span>
          <span className="text-xs font-bold text-foreground">
            {BOOKING_STEPS[currentStep - 1]?.title}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{
              width: `${(currentStep / BOOKING_STEPS.length) * 100}%`,
            }}
          />
        </div>
        {/* Horizontal step indicator dots for mobile */}
        <div className="flex justify-between items-center mt-3 px-1">
          {BOOKING_STEPS.map((step) => {
            const isCompleted = step.number < currentStep;
            const isActive = step.number === currentStep;
            const canClick = onStepClick && step.number <= maxAccessibleStep && !isActive;

            return (
              <button
                key={step.number}
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick(step.number)}
                className={cn(
                  "flex items-center justify-center text-[11px] font-semibold transition-all",
                  canClick ? "cursor-pointer hover:underline" : "cursor-default",
                  isActive
                    ? "text-primary font-bold"
                    : isCompleted
                    ? "text-accent"
                    : "text-muted-foreground opacity-60"
                )}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Langkah ${step.number}: ${step.title}`}
              >
                <span>{step.number}</span>
                <span className="ml-1 hidden xs:inline">{step.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop view: Stepper timeline */}
      <ol className="hidden md:flex items-center justify-between w-full relative">
        {BOOKING_STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isUpcoming = step.number > currentStep;
          const canClick = onStepClick && step.number <= maxAccessibleStep && !isActive;

          return (
            <li
              key={step.number}
              className={cn(
                "flex-1 relative flex flex-col items-center group",
                idx === 0 ? "items-start" : "",
                idx === BOOKING_STEPS.length - 1 ? "items-end" : ""
              )}
            >
              {/* Connector line between steps */}
              {idx > 0 && (
                <div
                  className={cn(
                    "absolute top-4 -translate-y-1/2 h-0.5 right-1/2 w-full -z-0 transition-colors duration-200",
                    isCompleted || isActive
                      ? "bg-wizard-connector-completed"
                      : "bg-wizard-connector-default"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step Button / Badge */}
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick(step.number)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Langkah ${step.number}: ${step.title}${
                  isCompleted ? " (selesai)" : isActive ? " (aktif)" : ""
                }`}
                className={cn(
                  "relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border transition-all duration-200 outline-none",
                  canClick
                    ? "cursor-pointer hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent"
                    : "cursor-default",
                  isCompleted &&
                    "bg-wizard-step-completed text-wizard-step-completed-foreground border-wizard-step-completed-border",
                  isActive &&
                    "bg-wizard-step-active text-wizard-step-active-foreground border-wizard-step-active-border ring-2 ring-wizard-step-active-ring shadow-xs",
                  isUpcoming &&
                    "bg-wizard-step-default text-wizard-step-default-foreground border-wizard-step-default-border"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-wizard-step-completed-icon stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <span>{step.number}</span>
                )}
              </button>

              {/* Label */}
              <div
                className={cn(
                  "mt-2 text-center",
                  idx === 0 ? "text-left" : "",
                  idx === BOOKING_STEPS.length - 1 ? "text-right" : ""
                )}
              >
                <span
                  className={cn(
                    "block text-xs font-semibold tracking-tight transition-colors",
                    isActive
                      ? "text-primary font-bold"
                      : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
