"use client";

import { useState, useMemo, useCallback } from "react";
import { Check, X, AlertCircle, ClipboardCheck, Users, CheckCheck, XCircle } from "lucide-react";
import { useBatches } from "@/lib/api/batches";
import { useAttendance, useMarkAttendance } from "@/lib/api/attendance";
import {
  Button,
  Card,
  CardContent,
  Spinner,
  EmptyState,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Pagination,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/attendance";
import { PAGINATION_DEFAULTS } from "@/types";

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Attendance Marking Page
 *
 * Mobile-optimized UI for marking attendance:
 * - Batch selector dropdown
 * - Date display (today only - backend restriction)
 * - Large present/absent toggle buttons
 * - Quick actions: Mark all present/absent
 * - Single "Save Attendance" action
 * - Pagination for large batches
 * - Success toast after saving
 *
 * Requires: ATTENDANCE_MARK permission (admin + teacher)
 */
export default function AttendancePage() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const todayDate = getTodayDate();

  // Local state for attendance status changes (persists across pages)
  const [localStatus, setLocalStatus] = useState<
    Record<string, AttendanceStatus>
  >({});

  // Fetch batches for dropdown (no pagination needed - usually small list)
  const { data: batchesData, isLoading: batchesLoading } = useBatches();
  const batches = batchesData?.data ?? [];

  // Fetch attendance for selected batch with pagination
  const {
    data: attendance,
    isLoading: attendanceLoading,
    error: attendanceError,
  } = useAttendance(selectedBatchId, todayDate, {
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  // Mark attendance mutation
  const {
    mutate: saveAttendance,
    isPending: isSaving,
    error: saveError,
  } = useMarkAttendance();

  // Merge server data with local changes
  const records = useMemo(() => {
    if (!attendance?.records) return [];
    return attendance.records.map((record) => ({
      ...record,
      status: localStatus[record.studentId] ?? record.status,
    }));
  }, [attendance?.records, localStatus]);

  const pagination = attendance?.pagination;

  // Check if all students on current page have a status
  const allMarkedOnPage = records.every((r) => r.status !== null);

  // Count present/absent on current page
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const unmarkedCount = records.filter((r) => r.status === null).length;

  // Handle status toggle
  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    setLocalStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  }, []);

  // Mark all students on current page as present
  const handleMarkAllPresent = useCallback(() => {
    if (!records.length) return;
    const updates: Record<string, AttendanceStatus> = {};
    records.forEach((r) => {
      updates[r.studentId] = "present";
    });
    setLocalStatus((prev) => ({ ...prev, ...updates }));
  }, [records]);

  // Mark all students on current page as absent
  const handleMarkAllAbsent = useCallback(() => {
    if (!records.length) return;
    const updates: Record<string, AttendanceStatus> = {};
    records.forEach((r) => {
      updates[r.studentId] = "absent";
    });
    setLocalStatus((prev) => ({ ...prev, ...updates }));
  }, [records]);

  // Handle save - saves current page's attendance
  const handleSave = () => {
    if (!selectedBatchId || !allMarkedOnPage) return;

    const attendanceRecords = records.map((r) => ({
      studentId: r.studentId,
      status: r.status as AttendanceStatus,
    }));

    saveAttendance(
      {
        batchId: selectedBatchId,
        date: todayDate,
        records: attendanceRecords,
      },
      {
        onSuccess: () => {
          // Clear local changes for saved students after successful save
          const savedStudentIds = new Set(records.map((r) => r.studentId));
          setLocalStatus((prev) => {
            const next = { ...prev };
            savedStudentIds.forEach((id) => delete next[id]);
            return next;
          });
          
          // Show success message
          setSuccessMessage(`Attendance saved for ${records.length} students`);
          setTimeout(() => setSuccessMessage(null), 3000);
        },
      }
    );
  };

  // Reset local state and page when batch changes
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    setLocalStatus({});
    setCurrentPage(1);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          Mark Attendance
        </h1>
        <p className="text-sm text-text-muted">
          Mark daily attendance for your batch
        </p>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-2 rounded-lg bg-success px-4 py-3 text-white shadow-lg">
            <Check className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Selectors Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Batch Selector */}
          <div className="space-y-2">
            <Label htmlFor="batch">Select Batch</Label>
            {batchesLoading ? (
              <Skeleton className="h-11 w-full" />
            ) : (
              <Select
                value={selectedBatchId || ""}
                onValueChange={handleBatchChange}
              >
                <SelectTrigger id="batch">
                  <SelectValue placeholder="Choose a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date Display */}
          <div className="space-y-2">
            <Label>Date</Label>
            <div className="flex h-11 items-center rounded-lg border border-border-subtle bg-bg-app px-3">
              <span className="text-sm text-text-primary">{todayDate}</span>
              <span className="ml-2 text-xs text-text-muted">(Today)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error States */}
      {(attendanceError || saveError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              {attendanceError
                ? "Failed to load attendance. Please try again."
                : saveError instanceof Error
                  ? saveError.message
                  : "Failed to save attendance. Please try again."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State - Skeleton */}
      {selectedBatchId && attendanceLoading && (
        <div className="space-y-3">
          {/* Summary bar skeleton */}
          <Skeleton className="h-14 w-full rounded-lg" />
          
          {/* Quick actions skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Student cards skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Skeleton className="h-5 w-40" />
                  <div className="flex gap-2">
                    <Skeleton className="h-12 w-28" />
                    <Skeleton className="h-12 w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Batch Selected */}
      {!selectedBatchId && !batchesLoading && (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="Select a batch"
            description="Choose a batch above to mark attendance"
          />
        </Card>
      )}

      {/* Students List */}
      {selectedBatchId && !attendanceLoading && attendance && (
        <>
          {records.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No students in batch"
                description="This batch has no active students"
              />
            </Card>
          ) : (
            <>
              {/* Summary Bar */}
              <div
                className="flex items-center justify-between rounded-lg bg-bg-app p-4"
                role="status"
                aria-live="polite"
                aria-label={`Attendance summary: ${presentCount} present, ${absentCount} absent, ${records.length} students on this page`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success" aria-hidden="true" />
                    <span className="text-sm font-medium">{presentCount} Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-error" aria-hidden="true" />
                    <span className="text-sm font-medium">{absentCount} Absent</span>
                  </div>
                </div>
                {pagination && (
                  <span className="text-sm text-text-muted">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} students)
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkAllPresent}
                  className="text-success hover:text-success"
                >
                  <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                  Mark All Present
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkAllAbsent}
                  className="text-error hover:text-error"
                >
                  <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Mark All Absent
                </Button>
              </div>

              {/* Student Cards */}
              <div className="space-y-3">
                {records.map((record) => (
                  <StudentAttendanceCard
                    key={record.studentId}
                    studentName={record.studentName}
                    status={record.status}
                    onStatusChange={(status) =>
                      handleStatusChange(record.studentId, status)
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <Card>
                  <div className="px-4">
                    <Pagination
                      pagination={pagination}
                      onPageChange={setCurrentPage}
                      showInfo={false}
                    />
                  </div>
                </Card>
              )}

              {/* Save Button */}
              <div className="sticky bottom-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!allMarkedOnPage || isSaving}
                  className="w-full h-14 text-base"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : allMarkedOnPage ? (
                    "Save Attendance"
                  ) : (
                    `Mark all students (${unmarkedCount} remaining)`
                  )}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Individual student attendance card with large toggle buttons
 */
function StudentAttendanceCard({
  studentName,
  status,
  onStatusChange,
}: {
  studentName: string;
  status: AttendanceStatus | null;
  onStatusChange: (status: AttendanceStatus) => void;
}) {
  const studentId = studentName.replace(/\s+/g, "-").toLowerCase();

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Student Name */}
          <p id={`student-${studentId}`} className="font-medium text-text-primary">
            {studentName}
          </p>

          {/* Toggle Buttons */}
          <div
            className="flex gap-2"
            role="group"
            aria-labelledby={`student-${studentId}`}
          >
            <button
              type="button"
              onClick={() => onStatusChange("present")}
              aria-pressed={status === "present"}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2",
                "h-12 px-6 rounded-lg font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                status === "present"
                  ? "bg-success text-white"
                  : "bg-bg-app text-text-muted hover:bg-green-50 hover:text-success border border-border-subtle"
              )}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              <span>Present</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusChange("absent")}
              aria-pressed={status === "absent"}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2",
                "h-12 px-6 rounded-lg font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                status === "absent"
                  ? "bg-error text-white"
                  : "bg-bg-app text-text-muted hover:bg-red-50 hover:text-error border border-border-subtle"
              )}
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span>Absent</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
