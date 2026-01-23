"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Input,
  Label,
  Button,
} from "@/components/ui";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAttendanceHistory } from "@/lib/api/attendance";
import type { AttendanceHistoryItem } from "@/types/attendance";
import Link from "next/link";

interface StudentAttendanceTabProps {
  studentId: string;
  batchId?: string | null;
  batchName?: string | null;
}

/**
 * Student Attendance Tab Component
 *
 * Shows attendance history for the student's batch with:
 * - Summary statistics
 * - List of attendance sessions with date filtering
 * - Links to detailed attendance view
 */
export function StudentAttendanceTab({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  studentId: _studentId,
  batchId,
  batchName,
}: StudentAttendanceTabProps) {
  // Date range filter (default to last 30 days)
  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }, []);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fetch attendance history for the student's batch
  const { data: attendanceData, isLoading } = useAttendanceHistory({
    batchId: batchId ?? undefined,
    startDate,
    endDate,
    limit: 100,
  });

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!attendanceData?.data || attendanceData.data.length === 0) {
      return null;
    }

    const sessions = attendanceData.data as AttendanceHistoryItem[];
    const totalSessions = sessions.length;
    const avgAttendanceRate =
      Math.round(
        sessions.reduce(
          (sum: number, s: AttendanceHistoryItem) =>
            sum + s.stats.attendanceRate,
          0
        ) / totalSessions
      ) || 0;
    const highestRate = Math.max(
      ...sessions.map((s: AttendanceHistoryItem) => s.stats.attendanceRate)
    );
    const lowestRate = Math.min(
      ...sessions.map((s: AttendanceHistoryItem) => s.stats.attendanceRate)
    );

    return {
      totalSessions,
      avgAttendanceRate,
      highestRate,
      lowestRate,
    };
  }, [attendanceData]);

  if (!batchId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-text-muted">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Batch Assigned</p>
            <p className="text-sm mt-1">
              This student is not assigned to any batch. Assign a batch to view
              attendance history.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <AttendanceTabSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Batch Context */}
      <Card className="bg-primary-50/50 border-primary-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-text-primary">
                  Viewing attendance for batch: {batchName || "Unknown"}
                </p>
                <p className="text-sm text-text-muted">
                  Individual student records are tracked within batch attendance
                  sessions.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/batches/${batchId}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Batch
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-text-muted" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="startDate">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="endDate">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Sessions"
            value={summary.totalSessions}
            icon={<Calendar className="h-4 w-4" />}
          />
          <SummaryCard
            label="Avg. Attendance Rate"
            value={`${summary.avgAttendanceRate}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            variant={
              summary.avgAttendanceRate >= 75
                ? "success"
                : summary.avgAttendanceRate >= 50
                ? "warning"
                : "error"
            }
          />
          <SummaryCard
            label="Highest Rate"
            value={`${summary.highestRate}%`}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <SummaryCard
            label="Lowest Rate"
            value={`${summary.lowestRate}%`}
            icon={<XCircle className="h-4 w-4" />}
            variant={summary.lowestRate < 50 ? "error" : "default"}
          />
        </div>
      )}

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-text-muted" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceData?.data && attendanceData.data.length > 0 ? (
            <div className="space-y-3">
              {(attendanceData.data as AttendanceHistoryItem[]).map(
                (session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border-subtle hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center p-2 bg-surface-elevated rounded min-w-[60px]">
                        <span className="text-xs text-text-muted uppercase">
                          {formatDayOfWeek(session.date)}
                        </span>
                        <span className="text-lg font-bold">
                          {formatDayNumber(session.date)}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatMonth(session.date)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {formatDate(session.date)}
                        </p>
                        <p className="text-sm text-text-muted">
                          Marked by {session.createdBy.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {session.stats.present}
                          </Badge>
                          <Badge variant="error">
                            <XCircle className="h-3 w-3 mr-1" />
                            {session.stats.absent}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted mt-1">
                          of {session.stats.total} students
                        </p>
                      </div>
                      <AttendanceRateBadge
                        rate={session.stats.attendanceRate}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Attendance Records</p>
              <p className="text-sm mt-1">
                No attendance has been marked for this batch in the selected
                date range.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "success" | "warning" | "error" | "default";
}) {
  const colorClass =
    variant === "success"
      ? "text-green-600"
      : variant === "warning"
      ? "text-amber-600"
      : variant === "error"
      ? "text-red-600"
      : "text-text-primary";

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
          {icon}
          <span>{label}</span>
        </div>
        <p className={`text-2xl font-semibold ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function AttendanceRateBadge({ rate }: { rate: number }) {
  const variant =
    rate >= 90
      ? "success"
      : rate >= 75
      ? "default"
      : rate >= 50
      ? "warning"
      : "error";

  return (
    <Badge variant={variant} className="text-base px-3 py-1">
      {rate}%
    </Badge>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatDayOfWeek(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

function formatDayNumber(dateString: string): string {
  return new Date(dateString).getDate().toString();
}

function formatMonth(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "short",
  });
}

function AttendanceTabSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
