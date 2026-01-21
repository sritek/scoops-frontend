"use client";

import { type ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Spinner } from "@/components/ui";

export interface MessagesLayoutProps {
  /** Content for the conversation list panel */
  conversationList: ReactNode;
  /** Content for the chat panel */
  chatPanel: ReactNode;
  /** Currently selected conversation ID (controls mobile view) */
  selectedId: string | null;
  /** Callback when back is pressed (mobile) */
  onBack: () => void;
  /** Custom empty state when no conversation is selected */
  emptyState?: ReactNode;
  /** Optional header action (e.g., "New Message" button) */
  headerAction?: ReactNode;
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Whether the conversation list is loading */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
}

/**
 * MessagesLayout Component
 *
 * Responsive split-view layout for messages:
 * - Desktop (md+): Side-by-side conversation list (320px) + chat panel
 * - Mobile: Either list OR chat panel visible
 */
export function MessagesLayout({
  conversationList,
  chatPanel,
  selectedId,
  emptyState,
  headerAction,
  title = "Messages",
  description,
  isLoading = false,
  error,
}: MessagesLayoutProps) {
  // Default empty state
  const defaultEmptyState = (
    <Card className="h-full flex items-center justify-center">
      <div className="text-center text-text-muted">
        <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Select a conversation to view messages</p>
      </div>
    </Card>
  );

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <MessagesHeader
          title={title}
          description={description}
          action={headerAction}
        />
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-3 p-4">
            <p className="text-sm text-error">
              Failed to load messages. Please try again.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <MessagesHeader
        title={title}
        description={description}
        action={headerAction}
      />

      {/* Main content */}
      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation List Panel */}
        <div
          className={cn(
            "w-full md:w-80 shrink-0",
            // On mobile, hide when a conversation is selected
            selectedId ? "hidden md:block" : ""
          )}
        >
          <Card className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                conversationList
              )}
            </div>
          </Card>
        </div>

        {/* Chat Panel */}
        <div
          className={cn(
            "flex-1",
            // On mobile, hide when no conversation is selected
            selectedId ? "" : "hidden md:block"
          )}
        >
          {selectedId ? chatPanel : emptyState || defaultEmptyState}
        </div>
      </div>
    </div>
  );
}

/**
 * Messages Header Component
 */
function MessagesHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
