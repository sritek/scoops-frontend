"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  GraduationCap,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
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
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  getChildExams,
  getChildReportCard,
  downloadChildReportCardPDF,
  getChildDetails,
  type ExamResult,
  type ExamType,
} from "@/lib/api/parent";
import { toast } from "sonner";

/**
 * Exam type labels
 */
const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  unit_test: "Unit Test",
  mid_term: "Mid-Term",
  final: "Final",
  practical: "Practical",
  assignment: "Assignment",
};

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
 * Get grade color class
 */
function getGradeColor(grade: string): string {
  if (grade === "AB") return "text-gray-500";
  if (["A+", "A"].includes(grade)) return "text-green-600";
  if (["B+", "B"].includes(grade)) return "text-blue-600";
  if (["C+", "C"].includes(grade)) return "text-yellow-600";
  if (grade === "D") return "text-orange-600";
  return "text-red-600"; // F
}

/**
 * Stat Card Component
 */
function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: number | string;
  icon?: React.ElementType;
  variant?: "default" | "success" | "error" | "warning";
}) {
  const colors = {
    default: "bg-bg-app text-text-primary",
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
    warning: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div className={cn("p-4 rounded-lg text-center", colors[variant])}>
      {Icon && <Icon className="h-5 w-5 mx-auto mb-1 opacity-70" />}
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}

/**
 * Exam Card Component
 */
function ExamCard({ exam }: { exam: ExamResult }) {
  const percentage = exam.percentage ?? 0;
  const batchAvgPercentage = exam.batchAveragePercentage ?? 0;
  const isAboveAverage = exam.percentage !== null && exam.batchAveragePercentage !== null && percentage > batchAvgPercentage;

  return (
    <Card className={cn(
      "transition-all",
      exam.isAbsent && "border-gray-200 bg-gray-50/50",
      !exam.isAbsent && exam.isPassed && "border-green-200",
      !exam.isAbsent && !exam.isPassed && exam.hasScore && "border-red-200"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Exam Name and Type */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text-primary truncate">{exam.name}</h3>
              <Badge variant="outline" className="text-xs shrink-0">
                {EXAM_TYPE_LABELS[exam.type]}
              </Badge>
            </div>

            {/* Subject and Date */}
            <div className="flex items-center gap-3 text-sm text-text-muted mb-3">
              {exam.subject && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {exam.subject}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(exam.examDate)}
              </span>
            </div>

            {/* Score Details */}
            {exam.isAbsent ? (
              <div className="flex items-center gap-2 text-gray-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Absent</span>
              </div>
            ) : exam.hasScore ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">
                    {exam.marksObtained}/{exam.totalMarks}
                  </span>
                  <span className="text-text-muted">
                    ({percentage}%)
                  </span>
                  <span className={cn("font-bold text-lg", getGradeColor(exam.grade))}>
                    {exam.grade}
                  </span>
                </div>
                
                {/* Batch Average Comparison */}
                {exam.batchAverage !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted">Class Avg:</span>
                    <span className="font-medium">{batchAvgPercentage}%</span>
                    {isAboveAverage ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Above Avg
                      </Badge>
                    ) : percentage < batchAvgPercentage ? (
                      <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                        Below Avg
                      </Badge>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-text-muted">Results pending</span>
            )}
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {exam.isAbsent ? (
              <Badge className="bg-gray-100 text-gray-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Absent
              </Badge>
            ) : exam.isPassed ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Passed
              </Badge>
            ) : exam.hasScore ? (
              <Badge className="bg-red-100 text-red-700">
                <XCircle className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Exams Tab Content
 */
function ExamsTab({ studentId }: { studentId: string }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "exams", typeFilter],
    queryFn: () => getChildExams(
      studentId,
      typeFilter !== "all" ? { type: typeFilter as ExamType } : undefined
    ),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-error">Failed to load exam results</p>
        </CardContent>
      </Card>
    );
  }

  const exams = data?.exams ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total Exams" value={summary.totalExams} icon={BookOpen} />
          <StatCard label="Attempted" value={summary.attemptedExams} />
          <StatCard label="Passed" value={summary.passedExams} variant="success" icon={CheckCircle} />
          <StatCard label="Failed" value={summary.failedExams} variant="error" icon={XCircle} />
          <StatCard label="Absent" value={summary.absentExams} variant="warning" icon={AlertCircle} />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">Filter by:</span>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(EXAM_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exam Cards */}
      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted">No exam results available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Report Card Tab Content
 */
function ReportCardTab({ studentId }: { studentId: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "report-card"],
    queryFn: () => getChildReportCard(studentId),
  });

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await downloadChildReportCardPDF(studentId);
      toast.success("Report card downloaded successfully");
    } catch (err) {
      toast.error("Failed to download report card");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-error">Failed to load report card</p>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary;
  const exams = data?.exams ?? [];

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted">No exam results to generate report card</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-600" />
              Overall Performance
            </CardTitle>
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="shrink-0"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Exams" value={summary?.totalExams ?? 0} icon={BookOpen} />
            <StatCard label="Passed" value={summary?.passedExams ?? 0} variant="success" icon={CheckCircle} />
            <StatCard label="Failed" value={summary?.failedExams ?? 0} variant="error" icon={XCircle} />
            <StatCard label="Absent" value={summary?.absentExams ?? 0} variant="warning" icon={AlertCircle} />
          </div>

          {/* Overall Percentage */}
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <p className="text-sm text-primary-600 mb-1">Overall Percentage</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-bold text-primary-700">
                {summary?.overallPercentage ?? 0}%
              </span>
              <span className={cn(
                "text-2xl font-bold",
                getGradeColor(summary?.overallGrade ?? "F")
              )}>
                {summary?.overallGrade ?? "-"}
              </span>
            </div>
            <p className="text-xs text-primary-600 mt-1">
              {summary?.totalMarksObtained ?? 0} / {summary?.totalMaxMarks ?? 0} marks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exam Results Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Exam Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-app">
                  <th className="text-left p-3 font-medium">Exam</th>
                  <th className="text-left p-3 font-medium">Subject</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-center p-3 font-medium">Marks</th>
                  <th className="text-center p-3 font-medium">Grade</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b border-border-subtle last:border-0">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{exam.name}</p>
                        <p className="text-xs text-text-muted">{EXAM_TYPE_LABELS[exam.type]}</p>
                      </div>
                    </td>
                    <td className="p-3">{exam.subject}</td>
                    <td className="p-3 text-text-muted">{formatDate(exam.examDate)}</td>
                    <td className="p-3 text-center">
                      {exam.marksObtained !== null ? (
                        <span>
                          <span className="font-medium">{exam.marksObtained}</span>
                          <span className="text-text-muted">/{exam.totalMarks}</span>
                        </span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className={cn("p-3 text-center font-bold", getGradeColor(exam.grade))}>
                      {exam.grade}
                    </td>
                    <td className="p-3 text-center">
                      {exam.marksObtained === null ? (
                        <Badge className="bg-gray-100 text-gray-700 text-xs">Absent</Badge>
                      ) : exam.isPassed ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Pass</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs">Fail</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Academics Page
 */
export default function ParentAcademicsPage() {
  const params = useParams();
  const studentId = params.id as string;

  // Fetch child details for header
  const { data: child } = useQuery({
    queryKey: ["parent", "children", studentId],
    queryFn: () => getChildDetails(studentId),
  });

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
          <h1 className="text-xl font-semibold text-text-primary">Academics</h1>
          {child && (
            <p className="text-sm text-text-muted">
              {child.firstName} {child.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="exams" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Exam Results
          </TabsTrigger>
          <TabsTrigger value="report-card" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Report Card
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-4">
          <ExamsTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="report-card" className="mt-4">
          <ReportCardTab studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
