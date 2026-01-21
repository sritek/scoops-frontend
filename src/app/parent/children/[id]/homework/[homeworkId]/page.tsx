"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Award,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
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
} from "@/components/ui";
import {
  getChildHomeworkDetail,
  getChildDetails,
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
 * Parent Homework Detail Page
 */
export default function ParentHomeworkDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const homeworkId = params.homeworkId as string;

  // Fetch child details for header
  const { data: child } = useQuery({
    queryKey: ["parent", "children", studentId],
    queryFn: () => getChildDetails(studentId),
  });

  // Fetch homework detail
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "homework", homeworkId],
    queryFn: () => getChildHomeworkDetail(studentId, homeworkId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/parent/children/${studentId}/homework`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">Homework</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-error">Failed to load homework details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(
    data.submission?.status as SubmissionStatus | null,
    data.isOverdue,
    data.isClosed
  );
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/parent/children/${studentId}/homework`}>
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
                  {data.submission.gradedAt ? formatDate(data.submission.gradedAt) : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submitted but not graded */}
      {data.submission && ["submitted", "late"].includes(data.submission.status) && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Submitted on {data.submission.submittedAt ? formatDate(data.submission.submittedAt) : ""}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Waiting for teacher to grade</p>
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
