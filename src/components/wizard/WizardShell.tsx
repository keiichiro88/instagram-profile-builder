"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWizardStore } from "@/lib/store";
import { getCanAdvance, getValidationMessage } from "@/lib/validation";
import { ProgressBar } from "./ProgressBar";
import { StepNavigation } from "./StepNavigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
  StepIntro,
  StepInventory,
  StepTrust,
  StepIcon,
  StepAccountName,
  StepProfile,
  StepComplete,
} from "./steps";

const STEP_COMPONENTS: ComponentType[] = [
  StepIntro,
  StepInventory,
  StepTrust,
  StepIcon,
  StepAccountName,
  StepProfile,
  StepComplete,
];

const SWIPE_THRESHOLD = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export function WizardShell() {
  const store = useWizardStore();
  const { currentStep, nextStep, prevStep, lastSavedAt, reset } = store;
  const [direction, setDirection] = useState(1);

  // Validation state
  const canAdvance = getCanAdvance(currentStep, store);
  const [validationToast, setValidationToast] = useState<string | null>(null);

  // Resume dialog — check after Zustand hydrates from localStorage
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const hasCheckedResume = useRef(false);
  useEffect(() => {
    if (!hasCheckedResume.current && lastSavedAt && currentStep > 0) {
      hasCheckedResume.current = true;
      setShowResumeDialog(true);
    }
  }, [lastSavedAt, currentStep]);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (validationToast) {
      const timer = setTimeout(() => setValidationToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [validationToast]);

  const handleNext = () => {
    if (currentStep >= 6) return;

    if (!canAdvance) {
      const message = getValidationMessage(currentStep, store);
      setValidationToast(message);
      return;
    }

    setDirection(1);
    nextStep();
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      prevStep();
    }
  };

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const { offset } = info;

    if (offset.x < -SWIPE_THRESHOLD) {
      handleNext();
    } else if (offset.x > SWIPE_THRESHOLD) {
      handlePrev();
    }
  };

  const handleResume = () => {
    setShowResumeDialog(false);
  };

  const handleStartOver = () => {
    reset();
    setShowResumeDialog(false);
  };

  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Progress bar - sticky top */}
      <ProgressBar currentStep={currentStep} />

      {/* Step content area with swipe + transitions — wider on complete step for Before/After */}
      <div className={`relative mx-auto flex w-full flex-1 overflow-hidden ${currentStep === 6 ? "max-w-[960px]" : "max-w-[480px]"}`}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30, duration: 0.3 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="flex w-full flex-1 flex-col pb-20 pt-2"
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Validation toast */}
      <AnimatePresence>
        {validationToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            {validationToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom navigation - fixed */}
      <StepNavigation
        currentStep={currentStep}
        onNext={handleNext}
        onPrev={handlePrev}
        canAdvance={canAdvance}
      />

      {/* Resume dialog (m9) */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>前回の続きから再開しますか？</DialogTitle>
            <DialogDescription>
              前回の作業データが残っています。続きから再開するか、最初からやり直すか選んでください。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStartOver}>
              最初から
            </Button>
            <Button onClick={handleResume}>続きから</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
