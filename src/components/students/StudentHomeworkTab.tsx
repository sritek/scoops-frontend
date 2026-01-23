"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "@/components/ui";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  Users,
} from "lucide-react";
import {
  useHomeworkList,
  type HomeworkStatus,
} from "@/lib/api/homework";

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

  const { data: homeworkData, isLoading } = useHomeworkList({
    batchId: batchId ?? undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
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

  // Count by status
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
      {/* Batch Context */}
      <Card className="bg-primary-50/50 border-primary-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-text-primary">
                  Viewing homework for batch: {batchName || "Unknown"}
                </p>
                <p className="text-sm text-text-muted">
                  Homework is assigned to the entire batch, not individual
                  students.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/homework">
                <ExternalLink className="h-4 w-4 mr-2" />
                All Homework
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Assignments"
          value={homeworkItems.length}
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
          {homeworkItems.length > 0 ? (
            <div className="space-y-4">
              {homeworkItems.map((homework) => (
                <HomeworkCard key={homework.id} homework={homework} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Homework Assignments</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all"
                  ? `No ${STATUS_LABELS[statusFilter as HomeworkStatus].toLowerCase()} homework found.`
                  : "No homework has been assigned to this batch yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface HomeworkCardProps {
  homework: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    totalMarks: number | null;
    status: HomeworkStatus;
    subjectName: string | null;
    submissionCount: number;
    isOverdue: boolean;
    createdAt: string;
  };
}

function HomeworkCard({ homework }: HomeworkCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border-subtle hover:bg-surface-hover transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {homework.subjectName && (
              <Badge variant="secondary">{homework.subjectName}</Badge>
            )}
            <StatusBadge status={homework.status} isOverdue={homework.isOverdue} />
          </div>

          <Link
            href={`/homework/${homework.id}`}
            className="text-lg font-medium text-text-primary hover:text-primary-600 hover:underline"
          >
            {homework.title}
          </Link>

          <p className="text-sm text-text-muted mt-1 line-clamp-2">
            {homework.description}
          </p>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-muted">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Due: {formatDate(homework.dueDate)}</span>
            </div>
            {homework.totalMarks && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{homework.totalMarks} marks</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>{homework.submissionCount} submissions</span>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/homework/${homework.id}`}>
            <ExternalLink className="h-4 w-4 mr-1" />
            View Details
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  isOverdue,
}: {
  status: HomeworkStatus;
  isOverdue: boolean;
}) {
  if (isOverdue && status === "published") {
    return (
      <Badge variant="error" className="flex items-center gap-1">
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

  return <Badge variant={variants[status]}>{STATUS_LABELS[status]}</Badge>;
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
