import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ChatConversation, ChatMessage, ChatRole, User } from '../../../core/models';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-dashboard-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-chat.component.html',
  styleUrl: './dashboard-chat.component.css',
})
export class DashboardChatComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) panelRole: ChatRole = 'owner';
  @Input() currentUser: User | null = null;
  @Input() pageTitle = 'Belső chat';
  @Input() pageSubtitle = '';

  conversations: ChatConversation[] = [];
  selectedConversationId: number | null = null;
  messages: ChatMessage[] = [];
  draftMessage = '';

  private conversationsSubscription?: Subscription;
  private messagesSubscription?: Subscription;

  constructor(private readonly chatService: ChatService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['panelRole'] || changes['currentUser']) {
      this.bindConversations();
    }
  }

  ngOnDestroy(): void {
    this.conversationsSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
  }

  get selectedConversation(): ChatConversation | null {
    return this.conversations.find((conversation) => conversation.id === this.selectedConversationId) ?? null;
  }

  get canSendMessage(): boolean {
    return Boolean(this.selectedConversationId && this.draftMessage.trim());
  }

  get isGroupChat(): boolean {
    return this.conversations.length <= 1;
  }

  get selectedConversationHeader(): string {
    const conversation = this.selectedConversation;

    if (!conversation) {
      return 'Nincs kiválasztott beszélgetés';
    }

    return conversation.title;
  }

  get selectedConversationSubheader(): string {
    const conversation = this.selectedConversation;

    if (!conversation) {
      return 'Válassz ki egy beszélgetést a listából.';
    }

    return this.isGroupChat
      ? 'Kozos owner-staff csoportbeszelgetes'
      : 'Belső kommunikáció a staff csapattal';
  }

  selectConversation(conversationId: number): void {
    if (this.selectedConversationId === conversationId && this.messagesSubscription) {
      this.chatService.markConversationAsRead(conversationId);
      return;
    }

    this.selectedConversationId = conversationId;
    this.chatService.markConversationAsRead(conversationId);
    this.messagesSubscription?.unsubscribe();
    this.messagesSubscription = this.chatService.getMessages(conversationId).subscribe((messages) => {
      this.messages = messages;
    });
  }

  sendMessage(): void {
    const selectedConversationId = this.selectedConversationId;
    const content = this.draftMessage.trim();

    if (!selectedConversationId || !content) {
      return;
    }

    this.chatService
      .sendMessage(selectedConversationId, content, {
        id: this.currentUser?.id ?? 0,
        name: this.getSenderName(),
        role: this.panelRole,
      })
      .subscribe(() => {
        this.draftMessage = '';
      });
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === (this.currentUser?.id ?? -1);
  }

  getMessageAvatarUrl(message: ChatMessage): string | null {
    if (this.isOwnMessage(message) && this.currentUser?.avatarUrl) {
      return this.currentUser.avatarUrl;
    }

    return message.senderAvatarUrl?.trim() || null;
  }

  getMessageInitials(message: ChatMessage): string {
    const sourceName = message.senderName.trim();
    const parts = sourceName.split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  formatConversationTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();

    if (sameDay) {
      return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  trackConversation(_: number, conversation: ChatConversation): number {
    return conversation.id;
  }

  trackMessage(_: number, message: ChatMessage): number {
    return message.id;
  }

  private bindConversations(): void {
    this.conversationsSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();

    this.conversationsSubscription = this.chatService
      .getConversations(this.panelRole)
      .subscribe((conversations) => {
        this.conversations = conversations;

        if (conversations.length === 0) {
          this.selectedConversationId = null;
          this.messages = [];
          return;
        }

        const stillExists = conversations.some(
          (conversation) => conversation.id === this.selectedConversationId
        );

        if (!stillExists) {
          this.selectConversation(conversations[0].id);
        }
      });
  }

  private getSenderName(): string {
    const firstName = this.currentUser?.firstName?.trim() ?? '';
    const lastName = this.currentUser?.lastName?.trim() ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }

    return this.panelRole === 'owner' ? 'Tulajdonos' : 'Staff';
  }
}
