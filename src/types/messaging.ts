/**
 * Messaging Types
 */

export type MessageType = "direct" | "broadcast" | "announcement";

export interface Participant {
  type: "user" | "parent";
  name: string;
}

export interface LastMessage {
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: MessageType;
  title: string;
  batchName?: string;
  participants: Participant[];
  lastMessage: LastMessage | null;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
  senderName: string;
  isOwnMessage: boolean;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface CreateConversationInput {
  type: MessageType;
  title?: string;
  batchId?: string;
  participantUserIds?: string[];
  participantParentIds?: string[];
  initialMessage: string;
}

export interface SendMessageInput {
  content: string;
  attachmentUrl?: string;
}

export interface CreateBroadcastInput {
  batchId: string;
  title: string;
  message: string;
}

export interface BroadcastResult {
  id: string;
  title: string;
  participantCount: number;
  message: string;
}

export interface UnreadCount {
  unreadCount: number;
}

export interface ConversationsFilters {
  page?: number;
  limit?: number;
}
