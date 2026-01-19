"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useExam, useUpdateExam } from "@/lib/api/exams";
import { usePermissions } from "@/lib/hooks";
import {
  Button,
  Card,
  CardContent,
  Badge,
  DataTable,
  Spinner,
} from "@/components/ui";
import type { ExamScore } from "@/types/exam";

/**
 * Exam Detail Page
 */
export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const { data: exam, isLoading, error } = useExam(examId);
  const { mutate: updateExam, isPending: isUpdating } = useUpdateExam();
  const { can } = usePermissions();

  const canManageExams = can("ATTENDANCE_MARK");

  const handleTogglePublish = () => {
    if (!exam) return;
    updateExam({
      id: examId,
      data: { isPublished: !exam.isPublished },
    });
  };

  const columns: ColumnDef<ExamScore>[] = useMemo(
    () => [
      {
        accessorKey: "studentName",
        header: "Student",
        cell: ({ row }) => (
          <p className="font-medium">{row.original.studentName}</p>
        ),
      },
      {
        accessorKey: "marksObtained",
        header: "Marks",
        cell: ({ row }) => {
          if (row.original.marksObtained === null) {
            return <span className="text-text-muted italic">Absent</span>;
          }
          return (
            <span className="font-medium">
              {row.original.marksObtained}/{exam?.totalMarks}
            </span>
          );
        },
      },
      {
        accessorKey: "grade",
        header: "Grade",
        cell: ({ row }) => {
          if (row.original.marksObtained === null) {
            return <Badge variant="default">AB</Badge>;
          }
          return (
            <Badge
              variant={row.original.isPassed ? "success" : "error"}
            >
              {row.original.grade}
            </Badge>
          );
        },
      },
      {
        accessorKey: "isPassed",
        header: "Result",
        cell: ({ row }) => {
          if (row.original.marksObtained === null) {
            return <span className="text-text-muted">—</span>;
          }
          return row.original.isPassed ? (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle className="h-4 w-4" />
              Pass
            </span>
          ) : (
            <span className="flex items-center gap-1 text-error">
              <XCircle className="h-4 w-4" />
              Fail
            </span>
          );
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <span className="text-text-muted">
            {row.original.remarks || "—"}
          </span>
        ),
      },
    ],
    [exam?.totalMarks]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="space-y-6">
        <BackButton />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load exam details. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <BackButton />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-text-primary">
                {exam.name}
              </h1>
              <Badge variant={exam.isPublished ? "success" : "warning"}>
                {exam.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-text-muted">
              {exam.batchName}
              {exam.subjectName && ` • ${exam.subjectName}`} •{" "}
              {formatDate(exam.examDate)}
            </p>
          </div>
        </div>
        {canManageExams && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleTogglePublish}
              disabled={isUpdating}
            >
              {exam.isPublished ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
            <Button onClick={() => router.push(`/exams/${examId}/marks`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Marks
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={exam.statistics.totalStudents}
        />
        <StatCard
          icon={Award}
          label="Pass Rate"
          value={`${exam.statistics.passPercentage.toFixed(0)}%`}
          variant={exam.statistics.passPercentage >= 60 ? "success" : "warning"}
        />
        <StatCard
          icon={TrendingUp}
          label="Average"
          value={`${exam.statistics.averageMarks.toFixed(1)}/${exam.totalMarks}`}
        />
        <StatCard
          icon={Clock}
          label="Absent"
          value={exam.statistics.totalAbsent}
          variant={exam.statistics.totalAbsent > 0 ? "warning" : "default"}
        />
      </div>

      {/* Exam Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <span className="text-text-muted">Type</span>
              <p className="font-medium capitalize">
                {exam.type.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <span className="text-text-muted">Total Marks</span>
              <p className="font-medium">{exam.totalMarks}</p>
            </div>
            <div>
              <span className="text-text-muted">Passing Marks</span>
              <p className="font-medium">{exam.passingMarks}</p>
            </div>
            <div>
              <span className="text-text-muted">Created By</span>
              <p className="font-medium">{exam.createdByName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pass/Fail Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Passed</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {exam.statistics.passCount}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {exam.statistics.failCount}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Scores Table */}
      <div>
        <h2 className="mb-4 text-lg font-medium">Student Scores</h2>
        <Card>
          {exam.scores.length === 0 ? (
            <CardContent className="py-8 text-center">
              <p className="text-text-muted">No scores entered yet.</p>
              {canManageExams && (
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/exams/${examId}/marks`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Enter Marks
                </Button>
              )}
            </CardContent>
          ) : (
            <DataTable
              columns={columns}
              data={exam.scores}
              paginationMode="client"
              pageSize={20}
              emptyMessage="No scores found."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

/**
 * Back Button
 */
function BackButton() {
  return (
    <Link href="/exams">
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </Link>
  );
}

/**
 * Stat Card
 */
function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning";
}) {
  const variantStyles = {
    default: "text-text-muted",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg bg-surface-secondary p-2 ${variantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-text-muted">{label}</p>
          <p className={`text-lg font-semibold ${variantStyles[variant]}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
