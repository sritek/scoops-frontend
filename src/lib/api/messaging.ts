/**
 * Messaging API Client
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Conversation,
  ConversationDetail,
  CreateConversationInput,
  SendMessageInput,
  CreateBroadcastInput,
  BroadcastResult,
  UnreadCount,
  ConversationsFilters,
  Message,
} from "@/types/messaging";
import type { PaginatedResponse } from "@/types";

// Query keys
export const messagingKeys = {
  all: ["messaging"] as const,
  unread: () => [...messagingKeys.all, "unread"] as const,
  conversations: () => [...messagingKeys.all, "conversations"] as const,
  conversationList: (filters: ConversationsFilters) =>
    [...messagingKeys.conversations(), filters] as const,
  conversationDetail: (id: string) =>
    [...messagingKeys.conversations(), "detail", id] as const,
};

/**
 * Fetch unread count
 */
async function fetchUnreadCount(): Promise<UnreadCount> {
  const response = await apiClient.get<{ data: UnreadCount }>("/messages/unread");
  return response.data;
}

/**
 * Fetch conversations
 */
async function fetchConversations(
  filters: ConversationsFilters = {}
): Promise<PaginatedResponse<Conversation>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  return apiClient.get(`/messages/conversations?${params.toString()}`);
}

/**
 * Fetch conversation detail
 */
async function fetchConversation(id: string): Promise<ConversationDetail> {
  const response = await apiClient.get<{ data: ConversationDetail }>(
    `/messages/conversations/${id}`
  );
  return response.data;
}

/**
 * Create conversation
 */
async function createConversation(
  input: CreateConversationInput
): Promise<Conversation> {
  const response = await apiClient.post<{ data: Conversation }>(
    "/messages/conversations",
    input
  );
  return response.data;
}

/**
 * Send message
 */
async function sendMessage(
  conversationId: string,
  input: SendMessageInput
): Promise<Message> {
  const response = await apiClient.post<{ data: Message }>(
    `/messages/conversations/${conversationId}/messages`,
    input
  );
  return response.data;
}

/**
 * Create broadcast
 */
async function createBroadcast(
  input: CreateBroadcastInput
): Promise<BroadcastResult> {
  const response = await apiClient.post<{ data: BroadcastResult }>(
    "/messages/broadcast",
    input
  );
  return response.data;
}

// Hooks

export function useUnreadCount() {
  return useQuery({
    queryKey: messagingKeys.unread(),
    queryFn: fetchUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useConversations(filters: ConversationsFilters = {}) {
  return useQuery({
    queryKey: messagingKeys.conversationList(filters),
    queryFn: () => fetchConversations(filters),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: messagingKeys.conversationDetail(id),
    queryFn: () => fetchConversation(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      input,
    }: {
      conversationId: string;
      input: SendMessageInput;
    }) => sendMessage(conversationId, input),
    onMutate: async ({ conversationId, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: messagingKeys.conversationDetail(conversationId),
      });

      // Snapshot current data for rollback
      const previousData = queryClient.getQueryData<ConversationDetail>(
        messagingKeys.conversationDetail(conversationId)
      );

      // Optimistically add the message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: input.content,
        attachmentUrl: input.attachmentUrl ?? null,
        createdAt: new Date().toISOString(),
        senderName: "You",
        isOwnMessage: true,
      };

      queryClient.setQueryData<ConversationDetail>(
        messagingKeys.conversationDetail(conversationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...old.messages, optimisticMessage],
          };
        }
      );

      return { previousData, conversationId };
    },
    onError: (err, { conversationId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          messagingKeys.conversationDetail(conversationId),
          context.previousData
        );
      }
    },
    onSuccess: (newMessage, { conversationId }) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<ConversationDetail>(
        messagingKeys.conversationDetail(conversationId),
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
      // Update conversation list's lastMessage
      queryClient.setQueryData<PaginatedResponse<Conversation>>(
        messagingKeys.conversations(),
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
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBroadcast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}
