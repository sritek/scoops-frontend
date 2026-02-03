"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Calendar,
  Award,
  FileText,
  Send,
  XCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  MessageSquare,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  Avatar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { toast } from "sonner";
import {
  useHomeworkDetail,
  useHomeworkSubmissions,
  usePublishHomework,
  useCloseHomework,
  useGradeSubmission,
  type HomeworkStatus,
  type SubmissionStatus,
  type HomeworkSubmission,
} from "@/lib/api/homework";

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
 * Get status badge configuration for homework
 */
function getHomeworkStatusConfig(status: HomeworkStatus) {
  switch (status) {
    case "draft":
      return {
        label: "Draft",
        color: "bg-gray-100 text-gray-700",
        icon: FileText,
      };
    case "published":
      return {
        label: "Published",
        color: "bg-green-100 text-green-700",
        icon: Send,
      };
    case "closed":
      return {
        label: "Closed",
        color: "bg-red-100 text-red-700",
        icon: XCircle,
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
 * Get status badge configuration for submission
 */
function getSubmissionStatusConfig(status: SubmissionStatus) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-700",
        icon: Clock,
      };
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
 * Grade submission schema
 */
const gradeSchema = z.object({
  marks: z.number().min(0, "Marks must be positive"),
  feedback: z.string().max(1000).optional(),
});

type GradeForm = z.infer<typeof gradeSchema>;

/**
 * Grade Dialog Component
 */
function GradeDialog({
  open,
  onOpenChange,
  submission,
  totalMarks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: HomeworkSubmission | null;
  totalMarks: number | null;
}) {
  const gradeMutation = useGradeSubmission();

  const form = useForm<GradeForm>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      marks: submission?.marks ?? 0,
      feedback: submission?.feedback ?? "",
    },
  });

  const onSubmit = async (data: GradeForm) => {
    if (!submission) return;

    if (totalMarks !== null && data.marks > totalMarks) {
      form.setError("marks", {
        message: `Marks cannot exceed total marks (${totalMarks})`,
      });
      return;
    }

    try {
      await gradeMutation.mutateAsync({
        submissionId: submission.id,
        input: {
          marks: data.marks,
          feedback: data.feedback || undefined,
        },
      });
      toast.success("Submission graded");
      onOpenChange(false);
    } catch {
      toast.error("Failed to grade submission");
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>{submission.studentName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marks">
              Marks{" "}
              {totalMarks && (
                <span className="text-text-muted">/ {totalMarks}</span>
              )}
            </Label>
            <Input
              id="marks"
              type="number"
              placeholder="Enter marks"
              {...form.register("marks")}
            />
            {form.formState.errors.marks && (
              <p className="text-xs text-error">
                {form.formState.errors.marks.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Provide feedback to the student..."
              rows={3}
              {...form.register("feedback")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={gradeMutation.isPending}>
              {submission.status === "graded" ? "Update Grade" : "Submit Grade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Submission Card Component
 */
function SubmissionCard({
  submission,
  totalMarks,
  onGrade,
}: {
  submission: HomeworkSubmission;
  totalMarks: number | null;
  onGrade: () => void;
}) {
  const statusConfig = getSubmissionStatusConfig(submission.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <Avatar
          src={submission.studentPhoto}
          fallback={submission.studentName
            .split(" ")
            .map((n) => n[0])
            .join("")}
          alt={submission.studentName}
          size="xl"
        />
        {/* <Avatar>
          <AvatarImage src={submission.studentPhoto || undefined} />
          <AvatarFallback>
            {submission.studentName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar> */}
        <div>
          <p className="font-medium text-text-primary">
            {submission.studentName}
          </p>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Badge className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {submission.submittedAt && (
              <span>Submitted: {formatDate(submission.submittedAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {submission.status === "graded" && submission.marks !== null && (
          <div className="text-right">
            <p className="font-semibold text-green-700">
              {submission.marks}/{totalMarks}
            </p>
            {submission.feedback && (
              <p className="text-xs text-text-muted flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Has feedback
              </p>
            )}
          </div>
        )}
        {["submitted", "late", "graded"].includes(submission.status) && (
          <Button size="sm" variant="secondary" onClick={onGrade}>
            {submission.status === "graded" ? "Edit Grade" : "Grade"}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Homework Detail Page
 */
export default function HomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;

  const [gradeSubmission, setGradeSubmission] =
    useState<HomeworkSubmission | null>(null);

  // Fetch homework detail
  const { data: homework, isLoading: homeworkLoading } =
    useHomeworkDetail(homeworkId);

  // Fetch submissions
  const { data: submissionsData, isLoading: submissionsLoading } =
    useHomeworkSubmissions(homeworkId);

  // Mutations
  const publishMutation = usePublishHomework();
  const closeMutation = useCloseHomework();

  const handlePublish = async () => {
    try {
      const result = await publishMutation.mutateAsync(homeworkId);
      toast.success(`Homework published to ${result.studentCount} students`);
    } catch {
      toast.error("Failed to publish homework");
    }
  };

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(homeworkId);
      toast.success("Homework closed");
    } catch {
      toast.error("Failed to close homework");
    }
  };

  if (homeworkLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="space-y-4">
        <Link href="/homework">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-error">Homework not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getHomeworkStatusConfig(homework.status);
  const StatusIcon = statusConfig.icon;
  const submissions = submissionsData?.submissions ?? [];
  const summary = submissionsData?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/homework">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
              {homework.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>{homework.batchName}</Badge>
              {homework.subjectName && (
                <Badge className="bg-purple-50">{homework.subjectName}</Badge>
              )}
              <Badge className={cn("text-xs", statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {homework.status === "draft" && (
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {homework.status === "published" && (
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={closeMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions {summary && `(${summary.total})`}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {/* Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Due Date</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(homework.dueDate)}
                  </p>
                </div>
                {homework.totalMarks && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Total Marks</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <Award className="h-4 w-4" />
                      {homework.totalMarks}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-text-muted mb-1">Created By</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {homework.createdBy.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Created At</p>
                  <p className="font-medium">
                    {formatDate(homework.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-primary whitespace-pre-wrap">
                {homework.description}
              </p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {homework.attachments && homework.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {homework.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-bg-app rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-text-muted" />
                    <span className="text-sm text-primary-600">
                      {attachment.name}
                    </span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          {homework.status === "draft" ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-text-muted" />
                <p className="text-text-muted">
                  Publish the homework to see submissions
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              {summary && (
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{summary.total}</p>
                      <p className="text-xs text-text-muted">Total</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-700">
                        {summary.pending}
                      </p>
                      <p className="text-xs text-yellow-600">Pending</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">
                        {summary.submitted}
                      </p>
                      <p className="text-xs text-blue-600">Submitted</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {summary.graded}
                      </p>
                      <p className="text-xs text-green-600">Graded</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Submissions List */}
              {submissionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : submissions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-text-muted">No submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      totalMarks={homework.totalMarks}
                      onGrade={() => setGradeSubmission(submission)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Grade Dialog */}
      <GradeDialog
        open={!!gradeSubmission}
        onOpenChange={(open) => !open && setGradeSubmission(null)}
        submission={gradeSubmission}
        totalMarks={homework.totalMarks}
      />
    </div>
  );
}
