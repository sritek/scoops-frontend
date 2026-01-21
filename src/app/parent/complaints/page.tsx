"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  Skeleton,
  Badge,
  Button,
} from "@/components/ui";
import { getParentComplaints, type Complaint } from "@/lib/api/parent";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  open: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  in_progress: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  resolved: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  closed: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
};

const priorityConfig: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

/**
 * Complaint card
 */
function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const status = statusConfig[complaint.status] || statusConfig.open;

  return (
    <Link href={`/parent/complaints/${complaint.id}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-full", status.bg)}>
              {status.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">{complaint.ticketNumber}</p>
                  <h3 className="font-medium text-text-primary truncate">
                    {complaint.subject}
                  </h3>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted flex-shrink-0" />
              </div>

              <p className="text-sm text-text-muted line-clamp-2 mt-1">
                {complaint.description}
              </p>

              <div className="mt-3 flex items-center flex-wrap gap-2">
                <Badge className={cn("text-xs capitalize", status.bg, status.color)}>
                  {complaint.status.replace("_", " ")}
                </Badge>
                <Badge className={cn("text-xs capitalize", priorityConfig[complaint.priority])}>
                  {complaint.priority}
                </Badge>
                {complaint.studentName && (
                  <Badge variant="outline" className="text-xs">
                    {complaint.studentName}
                  </Badge>
                )}
                {complaint.commentCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <MessageSquare className="h-3 w-3" />
                    {complaint.commentCount}
                  </span>
                )}
              </div>

              <p className="text-xs text-text-muted mt-2">
                {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Loading skeleton
 */
function ComplaintsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

/**
 * Parent Complaints Page
 *
 * Shows all complaints submitted by the parent:
 * - List of complaints with status
 * - Button to create new complaint
 */
export default function ParentComplaintsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "complaints"],
    queryFn: () => getParentComplaints({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary-600" />
            <h1 className="text-xl font-semibold text-text-primary">Complaints</h1>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <ComplaintsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load complaints</p>
        <p className="text-sm text-text-muted">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-primary-600" />
          <h1 className="text-xl font-semibold text-text-primary">Complaints</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/parent/complaints/new">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Link>
        </Button>
      </div>

      {/* Complaints list */}
      {data?.data && data.data.length > 0 ? (
        <div className="space-y-3">
          {data.data.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted">No complaints submitted</p>
            <p className="text-sm text-text-muted mt-1">
              Have an issue? Submit a complaint and we&apos;ll look into it.
            </p>
            <Button asChild className="mt-4">
              <Link href="/parent/complaints/new">
                <Plus className="h-4 w-4 mr-2" />
                Submit Complaint
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
