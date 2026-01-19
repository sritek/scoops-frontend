"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Coffee } from "lucide-react";
import { Button, Input, Checkbox, Label, Card, CardContent } from "@/components/ui";
import { TimeRangePicker } from "../molecules/time-range-picker";
import { PeriodNumber, BreakBadge } from "../atoms/period-number";
import { cn } from "@/lib/utils/cn";
import type { PeriodTemplateSlot } from "@/types/schedule";
import { DEFAULT_PERIOD_SLOTS } from "@/types/schedule";

type SlotInput = Omit<PeriodTemplateSlot, "id" | "templateId">;

interface PeriodTemplateEditorProps {
  slots: SlotInput[];
  onChange: (slots: SlotInput[]) => void;
  className?: string;
}

/**
 * PeriodTemplateEditor - Full editor for period time slots
 * 
 * - Add/remove periods and breaks
 * - Edit timings for each slot
 * - Mark breaks with custom names
 * - Reorder slots (by changing times)
 */
export function PeriodTemplateEditor({
  slots,
  onChange,
  className,
}: PeriodTemplateEditorProps) {
  // Sort slots by start time for display
  const sortedSlots = [...slots].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  // Add a new period slot
  const addPeriod = () => {
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    const nextPeriodNum = Math.max(...slots.filter(s => !s.isBreak).map(s => s.periodNumber), 0) + 1;
    
    // Calculate next time slot (default 45 minutes after last slot)
    let startTime = "08:00";
    let endTime = "08:45";
    
    if (lastSlot) {
      startTime = lastSlot.endTime;
      const [hours, mins] = startTime.split(":").map(Number);
      const endMins = mins + 45;
      const endHours = hours + Math.floor(endMins / 60);
      endTime = `${String(endHours).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
    }

    onChange([
      ...slots,
      {
        periodNumber: nextPeriodNum,
        startTime,
        endTime,
        isBreak: false,
      },
    ]);
  };

  // Add a break slot
  const addBreak = () => {
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    
    let startTime = "10:15";
    let endTime = "10:30";
    
    if (lastSlot) {
      startTime = lastSlot.endTime;
      const [hours, mins] = startTime.split(":").map(Number);
      const endMins = mins + 15;
      const endHours = hours + Math.floor(endMins / 60);
      endTime = `${String(endHours).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
    }

    onChange([
      ...slots,
      {
        periodNumber: 0, // Breaks use 0
        startTime,
        endTime,
        isBreak: true,
        breakName: "Break",
      },
    ]);
  };

  // Remove a slot
  const removeSlot = (index: number) => {
    const slotToRemove = sortedSlots[index];
    onChange(slots.filter((s) => 
      s.startTime !== slotToRemove.startTime || s.isBreak !== slotToRemove.isBreak
    ));
  };

  // Update a slot
  const updateSlot = (index: number, updates: Partial<SlotInput>) => {
    const slotToUpdate = sortedSlots[index];
    onChange(
      slots.map((s) =>
        s.startTime === slotToUpdate.startTime && s.isBreak === slotToUpdate.isBreak
          ? { ...s, ...updates }
          : s
      )
    );
  };

  // Load default template
  const loadDefaults = () => {
    onChange([...DEFAULT_PERIOD_SLOTS]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          Period Slots ({slots.filter(s => !s.isBreak).length} periods)
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadDefaults}>
            Load Defaults
          </Button>
        </div>
      </div>

      {/* Slots list */}
      <div className="space-y-2">
        {sortedSlots.map((slot, index) => (
          <Card
            key={`${slot.startTime}-${slot.isBreak}`}
            className={cn(
              "transition-all",
              slot.isBreak && "border-warning/30 bg-warning/5"
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Drag handle (visual only for now) */}
                <GripVertical className="h-4 w-4 text-text-muted/50 shrink-0" />

                {/* Period number or break indicator */}
                <div className="w-12 shrink-0">
                  {slot.isBreak ? (
                    <Coffee className="h-4 w-4 text-warning" />
                  ) : (
                    <PeriodNumber number={slot.periodNumber} size="sm" />
                  )}
                </div>

                {/* Time range */}
                <TimeRangePicker
                  startTime={slot.startTime}
                  endTime={slot.endTime}
                  onStartTimeChange={(v) => updateSlot(index, { startTime: v })}
                  onEndTimeChange={(v) => updateSlot(index, { endTime: v })}
                />

                {/* Break name (if break) */}
                {slot.isBreak && (
                  <Input
                    value={slot.breakName || ""}
                    onChange={(e) => updateSlot(index, { breakName: e.target.value })}
                    placeholder="Break name"
                    className="w-[120px]"
                  />
                )}

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlot(index)}
                  className="text-error hover:text-error hover:bg-error/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedSlots.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            No slots added. Click buttons below to add periods or breaks.
          </div>
        )}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button variant="secondary" size="sm" onClick={addPeriod}>
          <Plus className="h-4 w-4 mr-1" />
          Add Period
        </Button>
        <Button variant="secondary" size="sm" onClick={addBreak}>
          <Coffee className="h-4 w-4 mr-1" />
          Add Break
        </Button>
      </div>
    </div>
  );
}
