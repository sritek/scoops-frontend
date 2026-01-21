"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ArrowLeft, Send, MessageCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Button, Input, Spinner, Badge } from "@/components/ui";

export interface ChatPanelShellProps {
  /** Conversation title */
  title: string;
  /** Optional subtitle (e.g., batch name) */
  subtitle?: string;
  /** Optional badge content */
  badge?: ReactNode;
  /** Rendered message list */
  messages: ReactNode;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Callback when message is sent */
  onSend: (message: string) => void;
  /** Whether a message is currently being sent */
  isSending?: boolean;
  /** Whether the conversation is loading */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Custom empty state when no messages */
  emptyMessagesState?: ReactNode;
  /** Whether there are any messages */
  hasMessages?: boolean;
  /** Ref for scrolling to bottom */
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

/**
 * ChatPanelShell Component
 *
 * Provides the structure for a chat panel:
 * - Header with back button (mobile), title, subtitle, and badge
 * - Scrollable messages area
 * - Input area with send button
 */
export function ChatPanelShell({
  title,
  subtitle,
  badge,
  messages,
  onBack,
  onSend,
  isSending = false,
  isLoading = false,
  error,
  emptyMessagesState,
  hasMessages = true,
  messagesEndRef: externalRef,
}: ChatPanelShellProps) {
  const [newMessage, setNewMessage] = useState("");
  const internalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = externalRef || internalRef;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesEndRef]);

  const handleSend = () => {
    if (!newMessage.trim() || isSending) return;
    onSend(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-error">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Failed to load conversation</p>
        </div>
      </Card>
    );
  }

  // Default empty messages state
  const defaultEmptyState = (
    <div className="text-center text-text-muted py-8">
      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No messages yet. Start the conversation!</p>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-text-primary truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasMessages ? (
          <>
            {messages}
            <div ref={messagesEndRef} />
          </>
        ) : (
          emptyMessagesState || defaultEmptyState
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            aria-label="Send message"
          >
            {isSending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
