"use client";

import { useState, useCallback } from "react";
import {
  Check,
  X,
  AlertCircle,
  ClipboardCheck,
  Clock,
  Eye,
  Filter,
} from "lucide-react";
import { useBatches } from "@/lib/api/batches";
import {
  useAttendance,
  useAttendanceHistory,
} from "@/lib/api/attendance";
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
  AttendanceHistoryItem,
} from "@/types/attendance";
import { PAGINATION_DEFAULTS } from "@/types";

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

// =============================================================================
// History Tab
// =============================================================================

export function HistoryTab() {
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