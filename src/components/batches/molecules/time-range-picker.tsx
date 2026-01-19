"use client";

import { Input } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * TimeRangePicker - Two inputs for selecting start and end time
 */
export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  className,
}: TimeRangePickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="time"
        value={startTime}
        onChange={(e) => onStartTimeChange(e.target.value)}
        disabled={disabled}
        className="w-[110px]"
      />
      <span className="text-text-muted">to</span>
      <Input
        type="time"
        value={endTime}
        onChange={(e) => onEndTimeChange(e.target.value)}
        disabled={disabled}
        className="w-[110px]"
      />
    </div>
  );
}
