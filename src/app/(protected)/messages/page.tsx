"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  AlertCircle,
  Users,
  User,
  Megaphone,
  ArrowLeft,
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
  Button,
  Card,
  CardContent,
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
  Spinner,
  StudentSearchSelect,
} from "@/components/ui";
import type { Conversation, Message, MessageType } from "@/types/messaging";
import type { Student } from "@/types/student";
import { PAGINATION_DEFAULTS } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Messages Page
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

  useEffect(() => {
    if (
      conversations.length > 0 &&
      !selectedConversationId &&
      window.innerWidth >= 768
    ) {
      Promise.resolve().then(() => {
        setSelectedConversationId(conversations[0].id);
      });
    }
  }, [conversations, selectedConversationId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Messages</h1>
          <p className="text-sm text-text-muted">
            Communicate with parents and staff
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load messages. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Conversation List */}
          <div
            className={`w-full md:w-80 shrink-0 ${
              selectedConversationId ? "hidden md:block" : ""
            }`}
          >
            <Card className="h-full overflow-hidden">
              <div className="h-full overflow-y-auto">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : conversations.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No conversations"
                    description="Start a new conversation"
                    action={
                      <Button onClick={() => setShowNewDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Message
                      </Button>
                    }
                  />
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {conversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onClick={() =>
                          setSelectedConversationId(conversation.id)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
          <div
            className={`flex-1 ${
              selectedConversationId ? "" : "hidden md:block"
            }`}
          >
            {selectedConversationId ? (
              <ChatPanel
                conversationId={selectedConversationId}
                onBack={() => setSelectedConversationId(null)}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-text-muted">
                  <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}

/**
 * Conversation Item
 */
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getTypeIcon = (type: MessageType) => {
    switch (type) {
      case "broadcast":
        return <Megaphone className="h-4 w-4" />;
      case "announcement":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  console.log("conversation", conversation);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 text-left hover:bg-surface-secondary transition-colors",
        isSelected ? "bg-primary-100 dark:bg-primary-900/20" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-surface-secondary p-2 text-text-muted">
          {getTypeIcon(conversation.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{conversation.title}</p>
            {conversation.type === "broadcast" && (
              <Badge variant="info" className="text-[10px]">
                Broadcast
              </Badge>
            )}
          </div>
          {conversation.batchName && (
            <p className="text-xs text-text-muted">{conversation.batchName}</p>
          )}
          {conversation.type === "direct" && (
            <p className="text-xs text-text-muted">
              {conversation.participants[0].type} :{" "}
              {conversation.participants[0].name}
            </p>
          )}

          {/* {conversation.lastMessage && (
            <p className="text-sm text-text-muted truncate mt-1">
              {conversation.lastMessage.content}
            </p>
          )}
          <p className="text-xs text-text-muted mt-1">
            {formatRelativeTime(conversation.updatedAt)}
          </p> */}
        </div>
      </div>
    </button>
  );
}

/**
 * Chat Panel
 */
function ChatPanel({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversation,
    isLoading,
    error,
  } = useConversation(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!newMessage.trim() || isSending) return;

    sendMessage(
      { conversationId, input: { content: newMessage } },
      {
        onSuccess: () => {
          setNewMessage("");
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </Card>
    );
  }

  if (error || !conversation) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-error">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Failed to load conversation</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-medium">{conversation.title}</h2>
          {conversation.batchName && (
            <p className="text-xs text-text-muted">{conversation.batchName}</p>
          )}
        </div>
        <Badge variant="default" className="capitalize">
          {conversation.type}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
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
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Message Bubble
 */
function MessageBubble({ message }: { message: Message }) {
  return (
    <div
      className={`flex ${
        message.isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          message.isOwnMessage
            ? "bg-primary-600 text-white"
            : "bg-surface-secondary text-text-primary"
        }`}
      >
        {!message.isOwnMessage && (
          <p className="text-xs font-medium mb-1 opacity-70">
            {message.senderName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-[10px] mt-1 ${
            message.isOwnMessage ? "text-white/70" : "text-text-muted"
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
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

/**
 * Format relative time
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
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/**
 * Format time
 */
function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
