"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  AlertCircle,
  User,
  Megaphone,
} from "lucide-react";
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useSendMessage,
  useCreateBroadcast,
} from "@/lib/api/messaging";
import { useBatches } from "@/lib/api/batches";
import { usePermissions } from "@/lib/hooks";
import {
  MessagesLayout,
  ConversationListItem,
  MessageBubble,
  ChatPanelShell,
} from "@/components/messages";
import {
  Button,
  Badge,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  StudentSearchSelect,
} from "@/components/ui";
import type { Conversation, MessageType } from "@/types/messaging";
import type { Student } from "@/types/student";
import { PAGINATION_DEFAULTS } from "@/types";
import { capitalizeFirstLetter } from "@/lib/utils/format-utils";

/**
 * Staff Messages Page
 */
export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { can } = usePermissions();

  const canBroadcast = can("ATTENDANCE_MARK"); // Teachers can broadcast

  const { data, isLoading, error } = useConversations({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  const conversations = data?.data ?? [];

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (
      conversations.length > 0 &&
      !selectedConversationId &&
      typeof window !== "undefined" &&
      window.innerWidth >= 768
    ) {
      Promise.resolve().then(() => {
        setSelectedConversationId(conversations[0].id);
      });
    }
  }, [conversations, selectedConversationId]);

  return (
    <>
      <MessagesLayout
        title="Messages"
        description="Communicate with parents and staff"
        headerAction={
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        }
        conversationList={
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            isEmpty={!isLoading && conversations.length === 0}
            onNewMessage={() => setShowNewDialog(true)}
          />
        }
        chatPanel={
          selectedConversationId ? (
            <ChatPanel
              conversationId={selectedConversationId}
              onBack={() => setSelectedConversationId(null)}
            />
          ) : null
        }
        selectedId={selectedConversationId}
        onBack={() => setSelectedConversationId(null)}
        isLoading={isLoading}
        error={error instanceof Error ? error : null}
      />

      {/* New Message Dialog */}
      <NewMessageDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        canBroadcast={canBroadcast}
        onConversationCreated={(id) => {
          setSelectedConversationId(id);
          setShowNewDialog(false);
        }}
      />
    </>
  );
}

/**
 * Conversation List Component
 */
function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isEmpty,
  onNewMessage,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isEmpty: boolean;
  onNewMessage: () => void;
}) {
  if (isEmpty) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations"
        description="Start a new conversation"
        action={
          <Button onClick={onNewMessage}>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        }
      />
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          title={conversation.title}
          type={conversation.type as "direct" | "broadcast" | "announcement"}
          batchName={conversation.batchName}
          updatedAt={conversation.updatedAt}
          isSelected={selectedId === conversation.id}
          onClick={() => onSelect(conversation.id)}
          subtitle={
            conversation.type === "direct"
              ? `${capitalizeFirstLetter(conversation.participants[0]?.type ?? "")}: ${conversation.participants[0]?.name ?? ""}`
              : undefined
          }
        />
      ))}
    </div>
  );
}

/**
 * Chat Panel Component
 */
function ChatPanel({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversation,
    isLoading,
    error,
  } = useConversation(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  const handleSend = (content: string) => {
    sendMessage({ conversationId, input: { content } });
  };

  return (
    <ChatPanelShell
      title={conversation?.title ?? "Loading..."}
      subtitle={conversation?.batchName}
      badge={
        <Badge variant="default" className="capitalize">
          {conversation?.type ?? "direct"}
        </Badge>
      }
      messages={
        conversation?.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            senderName={msg.senderName}
            isOwnMessage={msg.isOwnMessage}
            createdAt={msg.createdAt}
          />
        )) ?? null
      }
      onBack={onBack}
      onSend={handleSend}
      isSending={isSending}
      isLoading={isLoading}
      error={error instanceof Error ? error : null}
      hasMessages={(conversation?.messages.length ?? 0) > 0}
      messagesEndRef={messagesEndRef}
    />
  );
}

/**
 * New Message Dialog
 */
function NewMessageDialog({
  open,
  onOpenChange,
  canBroadcast,
  onConversationCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canBroadcast: boolean;
  onConversationCreated: (id: string) => void;
}) {
  const [messageType, setMessageType] = useState<"broadcast" | "direct">(
    "broadcast"
  );
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: batchesData } = useBatches({ limit: 100 });
  const { mutate: createBroadcast, isPending: isCreatingBroadcast } =
    useCreateBroadcast();
  const { mutate: createConversation, isPending: isCreatingConversation } =
    useCreateConversation();

  const batches = batchesData?.data ?? [];

  // Get primary contact parent or first parent
  const primaryParent =
    selectedStudent?.parents?.find((p) => p.isPrimaryContact) ||
    selectedStudent?.parents?.[0];

  const handleSubmit = () => {
    if (messageType === "broadcast") {
      if (!batchId || !title || !message) return;

      createBroadcast(
        { batchId, title, message },
        {
          onSuccess: (result) => {
            onConversationCreated(result.id);
            resetForm();
          },
        }
      );
    } else if (messageType === "direct") {
      if (!selectedStudent || !primaryParent || !message) return;

      createConversation(
        {
          type: "direct",
          participantParentIds: [primaryParent.id],
          initialMessage: message,
          title: `Chat with ${selectedStudent.fullName}'s parent`,
          batchId: batchId || undefined,
        },
        {
          onSuccess: (result) => {
            onConversationCreated(result.id);
            resetForm();
          },
        }
      );
    }
  };

  const resetForm = () => {
    setMessageType("broadcast");
    setBatchId("");
    setTitle("");
    setMessage("");
    setSelectedStudent(null);
  };

  const handleMessageTypeChange = (type: "broadcast" | "direct") => {
    setMessageType(type);
    // Reset student selection when switching to broadcast
    if (type === "broadcast") {
      setSelectedStudent(null);
    }
    // Reset title when switching to direct (title is auto-generated)
    if (type === "direct") {
      setTitle("");
    }
  };

  const isSubmitDisabled =
    messageType === "broadcast"
      ? !batchId || !title || !message || isCreatingBroadcast
      : !selectedStudent ||
        !primaryParent ||
        !message ||
        isCreatingConversation;

  const isPending = isCreatingBroadcast || isCreatingConversation;

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            {messageType === "broadcast"
              ? "Send a broadcast message to all parents in a batch"
              : "Send a direct message to a specific parent"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {canBroadcast && (
            <>
              {/* Message Type Toggle */}
              <div className="space-y-2">
                <Label>Message Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      messageType === "broadcast" ? "primary" : "secondary"
                    }
                    size="sm"
                    onClick={() => handleMessageTypeChange("broadcast")}
                    className="flex-1"
                  >
                    <Megaphone className="mr-2 h-4 w-4" />
                    Broadcast
                  </Button>
                  <Button
                    type="button"
                    variant={messageType === "direct" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleMessageTypeChange("direct")}
                    className="flex-1"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Direct Message
                  </Button>
                </div>
              </div>

              {/* Batch Selection */}
              <div className="space-y-2">
                <Label>
                  Batch{" "}
                  {messageType === "broadcast" ? "*" : "(optional filter)"}
                </Label>
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Selection (Direct Message only) */}
              {messageType === "direct" && (
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <StudentSearchSelect
                    batchId={batchId || undefined}
                    value={selectedStudent?.id}
                    onChange={(student) => setSelectedStudent(student ?? null)}
                    placeholder="Search and select a student..."
                  />
                  {selectedStudent && primaryParent && (
                    <div className="mt-2 p-3 bg-surface-secondary rounded-md">
                      <p className="text-xs text-text-muted mb-1">
                        Message will be sent to:
                      </p>
                      <p className="text-sm font-medium">
                        {primaryParent.fullName}
                        <span className="text-text-muted font-normal ml-2">
                          ({primaryParent.relation})
                        </span>
                        {primaryParent.isPrimaryContact && (
                          <Badge variant="success" className="ml-2 text-[10px]">
                            Primary Contact
                          </Badge>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedStudent && !primaryParent && (
                    <div className="mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                      <p className="text-sm text-error">
                        This student has no parents registered. Please add a
                        parent first.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Title (Broadcast only) */}
              {messageType === "broadcast" && (
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Holiday Announcement"
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full min-h-[100px] rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          {!canBroadcast && (
            <div className="text-center py-4 text-text-muted">
              <p>You don&apos;t have permission to create new messages.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {canBroadcast && (
            <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
              {isPending
                ? "Sending..."
                : messageType === "broadcast"
                  ? "Send Broadcast"
                  : "Send Message"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
