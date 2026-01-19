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
  LayoutDashboard,
  Clock,
  Calendar,
  ChevronRight,
  Eye,
  TrendingUp,
  Filter,
  Lock,
} from "lucide-react";
import { useBatches } from "@/lib/api/batches";
import {
  useAttendance,
  useMarkAttendance,
  useAttendanceSummary,
  useAttendanceHistory,
} from "@/lib/api/attendance";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Avatar,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  AttendanceStatus,
  AttendanceHistoryItem,
} from "@/types/attendance";
import { PAGINATION_DEFAULTS } from "@/types";
import { usePermissions } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get date range for preset filters
 */
function getDateRange(preset: string): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split("T")[0];

  let startDate: Date;
  switch (preset) {
    case "7days":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30days":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90days":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate,
  };
}

type TabId = "dashboard" | "mark" | "history";

/**
 * Attendance Page with Tabs
 *
 * Modern, interactive UI for attendance management:
 * - Dashboard: Today's overview with stats and batch status
 * - Mark Attendance: Mark daily attendance for batches
 * - History: Browse and view past attendance records
 */
export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [chosenBatchId, setChosenBatchId] = useState<string | null>(null);

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "mark" as const, label: "Mark Attendance", icon: ClipboardCheck },
    { id: "history" as const, label: "History", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Attendance</h1>
        <p className="text-sm text-text-muted">
          Track and manage student attendance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-bg-app p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <DashboardTab
          onMarkAttendance={(batchId: string | null) => {
            setActiveTab("mark");
            setChosenBatchId(batchId);
          }}
        />
      )}
      {activeTab === "mark" && <MarkAttendanceTab batchId={chosenBatchId} />}
      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}

// =============================================================================
// Dashboard Tab
// =============================================================================

function DashboardTab({
  onMarkAttendance,
}: {
  onMarkAttendance: (batchId: string | null) => void;
}) {
  const { data: summary, isLoading, error } = useAttendanceSummary();
  const { can } = usePermissions();
  const { user } = useAuth();
  const canMarkAttendance = can("ATTENDANCE_MARK");
  const isTeacher = user?.role?.toLowerCase() === "teacher";
  
  // Get teacher's batch (for checking if they can mark a specific batch)
  const { data: batchesData } = useBatches();

  const teacherBatchIds = (!isTeacher || !user?.id || !batchesData?.data)
    ? []
    : batchesData.data.filter(b => b.classTeacherId === user.id).map(b => b.id);

  if (isLoading) {
    return <DashboardSkeleton />;
  }



  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">
            Failed to load attendance summary. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <EmptyState
          icon={LayoutDashboard}
          title="No data available"
          description="Attendance data will appear here once you start marking attendance"
        />
      </Card>
    );
  }

  const attendanceRate =
    summary.totalMarked > 0
      ? Math.round((summary.totalPresent / summary.totalMarked) * 100)
      : 0;

  const markedRate =
    summary.totalActiveStudents > 0
      ? Math.round((summary.totalMarked / summary.totalActiveStudents) * 100)
      : 0;


  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Attendance Rate Card */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Attendance Rate</p>
                <p className="text-3xl font-bold text-text-primary">
                  {attendanceRate}%
                </p>
              </div>
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90 transform">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-bg-app"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${attendanceRate * 1.76} 176`}
                    className="text-success transition-all duration-500"
                  />
                </svg>
                <TrendingUp className="absolute inset-0 m-auto h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Present Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Present Today</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary.totalPresent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absent Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <X className="h-6 w-6 text-error" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Absent Today</p>
                <p className="text-2xl font-bold text-text-primary">
                  {summary.totalAbsent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">Marking Progress</p>
                <Badge variant={markedRate === 100 ? "success" : "warning"}>
                  {summary.batchesMarked}/
                  {summary.batchesMarked + summary.batchesPending} batches
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-app">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-500"
                  style={{ width: `${markedRate}%` }}
                />
              </div>
              <p className="text-xs text-text-muted">
                {summary.totalMarked} of {summary.totalActiveStudents} students
                marked
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Batches */}
      {summary.pendingBatches?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-warning" />
              Pending Batches ({summary.pendingBatches?.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.pendingBatches?.map((batch) => {
              // Teachers can only mark their own batch
              const canMark = !isTeacher || teacherBatchIds.includes(batch.batchId);
              
              return (
                <div
                  key={batch.batchId}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-app p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                      <Users className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {batch.batchName}
                      </p>
                      <p className="text-sm text-text-muted">
                        {batch.studentCount} students
                      </p>
                    </div>
                  </div>
                  {canMark ? (
                    <Button
                      size="sm"
                      onClick={() => onMarkAttendance(batch.batchId)}
                    >
                      Mark Now
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Badge variant="default" className="text-xs">
                      <Lock className="mr-1 h-3 w-3" />
                      Not Your Batch
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Batches */}
      {summary.batchSummaries?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCheck className="h-5 w-5 text-success" />
              Completed Batches ({summary.batchSummaries?.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.batchSummaries?.map((batch) => {
                const rate =
                  batch.total > 0
                    ? Math.round((batch.present / batch.total) * 100)
                    : 0;
                return (
                  <div
                    key={batch.batchId}
                    className="rounded-lg border border-border-subtle bg-bg-app p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text-primary">
                        {batch.batchName}
                      </p>
                      <Badge
                        variant={
                          rate >= 80
                            ? "success"
                            : rate >= 60
                            ? "warning"
                            : "error"
                        }
                      >
                        {rate}%
                      </Badge>
                    </div>
                    <div className="mt-3 flex gap-4 text-sm">
                      <span className="text-success">
                        <Check className="mr-1 inline h-3.5 w-3.5" />
                        {batch.present}
                      </span>
                      <span className="text-error">
                        <X className="mr-1 inline h-3.5 w-3.5" />
                        {batch.absent}
                      </span>
                      <span className="text-text-muted">
                        Total: {batch.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Done State */}
      {summary.pendingBatches?.length === 0 &&
        summary.batchSummaries?.length === 0 && (
          <Card>
            <EmptyState
              icon={ClipboardCheck}
              title="No batches to show"
              description="Create batches and assign students to start tracking attendance"
            />
          </Card>
        )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="py-8">
          <Skeleton className="mx-auto h-32 w-full max-w-md" />
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Mark Attendance Tab
// =============================================================================

function MarkAttendanceTab({ batchId }: { batchId: string | null }) {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    batchId
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const todayDate = getTodayDate();

  // Permission and user info
  const { can } = usePermissions();
  const { user } = useAuth();
  const canMarkAttendance = can("ATTENDANCE_MARK");
  const isTeacher = user?.role?.toLowerCase() === "teacher";

  // Local state for attendance status changes
  const [localStatus, setLocalStatus] = useState<
    Record<string, AttendanceStatus | null>
  >({});

  // Fetch batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches();
  const allBatches = useMemo(() => batchesData?.data ?? [], [batchesData?.data]);
  
  // For teachers, filter to only show their assigned batch
  // For admins, show all batches
  const batches = useMemo(() => {
    if (isTeacher && user) {
      return allBatches.filter(batch => batch.classTeacherId === user.id);
    }
    return allBatches;
  }, [allBatches, isTeacher, user]);

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

          {/* Teacher notice */}
          {isTeacher && batches.length === 1 && (
            <div className="flex items-center gap-2 rounded-lg bg-primary-100 p-3 text-sm text-primary-600 dark:bg-primary-900/30">
              <Lock className="h-4 w-4" />
              <span>You can only mark attendance for your assigned batch.</span>
            </div>
          )}

          {/* No assigned batch notice for teachers */}
          {isTeacher && batches.length === 0 && !batchesLoading && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
              <AlertCircle className="h-4 w-4" />
              <span>You are not assigned as class teacher to any batch. Contact admin to assign you a batch.</span>
            </div>
          )}
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

// =============================================================================
// History Tab
// =============================================================================

function HistoryTab() {
  const [datePreset, setDatePreset] = useState("7days");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingSession, setViewingSession] =
    useState<AttendanceHistoryItem | null>(null);

  // Get date range from preset
  const { startDate, endDate } = getDateRange(datePreset);

  // Fetch batches for filter
  const { data: batchesData } = useBatches();
  const batches = batchesData?.data ?? [];

  // Fetch history
  const {
    data: historyData,
    isLoading,
    error,
  } = useAttendanceHistory({
    batchId: selectedBatchId || undefined,
    startDate,
    endDate,
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  const history = historyData?.data ?? [];
  const pagination = historyData?.pagination;

  console.log('historyData', historyData)

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* View Details Modal */}
      <ViewAttendanceModal
        session={viewingSession}
        onClose={() => setViewingSession(null)}
      />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">
              Filters
            </span>
          </div>

          {/* Date Range */}
          <div className="space-y-1.5">
            <Label className="text-xs">Date Range</Label>
            <Select
              value={datePreset}
              onValueChange={(value) => {
                setDatePreset(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batch Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs">Batch</Label>
            <Select
              value={selectedBatchId || "all"}
              onValueChange={(value) => {
                setSelectedBatchId(value === "all" ? "" : value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load attendance history. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && <HistorySkeleton />}

      {/* History List */}
      {!isLoading && !error && (
        <>
          {history.length === 0 ? (
            <Card>
              <EmptyState
                icon={Clock}
                title="No attendance records"
                description="No attendance has been marked in the selected date range"
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <HistoryCard
                  key={session.id}
                  session={session}
                  onView={() => setViewingSession(session)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Card>
              <div className="px-4">
                <Pagination
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * History card showing attendance session summary
 */
function HistoryCard({
  session,
  onView,
}: {
  session: AttendanceHistoryItem;
  onView: () => void;
}) {
  const stats = session.stats;
  const rateColor =
    stats.attendanceRate >= 80
      ? "text-success"
      : stats.attendanceRate >= 60
      ? "text-warning"
      : "text-error";

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Session Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-text-primary">
                {session.batchName}
              </p>
              <Badge variant="default">{formatDate(session.date)}</Badge>
            </div>
            <p className="text-sm text-text-muted">
              Marked by {session.createdBy.name}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            {/* Attendance Bar */}
            <div className="flex items-center gap-3">
              <div className="hidden w-24 sm:block">
                <div className="h-2 overflow-hidden rounded-full bg-bg-app">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      stats.attendanceRate >= 80
                        ? "bg-success"
                        : stats.attendanceRate >= 60
                        ? "bg-warning"
                        : "bg-error"
                    )}
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
              </div>
              <span className={cn("text-lg font-bold", rateColor)}>
                {stats.attendanceRate}%
              </span>
            </div>

            {/* Stats Pills */}
            <div className="hidden items-center gap-2 text-sm lg:flex">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-success dark:bg-green-900">
                {stats.present} P
              </span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-error dark:bg-red-900">
                {stats.absent} A
              </span>
            </div>

            {/* View Button */}
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Modal to view attendance details (read-only)
 */
function ViewAttendanceModal({
  session,
  onClose,
}: {
  session: AttendanceHistoryItem | null;
  onClose: () => void;
}) {
  // Fetch full attendance data for this session
  const { data: attendance, isLoading } = useAttendance(
    session?.batchId || null,
    session?.date || null,
    { limit: 100 }
  );

  const records = attendance?.records ?? [];

  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {session?.batchName}
          </DialogTitle>
          <DialogDescription>
            Attendance for {session ? formatDate(session.date) : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Stats Summary */}
        {session && (
          <div className="flex gap-4 rounded-lg bg-bg-app p-4">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-success">
                {session.stats.present}
              </p>
              <p className="text-xs text-text-muted">Present</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-error">
                {session.stats.absent}
              </p>
              <p className="text-xs text-text-muted">Absent</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-text-primary">
                {session.stats.attendanceRate}%
              </p>
              <p className="text-xs text-text-muted">Rate</p>
            </div>
          </div>
        )}

        {/* Student List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {records.map((record) => (
              <div
                key={record.studentId}
                className="flex items-center justify-between rounded-lg border border-border-subtle p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    fallback={record.studentName.charAt(0)}
                    alt={record.studentName}
                    size="sm"
                  />
                  <span className="text-sm font-medium">
                    {record.studentName}
                  </span>
                </div>
                <Badge
                  variant={record.status === "present" ? "success" : "error"}
                >
                  {record.status === "present" ? (
                    <Check className="mr-1 h-3 w-3" />
                  ) : (
                    <X className="mr-1 h-3 w-3" />
                  )}
                  {record.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
