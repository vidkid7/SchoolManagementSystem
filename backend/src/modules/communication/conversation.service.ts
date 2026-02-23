/**
 * Conversation Service
 * 
 * Business logic for conversation management
 * 
 * Requirements: 24.1, 24.5
 */

import { conversationRepository, ConversationPaginationOptions } from './conversation.repository';

export class ConversationService {
  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: number, options?: ConversationPaginationOptions) {
    return await conversationRepository.findByUser(userId, options);
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: number, userId: number) {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Verify user is participant
    if (!conversation.hasParticipant(userId)) {
      throw new Error('Access denied');
    }

    return conversation;
  }

  /**
   * Get or create conversation with another user
   */
  async getOrCreateConversation(userId: number, otherUserId: number) {
    if (userId === otherUserId) {
      throw new Error('Cannot create conversation with yourself');
    }

    return await conversationRepository.findOrCreate(userId, otherUserId);
  }

  /**
   * Get conversation between two users
   */
  async getConversationBetweenUsers(user1Id: number, user2Id: number, requesterId: number) {
    // Verify requester is one of the participants
    if (requesterId !== user1Id && requesterId !== user2Id) {
      throw new Error('Access denied');
    }

    const conversation = await conversationRepository.findByParticipants(user1Id, user2Id);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: number) {
    return await conversationRepository.getTotalUnreadCount(userId);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: number, userId: number) {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Verify user is participant
    if (!conversation.hasParticipant(userId)) {
      throw new Error('Access denied');
    }

    const deleted = await conversationRepository.delete(conversationId);

    if (!deleted) {
      throw new Error('Failed to delete conversation');
    }

    return { success: true };
  }

  /**
   * Get conversation with unread count for user
   */
  async getConversationWithUnreadCount(conversationId: number, userId: number) {
    const conversation = await this.getConversationById(conversationId, userId);
    const unreadCount = conversation.getUnreadCount(userId);

    return {
      ...conversation.toJSON(),
      unreadCount,
    };
  }

  /**
   * Get all conversations with unread counts
   */
  async getUserConversationsWithUnreadCounts(
    userId: number,
    options?: ConversationPaginationOptions
  ) {
    const result = await conversationRepository.findByUser(userId, options);

    const conversationsWithUnread = result.conversations.map((conversation) => ({
      ...conversation.toJSON(),
      unreadCount: conversation.getUnreadCount(userId),
    }));

    return {
      ...result,
      conversations: conversationsWithUnread,
    };
  }
}

export const conversationService = new ConversationService();
