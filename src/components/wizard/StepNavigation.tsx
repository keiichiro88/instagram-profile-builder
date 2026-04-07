"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StepNavigationProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  canAdvance?: boolean;
}

export function StepNavigation({
  currentStep,
  onNext,
  onPrev,
  canAdvance = true,
}: StepNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === 6;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Back button */}
        {isFirstStep ? (
          <div />
        ) : (
          <Button
            variant="ghost"
            size="lg"
            onClick={onPrev}
            className="min-h-[48px] gap-1 px-4"
          >
            <ChevronLeft className="size-4" data-icon="inline-start" />
            戻る
          </Button>
        )}

        {/* Next button */}
        {isLastStep ? (
          <div />
        ) : (
          <Button
            onClick={onNext}
            size="lg"
            disabled={!canAdvance}
            className="min-h-[48px] gap-1 px-6 shadow-md disabled:opacity-50"
          >
            次へ
            <ChevronRight className="size-4" data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}
