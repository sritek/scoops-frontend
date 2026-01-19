"use client";

import { cn } from "@/lib/utils/cn";
import { DAYS_OF_WEEK, getDayLabel, getDayShortLabel } from "@/types/schedule";

interface DayLabelProps {
  day: number;
  variant?: "short" | "full";
  className?: string;
  active?: boolean;
}

/**
 * DayLabel - Renders a day of the week label with consistent styling
 * 
 * @example
 * <DayLabel day={1} />           // "Mon"
 * <DayLabel day={1} variant="full" /> // "Monday"
 */
export function DayLabel({
  day,
  variant = "short",
  className,
  active = false,
}: DayLabelProps) {
  const label = variant === "short" ? getDayShortLabel(day) : getDayLabel(day);

  return (
    <span
      className={cn(
        "font-medium text-sm",
        active ? "text-primary-600" : "text-text-primary",
        className
      )}
    >
      {label}
    </span>
  );
}

/**
 * DayLabelBadge - Day label with a badge/chip style
 */
export function DayLabelBadge({
  day,
  selected = false,
  className,
}: {
  day: number;
  selected?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium",
        selected
          ? "bg-primary-600 text-white"
          : "bg-bg-app text-text-muted border border-border-subtle",
        className
      )}
    >
      {getDayShortLabel(day)}
    </span>
  );
}
