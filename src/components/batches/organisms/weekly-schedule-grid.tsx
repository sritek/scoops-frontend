"use client";

import { useMemo } from "react";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DayLabel } from "../atoms/day-label";
import { PeriodNumber } from "../atoms/period-number";
import { SubjectBadge, EmptySubjectBadge } from "../atoms/subject-badge";
import type { Period, PeriodTemplateSlot } from "@/types/schedule";
import { DAYS_OF_WEEK, DEFAULT_ACTIVE_DAYS } from "@/types/schedule";

interface WeeklyScheduleGridProps {
  periods: Period[];
  templateSlots?: PeriodTemplateSlot[];
  activeDays?: number[];
  onPeriodClick?: (day: number, periodNumber: number) => void;
  selectedPeriod?: { day: number; period: number } | null;
  className?: string;
  showTeacher?: boolean;
  editable?: boolean;
  showBreaks?: boolean;
}

// Represents either a period row or a break row
type ScheduleRow =
  | { type: "period"; periodNumber: number; startTime: string; endTime: string }
  | { type: "break"; breakName: string; startTime: string; endTime: string };

/**
 * WeeklyScheduleGrid - Table grid showing weekly periods
 *
 * Displays the weekly schedule in a grid format with days as columns
 * and periods/breaks as rows. Supports:
 * - Configurable active days
 * - Break rows (lunch, recess)
 * - Click-to-edit mode
 */
export function WeeklyScheduleGrid({
  periods,
  templateSlots = [],
  activeDays = DEFAULT_ACTIVE_DAYS,
  onPeriodClick,
  selectedPeriod,
  className,
  showTeacher = true,
  editable = false,
  showBreaks = true,
}: WeeklyScheduleGridProps) {
  // Filter days to show based on activeDays
  const visibleDays = useMemo(() => {
    return DAYS_OF_WEEK.filter((day) => activeDays.includes(day.value));
  }, [activeDays]);

  // Group periods by day and period number
  const periodMap = useMemo(() => {
    const map = new Map<string, Period>();
    periods.forEach((p) => {
      map.set(`${p.dayOfWeek}-${p.periodNumber}`, p);
    });
    return map;
  }, [periods]);

  // Build ordered list of rows (periods and breaks)
  const scheduleRows = useMemo((): ScheduleRow[] => {
    const rows: ScheduleRow[] = [];

    if (templateSlots.length > 0) {
      // Sort slots by start time
      const sortedSlots = [...templateSlots].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      sortedSlots.forEach((slot) => {
        if (slot.isBreak) {
          if (showBreaks) {
            rows.push({
              type: "break",
              breakName: slot.breakName || "Break",
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          }
        } else {
          rows.push({
            type: "period",
            periodNumber: slot.periodNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      });
    } else if (periods.length > 0) {
      // Build from periods data
      const periodNumbers = new Set<number>();
      const timeSlots = new Map<
        number,
        { startTime: string; endTime: string }
      >();

      periods.forEach((p) => {
        periodNumbers.add(p.periodNumber);
        if (!timeSlots.has(p.periodNumber)) {
          timeSlots.set(p.periodNumber, {
            startTime: p.startTime,
            endTime: p.endTime,
          });
        }
      });

      Array.from(periodNumbers)
        .sort((a, b) => a - b)
        .forEach((periodNum) => {
          const slot = timeSlots.get(periodNum);
          if (slot) {
            rows.push({
              type: "period",
              periodNumber: periodNum,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          }
        });
    }

    return rows;
  }, [templateSlots, periods, showBreaks]);

  // Check if period is selected
  const isSelected = (day: number, periodNum: number) => {
    return selectedPeriod?.day === day && selectedPeriod?.period === periodNum;
  };

  // Handle period cell click
  const handleCellClick = (day: number, periodNum: number) => {
    if (editable && onPeriodClick) {
      onPeriodClick(day, periodNum);
    }
  };

  if (scheduleRows.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No schedule configured. Initialize from a template to get started.
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto print:overflow-visible", className)}>
      <table className="w-full border-collapse min-w-[700px] print:min-w-0">
        <thead>
          <tr>
            <th className="p-2 border border-border-subtle bg-bg-app w-[100px] print:bg-gray-100">
              <span className="text-xs text-text-muted font-medium">Period</span>
            </th>
            {visibleDays.map((day) => (
              <th
                key={day.value}
                className="p-2 border border-border-subtle bg-bg-app print:bg-gray-100"
              >
                <DayLabel day={day.value} variant="full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scheduleRows.map((row, index) => {
            if (row.type === "break") {
              // Break row - spans all day columns
              return (
                <tr key={`break-${index}`} className="bg-warning/5 print:bg-amber-50">
                  <td className="p-2 border border-border-subtle bg-warning/10 print:bg-amber-100">
                    <div className="flex flex-col items-center gap-1">
                      <Coffee className="h-4 w-4 text-warning" />
                      <span className="text-[10px] text-text-muted">
                        {row.startTime}
                      </span>
                    </div>
                  </td>
                  <td
                    colSpan={visibleDays.length}
                    className="p-3 border border-border-subtle text-center"
                  >
                    <span className="text-sm font-medium text-warning">
                      {row.breakName}
                    </span>
                    <span className="text-xs text-text-muted ml-2">
                      ({row.startTime} - {row.endTime})
                    </span>
                  </td>
                </tr>
              );
            }

            // Period row
            return (
              <tr key={`period-${row.periodNumber}`}>
                <td className="p-2 border border-border-subtle bg-bg-app print:bg-gray-50">
                  <div className="flex flex-col items-center gap-1">
                    <PeriodNumber number={row.periodNumber} size="sm" />
                    <span className="text-[10px] text-text-muted">
                      {row.startTime}
                    </span>
                  </div>
                </td>
                {visibleDays.map((day) => {
                  const period = periodMap.get(
                    `${day.value}-${row.periodNumber}`
                  );
                  const selected = isSelected(day.value, row.periodNumber);

                  return (
                    <td
                      key={day.value}
                      onClick={() => handleCellClick(day.value, row.periodNumber)}
                      className={cn(
                        "p-2 border border-border-subtle",
                        "transition-all",
                        editable && "cursor-pointer hover:bg-primary-100/30",
                        selected &&
                          "bg-primary-100/50 ring-2 ring-primary-600/50 ring-inset"
                      )}
                    >
                      {period ? (
                        <div className="space-y-1">
                          {period.subject ? (
                            <SubjectBadge
                              name={period.subject.name}
                              code={period.subject.code}
                            />
                          ) : (
                            <EmptySubjectBadge />
                          )}
                          {showTeacher && period.teacher && (
                            <p className="text-[11px] text-text-muted truncate">
                              {period.teacher.fullName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="h-10 flex items-center justify-center">
                          <span className="text-xs text-text-muted/50">—</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
