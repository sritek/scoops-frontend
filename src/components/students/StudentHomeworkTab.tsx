"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DataTable,
} from "@/components/ui";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  useHomeworkList,
  type HomeworkStatus,
  type HomeworkListItem,
} from "@/lib/api/homework";
import type { PaginationMeta } from "@/types";

interface StudentHomeworkTabProps {
  studentId: string;
  batchId?: string | null;
  batchName?: string | null;
}

const STATUS_LABELS: Record<HomeworkStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

function formatHomeworkDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const homeworkTableColumns: ColumnDef<HomeworkListItem>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/homework/${row.original.id}`}
        className="font-medium text-primary-600 hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "subjectName",
    header: "Subject",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ getValue }) => formatHomeworkDate(getValue() as string),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <HomeworkStatusBadge
        status={row.original.status}
        isOverdue={row.original.isOverdue}
      />
    ),
  },
  {
    accessorKey: "submissionCount",
    header: "Submissions",
    cell: ({ getValue }) => getValue() as number,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/homework/${row.original.id}`}>
          <ExternalLink className="h-4 w-4 mr-1" />
          View
        </Link>
      </Button>
    ),
  },
];

function HomeworkStatusBadge({
  status,
  isOverdue,
}: {
  status: HomeworkStatus;
  isOverdue: boolean;
}) {
  if (isOverdue && status === "published") {
    return (
      <Badge variant="error" className="flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3" />
        Overdue
      </Badge>
    );
  }
  const variants: Record<HomeworkStatus, "success" | "warning" | "default"> = {
    draft: "default",
    published: "success",
    closed: "default",
  };
  return (
    <Badge variant={variants[status]} className="w-fit">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/**
 * Student Homework Tab Component
 *
 * Shows homework assigned to the student's batch with:
 * - Status filtering
 * - Due date information
 * - Submission status
 */
export function StudentHomeworkTab({
  studentId,
  batchId,
  batchName,
}: StudentHomeworkTabProps) {
  const [statusFilter, setStatusFilter] = useState<HomeworkStatus | "all">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data: homeworkData, isLoading } = useHomeworkList({
    batchId: batchId ?? undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: pageSize,
  });

  if (!batchId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-text-muted">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Batch Assigned</p>
            <p className="text-sm mt-1">
              This student is not assigned to any batch. Assign a batch to view
              homework assignments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <HomeworkTabSkeleton />;
  }

  const homeworkItems = homeworkData?.data ?? [];
  const paginationRaw = homeworkData?.pagination;
  const totalAssignments = paginationRaw?.total ?? 0;

  const serverPagination: PaginationMeta | undefined = paginationRaw
    ? {
        ...paginationRaw,
        hasNext: paginationRaw.page < paginationRaw.totalPages,
        hasPrev: paginationRaw.page > 1,
      }
    : undefined;

  const handleLimitChange = (limit: number) => {
    setPageSize(limit);
    setPage(1);
  };

  // Count by status (current page, for summary cards)
  const statusCounts = homeworkItems.reduce(
    (acc, hw) => {
      acc[hw.status] = (acc[hw.status] || 0) + 1;
      return acc;
    },
    {} as Record<HomeworkStatus, number>
  );

  const overdueCount = homeworkItems.filter((hw) => hw.isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Assignments"
          value={totalAssignments}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <SummaryCard
          label="Published"
          value={statusCounts.published || 0}
          icon={<FileText className="h-4 w-4" />}
          variant="success"
        />
        <SummaryCard
          label="Closed"
          value={statusCounts.closed || 0}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <SummaryCard
          label="Overdue"
          value={overdueCount}
          icon={<AlertCircle className="h-4 w-4" />}
          variant={overdueCount > 0 ? "error" : "default"}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-text-muted" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as HomeworkStatus | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-text-muted" />
            Homework Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalAssignments === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Homework Assignments</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all"
                  ? `No ${STATUS_LABELS[statusFilter as HomeworkStatus].toLowerCase()} homework found.`
                  : "No homework has been assigned to this batch yet."}
              </p>
            </div>
          ) : (
            <DataTable<HomeworkListItem>
              columns={homeworkTableColumns}
              data={homeworkItems}
              paginationMode="server"
              serverPagination={serverPagination!}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
              limitOptions={[10, 20, 50]}
              showLimitSelector={true}
              isLoading={isLoading}
              emptyMessage="No homework in this range."
            />
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
  value: number;
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

function HomeworkTabSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-12 w-full" />
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
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
