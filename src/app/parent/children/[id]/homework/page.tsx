"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Award,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  getChildHomework,
  getChildHomeworkDetail,
  getChildDetails,
  type ChildHomework,
  type SubmissionStatus,
} from "@/lib/api/parent";

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get status badge configuration
 */
function getStatusConfig(status: SubmissionStatus | null, isOverdue: boolean, isClosed: boolean) {
  if (isClosed && status === "pending") {
    return {
      label: "Not Submitted",
      color: "bg-gray-100 text-gray-700",
      icon: XCircle,
    };
  }

  if (!status || status === "pending") {
    if (isOverdue) {
      return {
        label: "Overdue",
        color: "bg-red-100 text-red-700",
        icon: AlertTriangle,
      };
    }
    return {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700",
      icon: Clock,
    };
  }

  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        color: "bg-blue-100 text-blue-700",
        icon: CheckCircle,
      };
    case "late":
      return {
        label: "Late",
        color: "bg-orange-100 text-orange-700",
        icon: AlertTriangle,
      };
    case "graded":
      return {
        label: "Graded",
        color: "bg-green-100 text-green-700",
        icon: Award,
      };
    default:
      return {
        label: status,
        color: "bg-gray-100 text-gray-700",
        icon: Clock,
      };
  }
}

/**
 * Homework Card Component
 */
function HomeworkCard({
  homework,
  studentId,
}: {
  homework: ChildHomework;
  studentId: string;
}) {
  const router = useRouter();
  const statusConfig = getStatusConfig(
    homework.submission?.status as SubmissionStatus | null,
    homework.isOverdue,
    homework.isClosed
  );
  const StatusIcon = statusConfig.icon;

  const handleClick = () => {
    router.push(`/parent/children/${studentId}/homework/${homework.id}`);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        homework.isOverdue && !homework.submission && "border-red-200",
        homework.submission?.status === "graded" && "border-green-200"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title and Subject */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text-primary truncate">
                {homework.title}
              </h3>
              {homework.subject && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {homework.subject}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-text-muted line-clamp-2 mb-3">
              {homework.description}
            </p>

            {/* Due Date and Marks */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-text-muted">
                <Calendar className="h-3.5 w-3.5" />
                Due: {formatDate(homework.dueDate)}
              </span>
              {homework.totalMarks && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Award className="h-3.5 w-3.5" />
                  {homework.totalMarks} marks
                </span>
              )}
            </div>

            {/* Days until due or grades */}
            <div className="flex items-center gap-3 mt-2">
              {homework.submission?.status === "graded" && homework.submission.marks !== null ? (
                <span className="text-sm font-medium text-green-600">
                  Score: {homework.submission.marks}/{homework.totalMarks}
                </span>
              ) : !homework.isClosed && homework.daysUntilDue > 0 ? (
                <span
                  className={cn(
                    "text-xs",
                    homework.daysUntilDue <= 2 ? "text-orange-600" : "text-text-muted"
                  )}
                >
                  {homework.daysUntilDue === 1
                    ? "Due tomorrow"
                    : `${homework.daysUntilDue} days left`}
                </span>
              ) : homework.isOverdue && !homework.submission ? (
                <span className="text-xs text-red-600">Past due date</span>
              ) : null}
            </div>
          </div>

          {/* Status Badge and Arrow */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Summary Stats Component
 */
function SummaryStats({
  summary,
}: {
  summary: { total: number; pending: number; submitted: number; graded: number };
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-bg-app p-3 rounded-lg text-center">
        <p className="text-lg font-bold text-text-primary">{summary.total}</p>
        <p className="text-xs text-text-muted">Total</p>
      </div>
      <div className="bg-yellow-50 p-3 rounded-lg text-center">
        <p className="text-lg font-bold text-yellow-700">{summary.pending}</p>
        <p className="text-xs text-yellow-600">Pending</p>
      </div>
      <div className="bg-blue-50 p-3 rounded-lg text-center">
        <p className="text-lg font-bold text-blue-700">{summary.submitted}</p>
        <p className="text-xs text-blue-600">Submitted</p>
      </div>
      <div className="bg-green-50 p-3 rounded-lg text-center">
        <p className="text-lg font-bold text-green-700">{summary.graded}</p>
        <p className="text-xs text-green-600">Graded</p>
      </div>
    </div>
  );
}

/**
 * Parent Homework Page
 */
export default function ParentHomeworkPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch child details for header
  const { data: child } = useQuery({
    queryKey: ["parent", "children", studentId],
    queryFn: () => getChildDetails(studentId),
  });

  // Fetch homework list
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "homework", statusFilter],
    queryFn: () =>
      getChildHomework(
        studentId,
        statusFilter !== "all" ? { status: statusFilter } : undefined
      ),
  });

  const homework = data?.homework ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/parent/children/${studentId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Homework
          </h1>
          {child && (
            <p className="text-sm text-text-muted">
              {child.firstName} {child.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && <SummaryStats summary={summary} />}

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="graded">Graded</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-error">Failed to load homework</p>
          </CardContent>
        </Card>
      )}

      {/* Homework List */}
      {!isLoading && !error && (
        <>
          {homework.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-text-muted" />
                <p className="text-text-muted">
                  {statusFilter === "all"
                    ? "No homework assignments yet"
                    : `No ${statusFilter} homework`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {homework.map((hw) => (
                <HomeworkCard key={hw.id} homework={hw} studentId={studentId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Homework Detail Page (exported for nested route)
 */
export function HomeworkDetailView({
  studentId,
  homeworkId,
}: {
  studentId: string;
  homeworkId: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "homework", homeworkId],
    queryFn: () => getChildHomeworkDetail(studentId, homeworkId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-error">Failed to load homework details</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(
    data.submission?.status as SubmissionStatus | null,
    data.isOverdue,
    data.isClosed
  );
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {data.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {data.subject && (
                  <Badge variant="outline" className="text-xs">
                    {data.subject}
                  </Badge>
                )}
                <span className="text-xs text-text-muted">{data.batchName}</span>
              </div>
            </div>
            <Badge className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Due: {formatDate(data.dueDate)}
            </span>
            {data.totalMarks && (
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                {data.totalMarks} marks
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {data.description}
          </p>
        </CardContent>
      </Card>

      {/* Attachments */}
      {data.attachments && data.attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-bg-app rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-primary-600">{attachment.name}</span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submission Result */}
      {data.submission?.status === "graded" && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-700">
                  {data.submission.marks}
                </span>
                <span className="text-text-muted">/ {data.totalMarks}</span>
                <span className="text-sm text-green-600">
                  (
                  {Math.round(
                    ((data.submission.marks || 0) / (data.totalMarks || 1)) * 100
                  )}
                  %)
                </span>
              </div>
              {data.submission.feedback && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Feedback:</p>
                  <p className="text-sm text-text-primary">{data.submission.feedback}</p>
                </div>
              )}
              {data.submission.gradedBy && (
                <p className="text-xs text-text-muted">
                  Graded by {data.submission.gradedBy} on{" "}
                  {formatDate(data.submission.gradedAt || "")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Created by info */}
      <p className="text-xs text-text-muted text-center">
        Assigned by {data.createdBy} on {formatDate(data.createdAt)}
      </p>
    </div>
  );
}
