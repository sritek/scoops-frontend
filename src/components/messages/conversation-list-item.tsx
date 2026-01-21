"use client";

import { User, Users, Megaphone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

export type ConversationType = "direct" | "broadcast" | "announcement";

export interface ConversationListItemProps {
  /** Conversation title */
  title: string;
  /** Type of conversation */
  type: ConversationType;
  /** Optional batch name */
  batchName?: string;
  /** Last message preview */
  lastMessage?: {
    content: string;
    isFromStaff?: boolean;
  };
  /** Last updated timestamp (ISO string) */
  updatedAt: string;
  /** Whether this item is currently selected */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Optional subtitle (e.g., participant info) */
  subtitle?: string;
  /** Whether to show the badge for broadcast type */
  showTypeBadge?: boolean;
}

/**
 * ConversationListItem Component
 *
 * Displays a single conversation in the conversation list.
 * Shows type icon, title, batch name, last message preview, and timestamp.
 */
export function ConversationListItem({
  title,
  type,
  batchName,
  lastMessage,
  updatedAt,
  isSelected,
  onClick,
  subtitle,
  showTypeBadge = true,
}: ConversationListItemProps) {
  const TypeIcon = getTypeIcon(type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 text-left transition-colors",
        "hover:bg-surface-secondary",
        isSelected && "bg-primary-100 dark:bg-primary-900/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={cn(
            "rounded-full p-2 shrink-0",
            type === "broadcast"
              ? "bg-purple-100 dark:bg-purple-900/30"
              : "bg-surface-secondary"
          )}
        >
          <TypeIcon
            className={cn(
              "h-4 w-4",
              type === "broadcast"
                ? "text-purple-600 dark:text-purple-400"
                : "text-text-muted"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <p className="font-medium truncate text-text-primary">{title}</p>
            {showTypeBadge && type === "broadcast" && (
              <Badge variant="info" className="text-[10px] shrink-0">
                Broadcast
              </Badge>
            )}
          </div>

          {/* Batch name */}
          {batchName && (
            <p className="text-xs text-primary-600 dark:text-primary-400">
              {batchName}
            </p>
          )}

          {/* Subtitle (e.g., participant info) */}
          {subtitle && (
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          )}

          {/* Last message preview */}
          {lastMessage && (
            <p className="text-sm text-text-muted truncate mt-1">
              {lastMessage.isFromStaff && (
                <span className="text-text-secondary">Staff: </span>
              )}
              {lastMessage.content}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-text-muted mt-1">
            {formatRelativeTime(updatedAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

/**
 * Get the icon component for a conversation type
 */
function getTypeIcon(type: ConversationType) {
  switch (type) {
    case "broadcast":
      return Megaphone;
    case "announcement":
      return Users;
    case "direct":
    default:
      return User;
  }
}

/**
 * Format a timestamp as relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}
