"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Skeleton,
  Badge,
} from "@/components/ui";
import {
  getParentComplaint,
  addParentComplaintComment,
  type ComplaintWithComments,
} from "@/lib/api/parent";
import { toast } from "sonner";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  open: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "Open",
  },
  in_progress: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "In Progress",
  },
  resolved: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Resolved",
  },
  closed: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-gray-600",
    bg: "bg-gray-100",
    label: "Closed",
  },
};

const priorityConfig: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

/**
 * Comment component
 */
function Comment({
  comment,
}: {
  comment: ComplaintWithComments["comments"][number];
}) {
  return (
    <div
      className={cn(
        "flex gap-3",
        comment.isOwnComment ? "flex-row-reverse" : ""
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full flex-shrink-0",
          comment.authorType === "staff" ? "bg-primary-100" : "bg-gray-100"
        )}
      >
        <User className="h-4 w-4 text-text-muted" />
      </div>
      <div
        className={cn(
          "flex-1 max-w-[80%]",
          comment.isOwnComment ? "text-right" : ""
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2",
            comment.isOwnComment
              ? "bg-primary-600 text-white ml-auto"
              : "bg-bg-app text-text-primary"
          )}
          style={{ display: "inline-block", textAlign: "left" }}
        >
          {!comment.isOwnComment && (
            <p
              className={cn(
                "text-xs font-medium mb-1",
                comment.authorType === "staff"
                  ? "text-primary-600"
                  : "text-text-muted"
              )}
            >
              {comment.authorName}
              {comment.authorType === "staff" && " (Staff)"}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
        <p
          className={cn(
            "text-xs text-text-muted mt-1",
            comment.isOwnComment ? "text-right" : ""
          )}
        >
          {new Date(comment.createdAt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton
 */
function ComplaintDetailSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  );
}

/**
 * Complaint Detail Page
 *
 * Shows complaint details and comments:
 * - Status and priority badges
 * - Description
 * - Comments timeline
 * - Add comment (if not resolved/closed)
 */
export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const complaintId = params.id as string;

  const [newComment, setNewComment] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { data: complaint, isLoading, error } = useQuery({
    queryKey: ["parent", "complaints", complaintId],
    queryFn: () => getParentComplaint(complaintId),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      addParentComplaintComment(complaintId, content),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({
        queryKey: ["parent", "complaints", complaintId],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add comment"
      );
    },
  });

  // Scroll to bottom when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [complaint?.comments]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  if (isLoading) {
    return <ComplaintDetailSkeleton />;
  }

  if (error || !complaint) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load complaint</p>
        <Link
          href="/parent/complaints"
          className="text-primary-600 hover:text-primary-700"
        >
          Go back to complaints
        </Link>
      </div>
    );
  }

  const status = statusConfig[complaint.status] || statusConfig.open;
  const canComment =
    complaint.status !== "resolved" && complaint.status !== "closed";

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/parent/complaints"
          className="p-2 hover:bg-bg-app rounded-sm transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-text-muted">{complaint.ticketNumber}</p>
          <h1 className="text-lg font-semibold text-text-primary line-clamp-1">
            {complaint.subject}
          </h1>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge className={cn("text-sm", status.bg, status.color)}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
            <Badge
              className={cn("text-xs capitalize", priorityConfig[complaint.priority])}
            >
              {complaint.priority} Priority
            </Badge>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {complaint.studentName && (
              <div className="flex justify-between">
                <span className="text-text-muted">Student</span>
                <span className="font-medium">{complaint.studentName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-muted">Category</span>
              <span className="font-medium capitalize">{complaint.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Submitted</span>
              <span className="font-medium">
                {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {complaint.assignedTo && (
              <div className="flex justify-between">
                <span className="text-text-muted">Assigned To</span>
                <span className="font-medium">{complaint.assignedTo}</span>
              </div>
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
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {complaint.description}
          </p>
        </CardContent>
      </Card>

      {/* Resolution (if resolved) */}
      {complaint.resolution && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 whitespace-pre-wrap">
              {complaint.resolution}
            </p>
            {complaint.resolvedAt && (
              <p className="text-xs text-green-600 mt-2">
                Resolved on{" "}
                {new Date(complaint.resolvedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Comments ({complaint.comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complaint.comments.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {complaint.comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <p className="text-center py-4 text-text-muted text-sm">
              No comments yet
            </p>
          )}

          {/* Add comment form */}
          {canComment && (
            <form
              onSubmit={handleSubmitComment}
              className="mt-4 pt-4 border-t border-border-subtle flex gap-2"
            >
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={addCommentMutation.isPending}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || addCommentMutation.isPending}
                isLoading={addCommentMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}

          {!canComment && (
            <p className="mt-4 pt-4 border-t border-border-subtle text-center text-sm text-text-muted">
              This complaint is {complaint.status.replace("_", " ")} and cannot
              accept new comments.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
