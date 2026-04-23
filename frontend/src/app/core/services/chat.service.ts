import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';

import { ChatConversation, ChatMessage, ChatRole } from '../models/chat.model';

type ChatStore = Record<number, ChatMessage[]>;

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly conversationsSubject = new BehaviorSubject<ChatConversation[]>(this.createSeedConversations());
  private readonly messagesSubject = new BehaviorSubject<ChatStore>(this.createSeedMessages());

  getConversations(_: ChatRole): Observable<ChatConversation[]> {
    return this.conversationsSubject.asObservable().pipe(
      map((conversations) => {
        return conversations
          .slice()
          .sort(
            (left, right) =>
              new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime()
          );
      })
    );
  }

  getMessages(conversationId: number): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable().pipe(
      map((store) => (store[conversationId] ?? []).slice())
    );
  }

  sendMessage(
    conversationId: number,
    content: string,
    sender: { id: number; name: string; role: ChatRole }
  ): Observable<ChatMessage> {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return of({
        id: 0,
        conversationId,
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        senderAvatarUrl: null,
        content: '',
        createdAt: new Date().toISOString(),
      });
    }

    const createdAt = new Date().toISOString();
    const message: ChatMessage = {
      id: Date.now(),
      conversationId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatarUrl: null,
      content: trimmedContent,
      createdAt,
    };

    const currentStore = this.messagesSubject.value;
    const existingMessages = currentStore[conversationId] ?? [];

    this.messagesSubject.next({
      ...currentStore,
      [conversationId]: [...existingMessages, message],
    });

    this.conversationsSubject.next(
      this.conversationsSubject.value.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          lastMessagePreview: trimmedContent,
          lastMessageAt: createdAt,
          unreadCount: 0,
        };
      })
    );

    return of(message);
  }

  markConversationAsRead(conversationId: number): void {
    this.conversationsSubject.next(
      this.conversationsSubject.value.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  }

  private createSeedConversations(): ChatConversation[] {
    const now = new Date();
    const updatedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 45);

    return [
      {
        id: 1,
        companyId: 1,
        title: 'Csapat chat',
        participantLabel: 'Owner + teljes staff csapat',
        lastMessagePreview: 'Rendben, a holnapi beosztást akkor itt egyeztessük.',
        lastMessageAt: updatedAt.toISOString(),
        unreadCount: 3,
      },
    ];
  }

  private createSeedMessages(): ChatStore {
    const now = new Date();

    return {
      1: [
        {
          id: 101,
          conversationId: 1,
          senderId: 900,
          senderName: 'Tulajdonos',
          senderRole: 'owner',
          senderAvatarUrl: null,
          content: 'Sziasztok, ide írjunk minden napi egyeztetést, hogy egy helyen legyen.',
          createdAt: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
        },
        {
          id: 102,
          conversationId: 1,
          senderId: 201,
          senderName: 'Fodor Réka',
          senderRole: 'staff',
          senderAvatarUrl: null,
          content: 'Rendben, a csúszó foglalásokat ide fogom jelezni.',
          createdAt: new Date(now.getTime() - 74 * 60 * 1000).toISOString(),
        },
        {
          id: 103,
          conversationId: 1,
          senderId: 202,
          senderName: 'Németh Bence',
          senderRole: 'staff',
          senderAvatarUrl: null,
          content: 'A pénteki esti műszakot tudom vállalni, ha kell csere.',
          createdAt: new Date(now.getTime() - 44 * 60 * 1000).toISOString(),
        },
        {
          id: 104,
          conversationId: 1,
          senderId: 203,
          senderName: 'Szalai Dóra',
          senderRole: 'staff',
          senderAvatarUrl: null,
          content: 'Az új csomagárakról is itt írjunk szerintem.',
          createdAt: new Date(now.getTime() - 24 * 60 * 1000).toISOString(),
        },
        {
          id: 105,
          conversationId: 1,
          senderId: 900,
          senderName: 'Tulajdonos',
          senderRole: 'owner',
          senderAvatarUrl: null,
          content: 'Rendben, a holnapi beosztást akkor itt egyeztessük.',
          createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
        },
      ],
    };
  }
}
