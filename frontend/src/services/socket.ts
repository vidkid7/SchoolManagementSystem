/**
 * Socket Service for Real-time Communication
 * 
 * Implements real-time messaging with Socket.IO
 * 
 * Requirements: 24.3, 24.6, 24.7
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SocketMessage {
  messageId: number;
  conversationId: number;
  senderId: number;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface SocketGroupMessage {
  groupMessageId: number;
  groupConversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface UserStatus {
  userId: number;
  status: 'online' | 'offline';
  timestamp: string;
}

export interface TypingStatus {
  conversationId?: number;
  groupConversationId?: number;
  userId: number;
}

class SocketService {
  private socket: Socket | null = null;
  private onlineUsers: Set<number> = new Set();
  private typingUsers: Map<number | string, Set<number>> = new Map();
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('accessToken');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Online users
    this.socket.on('users:online', (userIds: number[]) => {
      this.onlineUsers = new Set(userIds);
      this.emit('users:online', Array.from(this.onlineUsers));
    });

    // User status changes
    this.socket.on('user:status', (data: UserStatus) => {
      if (data.status === 'online') {
        this.onlineUsers.add(data.userId);
      } else {
        this.onlineUsers.delete(data.userId);
      }
      this.emit('user:status', data);
    });

    // New message
    this.socket.on('message:new', (data: SocketMessage) => {
      this.emit('message:new', data);
    });

    // Message read
    this.socket.on('message:read', (data: any) => {
      this.emit('message:read', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: TypingStatus) => {
      const key = data.conversationId || data.groupConversationId;
      if (key) {
        let users = this.typingUsers.get(key) || new Set();
        users.add(data.userId);
        this.typingUsers.set(key, users);
      }
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: TypingStatus) => {
      const key = data.conversationId || data.groupConversationId;
      if (key) {
        const users = this.typingUsers.get(key);
        if (users) {
          users.delete(data.userId);
        }
      }
      this.emit('typing:stop', data);
    });

    // Group messages
    this.socket.on('group:message:new', (data: SocketGroupMessage) => {
      this.emit('group:message:new', data);
    });

    this.socket.on('group:typing:start', (data: TypingStatus) => {
      const key = data.groupConversationId;
      if (key) {
        let users = this.typingUsers.get(key) || new Set();
        users.add(data.userId);
        this.typingUsers.set(key, users);
      }
      this.emit('group:typing:start', data);
    });

    this.socket.on('group:typing:stop', (data: TypingStatus) => {
      const key = data.groupConversationId;
      if (key) {
        const users = this.typingUsers.get(key);
        if (users) {
          users.delete(data.userId);
        }
      }
      this.emit('group:typing:stop', data);
    });

    // Notifications
    this.socket.on('notification:new', (data: any) => {
      this.emit('notification:new', data);
    });

    // Announcements
    this.socket.on('announcement:new', (data: any) => {
      this.emit('announcement:new', data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.onlineUsers.clear();
    this.typingUsers.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get all online user IDs
   */
  getOnlineUsers(): number[] {
    return Array.from(this.onlineUsers);
  }

  /**
   * Check if user is typing
   */
  isUserTyping(conversationId: number | string, userId: number): boolean {
    const users = this.typingUsers.get(conversationId);
    return users?.has(userId) || false;
  }

  /**
   * Get typing users for a conversation
   */
  getTypingUsers(conversationId: number | string): number[] {
    const users = this.typingUsers.get(conversationId);
    return users ? Array.from(users) : [];
  }

  // ==================== EVENT EMITTERS ====================

  /**
   * Send message
   */
  sendMessage(data: {
    recipientId: number;
    conversationId: number;
    messageId: number;
    content: string;
    sentAt: string;
  }): void {
    this.socket?.emit('message:send', data);
  }

  /**
   * Mark message as read
   */
  markMessageRead(data: {
    messageId: number;
    conversationId: number;
    senderId: number;
  }): void {
    this.socket?.emit('message:read', data);
  }

  /**
   * Start typing
   */
  startTyping(recipientId: number, conversationId: number): void {
    this.socket?.emit('typing:start', { recipientId, conversationId });
  }

  /**
   * Stop typing
   */
  stopTyping(recipientId: number, conversationId: number): void {
    this.socket?.emit('typing:stop', { recipientId, conversationId });
  }

  /**
   * Send group message
   */
  sendGroupMessage(data: {
    groupConversationId: number;
    groupMessageId: number;
    content: string;
    sentAt: string;
    memberIds: number[];
  }): void {
    this.socket?.emit('group:message:send', data);
  }

  /**
   * Start group typing
   */
  startGroupTyping(groupConversationId: number, memberIds: number[]): void {
    this.socket?.emit('group:typing:start', { groupConversationId, memberIds });
  }

  /**
   * Stop group typing
   */
  stopGroupTyping(groupConversationId: number, memberIds: number[]): void {
    this.socket?.emit('group:typing:stop', { groupConversationId, memberIds });
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Subscribe to event
   */
  on(event: string, handler: (data: any) => void): () => void {
    const handlers = this.eventHandlers.get(event) || new Set();
    handlers.add(handler);
    this.eventHandlers.set(event, handlers);

    // Return unsubscribe function
    return () => {
      const eventHandlers = this.eventHandlers.get(event);
      if (eventHandlers) {
        eventHandlers.delete(handler);
        if (eventHandlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }

  /**
   * Emit event to local handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
}

export const socketService = new SocketService();