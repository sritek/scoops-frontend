"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Megaphone,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  Skeleton,
  Badge,
} from "@/components/ui";
import { getParentAnnouncements, type Announcement } from "@/lib/api/parent";

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Announcement card component
 */
function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongContent = announcement.content.length > 200;
  const displayContent = isExpanded
    ? announcement.content
    : announcement.content.slice(0, 200) + (isLongContent ? "..." : "");

  return (
    <Card
      className={cn(
        "transition-all",
        !announcement.isRead && "border-primary-200 bg-primary-50/30"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {announcement.isSchoolWide ? (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                School-wide
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Users className="h-3 w-3" />
                {announcement.batchName}
              </Badge>
            )}
            {!announcement.isRead && (
              <Badge variant="primary" className="text-xs">
                New
              </Badge>
            )}
          </div>
          <span className="text-xs text-text-muted flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(announcement.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-medium text-text-primary mb-1">
          {announcement.title}
        </h3>

        {/* Sender */}
        <p className="text-xs text-text-muted mb-2">
          From: {announcement.senderName}
        </p>

        {/* Content */}
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {displayContent}
        </p>

        {/* Expand/Collapse button */}
        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
function AnnouncementsPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-64" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Megaphone className="h-12 w-12 mx-auto text-text-muted mb-3" />
        <p className="text-text-muted">No announcements yet</p>
        <p className="text-sm text-text-muted mt-1">
          School announcements and batch updates will appear here
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Announcements Page
 *
 * Shows school-wide and batch-specific announcements
 */
export default function AnnouncementsPage() {
  const {
    data: announcementsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "announcements"],
    queryFn: () => getParentAnnouncements({ limit: 50 }),
  });

  if (isLoading) {
    return <AnnouncementsPageSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load announcements</p>
        <p className="text-sm text-text-muted">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  const announcements = announcementsData?.data ?? [];
  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-text-primary">
            Announcements
          </h1>
          {unreadCount > 0 && (
            <Badge variant="primary">{unreadCount} new</Badge>
          )}
        </div>
        <p className="text-text-muted">
          Updates from school and your children&apos;s batches
        </p>
      </div>

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
    </div>
  );
}
