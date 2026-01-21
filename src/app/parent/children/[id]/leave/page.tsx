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
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import {
  useChildLeaveApplications,
  useSubmitLeaveApplication,
  useCancelLeaveApplication,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  type StudentLeaveType,
  type StudentLeaveStatus,
} from "@/lib/api/leave";
import { getChildDetails } from "@/lib/api/parent";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Form validation schema
const leaveFormSchema = z.object({
  type: z.enum(["sick", "family", "vacation", "medical", "other"]),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

type LeaveFormData = z.infer<typeof leaveFormSchema>;

/**
 * Status badge colors
 */
const statusColors: Record<StudentLeaveStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

/**
 * Status icons
 */
function StatusIcon({ status }: { status: StudentLeaveStatus }) {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-gray-500" />;
  }
}

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
 * Get minimum date (today) for date picker
 */
function getMinDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Leave Application Page for Parent
 */
export default function ParentLeaveApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [showForm, setShowForm] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Fetch child details
  const { data: child } = useQuery({
    queryKey: ["parent", "children", studentId],
    queryFn: () => getChildDetails(studentId),
  });

  // Fetch leave applications
  const { data: leaveData, isLoading, error, refetch } = useChildLeaveApplications(studentId);

  // Submit leave mutation
  const { mutate: submitLeave, isPending: isSubmitting } = useSubmitLeaveApplication();

  // Cancel leave mutation
  const { mutate: cancelLeave, isPending: isCanceling } = useCancelLeaveApplication();

  // Form setup
  const form = useForm<LeaveFormData>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      type: "sick",
      reason: "",
      startDate: "",
      endDate: "",
    },
  });

  const handleSubmit = (data: LeaveFormData) => {
    submitLeave(
      { studentId, input: data },
      {
        onSuccess: () => {
          toast.success("Leave application submitted successfully");
          setShowForm(false);
          form.reset();
          refetch();
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to submit leave application");
        },
      }
    );
  };

  const handleCancel = (leaveId: string) => {
    cancelLeave(leaveId, {
      onSuccess: () => {
        toast.success("Leave application cancelled");
        setCancelingId(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to cancel leave application");
        setCancelingId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load leave applications</p>
        <Link
          href={`/parent/children/${studentId}`}
          className="text-primary-600 hover:text-primary-700"
        >
          Go back
        </Link>
      </div>
    );
  }

  const applications = leaveData?.data ?? [];

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/parent/children/${studentId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Leave Applications</h1>
            {child && (
              <p className="text-sm text-text-muted">{child.firstName} {child.lastName}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Apply Leave
        </Button>
      </div>

      {/* Leave Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a leave request for {child?.firstName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Leave Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value as StudentLeaveType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-xs text-error">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  min={getMinDate()}
                  {...form.register("startDate")}
                />
                {form.formState.errors.startDate && (
                  <p className="text-xs text-error">{form.formState.errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  min={form.watch("startDate") || getMinDate()}
                  {...form.register("endDate")}
                />
                {form.formState.errors.endDate && (
                  <p className="text-xs text-error">{form.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for the leave request..."
                className="min-h-[100px]"
                {...form.register("reason")}
              />
              {form.formState.errors.reason && (
                <p className="text-xs text-error">{form.formState.errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted mb-4">No leave applications yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Apply for Leave
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon status={application.status} />
                      <Badge className={cn("text-xs", statusColors[application.status])}>
                        {LEAVE_STATUS_LABELS[application.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {LEAVE_TYPE_LABELS[application.type]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(application.startDate)}
                        {application.startDate !== application.endDate && (
                          <> - {formatDate(application.endDate)}</>
                        )}
                      </span>
                      <span className="text-text-primary font-medium">
                        ({application.totalDays} day{application.totalDays !== 1 ? "s" : ""})
                      </span>
                    </div>

                    <p className="text-sm text-text-secondary">{application.reason}</p>

                    {application.reviewNote && (
                      <div className="mt-2 p-2 bg-bg-app rounded text-sm">
                        <p className="text-text-muted text-xs mb-1">Review Note:</p>
                        <p className="text-text-secondary">{application.reviewNote}</p>
                      </div>
                    )}

                    {application.reviewedBy && (
                      <p className="mt-2 text-xs text-text-muted">
                        Reviewed by {application.reviewedBy.name} on{" "}
                        {application.reviewedAt ? formatDate(application.reviewedAt) : ""}
                      </p>
                    )}
                  </div>

                  {application.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error hover:text-error hover:bg-red-50"
                      onClick={() => setCancelingId(application.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelingId} onOpenChange={() => setCancelingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelingId(null)}>
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelingId && handleCancel(cancelingId)}
              disabled={isCanceling}
            >
              {isCanceling ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
