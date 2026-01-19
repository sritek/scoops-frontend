"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { DayLabel, DayLabelBadge } from "../atoms/day-label";
import { PeriodNumber } from "../atoms/period-number";
import { TimeSlotBadge } from "../atoms/time-slot-badge";
import { SubjectBadge, EmptySubjectBadge } from "../atoms/subject-badge";
import { cn } from "@/lib/utils/cn";
import type { Period } from "@/types/schedule";
import { DAYS_OF_WEEK, getDayLabel } from "@/types/schedule";

interface CalendarScheduleViewProps {
  periods: Period[];
  onPeriodClick?: (period: Period) => void;
  className?: string;
}

// Time slots for the calendar (hourly)
const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const hour = 8 + i;
  return `${String(hour).padStart(2, "0")}:00`;
});

/**
 * CalendarScheduleView - Calendar-based view of the timetable
 *
 * Features:
 * - Week view (default) with day columns
 * - Day view toggle for detailed single-day view
 * - Color-coded by subject
 * - Click to edit period
 */
export function CalendarScheduleView({
  periods,
  onPeriodClick,
  className,
}: CalendarScheduleViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState(1); // Monday

  // Group periods by day
  const periodsByDay = useMemo(() => {
    const map = new Map<number, Period[]>();
    DAYS_OF_WEEK.forEach((d) => map.set(d.value, []));
    periods.forEach((p) => {
      const dayPeriods = map.get(p.dayOfWeek) || [];
      dayPeriods.push(p);
      map.set(p.dayOfWeek, dayPeriods);
    });
    return map;
  }, [periods]);

  // Calculate position for a period in the calendar
  const getPeriodPosition = (period: Period) => {
    const [startHour, startMin] = period.startTime.split(":").map(Number);
    const [endHour, endMin] = period.endTime.split(":").map(Number);

    const startOffset = (startHour - 8) * 60 + startMin;
    const duration = endHour * 60 + endMin - (startHour * 60 + startMin);

    return {
      top: `${(startOffset / 60) * 60}px`,
      height: `${(duration / 60) * 60 - 4}px`,
    };
  };

  // Navigate days in day view
  const navigateDay = (direction: number) => {
    const newDay = selectedDay + direction;
    if (newDay >= 1 && newDay <= 6) {
      setSelectedDay(newDay);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {viewMode === "day" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDay(-1)}
                disabled={selectedDay <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[100px] text-center">
                {getDayLabel(selectedDay)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDay(1)}
                disabled={selectedDay >= 6}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 bg-bg-app rounded-lg p-1">
          <Button
            variant={viewMode === "week" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            <Grid className="h-4 w-4 mr-1" />
            Week
          </Button>
          <Button
            variant={viewMode === "day" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            <List className="h-4 w-4 mr-1" />
            Day
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === "week" ? (
        <WeekView
          periodsByDay={periodsByDay}
          onPeriodClick={onPeriodClick}
          getPeriodPosition={getPeriodPosition}
        />
      ) : (
        <DayView
          day={selectedDay}
          periods={periodsByDay.get(selectedDay) || []}
          onPeriodClick={onPeriodClick}
        />
      )}
    </div>
  );
}

/**
 * Week View - 6-column grid (Mon-Sat) with time rows
 */
function WeekView({
  periodsByDay,
  onPeriodClick,
  getPeriodPosition,
}: {
  periodsByDay: Map<number, Period[]>;
  onPeriodClick?: (period: Period) => void;
  getPeriodPosition: (period: Period) => { top: string; height: string };
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-border-subtle">
          <div className="p-2" />
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="p-2 text-center border-l border-border-subtle"
            >
              <DayLabel day={day.value} variant="full" />
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)]">
          {/* Time labels */}
          <div className="relative">
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="h-[60px] border-b border-border-subtle pr-2 text-right"
              >
                <span className="text-xs text-text-muted -mt-2 block">
                  {time}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="relative border-l border-border-subtle"
              style={{ height: `${TIME_SLOTS.length * 60}px` }}
            >
              {/* Time grid lines */}
              {TIME_SLOTS.map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-b border-border-subtle/50"
                  style={{ top: `${i * 60}px`, height: "60px" }}
                />
              ))}

              {/* Periods */}
              {periodsByDay.get(day.value)?.map((period) => {
                const pos = getPeriodPosition(period);
                return (
                  <div
                    key={period.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md p-1.5 border",
                      "bg-bg-surface border-border-subtle",
                      "overflow-hidden transition-all",
                      onPeriodClick &&
                        "cursor-pointer hover:shadow-md hover:z-10"
                    )}
                    style={pos}
                    onClick={() => onPeriodClick?.(period)}
                  >
                    <div className="flex items-center gap-2">
                      <PeriodNumber number={period.periodNumber} size="sm" />

                      <div>
                        {period.subject && (
                          <p className="text-xs font-medium text-text-primary truncate">
                            {period.subject.name}
                          </p>
                        )}
                        {period.teacher && (
                          <p className="text-[10px] text-text-muted truncate">
                            {period.teacher.fullName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Day View - Detailed single-day schedule
 */
function DayView({
  day,
  periods,
  onPeriodClick,
}: {
  day: number;
  periods: Period[];
  onPeriodClick?: (period: Period) => void;
}) {
  const sortedPeriods = [...periods].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <Card>
      <CardContent className="p-4">
        {sortedPeriods.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No periods scheduled for {getDayLabel(day)}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPeriods.map((period) => (
              <div
                key={period.id}
                onClick={() => onPeriodClick?.(period)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border border-border-subtle",
                  "bg-bg-surface transition-all",
                  onPeriodClick && "cursor-pointer hover:border-primary-600/50"
                )}
              >
                <div className="shrink-0 space-y-1 space-x-2">
                  <PeriodNumber number={period.periodNumber} />
                  <TimeSlotBadge
                    startTime={period.startTime}
                    endTime={period.endTime}
                    compact
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {period.subject ? (
                    <SubjectBadge
                      name={period.subject.name}
                      code={period.subject.code}
                      showCode
                    />
                  ) : (
                    <EmptySubjectBadge />
                  )}
                  {period.teacher && (
                    <p className="mt-1.5 text-sm text-text-muted">
                      {period.teacher.fullName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
