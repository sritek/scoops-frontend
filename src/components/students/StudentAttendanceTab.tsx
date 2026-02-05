"use client";

import { useState, useMemo, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Input,
  Label,
  DataTable,
} from "@/components/ui";
import {
  Calendar,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useStudentAttendanceHistory } from "@/lib/api/attendance";
import type {
  StudentAttendanceHistoryResponse,
  StudentAttendanceRecord,
} from "@/types/attendance";

const attendanceHistoryColumns: ColumnDef<StudentAttendanceRecord>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "batchName",
    header: "Batch",
    cell: ({ getValue }) => getValue() as string,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as "present" | "absent";
      return (
        <Badge
          variant={status === "present" ? "success" : "error"}
          className="px-2 py-0.5 text-xs capitalize"
        >
          {status === "present" ? "Present" : "Absent"}
        </Badge>
      );
    },
  },
];

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
  studentId,
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when date range changes
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  // Fetch attendance history for this student (paginated)
  const { data: attendanceData, isLoading } = useStudentAttendanceHistory(
    studentId,
    {
      startDate,
      endDate,
      page,
      limit: pageSize,
    }
  );

  const response = attendanceData as
    | StudentAttendanceHistoryResponse
    | undefined;
  const summary = response?.summary ?? null;
  const pagination = response?.pagination;
  const records = response?.records ?? [];

  const handleLimitChange = (limit: number) => {
    setPageSize(limit);
    setPage(1);
  };

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            label="Total Sessions"
            value={summary.totalSessions}
            icon={<Calendar className="h-4 w-4" />}
          />
          <SummaryCard
            label="Attendance Rate"
            value={
              summary.attendancePercentage !== null
                ? `${summary.attendancePercentage}%`
                : "N/A"
            }
            icon={<TrendingUp className="h-4 w-4" />}
            variant={
              (summary.attendancePercentage ?? 0) >= 75
                ? "success"
                : (summary.attendancePercentage ?? 0) >= 50
                ? "warning"
                : "error"
            }
          />
          <SummaryCard
            label="Present Days"
            value={summary.presentDays}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
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
          {pagination?.total === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Attendance Records</p>
              <p className="text-sm mt-1">
                No attendance has been recorded for this student in the selected
                date range.
              </p>
            </div>
          ) : (
            <>
              <DataTable<StudentAttendanceRecord>
                columns={attendanceHistoryColumns}
                data={records}
                paginationMode="server"
                serverPagination={pagination!}
                onPageChange={setPage}
                onLimitChange={handleLimitChange}
                limitOptions={[10, 20, 50]}
                showLimitSelector={true}
                isLoading={isLoading}
                emptyMessage="No attendance records in this range."
              />
            </>
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
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
