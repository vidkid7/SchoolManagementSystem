/**
 * Message Service
 * 
 * Business logic for messaging operations
 * 
 * Requirements: 24.1, 24.3, 24.5, 24.6, 24.7
 */

import { messageRepository, MessagePaginationOptions } from './message.repository';
import { conversationRepository } from './conversation.repository';
import { MessageCreationAttributes } from '../../models/Message.model';
import { socketService } from '../../services/socket.service';

export interface SendMessageData {
  senderId: number;
  recipientId: number;
  content: string;
  attachments?: object[];
}

export class MessageService {
  /**
   * Send a message
   */
  async sendMessage(data: SendMessageData) {
    // Validate that sender and recipient are different
    if (data.senderId === data.recipientId) {
      throw new Error('Cannot send message to yourself');
    }

    // Find or create conversation
    const conversation = await conversationRepository.findOrCreate(
      data.senderId,
      data.recipientId
    );

    // Create message
    const messageData: MessageCreationAttributes = {
      conversationId: conversation.conversationId,
      senderId: data.senderId,
      recipientId: data.recipientId,
      content: data.content,
      attachments: data.attachments,
      sentAt: new Date(),
    };

    const message = await messageRepository.create(messageData);

    // Update conversation last message
    await conversationRepository.updateLastMessage(
      conversation.conversationId,
      message.messageId,
      message.sentAt
    );

    // Increment unread count for recipient
    await conversationRepository.incrementUnreadCount(
      conversation.conversationId,
      data.recipientId
    );

    // Emit real-time message to recipient via Socket.IO (Requirement 24.3)
    socketService.emitToUser(data.recipientId, 'message:new', {
      messageId: message.messageId,
      conversationId: conversation.conversationId,
      senderId: data.senderId,
      recipientId: data.recipientId,
      content: message.content,
      attachments: message.attachments,
      sentAt: message.sentAt,
      isRead: false,
    });

    return {
      message,
      conversation,
    };
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: number,
    userId: number,
    options?: MessagePaginationOptions
  ) {
    // Verify user is participant in conversation
    const isParticipant = await conversationRepository.isParticipant(
      conversationId,
      userId
    );

    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return await messageRepository.findByConversation(conversationId, options);
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: number, userId: number) {
    const message = await messageRepository.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Only recipient can mark message as read
    if (message.recipientId !== userId) {
      throw new Error('Only recipient can mark message as read');
    }

    const updatedMessage = await messageRepository.markAsRead(messageId);

    if (!updatedMessage) {
      throw new Error('Failed to mark message as read');
    }

    // Emit read receipt to sender via Socket.IO (Requirement 24.7)
    socketService.emitToUser(message.senderId, 'message:read', {
      messageId: message.messageId,
      conversationId: message.conversationId,
      readBy: userId,
      readAt: updatedMessage.readAt,
    });

    return updatedMessage;
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversationId: number, userId: number) {
    // Verify user is participant in conversation
    const isParticipant = await conversationRepository.isParticipant(
      conversationId,
      userId
    );

    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Mark all messages as read
    const count = await messageRepository.markConversationAsRead(
      conversationId,
      userId
    );

    // Reset unread count in conversation
    await conversationRepository.resetUnreadCount(conversationId, userId);

    return { markedCount: count };
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: number, conversationId?: number) {
    if (conversationId) {
      return await messageRepository.getUnreadCount(userId, conversationId);
    }
    return await conversationRepository.getTotalUnreadCount(userId);
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: number,
    searchQuery: string,
    options?: MessagePaginationOptions
  ) {
    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new Error('Search query is required');
    }

    return await messageRepository.searchMessages(userId, searchQuery, options);
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: number, userId: number) {
    const message = await messageRepository.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Only sender can delete message
    if (message.senderId !== userId) {
      throw new Error('Only sender can delete message');
    }

    const deleted = await messageRepository.delete(messageId);

    if (!deleted) {
      throw new Error('Failed to delete message');
    }

    return { success: true };
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: number, userId: number) {
    const message = await messageRepository.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is sender or recipient
    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new Error('Access denied');
    }

    return message;
  }
}

export const messageService = new MessageService();
