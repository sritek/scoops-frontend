"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  icon?: React.ReactNode;
}

interface StudentFormStepperProps {
  currentStep: number;
  steps: Step[];
  className?: string;
}

/**
 * Student Form Stepper Component
 *
 * Visual step indicator showing progress through the multi-step form.
 * Displays step numbers, labels, and completion status.
 */
export function StudentFormStepper({
  currentStep,
  steps,
  className,
}: StudentFormStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isActive
                      ? "border-primary-600 bg-primary-600 text-white"
                      : isCompleted
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-border-subtle bg-bg-surface text-text-muted"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[100px]",
                    isActive
                      ? "text-primary-600"
                      : isCompleted
                      ? "text-primary-600"
                      : "text-text-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    isCompleted ? "bg-primary-600" : "bg-border-subtle"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
