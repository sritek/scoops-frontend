"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Phone,
  User,
  GraduationCap,
  AlertCircle,
  UserX,
  FileText,
  Download,
  BookOpen,
  CreditCard,
  Heart,
  Calendar,
  CalendarDays,
  IdCard,
} from "lucide-react";
import { useDeleteStudent, useStudent } from "@/lib/api/students";
import { useStudentReportCard, downloadReportCardPDF } from "@/lib/api";
import { usePermissions } from "@/lib/hooks";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
  Avatar,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import type { ExamType } from "@/types/exam";
import {
  StudentFeesTab,
  StudentHealthTab,
  StudentAttendanceTab,
  StudentLeaveTab,
  StudentHomeworkTab,
  IdCardDialog,
} from "@/components/students";

/**
 * Student Detail Page
 *
 * Displays comprehensive student information including:
 * - Personal details
 * - Parent/guardian contacts
 * - Batch assignment
 * - Status
 */
export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: student, isLoading, error } = useStudent(id);
  const { data: reportCard, isLoading: reportCardLoading } =
    useStudentReportCard(id);
  const { mutate: deactivateStudent, isPending } = useDeleteStudent();
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const { can } = usePermissions();

  const canEditStudent = can("STUDENT_EDIT");

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const blob = await downloadReportCardPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_Card_${
        student?.fullName?.replace(/\s+/g, "_") || "Student"
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Report card downloaded successfully");
    } catch {
      toast.error("Failed to download report card");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDeactivate = () => {
    if (!student) return;

    deactivateStudent(student.id, {
      onSuccess: () => {
        toast.success("Student deactivated successfully");
      },
      onError: () => {
        toast.error("Failed to deactivate student");
      },
    });
  };

  if (isLoading) {
    return <StudentDetailSkeleton />;
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              {error ? "Failed to load student details." : "Student not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
          <Avatar
            src={student.photoUrl}
            fallback={student.firstName?.charAt(0)}
            alt={student.fullName}
            size="xl"
          />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {student.fullName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={student.status === "active" ? "success" : "default"}
              >
                {student.status}
              </Badge>
              {student.batchName && (
                <Badge variant="info">{student.batchName}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowIdCard(true)}>
            <IdCard className="mr-2 h-4 w-4" aria-hidden="true" />
            ID Card
          </Button>
          {canEditStudent && (
            <>
              <Button asChild>
                <Link href={`/students/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                  Edit Student
                </Link>
              </Button>
              {student.status === "active" && (
                <Button
                  variant="destructive"
                  isLoading={isPending}
                  disabled={isPending}
                  onClick={handleDeactivate}
                >
                  <UserX className="mr-2 h-4 w-4" aria-hidden="true" />
                  Deactivate
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Leave
          </TabsTrigger>
          <TabsTrigger value="homework" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Homework
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Health
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User
                    className="h-5 w-5 text-text-muted"
                    aria-hidden="true"
                  />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Full Name" value={student.fullName} />
                <InfoRow
                  label="Gender"
                  value={student.gender ? capitalize(student.gender) : "—"}
                />
                <InfoRow
                  label="Date of Birth"
                  value={student.dob ? formatDate(student.dob) : "—"}
                />
                <InfoRow
                  label="Category"
                  value={
                    student.category ? student.category.toUpperCase() : "—"
                  }
                />
                <InfoRow label="CWSN" value={student.isCwsn ? "Yes" : "No"} />
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap
                    className="h-5 w-5 text-text-muted"
                    aria-hidden="true"
                  />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Admission Year"
                  value={String(student.admissionYear)}
                />
                <InfoRow
                  label="Batch"
                  value={student.batchName || "Not assigned"}
                />
                <InfoRow
                  label="Enrolled On"
                  value={formatDate(student.createdAt)}
                />
                <InfoRow
                  label="Last Updated"
                  value={formatDate(student.updatedAt)}
                />
              </CardContent>
            </Card>

            {/* Parent/Guardian Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone
                    className="h-5 w-5 text-text-muted"
                    aria-hidden="true"
                  />
                  Parent / Guardian
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.parents && student.parents.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {student.parents.map((parent) => (
                      <div
                        key={parent.id}
                        className="rounded-lg border border-border-subtle p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar
                            src={parent.photoUrl}
                            fallback={parent.firstName?.charAt(0)}
                            alt={parent.fullName}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {parent.fullName}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge
                                variant="default"
                                className="capitalize text-xs"
                              >
                                {parent.relation}
                              </Badge>
                              {parent.isPrimaryContact && (
                                <Badge variant="success" className="text-xs">
                                  Primary Contact
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                          <Phone className="h-4 w-4" aria-hidden="true" />
                          <a
                            href={`tel:${parent.phone}`}
                            className="hover:text-primary-600"
                          >
                            {parent.phone}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted text-center py-4">
                    No parent/guardian information available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Card Section */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText
                  className="h-5 w-5 text-text-muted"
                  aria-hidden="true"
                />
                Report Card
              </CardTitle>
              {reportCard && reportCard.exams.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                >
                  {isDownloadingPDF ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  Download PDF
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {reportCardLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : reportCard && reportCard.exams.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Exams"
                      value={reportCard.exams.length}
                      icon={<BookOpen className="h-4 w-4" />}
                    />
                    <StatCard
                      label="Passed"
                      value={reportCard.exams.filter((e) => e.isPassed).length}
                      variant="success"
                    />
                    <StatCard
                      label="Failed"
                      value={
                        reportCard.exams.filter(
                          (e) => e.marksObtained !== null && !e.isPassed
                        ).length
                      }
                      variant="error"
                    />
                    <StatCard
                      label="Average"
                      value={calculateAverage(reportCard.exams)}
                      suffix="%"
                    />
                  </div>

                  {/* Results Table */}
                  <div className="overflow-x-auto rounded-lg border border-border-subtle">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-elevated">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-text-muted">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-text-muted">
                            Exam
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-text-muted">
                            Subject
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-text-muted">
                            Type
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-text-muted">
                            Marks
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-text-muted">
                            Grade
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-text-muted">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {reportCard.exams.map((exam) => (
                          <tr
                            key={exam.examId}
                            className="hover:bg-surface-hover"
                          >
                            <td className="px-4 py-3 text-text-secondary">
                              {formatDate(exam.examDate)}
                            </td>
                            <td className="px-4 py-3 font-medium text-text-primary">
                              {exam.examName}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">
                              {exam.subjectName}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="default">
                                {formatExamType(exam.examType)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {exam.marksObtained !== null ? (
                                <span className="font-medium">
                                  {exam.marksObtained}/{exam.totalMarks}
                                </span>
                              ) : (
                                <span className="text-text-muted">AB</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge
                                variant={
                                  exam.marksObtained === null
                                    ? "default"
                                    : exam.isPassed
                                    ? "success"
                                    : "error"
                                }
                              >
                                {exam.grade}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {exam.marksObtained === null ? (
                                <Badge variant="default">Absent</Badge>
                              ) : exam.isPassed ? (
                                <Badge variant="success">Pass</Badge>
                              ) : (
                                <Badge variant="error">Fail</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No exam results available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="mt-6">
          <StudentFeesTab studentId={id} batchId={student.batchId} />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-6">
          <StudentAttendanceTab
            studentId={id}
            batchId={student.batchId}
            batchName={student.batchName}
          />
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="mt-6">
          <StudentLeaveTab studentId={id} />
        </TabsContent>

        {/* Homework Tab */}
        <TabsContent value="homework" className="mt-6">
          <StudentHomeworkTab
            studentId={id}
            batchId={student.batchId}
            batchName={student.batchName}
          />
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="mt-6">
          <StudentHealthTab studentId={id} />
        </TabsContent>
      </Tabs>

      {/* ID Card Dialog */}
      <IdCardDialog
        open={showIdCard}
        onOpenChange={setShowIdCard}
        student={{
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: student.fullName,
          photoUrl: student.photoUrl,
          batchName: student.batchName,
          admissionYear: student.admissionYear,
        }}
      />
    </div>
  );
}

/**
 * Info row component for displaying label-value pairs
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

/**
 * Skeleton loading state
 */
function StudentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format exam type for display
 */
function formatExamType(type: ExamType): string {
  const types: Record<ExamType, string> = {
    unit_test: "Unit Test",
    mid_term: "Mid-Term",
    final: "Final",
    practical: "Practical",
    assignment: "Assignment",
  };
  return types[type] || type;
}

/**
 * Calculate average percentage from exam results
 */
function calculateAverage(
  exams: { marksObtained: number | null; totalMarks: number }[]
): number {
  const scoredExams = exams.filter((e) => e.marksObtained !== null);
  if (scoredExams.length === 0) return 0;

  const totalObtained = scoredExams.reduce(
    (sum, e) => sum + (e.marksObtained || 0),
    0
  );
  const totalMax = scoredExams.reduce((sum, e) => sum + e.totalMarks, 0);

  return totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
}

/**
 * Stat card component for report card summary
 */
function StatCard({
  label,
  value,
  suffix,
  icon,
  variant,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
  variant?: "success" | "error";
}) {
  const colorClass =
    variant === "success"
      ? "text-green-600"
      : variant === "error"
      ? "text-red-600"
      : "text-text-primary";

  return (
    <div className="rounded-lg border border-border-subtle p-3 bg-surface-elevated">
      <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-xl font-semibold ${colorClass}`}>
        {value}
        {suffix}
      </div>
    </div>
  );
}
