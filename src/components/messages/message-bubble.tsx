"use client";

import { cn } from "@/lib/utils";

export interface MessageBubbleProps {
  /** Message content */
  content: string;
  /** Name of the sender (shown for received messages) */
  senderName?: string;
  /** Whether this message was sent by the current user */
  isOwnMessage: boolean;
  /** Whether this message is from a staff member */
  isFromStaff?: boolean;
  /** Message timestamp (ISO string) */
  createdAt: string;
}

/**
 * MessageBubble Component
 *
 * Displays a single chat message with appropriate styling
 * based on whether it's sent or received.
 */
export function MessageBubble({
  content,
  senderName,
  isOwnMessage,
  isFromStaff,
  createdAt,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isOwnMessage
            ? "bg-primary-600 text-white"
            : "bg-primary-100 text-text-primary"
        )}
      >
        {/* Sender name (for received messages) */}
        {!isOwnMessage && senderName && (
          <p
            className={cn(
              "text-xs font-medium mb-1",
              isFromStaff
                ? "text-primary-600 dark:text-primary-400"
                : "opacity-70"
            )}
          >
            {senderName}
            {isFromStaff && " (Staff)"}
          </p>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap">{content}</p>

        {/* Timestamp */}
        <p
          className={cn(
            "text-[10px] mt-1",
            isOwnMessage ? "text-white/70" : "text-text-muted"
          )}
        >
          {formatTime(createdAt)}
        </p>
      </div>
    </div>
  );
}

/**
 * Format a timestamp as time only
 */
function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
