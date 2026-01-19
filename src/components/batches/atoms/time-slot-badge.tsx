"use client";

import { cn } from "@/lib/utils/cn";

interface TimeSlotBadgeProps {
  startTime: string;
  endTime: string;
  className?: string;
  compact?: boolean;
}

/**
 * TimeSlotBadge - Displays a time range in a styled badge
 * 
 * @example
 * <TimeSlotBadge startTime="08:00" endTime="08:45" />
 * // Renders: "08:00 - 08:45"
 */
export function TimeSlotBadge({
  startTime,
  endTime,
  className,
  compact = false,
}: TimeSlotBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5",
        "bg-bg-app text-text-muted text-xs font-medium",
        "border border-border-subtle",
        compact && "px-1.5 text-[11px]",
        className
      )}
    >
      <span>{startTime}</span>
      <span className="text-text-muted/60">-</span>
      <span>{endTime}</span>
    </span>
  );
}
