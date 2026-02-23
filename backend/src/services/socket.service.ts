/**
 * Socket.IO Service
 * 
 * Implements real-time messaging with Socket.IO
 * 
 * Requirements: 24.3, 24.6, 24.7
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { logger } from '@utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

interface OnlineUser {
  userId: number;
  socketId: string;
  connectedAt: Date;
}

class SocketService {
  private io: Server | null = null;
  private onlineUsers: Map<number, OnlineUser> = new Map();

  /**
   * Initialize Socket.IO server
   */
  public initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('✅ Socket.IO server initialized');
  }

  /**
   * Authenticate socket connection using JWT
   */
  private async authenticateSocket(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: number;
        role: string;
      };

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    
    logger.info(`User ${userId} connected via Socket.IO (${socket.id})`);

    // Track online user
    this.onlineUsers.set(userId, {
      userId,
      socketId: socket.id,
      connectedAt: new Date(),
    });

    // Notify user's contacts about online status
    this.broadcastUserStatus(userId, 'online');

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Socket event handlers
    socket.on('message:send', (data) => this.handleMessageSend(socket, data));
    socket.on('message:read', (data) => this.handleMessageRead(socket, data));
    socket.on('typing:start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing:stop', (data) => this.handleTypingStop(socket, data));
    
    // Group messaging event handlers
    socket.on('group:message:send', (data) => this.handleGroupMessageSend(socket, data));
    socket.on('group:typing:start', (data) => this.handleGroupTypingStart(socket, data));
    socket.on('group:typing:stop', (data) => this.handleGroupTypingStop(socket, data));
    
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // Send online users list to the connected user
    socket.emit('users:online', this.getOnlineUserIds());
  }

  /**
   * Handle message send event
   */
  private handleMessageSend(socket: AuthenticatedSocket, data: any): void {
    const { recipientId, conversationId, messageId, content, sentAt } = data;

    // Emit to recipient if online
    this.emitToUser(recipientId, 'message:new', {
      messageId,
      conversationId,
      senderId: socket.userId,
      content,
      sentAt,
      isRead: false,
    });

    logger.debug(`Message ${messageId} sent from ${socket.userId} to ${recipientId}`);
  }

  /**
   * Handle message read event
   */
  private handleMessageRead(socket: AuthenticatedSocket, data: any): void {
    const { messageId, conversationId, senderId } = data;

    // Notify sender that message was read
    this.emitToUser(senderId, 'message:read', {
      messageId,
      conversationId,
      readBy: socket.userId,
      readAt: new Date(),
    });

    logger.debug(`Message ${messageId} marked as read by ${socket.userId}`);
  }

  /**
   * Handle typing start event
   */
  private handleTypingStart(socket: AuthenticatedSocket, data: any): void {
    const { recipientId, conversationId } = data;

    this.emitToUser(recipientId, 'typing:start', {
      conversationId,
      userId: socket.userId,
    });
  }

  /**
   * Handle typing stop event
   */
  private handleTypingStop(socket: AuthenticatedSocket, data: any): void {
    const { recipientId, conversationId } = data;

    this.emitToUser(recipientId, 'typing:stop', {
      conversationId,
      userId: socket.userId,
    });
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    
    logger.info(`User ${userId} disconnected from Socket.IO (${socket.id})`);

    // Remove from online users
    this.onlineUsers.delete(userId);

    // Notify user's contacts about offline status
    this.broadcastUserStatus(userId, 'offline');
  }

  /**
   * Handle group message send event
   */
  private handleGroupMessageSend(socket: AuthenticatedSocket, data: any): void {
    const { groupConversationId, groupMessageId, content, sentAt, memberIds } = data;

    // Emit to all group members except sender
    if (memberIds && Array.isArray(memberIds)) {
      const recipientIds = memberIds.filter((id: number) => id !== socket.userId);
      
      this.emitToUsers(recipientIds, 'group:message:new', {
        groupMessageId,
        groupConversationId,
        senderId: socket.userId,
        content,
        sentAt,
      });
    }

    logger.debug(`Group message ${groupMessageId} sent to group ${groupConversationId} by ${socket.userId}`);
  }

  /**
   * Handle group typing start event
   */
  private handleGroupTypingStart(socket: AuthenticatedSocket, data: any): void {
    const { groupConversationId, memberIds } = data;

    if (memberIds && Array.isArray(memberIds)) {
      const recipientIds = memberIds.filter((id: number) => id !== socket.userId);
      
      this.emitToUsers(recipientIds, 'group:typing:start', {
        groupConversationId,
        userId: socket.userId,
      });
    }
  }

  /**
   * Handle group typing stop event
   */
  private handleGroupTypingStop(socket: AuthenticatedSocket, data: any): void {
    const { groupConversationId, memberIds } = data;

    if (memberIds && Array.isArray(memberIds)) {
      const recipientIds = memberIds.filter((id: number) => id !== socket.userId);
      
      this.emitToUsers(recipientIds, 'group:typing:stop', {
        groupConversationId,
        userId: socket.userId,
      });
    }
  }

  /**
   * Emit event to specific user
   */
  public emitToUser(userId: number, event: string, data: any): void {
    if (!this.io) {
      logger.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to multiple users
   */
  public emitToUsers(userIds: number[], event: string, data: any): void {
    if (!this.io) {
      logger.warn('Socket.IO not initialized');
      return;
    }

    userIds.forEach((userId) => {
      this.io!.to(`user:${userId}`).emit(event, data);
    });
  }

  /**
   * Broadcast user online/offline status
   */
  private broadcastUserStatus(userId: number, status: 'online' | 'offline'): void {
    if (!this.io) return;

    // Broadcast to all connected users
    this.io.emit('user:status', {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Get list of online user IDs
   */
  public getOnlineUserIds(): number[] {
    return Array.from(this.onlineUsers.keys());
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get online users count
   */
  public getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * Get Socket.IO instance
   */
  public getIO(): Server | null {
    return this.io;
  }

  /**
   * Emit notification to user
   */
  public emitNotification(userId: number, notification: any): void {
    this.emitToUser(userId, 'notification:new', notification);
  }

  /**
   * Emit announcement to multiple users
   */
  public emitAnnouncement(userIds: number[], announcement: any): void {
    this.emitToUsers(userIds, 'announcement:new', announcement);
  }
}

// Export singleton instance
export const socketService = new SocketService();
