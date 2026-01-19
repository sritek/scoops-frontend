"use client";

import { cn } from "@/lib/utils/cn";
import { TimeSlotBadge } from "../atoms/time-slot-badge";
import { PeriodNumber, BreakBadge } from "../atoms/period-number";
import { SubjectBadge, EmptySubjectBadge } from "../atoms/subject-badge";
import type { Period, PeriodTemplateSlot } from "@/types/schedule";

interface PeriodCardProps {
  period: Period | (PeriodTemplateSlot & { teacher?: { fullName: string }; subject?: { name: string; code: string } });
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * PeriodCard - Card showing period details (time, subject, teacher)
 * 
 * Can be used for both schedule periods and template slots.
 */
export function PeriodCard({
  period,
  onClick,
  selected = false,
  compact = false,
  className,
}: PeriodCardProps) {
  const isBreak = "isBreak" in period && period.isBreak;
  const breakName = "breakName" in period ? period.breakName : undefined;
  const isClickable = !!onClick;

  if (isBreak) {
    return (
      <div
        className={cn(
          "rounded-lg p-2 border border-dashed",
          "bg-warning/5 border-warning/30",
          compact ? "py-1.5" : "py-2",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <BreakBadge name={breakName} />
          <TimeSlotBadge
            startTime={period.startTime}
            endTime={period.endTime}
            compact={compact}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border transition-all",
        isClickable && "cursor-pointer hover:border-primary-600/50 hover:shadow-sm",
        selected
          ? "border-primary-600 bg-primary-100/30 ring-1 ring-primary-600/20"
          : "border-border-subtle bg-bg-surface",
        compact ? "p-2" : "p-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PeriodNumber number={period.periodNumber} size={compact ? "sm" : "md"} />
          <TimeSlotBadge
            startTime={period.startTime}
            endTime={period.endTime}
            compact={compact}
          />
        </div>
      </div>

      <div className={cn("mt-2 space-y-1", compact && "mt-1.5")}>
        {period.subject ? (
          <SubjectBadge
            name={period.subject.name}
            code={period.subject.code}
          />
        ) : (
          <EmptySubjectBadge />
        )}

        {period.teacher && (
          <p className={cn("text-text-muted", compact ? "text-[11px]" : "text-xs")}>
            {period.teacher.fullName}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * EmptyPeriodCard - Placeholder for unassigned period slot
 */
export function EmptyPeriodCard({
  periodNumber,
  startTime,
  endTime,
  onClick,
  className,
}: {
  periodNumber: number;
  startTime: string;
  endTime: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-dashed border-border-subtle p-3",
        "bg-bg-app/50 transition-all",
        onClick && "cursor-pointer hover:border-primary-600/50 hover:bg-bg-surface",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <PeriodNumber number={periodNumber} />
        <TimeSlotBadge startTime={startTime} endTime={endTime} />
      </div>
      <p className="mt-2 text-xs text-text-muted italic">
        Click to assign
      </p>
    </div>
  );
}
