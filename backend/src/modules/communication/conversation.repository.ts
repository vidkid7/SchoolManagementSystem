/**
 * Conversation Repository
 * 
 * Database operations for conversations
 * 
 * Requirements: 24.1, 24.5
 */

import { Op } from 'sequelize';
import { Conversation, ConversationCreationAttributes } from '../../models/Conversation.model';
import { Message } from '../../models/Message.model';
import User from '../../models/User.model';

export interface ConversationPaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: 'lastMessageAt' | 'createdAt';
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedConversations {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ConversationRepository {
  /**
   * Create a new conversation
   */
  async create(data: ConversationCreationAttributes): Promise<Conversation> {
    // Ensure participant1Id is always less than participant2Id for consistency
    const participant1Id = Math.min(data.participant1Id, data.participant2Id);
    const participant2Id = Math.max(data.participant1Id, data.participant2Id);

    return await Conversation.create({
      ...data,
      participant1Id,
      participant2Id,
    });
  }

  /**
   * Find conversation by ID
   */
  async findById(conversationId: number): Promise<Conversation | null> {
    return await Conversation.findByPk(conversationId, {
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: Message,
          as: 'lastMessage',
          required: false,
        },
      ],
    });
  }

  /**
   * Find conversation between two users
   */
  async findByParticipants(user1Id: number, user2Id: number): Promise<Conversation | null> {
    const participant1Id = Math.min(user1Id, user2Id);
    const participant2Id = Math.max(user1Id, user2Id);

    return await Conversation.findOne({
      where: {
        participant1Id,
        participant2Id,
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: Message,
          as: 'lastMessage',
          required: false,
        },
      ],
    });
  }

  /**
   * Find or create conversation between two users
   */
  async findOrCreate(user1Id: number, user2Id: number): Promise<Conversation> {
    const existing = await this.findByParticipants(user1Id, user2Id);
    
    if (existing) {
      return existing;
    }

    return await this.create({
      participant1Id: user1Id,
      participant2Id: user2Id,
    });
  }

  /**
   * Find all conversations for a user
   */
  async findByUser(
    userId: number,
    options: ConversationPaginationOptions = {}
  ): Promise<PaginatedConversations> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'lastMessageAt',
      orderDirection = 'DESC',
    } = options;

    const { count, rows } = await Conversation.findAndCountAll({
      where: {
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: Message,
          as: 'lastMessage',
          required: false,
        },
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      conversations: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Update last message for conversation
   */
  async updateLastMessage(
    conversationId: number,
    messageId: number,
    messageDate: Date
  ): Promise<Conversation | null> {
    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      conversation.lastMessageId = messageId;
      conversation.lastMessageAt = messageDate;
      await conversation.save();
    }
    return conversation;
  }

  /**
   * Increment unread count for recipient
   */
  async incrementUnreadCount(conversationId: number, recipientId: number): Promise<void> {
    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      if (recipientId === conversation.participant1Id) {
        conversation.unreadCountUser1 += 1;
      } else if (recipientId === conversation.participant2Id) {
        conversation.unreadCountUser2 += 1;
      }
      await conversation.save();
    }
  }

  /**
   * Reset unread count for user
   */
  async resetUnreadCount(conversationId: number, userId: number): Promise<void> {
    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      if (userId === conversation.participant1Id) {
        conversation.unreadCountUser1 = 0;
      } else if (userId === conversation.participant2Id) {
        conversation.unreadCountUser2 = 0;
      }
      await conversation.save();
    }
  }

  /**
   * Get total unread count for user across all conversations
   */
  async getTotalUnreadCount(userId: number): Promise<number> {
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      attributes: ['conversationId', 'participant1Id', 'participant2Id', 'unreadCountUser1', 'unreadCountUser2'],
    });

    let totalUnread = 0;
    for (const conversation of conversations) {
      if (userId === conversation.participant1Id) {
        totalUnread += conversation.unreadCountUser1;
      } else if (userId === conversation.participant2Id) {
        totalUnread += conversation.unreadCountUser2;
      }
    }

    return totalUnread;
  }

  /**
   * Delete conversation
   */
  async delete(conversationId: number): Promise<boolean> {
    const deleted = await Conversation.destroy({
      where: { conversationId },
    });
    return deleted > 0;
  }

  /**
   * Check if user is participant in conversation
   */
  async isParticipant(conversationId: number, userId: number): Promise<boolean> {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return false;
    }
    return conversation.hasParticipant(userId);
  }
}

export const conversationRepository = new ConversationRepository();
