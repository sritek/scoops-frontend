"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Check,
  X,
  AlertCircle,
  ClipboardCheck,
  Users,
  CheckCheck,
  XCircle,
  Calendar,
} from "lucide-react";
import { useBatches } from "@/lib/api/batches";
import {
  useAttendance,
  useMarkAttendance,
} from "@/lib/api/attendance";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Pagination,
  Skeleton,
  Badge,
  Avatar,
  Spinner,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  AttendanceStatus,
} from "@/types/attendance";
import { PAGINATION_DEFAULTS } from "@/types";

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }


// =============================================================================
// Mark Attendance Tab
// =============================================================================

export function MarkAttendanceTab({ batchId }: { batchId: string | null }) {
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
      batchId
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const todayDate = getTodayDate();
  
    // Local state for attendance status changes
    const [localStatus, setLocalStatus] = useState<
      Record<string, AttendanceStatus | null>
    >({});
  
    // Fetch batches
    const { data: batchesData, isLoading: batchesLoading } = useBatches();
    const batches = batchesData?.data ?? [];
  
    // Fetch attendance for selected batch
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
      if (!attendance || !attendance.records)
        return [] as Array<{
          studentId: string;
          studentName: string;
          status: AttendanceStatus | null;
          markedAt?: string;
        }>;
      return attendance.records.map((record) => ({
        ...record,
        status: Object.prototype.hasOwnProperty.call(
          localStatus,
          record.studentId
        )
          ? localStatus[record.studentId]
          : (record.status as AttendanceStatus | null),
      }));
    }, [attendance, localStatus]);
  
    const pagination = attendance?.pagination;
  
    // Stats
    const allMarkedOnPage =
      records.length > 0 && records.every((r) => r.status !== null);
    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const unmarkedCount = records.filter((r) => r.status === null).length;
  
    // Handlers
    const handleStatusChange = useCallback(
      (studentId: string, status: AttendanceStatus) => {
        setLocalStatus((prev) => ({ ...prev, [studentId]: status }));
      },
      []
    );
  
    const handleMarkAllPresent = useCallback(() => {
      if (!records.length) return;
      const updates: Record<string, AttendanceStatus> = {};
      for (const r of records) {
        updates[r.studentId] = "present";
      }
      setLocalStatus((prev) => ({ ...prev, ...updates }));
    }, [records]);
  
    const handleMarkAllAbsent = useCallback(() => {
      if (!records.length) return;
      const updates: Record<string, AttendanceStatus> = {};
      for (const r of records) {
        updates[r.studentId] = "absent";
      }
      setLocalStatus((prev) => ({ ...prev, ...updates }));
    }, [records]);
  
    const handleSave = () => {
      if (!selectedBatchId || !allMarkedOnPage) return;
  
      const attendanceRecords = records.map((r) => ({
        studentId: r.studentId,
        status: r.status as AttendanceStatus,
      }));
  
      saveAttendance(
        { batchId: selectedBatchId, date: todayDate, records: attendanceRecords },
        {
          onSuccess: () => {
            const savedStudentIds = new Set(records.map((r) => r.studentId));
            setLocalStatus((prev) => {
              const next = { ...prev };
              for (const id of savedStudentIds) {
                delete next[id];
              }
              return next;
            });
            setSuccessMessage(`Attendance saved for ${records.length} students`);
            setTimeout(() => setSuccessMessage(null), 3000);
          },
        }
      );
    };
  
    const handleBatchChange = (batchId: string) => {
      setSelectedBatchId(batchId);
      setLocalStatus({});
      setCurrentPage(1);
      setSuccessMessage(null);
    };
  
    // Get student count for selected batch
    const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  
    return (
      <div className="space-y-6">
        {/* Success Toast */}
        {successMessage && (
          <div className="fixed right-4 top-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 rounded-lg bg-success px-4 py-3 text-white shadow-lg">
              <Check className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}
  
        {/* Selectors Card */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            {/* Batch Selector */}
            <div className="space-y-2">
              <Label htmlFor="batch">Select Batch</Label>
              {batchesLoading ? (
                <Skeleton className="h-11 w-full" />
              ) : batches.length === 0 ? (
                <div className="flex h-11 items-center rounded-lg border border-border-subtle bg-bg-app px-3">
                  <span className="text-sm text-text-muted">
                    No batches available
                  </span>
                </div>
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
                        <div className="flex items-center gap-2">
                          <span>{batch.name}</span>
                          <Badge variant="default" className="text-xs">
                            {batch.studentCount || 0} students
                          </Badge>
                        </div>
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
                <Calendar className="mr-2 h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-primary">
                  {formatDate(todayDate)}
                </span>
                <Badge variant="info" className="ml-2">
                  Today
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
  
        {/* Error States */}
        {(attendanceError || saveError) && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
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
  
        {/* Loading State */}
        {selectedBatchId && attendanceLoading && <MarkAttendanceSkeleton />}
  
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
                  description="This batch has no active students assigned. Add students to this batch first."
                />
              </Card>
            ) : (
              <>
                {/* Summary Bar */}
                <div
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-bg-app p-4"
                  role="status"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-success" />
                      <span className="text-sm font-medium">
                        {presentCount} Present
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-error" />
                      <span className="text-sm font-medium">
                        {absentCount} Absent
                      </span>
                    </div>
                    {unmarkedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-text-muted" />
                        <span className="text-sm font-medium text-text-muted">
                          {unmarkedCount} Unmarked
                        </span>
                      </div>
                    )}
                  </div>
                  {pagination && (
                    <span className="text-sm text-text-muted">
                      Page {pagination.page} of {pagination.totalPages}
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
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark All Present
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleMarkAllAbsent}
                    className="text-error hover:text-error"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark All Absent
                  </Button>
                </div>
  
                {/* Student Cards */}
                <div className="space-y-2">
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
                    className="h-14 w-full text-base"
                  >
                    {isSaving ? (
                      <>
                        <Spinner className="mr-2 h-5 w-5" />
                        Saving...
                      </>
                    ) : allMarkedOnPage ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Save Attendance
                      </>
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
  
  function MarkAttendanceSkeleton() {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
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
    );
  }
  
  /**
   * Individual student attendance card with toggle buttons
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
      <Card
        className={cn(
          "transition-all duration-200",
          status === "present" &&
            "border-success/50 bg-green-50/50 dark:bg-green-950/20",
          status === "absent" && "border-error/50 bg-red-50/50 dark:bg-red-950/20"
        )}
      >
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Student Info */}
            <div className="flex items-center gap-3">
              <Avatar
                fallback={studentName.charAt(0)}
                alt={studentName}
                size="sm"
              />
              <p
                id={`student-${studentId}`}
                className="font-medium text-text-primary"
              >
                {studentName}
              </p>
            </div>
  
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
                  "flex flex-1 items-center justify-center gap-2 sm:flex-none",
                  "h-11 rounded-lg px-5 font-medium transition-all",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  status === "present"
                    ? "bg-success text-white shadow-sm"
                    : "border border-border-subtle bg-bg-surface text-text-muted hover:border-success hover:text-success"
                )}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Present</span>
              </button>
  
              <button
                type="button"
                onClick={() => onStatusChange("absent")}
                aria-pressed={status === "absent"}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 sm:flex-none",
                  "h-11 rounded-lg px-5 font-medium transition-all",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  status === "absent"
                    ? "bg-error text-white shadow-sm"
                    : "border border-border-subtle bg-bg-surface text-text-muted hover:border-error hover:text-error"
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Absent</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }