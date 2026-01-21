"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  MessagesLayout,
  ConversationListItem,
  MessageBubble,
  ChatPanelShell,
} from "@/components/messages";
import { EmptyState, Badge } from "@/components/ui";
import {
  getParentConversations,
  getParentConversation,
  sendParentMessage,
  findOrCreateConversationWithStaff,
  type Conversation,
  type ConversationsResponse,
  type ConversationMessage,
  type ConversationWithMessages,
} from "@/lib/api/parent";
import { toast } from "sonner";

/**
 * Active view type for the messages page
 */
type ActiveView =
  | { type: "pending" }
  | { type: "conversation"; id: string }
  | { type: "none" };

/**
 * Parent Messages Page
 *
 * Shows conversations with staff members:
 * - Responsive layout: side-by-side on desktop, single view on mobile
 * - List of all conversations
 * - Conversation detail with messages
 * - Ability to reply to messages
 * - Handles ?staffId&staffName params for lazy conversation creation
 */
export default function ParentMessagesPage() {
  const router = useRouter();

  // Active view tracks which panel is currently being viewed
  const [activeView, setActiveView] = useState<ActiveView>({ type: "none" });

  // Pending staff info - persists until explicitly cleared (back button or conversation created)
  const [pendingStaff, setPendingStaff] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const staffId = searchParams.get("staffId");
  const staffName = searchParams.get("staffName");

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "messages"],
    queryFn: () => getParentConversations({ limit: 50 }),
  });

  const conversations = useMemo(() => data?.data ?? [], [data?.data]);

  // Handle staffId & staffName params - show new chat panel immediately
  useEffect(() => {
    if (staffId && staffName) {
      // Use Promise.resolve to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setPendingStaff({
          id: staffId,
          name: decodeURIComponent(staffName),
        });
        setActiveView({ type: "pending" });
        // Clear URL immediately to prevent re-triggering
        router.replace("/parent/messages");
      });
    }
  }, [staffId, staffName, router]);

  // Auto-select first conversation on desktop
  // Only when: no active view, no pending staff, no URL params, has conversations, desktop
  useEffect(() => {
    if (
      activeView.type === "none" &&
      !pendingStaff &&
      !staffId && // Don't auto-select if URL params present
      !staffName && // Effect 1 will handle these
      conversations.length > 0 &&
      typeof window !== "undefined" &&
      window.innerWidth >= 768
    ) {
      // Use Promise.resolve to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setActiveView({ type: "conversation", id: conversations[0].id });
      });
    }
  }, [conversations, activeView.type, pendingStaff, staffId, staffName]);

  // Determine which chat panel to show based on activeView
  const chatPanel =
    activeView.type === "pending" && pendingStaff ? (
      <NewChatPanel
        staffId={pendingStaff.id}
        staffName={pendingStaff.name}
        onBack={() => {
          setPendingStaff(null); // Clear pending when back pressed
          setActiveView({ type: "none" });
        }}
        onConversationCreated={(id) => {
          setPendingStaff(null); // Clear pending after creation
          setActiveView({ type: "conversation", id });
        }}
      />
    ) : activeView.type === "conversation" ? (
      <ChatPanel
        conversationId={activeView.id}
        onBack={() => setActiveView({ type: "none" })}
      />
    ) : null;

  console.log("activeView", activeView);

  // For mobile view and MessagesLayout
  const effectiveSelectedId =
    activeView.type === "pending"
      ? "pending"
      : activeView.type === "conversation"
      ? activeView.id
      : null;

  return (
    <MessagesLayout
      title="Messages"
      description="Conversations with school staff"
      conversationList={
        <ConversationList
          conversations={conversations}
          selectedId={activeView.type === "conversation" ? activeView.id : null}
          onSelect={(id) => setActiveView({ type: "conversation", id })}
          isEmpty={!isLoading && conversations.length === 0 && !pendingStaff}
          pendingStaff={pendingStaff}
          isPendingSelected={activeView.type === "pending"}
          onSelectPending={() => setActiveView({ type: "pending" })}
        />
      }
      chatPanel={chatPanel}
      selectedId={effectiveSelectedId}
      onBack={() => {
        if (activeView.type === "pending") {
          setPendingStaff(null);
        }
        setActiveView({ type: "none" });
      }}
      isLoading={isLoading}
      error={error instanceof Error ? error : null}
    />
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
  pendingStaff,
  isPendingSelected,
  onSelectPending,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isEmpty: boolean;
  pendingStaff?: { id: string; name: string } | null;
  isPendingSelected?: boolean;
  onSelectPending?: () => void;
}) {
  if (isEmpty) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No messages"
        description="Messages from school staff will appear here"
      />
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {/* Pending conversation at top */}
      {pendingStaff && (
        <ConversationListItem
          title={`Chat with ${pendingStaff.name}`}
          type="direct"
          updatedAt={new Date().toISOString()}
          isSelected={isPendingSelected ?? false}
          onClick={() => onSelectPending?.()}
          subtitle="New conversation"
        />
      )}

      {/* Existing conversations */}
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          title={conversation.title}
          type={conversation.type as "direct" | "broadcast" | "announcement"}
          batchName={conversation.batchName ?? undefined}
          lastMessage={
            conversation.lastMessage
              ? {
                  content: conversation.lastMessage.content,
                  isFromStaff: conversation.lastMessage.isFromStaff,
                }
              : undefined
          }
          updatedAt={conversation.updatedAt}
          isSelected={selectedId === conversation.id}
          onClick={() => onSelect(conversation.id)}
        />
      ))}
    </div>
  );
}

/**
 * New Chat Panel Component
 *
 * Shows an empty chat panel for starting a new conversation with a teacher.
 * Conversation is only created when the first message is sent.
 */
function NewChatPanel({
  staffId,
  staffName,
  onBack,
  onConversationCreated,
}: {
  staffId: string;
  staffName: string;
  onBack: () => void;
  onConversationCreated: (conversationId: string) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (message: string) =>
      findOrCreateConversationWithStaff(staffId, message),
    onSuccess: (conversation) => {
      // Optimistically add the new conversation to the list cache
      queryClient.setQueryData<ConversationsResponse>(
        ["parent", "messages"],
        (oldData) => {
          if (!oldData) return oldData;
          // Check if conversation already exists (in case it was found, not created)
          const exists = oldData.data.some((c) => c.id === conversation.id);
          if (exists) {
            // Update existing conversation
            return {
              ...oldData,
              data: oldData.data.map((c) =>
                c.id === conversation.id
                  ? {
                      ...c,
                      lastMessage: conversation.messages[0]
                        ? {
                            content: conversation.messages[0].content,
                            createdAt: conversation.messages[0].createdAt,
                            isFromStaff: conversation.messages[0].isFromStaff,
                          }
                        : c.lastMessage,
                      updatedAt: conversation.updatedAt,
                    }
                  : c
              ),
            };
          }
          // Add new conversation at the top
          return {
            ...oldData,
            data: [conversation, ...oldData.data],
            total: oldData.total + 1,
          };
        }
      );
      // Now transition the view - list is already updated
      onConversationCreated(conversation.id);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );
    },
  });

  return (
    <ChatPanelShell
      title={`Chat with ${staffName}`}
      badge={<Badge variant="default">Direct</Badge>}
      messages={null}
      onBack={onBack}
      onSend={(message) => createMutation.mutate(message)}
      isSending={createMutation.isPending}
      isLoading={false}
      hasMessages={false}
      emptyMessagesState={
        <div className="text-center py-8 text-text-muted">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Send a message to start the conversation</p>
        </div>
      }
    />
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
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "messages", conversationId],
    queryFn: () => getParentConversation(conversationId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendParentMessage(conversationId, content),
    onMutate: async (content) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["parent", "messages", conversationId],
      });

      // Snapshot current data for rollback
      const previousData = queryClient.getQueryData<ConversationWithMessages>([
        "parent",
        "messages",
        conversationId,
      ]);

      // Optimistically add the message
      const optimisticMessage: ConversationMessage = {
        id: `temp-${Date.now()}`,
        content,
        attachmentUrl: null,
        createdAt: new Date().toISOString(),
        senderName: "You",
        isOwnMessage: true,
        isFromStaff: false,
      };

      queryClient.setQueryData<ConversationWithMessages>(
        ["parent", "messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...old.messages, optimisticMessage],
          };
        }
      );

      return { previousData };
    },
    onError: (err, content, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["parent", "messages", conversationId],
          context.previousData
        );
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to send message"
      );
    },
    onSuccess: (newMessage) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<ConversationWithMessages>(
        ["parent", "messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id.startsWith("temp-") ? newMessage : msg
            ),
          };
        }
      );
      // Also update conversation list's lastMessage
      queryClient.setQueryData<ConversationsResponse>(
        ["parent", "messages"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: {
                      content: newMessage.content,
                      createdAt: newMessage.createdAt,
                      isFromStaff: newMessage.isFromStaff,
                    },
                    updatedAt: newMessage.createdAt,
                  }
                : c
            ),
          };
        }
      );
    },
  });

  const handleSend = (message: string) => {
    sendMutation.mutate(message);
  };

  return (
    <ChatPanelShell
      title={conversation?.title ?? "Loading..."}
      subtitle={conversation?.batchName ?? undefined}
      badge={
        conversation?.type === "broadcast" ? (
          <Badge variant="info" className="capitalize">
            Broadcast
          </Badge>
        ) : (
          <Badge variant="default" className="capitalize">
            {conversation?.type ?? "direct"}
          </Badge>
        )
      }
      messages={
        conversation?.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            senderName={msg.senderName}
            isOwnMessage={msg.isOwnMessage}
            isFromStaff={msg.isFromStaff}
            createdAt={msg.createdAt}
          />
        )) ?? null
      }
      onBack={onBack}
      onSend={handleSend}
      isSending={sendMutation.isPending}
      isLoading={isLoading}
      error={error instanceof Error ? error : null}
      hasMessages={(conversation?.messages.length ?? 0) > 0}
      messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
    />
  );
}
