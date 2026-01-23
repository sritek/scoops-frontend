"use client";

import { useState } from "react";
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
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import {
  useLeaveApplications,
  useReviewLeaveApplication,
  type StudentLeaveStatus,
  type StudentLeaveType,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
} from "@/lib/api/leave";
import { toast } from "sonner";

interface StudentLeaveTabProps {
  studentId: string;
}

/**
 * Student Leave Tab Component
 *
 * Shows leave applications for a specific student with:
 * - Status filtering
 * - Quick approve/reject actions
 * - Leave history with details
 */
export function StudentLeaveTab({ studentId }: StudentLeaveTabProps) {
  const [statusFilter, setStatusFilter] = useState<StudentLeaveStatus | "all">(
    "all"
  );

  const { data: leaveData, isLoading, refetch } = useLeaveApplications({
    studentId,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const reviewMutation = useReviewLeaveApplication();

  const handleReview = async (
    leaveId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      await reviewMutation.mutateAsync({
        id: leaveId,
        input: { status },
      });
      toast.success(
        `Leave application ${status === "approved" ? "approved" : "rejected"}`
      );
      refetch();
    } catch {
      toast.error("Failed to review leave application");
    }
  };

  if (isLoading) {
    return <LeaveTabSkeleton />;
  }

  const leaveApplications = leaveData?.data ?? [];

  // Count by status
  const statusCounts = leaveApplications.reduce(
    (acc, leave) => {
      acc[leave.status] = (acc[leave.status] || 0) + 1;
      return acc;
    },
    {} as Record<StudentLeaveStatus, number>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Applications"
          value={leaveApplications.length}
          icon={<Calendar className="h-4 w-4" />}
        />
        <SummaryCard
          label="Pending"
          value={statusCounts.pending || 0}
          icon={<Clock className="h-4 w-4" />}
          variant={statusCounts.pending > 0 ? "warning" : "default"}
        />
        <SummaryCard
          label="Approved"
          value={statusCounts.approved || 0}
          icon={<CheckCircle className="h-4 w-4" />}
          variant="success"
        />
        <SummaryCard
          label="Rejected"
          value={statusCounts.rejected || 0}
          icon={<XCircle className="h-4 w-4" />}
          variant="error"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-muted" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StudentLeaveStatus | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-text-muted" />
            Leave Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveApplications.length > 0 ? (
            <div className="space-y-4">
              {leaveApplications.map((leave) => (
                <LeaveApplicationCard
                  key={leave.id}
                  leave={leave}
                  onApprove={() => handleReview(leave.id, "approved")}
                  onReject={() => handleReview(leave.id, "rejected")}
                  isPending={reviewMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Leave Applications</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all"
                  ? `No ${statusFilter} leave applications found.`
                  : "This student has no leave applications on record."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface LeaveApplicationCardProps {
  leave: {
    id: string;
    type: StudentLeaveType;
    reason: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: StudentLeaveStatus;
    reviewedBy: { id: string; name: string } | null;
    reviewedAt: string | null;
    reviewNote: string | null;
    createdAt: string;
  };
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}

function LeaveApplicationCard({
  leave,
  onApprove,
  onReject,
  isPending,
}: LeaveApplicationCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border-subtle">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              {LEAVE_TYPE_LABELS[leave.type]}
            </Badge>
            <StatusBadge status={leave.status} />
          </div>

          <p className="text-text-primary">{leave.reason}</p>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-muted">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{leave.totalDays} day(s)</span>
            </div>
          </div>

          {leave.reviewedBy && (
            <p className="text-sm text-text-muted mt-2">
              Reviewed by {leave.reviewedBy.name} on{" "}
              {formatDateTime(leave.reviewedAt!)}
              {leave.reviewNote && `: "${leave.reviewNote}"`}
            </p>
          )}

          <p className="text-xs text-text-muted mt-2">
            Applied on {formatDateTime(leave.createdAt)}
          </p>
        </div>

        {/* Action Buttons for Pending Applications */}
        {leave.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onApprove}
              disabled={isPending}
              className="text-success hover:text-success hover:bg-success/10"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isPending}
              className="text-error hover:text-error hover:bg-error/10"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StudentLeaveStatus }) {
  const variants: Record<StudentLeaveStatus, "success" | "warning" | "error" | "default"> = {
    pending: "warning",
    approved: "success",
    rejected: "error",
    cancelled: "default",
  };

  return (
    <Badge variant={variants[status]}>
      {LEAVE_STATUS_LABELS[status]}
    </Badge>
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LeaveTabSkeleton() {
  return (
    <div className="space-y-6">
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
