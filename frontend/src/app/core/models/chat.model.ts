export type ChatRole = 'owner' | 'staff';

export interface ChatConversation {
  id: number;
  companyId: number | null;
  title: string;
  participantLabel: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: ChatRole;
  senderAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}
