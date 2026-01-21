"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useExam, useStudentsForMarks, useSaveScores } from "@/lib/api/exams";
import { usePermissions } from "@/lib/hooks";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Spinner,
} from "@/components/ui";
import { AccessDenied } from "@/components/ui/access-denied";
import type { StudentForMarks } from "@/types/exam";

interface ScoreEntry {
  studentId: string;
  marksObtained: number | null;
  remarks: string;
  isDirty: boolean;
}

/**
 * Bulk Marks Entry Page
 */
export default function MarksEntryPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { can } = usePermissions();

  const [scores, setScores] = useState<Map<string, ScoreEntry>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const {
    data: students,
    isLoading: studentsLoading,
    refetch: refetchStudents,
  } = useStudentsForMarks(examId);
  const { mutate: saveScores, isPending: isSaving } = useSaveScores();

  const canManageExams = can("ATTENDANCE_MARK");

  // Initialize scores from API data
  useEffect(() => {
    if (students) {
      const initialScores = new Map<string, ScoreEntry>();
      students.forEach((student) => {
        initialScores.set(student.studentId, {
          studentId: student.studentId,
          marksObtained: student.marksObtained,
          remarks: student.remarks || "",
          isDirty: false,
        });
      });

      queueMicrotask(() => {
        setScores(initialScores);
        setHasChanges(false);
      });
    }
  }, [students]);

  const updateScore = useCallback(
    (
      studentId: string,
      field: "marksObtained" | "remarks",
      value: number | null | string
    ) => {
      setScores((prev) => {
        const newScores = new Map(prev);
        const current = newScores.get(studentId);
        if (current) {
          newScores.set(studentId, {
            ...current,
            [field]: value,
            isDirty: true,
          });
        }
        return newScores;
      });
      setHasChanges(true);
    },
    []
  );

  const handleMarksChange = useCallback(
    (studentId: string, value: string) => {
      if (value === "" || value === "-") {
        updateScore(studentId, "marksObtained", null);
      } else {
        const numValue = parseInt(value, 10);
        if (
          !isNaN(numValue) &&
          numValue >= 0 &&
          numValue <= (exam?.totalMarks ?? 100)
        ) {
          updateScore(studentId, "marksObtained", numValue);
        }
      }
    },
    [exam?.totalMarks, updateScore]
  );

  const handleSave = () => {
    const dirtyScores = Array.from(scores.values())
      .filter((s) => s.isDirty)
      .map((s) => ({
        studentId: s.studentId,
        marksObtained: s.marksObtained,
        remarks: s.remarks || undefined,
      }));

    if (dirtyScores.length === 0) return;

    saveScores(
      { examId, input: { scores: dirtyScores } },
      {
        onSuccess: () => {
          // Mark all as not dirty
          setScores((prev) => {
            const newScores = new Map(prev);
            newScores.forEach((score, key) => {
              newScores.set(key, { ...score, isDirty: false });
            });
            return newScores;
          });
          setHasChanges(false);
        },
      }
    );
  };

  const getGrade = (
    marks: number | null,
    totalMarks: number,
    passingMarks: number
  ): string => {
    if (marks === null) return "AB";
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (marks >= passingMarks) return "D";
    return "F";
  };

  const isPassed = (marks: number | null, passingMarks: number): boolean => {
    if (marks === null) return false;
    return marks >= passingMarks;
  };

  if (!canManageExams) {
    return (
      <AccessDenied description="You don't have permission to enter marks." />
    );
  }

  if (examLoading || studentsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="space-y-6">
        <BackButton />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load exam. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentsList = students ?? [];
  const dirtyCount = Array.from(scores.values()).filter(
    (s) => s.isDirty
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <BackButton examId={examId} />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Enter Marks
            </h1>
            <p className="text-sm text-text-muted">
              {exam.name} • {exam.batchName} • Total: {exam.totalMarks}, Pass:{" "}
              {exam.passingMarks}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-warning">
              {dirtyCount} unsaved changes
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchStudents()}
            disabled={isSaving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
        <CardContent className="p-4 text-sm text-blue-700 dark:text-blue-300">
          <ul className="list-disc list-inside space-y-1">
            <li>Enter marks for each student (0-{exam.totalMarks})</li>
            <li>Leave blank or enter &quot;-&quot; to mark as absent</li>
            <li>Press Tab to move to the next field</li>
            <li>Changes are highlighted until saved</li>
          </ul>
        </CardContent>
      </Card>

      {/* Marks Entry Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-subtle bg-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted w-8">
                  #
                </th>
                <th className="px-4 py-3 text-left font-medium text-text-muted min-w-[200px]">
                  Student Name
                </th>
                <th className="px-4 py-3 text-center font-medium text-text-muted w-32">
                  Marks (/{exam.totalMarks})
                </th>
                <th className="px-4 py-3 text-center font-medium text-text-muted w-20">
                  Grade
                </th>
                <th className="px-4 py-3 text-center font-medium text-text-muted w-24">
                  Result
                </th>
                <th className="px-4 py-3 text-left font-medium text-text-muted min-w-[200px]">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {studentsList.map((student, index) => {
                const scoreEntry = scores.get(student.studentId);
                const marks = scoreEntry?.marksObtained ?? null;
                const remarks = scoreEntry?.remarks ?? "";
                const isDirty = scoreEntry?.isDirty ?? false;
                const grade = getGrade(
                  marks,
                  exam.totalMarks,
                  exam.passingMarks
                );
                const passed = isPassed(marks, exam.passingMarks);

                return (
                  <tr
                    key={student.studentId}
                    className={`hover:bg-surface-secondary/50 ${
                      isDirty ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{student.studentName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={marks === null ? "" : marks.toString()}
                        onChange={(e) =>
                          handleMarksChange(student.studentId, e.target.value)
                        }
                        placeholder="-"
                        className="w-20 text-center mx-auto"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          marks === null
                            ? "default"
                            : passed
                            ? "success"
                            : "error"
                        }
                      >
                        {grade}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {marks === null ? (
                        <span className="text-text-muted">—</span>
                      ) : passed ? (
                        <span className="flex items-center justify-center gap-1 text-success">
                          <CheckCircle className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-error">
                          <XCircle className="h-4 w-4" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        value={remarks}
                        onChange={(e) =>
                          updateScore(
                            student.studentId,
                            "remarks",
                            e.target.value
                          )
                        }
                        placeholder="Optional remarks"
                        className="w-full"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {studentsList.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-text-muted">No students in this batch.</p>
          </div>
        )}
      </Card>

      {/* Summary */}
      {studentsList.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <SummaryItem label="Total Students" value={studentsList.length} />
              <SummaryItem
                label="Marks Entered"
                value={
                  Array.from(scores.values()).filter(
                    (s) => s.marksObtained !== null
                  ).length
                }
                variant="info"
              />
              <SummaryItem
                label="Passed"
                value={
                  Array.from(scores.values()).filter((s) =>
                    isPassed(s.marksObtained, exam.passingMarks)
                  ).length
                }
                variant="success"
              />
              <SummaryItem
                label="Failed"
                value={
                  Array.from(scores.values()).filter(
                    (s) =>
                      s.marksObtained !== null &&
                      !isPassed(s.marksObtained, exam.passingMarks)
                  ).length
                }
                variant="error"
              />
              <SummaryItem
                label="Absent"
                value={
                  Array.from(scores.values()).filter(
                    (s) => s.marksObtained === null
                  ).length
                }
                variant="warning"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky Save Button for Mobile */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full shadow-lg"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : `Save ${dirtyCount} Changes`}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Back Button
 */
function BackButton({ examId }: { examId?: string }) {
  return (
    <Link href={examId ? `/exams/${examId}` : "/exams"}>
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </Link>
  );
}

/**
 * Summary Item
 */
function SummaryItem({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "success" | "error" | "warning" | "info";
}) {
  const variantStyles = {
    default: "text-text-primary",
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
    info: "text-primary-600",
  };

  return (
    <div>
      <span className="text-text-muted">{label}</span>
      <p className={`text-lg font-semibold ${variantStyles[variant]}`}>
        {value}
      </p>
    </div>
  );
}
