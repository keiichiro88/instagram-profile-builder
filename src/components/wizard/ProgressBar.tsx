"use client";

import { STEPS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-[480px] px-4 py-3">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Dot + label */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent &&
                        "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse",
                      isUpcoming && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <svg
                        className="size-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] leading-none whitespace-nowrap transition-colors",
                      isCurrent
                        ? "font-bold text-primary"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.shortName}
                  </span>
                </div>

                {/* Connecting line */}
                {index < STEPS.length - 1 && (
                  <div className="mx-1 h-0.5 flex-1 rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        index < currentStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
