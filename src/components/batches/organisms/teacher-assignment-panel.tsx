"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { X, Save } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from "@/components/ui";
import { TeacherSelect } from "../molecules/teacher-select";
import { SubjectSelect } from "../molecules/subject-select";
import { PeriodNumber } from "../atoms/period-number";
import { TimeSlotBadge } from "../atoms/time-slot-badge";
import { DayLabel } from "../atoms/day-label";
import { cn } from "@/lib/utils/cn";
import type { Period, UpdatePeriodInput } from "@/types/schedule";

interface TeacherAssignmentPanelProps {
  period: Period | null;
  day: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  onSave: (data: UpdatePeriodInput) => void;
  onClose: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * TeacherAssignmentPanel - Panel to assign subject and teacher to a period
 *
 * Appears when a period cell is clicked in the schedule grid.
 * Allows selecting both subject and teacher for the period.
 */
export function TeacherAssignmentPanel({
  period,
  day,
  periodNumber,
  startTime,
  endTime,
  onSave,
  onClose,
  isLoading = false,
  className,
}: TeacherAssignmentPanelProps) {
  console.log("period", period);
  console.log("day", day);
  console.log("periodNumber", periodNumber);
  console.log("startTime", startTime);
  console.log("endTime", endTime);

  const [subjectId, setSubjectId] = useState<string | undefined>(
    period?.subjectId || undefined
  );
  const [teacherId, setTeacherId] = useState<string | undefined>(
    period?.teacherId || undefined
  );

  const handleSave = () => {
    onSave({
      subjectId: subjectId || null,
      teacherId: teacherId || null,
    });
  };

  const hasChanges =
    subjectId !== (period?.subjectId || undefined) ||
    teacherId !== (period?.teacherId || undefined);

  useEffect(() => {
    queueMicrotask(() => {
      setSubjectId(period?.subjectId || undefined);
      setTeacherId(period?.teacherId || undefined);
    });
  }, [period]);

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Assign Period</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period info */}
        <div className="flex items-center gap-3 p-3 bg-bg-app rounded-lg">
          <DayLabel day={day} variant="full" />
          <span className="text-text-muted">·</span>
          <PeriodNumber number={periodNumber} />
          <TimeSlotBadge startTime={startTime} endTime={endTime} />
        </div>

        {/* Subject select */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <SubjectSelect
            value={subjectId}
            onChange={setSubjectId}
            placeholder="Select subject..."
          />
        </div>

        {/* Teacher select */}
        <div className="space-y-2">
          <Label htmlFor="teacher">Teacher</Label>
          <TeacherSelect
            value={teacherId}
            onChange={setTeacherId}
            placeholder="Select teacher..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inline version for use in dialogs or sidebars
 */
export function TeacherAssignmentInline({
  period,
  day,
  periodNumber,
  onSubjectChange,
  onTeacherChange,
  className,
}: {
  period: Period | null;
  day: number;
  periodNumber: number;
  onSubjectChange: (value: string | undefined) => void;
  onTeacherChange: (value: string | undefined) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <DayLabel day={day} />
        <PeriodNumber number={periodNumber} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <SubjectSelect
            value={period?.subjectId || undefined}
            onChange={onSubjectChange}
            placeholder="Select..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Teacher</Label>
          <TeacherSelect
            value={period?.teacherId || undefined}
            onChange={onTeacherChange}
            placeholder="Select..."
          />
        </div>
      </div>
    </div>
  );
}
