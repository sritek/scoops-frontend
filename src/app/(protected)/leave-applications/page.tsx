"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  AlertCircle,
  User,
  Calendar,
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Textarea,
  Pagination,
  EmptyState,
} from "@/components/ui";
import {
  useLeaveApplications,
  useLeaveStats,
  useReviewLeaveApplication,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  type StudentLeaveStatus,
  type LeaveApplicationWithStudent,
} from "@/lib/api/leave";
import { useBatches } from "@/lib/api/batches";
import { toast } from "sonner";
import { PAGINATION_DEFAULTS } from "@/types";

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
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "success";
}) {
  const bgColor = {
    default: "bg-bg-app",
    warning: "bg-yellow-50",
    success: "bg-green-50",
  }[variant];

  const iconColor = {
    default: "text-primary-600",
    warning: "text-yellow-600",
    success: "text-green-600",
  }[variant];

  return (
    <div className={cn("p-4 rounded-lg", bgColor)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-text-muted">{title}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Leave Application Card
 */
function LeaveCard({
  application,
  onReview,
}: {
  application: LeaveApplicationWithStudent;
  onReview: (id: string, status: "approved" | "rejected") => void;
}) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">(
    "approved"
  );
  const [reviewNote, setReviewNote] = useState("");

  const handleReview = () => {
    onReview(application.id, reviewStatus);
    setShowReviewDialog(false);
    setReviewNote("");
  };

  return (
    <>
      <Card
        className={cn(application.status === "pending" && "border-yellow-200")}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Student Info */}
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-text-muted" />
                <span className="font-medium">{application.student.name}</span>
                {application.student.batchName && (
                  <Badge variant="default" className="text-xs">
                    {application.student.batchName}
                  </Badge>
                )}
              </div>

              {/* Status and Type */}
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon status={application.status} />
                <Badge
                  className={cn("text-xs", statusColors[application.status])}
                >
                  {LEAVE_STATUS_LABELS[application.status]}
                </Badge>
                <Badge variant="default" className="text-xs">
                  {LEAVE_TYPE_LABELS[application.type]}
                </Badge>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(application.startDate)}
                  {application.startDate !== application.endDate && (
                    <> - {formatDate(application.endDate)}</>
                  )}
                </span>
                <span className="text-text-primary font-medium">
                  ({application.totalDays} day
                  {application.totalDays !== 1 ? "s" : ""})
                </span>
              </div>

              {/* Reason */}
              <p className="text-sm text-text-secondary mb-2">
                {application.reason}
              </p>

              {/* Parent Info */}
              <p className="text-xs text-text-muted">
                Applied by: {application.parent.name} (
                {application.parent.phone})
              </p>

              {/* Review Note */}
              {application.reviewNote && (
                <div className="mt-2 p-2 bg-bg-app rounded text-sm">
                  <p className="text-text-muted text-xs mb-1">Review Note:</p>
                  <p className="text-text-secondary">
                    {application.reviewNote}
                  </p>
                </div>
              )}

              {application.reviewedBy && (
                <p className="mt-2 text-xs text-text-muted">
                  Reviewed by {application.reviewedBy.name} on{" "}
                  {application.reviewedAt
                    ? formatDate(application.reviewedAt)
                    : ""}
                </p>
              )}
            </div>

            {/* Actions */}
            {application.status === "pending" && (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setReviewStatus("approved");
                    setShowReviewDialog(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setReviewStatus("rejected");
                    setShowReviewDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewStatus === "approved" ? "Approve" : "Reject"} Leave
              Application
            </DialogTitle>
            <DialogDescription>
              {reviewStatus === "approved"
                ? "The student will be marked as on leave for the requested dates."
                : "The leave request will be rejected and the parent will be notified."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-bg-app rounded-lg">
              <p className="font-medium">{application.student.name}</p>
              <p className="text-sm text-text-muted">
                {formatDate(application.startDate)} -{" "}
                {formatDate(application.endDate)} ({application.totalDays} days)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                placeholder="Add a note for the parent..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowReviewDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              className={
                reviewStatus === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
              variant={reviewStatus === "rejected" ? "destructive" : "primary"}
            >
              {reviewStatus === "approved" ? "Approve" : "Reject"} Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Leave Applications Management Page
 */
export default function LeaveApplicationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StudentLeaveStatus | "all">(
    "pending"
  );
  const [batchFilter, setBatchFilter] = useState<string>("all");

  // Fetch leave applications
  const {
    data: leaveData,
    isLoading,
    refetch,
  } = useLeaveApplications({
    status: statusFilter === "all" ? undefined : statusFilter,
    batchId: batchFilter === "all" ? undefined : batchFilter,
    page,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  // Fetch leave stats
  const { data: stats } = useLeaveStats();

  // Fetch batches for filter
  const { data: batchesData } = useBatches({ page: 1, limit: 100 });

  // Review mutation
  const { mutate: reviewLeave, isPending: isReviewing } =
    useReviewLeaveApplication();

  const handleReview = (id: string, status: "approved" | "rejected") => {
    reviewLeave(
      { id, input: { status } },
      {
        onSuccess: () => {
          toast.success(`Leave application ${status}`);
          refetch();
        },
        onError: (error: Error) => {
          toast.error(error.message || `Failed to ${status} leave application`);
        },
      }
    );
  };

  const applications = leaveData?.data ?? [];
  const pagination = leaveData?.pagination;
  const batches = batchesData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary-600" />
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Leave Applications
          </h1>
          <p className="text-sm text-text-muted">
            Review and manage student leave requests
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Pending Requests"
            value={stats.pending}
            icon={Clock}
            variant={stats.pending > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Approved This Month"
            value={stats.approvedThisMonth}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Total This Month"
            value={stats.totalThisMonth}
            icon={CalendarDays}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StudentLeaveStatus | "all");
                  setPage(1);
                }}
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
            <div className="flex-1">
              <Select
                value={batchFilter}
                onValueChange={(value) => {
                  setBatchFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No leave applications"
          description={
            statusFilter === "pending"
              ? "There are no pending leave applications to review."
              : "No leave applications match your current filters."
          }
        />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <LeaveCard
              key={application.id}
              application={application}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}
    </div>
  );
}
