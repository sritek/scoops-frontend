"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  User,
  Lock,
} from "lucide-react";
import {
  useComplaint,
  useUpdateComplaint,
  useAddComment,
} from "@/lib/api/complaints";
import { useStaffList } from "@/lib/api/staff";
import { usePermissions } from "@/lib/hooks";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Spinner,
  Checkbox,
  Skeleton,
  DetailPageHeaderSkeleton,
} from "@/components/ui";
import type { ComplaintStatus, ComplaintPriority } from "@/types/complaint";
import {
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
} from "@/types/complaint";

/**
 * Complaint Detail Page
 */
export default function ComplaintDetailPage() {
  const params = useParams();
  const complaintId = params.id as string;
  const { can } = usePermissions();

  const canManageComplaints = can("SETTINGS_MANAGE");

  const { data: complaint, isLoading, error } = useComplaint(complaintId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <DetailPageHeaderSkeleton
          showBackButton
          badgeCount={2}
          showActions={false}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>

            {/* Comments Card Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-4 mb-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-surface-secondary p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-16 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="space-y-6">
        <BackButton />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load complaint. Please try again.
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
                {complaint.ticketNumber}
              </h1>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <p className="text-sm text-text-muted mt-1">
              {complaint.subject}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium mb-4">Description</h2>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {complaint.description}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium mb-4">
                Comments ({complaint.comments.length})
              </h2>
              
              <div className="space-y-4 mb-6">
                {complaint.comments.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">
                    No comments yet
                  </p>
                ) : (
                  complaint.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-lg p-4 ${
                        comment.isInternal
                          ? "bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900"
                          : "bg-surface-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="rounded-full bg-primary-100 p-1.5 dark:bg-primary-900">
                          <User className="h-3 w-3 text-primary-600" />
                        </div>
                        <span className="text-sm font-medium">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-text-muted">
                          ({comment.authorType})
                        </span>
                        {comment.isInternal && (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            Internal
                          </Badge>
                        )}
                        <span className="text-xs text-text-muted ml-auto">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <AddCommentForm complaintId={complaintId} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium mb-4">Details</h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-text-muted">Category</dt>
                  <dd className="font-medium capitalize">{complaint.category}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Submitted By</dt>
                  <dd className="font-medium">{complaint.submittedBy}</dd>
                </div>
                {complaint.studentName && (
                  <div>
                    <dt className="text-text-muted">Related Student</dt>
                    <dd className="font-medium">{complaint.studentName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-text-muted">Assigned To</dt>
                  <dd className="font-medium">
                    {complaint.assignedTo || "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Created</dt>
                  <dd className="font-medium">
                    {formatDateTime(complaint.createdAt)}
                  </dd>
                </div>
                {complaint.resolvedAt && (
                  <div>
                    <dt className="text-text-muted">Resolved</dt>
                    <dd className="font-medium">
                      {formatDateTime(complaint.resolvedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Resolution */}
          {complaint.resolution && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
              <CardContent className="p-6">
                <h2 className="font-medium mb-2 text-green-700 dark:text-green-300">
                  Resolution
                </h2>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {complaint.resolution}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions (Admin Only) */}
          {canManageComplaints && (
            <UpdateComplaintForm
              complaintId={complaintId}
              currentStatus={complaint.status}
              currentPriority={complaint.priority}
              currentAssignedTo={complaint.assignedTo}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Back Button
 */
function BackButton() {
  return (
    <Link href="/complaints">
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </Link>
  );
}

/**
 * Status Badge
 */
function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = {
    open: { variant: "warning" as const, icon: Clock },
    in_progress: { variant: "info" as const, icon: Loader2 },
    resolved: { variant: "success" as const, icon: CheckCircle },
    closed: { variant: "default" as const, icon: XCircle },
  };
  const { variant, icon: Icon } = config[status];
  return (
    <Badge variant={variant} className="gap-1 capitalize">
      <Icon className="h-3 w-3" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

/**
 * Priority Badge
 */
function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  const config = {
    low: "default" as const,
    medium: "warning" as const,
    high: "error" as const,
    urgent: "error" as const,
  };
  return (
    <Badge variant={config[priority]} className="capitalize">
      {priority}
    </Badge>
  );
}

/**
 * Add Comment Form
 */
function AddCommentForm({ complaintId }: { complaintId: string }) {
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const { mutate: addComment, isPending } = useAddComment();

  const handleSubmit = () => {
    if (!content.trim()) return;

    addComment(
      { complaintId, input: { content, isInternal } },
      {
        onSuccess: () => {
          setContent("");
          setIsInternal(false);
        },
      }
    );
  };

  return (
    <div className="border-t border-border-subtle pt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="w-full min-h-[80px] rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <div className="flex items-center justify-between mt-3">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <Checkbox
            checked={isInternal}
            onCheckedChange={(checked) => setIsInternal(checked as boolean)}
          />
          <Lock className="h-3 w-3" />
          Internal note (not visible to parent)
        </label>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isPending}
          size="sm"
        >
          <Send className="mr-2 h-4 w-4" />
          {isPending ? "Sending..." : "Add Comment"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Update Complaint Form
 */
function UpdateComplaintForm({
  complaintId,
  currentStatus,
  currentPriority,
  currentAssignedTo,
}: {
  complaintId: string;
  currentStatus: ComplaintStatus;
  currentPriority: ComplaintPriority;
  currentAssignedTo: string | null;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [assignedToId, setAssignedToId] = useState("__unassigned__");
  const [resolution, setResolution] = useState("");

  const { data: staffData } = useStaffList({ limit: 100 });
  const { mutate: updateComplaint, isPending } = useUpdateComplaint();

  const staff = staffData?.data ?? [];

  const handleUpdate = () => {
    const input: any = {};
    if (status !== currentStatus) input.status = status;
    if (priority !== currentPriority) input.priority = priority;
    if (assignedToId && assignedToId !== "__unassigned__") input.assignedToId = assignedToId;
    if (resolution) input.resolution = resolution;

    if (Object.keys(input).length === 0) return;

    updateComplaint({ id: complaintId, input });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-medium mb-4">Update Complaint</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as ComplaintPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue placeholder={currentAssignedTo || "Select staff"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(status === "resolved" || status === "closed") && (
            <div className="space-y-2">
              <Label>Resolution</Label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                className="w-full min-h-[80px] rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          <Button onClick={handleUpdate} disabled={isPending} className="w-full">
            {isPending ? "Updating..." : "Update"}
          </Button>
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date time
 */
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
