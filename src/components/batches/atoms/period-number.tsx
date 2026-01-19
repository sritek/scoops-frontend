"use client";

import { cn } from "@/lib/utils/cn";

interface PeriodNumberProps {
  number: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * PeriodNumber - Displays a period number in a styled badge
 * 
 * @example
 * <PeriodNumber number={1} />  // "P1"
 * <PeriodNumber number={3} size="lg" />  // "P3" (larger)
 */
export function PeriodNumber({
  number,
  className,
  size = "md",
}: PeriodNumberProps) {
  const sizeClasses = {
    sm: "h-5 min-w-[20px] text-[10px]",
    md: "h-6 min-w-[24px] text-xs",
    lg: "h-8 min-w-[32px] text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-primary-100 text-primary-600 font-semibold",
        "px-1.5",
        sizeClasses[size],
        className
      )}
    >
      P{number}
    </span>
  );
}

/**
 * BreakBadge - Displays a break indicator
 */
export function BreakBadge({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "bg-warning/10 text-warning text-xs font-medium",
        className
      )}
    >
      {name || "Break"}
    </span>
  );
}
