/**
 * Message Repository
 * 
 * Database operations for messages
 * 
 * Requirements: 24.1, 24.5
 */

import { Op } from 'sequelize';
import { Message, MessageCreationAttributes } from '../../models/Message.model';
import User from '../../models/User.model';

export interface MessageFilters {
  conversationId?: number;
  senderId?: number;
  recipientId?: number;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export interface MessagePaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: 'sentAt' | 'createdAt';
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MessageRepository {
  /**
   * Create a new message
   */
  async create(data: MessageCreationAttributes): Promise<Message> {
    return await Message.create(data);
  }

  /**
   * Find message by ID
   */
  async findById(messageId: number): Promise<Message | null> {
    return await Message.findByPk(messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'username', 'email', 'role'],
        },
      ],
    });
  }

  /**
   * Find messages by conversation with pagination
   */
  async findByConversation(
    conversationId: number,
    options: MessagePaginationOptions = {}
  ): Promise<PaginatedMessages> {
    const {
      page = 1,
      limit = 50,
      orderBy = 'sentAt',
      orderDirection = 'DESC',
    } = options;

    const { count, rows } = await Message.findAndCountAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'username', 'email', 'role'],
        },
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      messages: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Find messages with filters
   */
  async findWithFilters(
    filters: MessageFilters,
    options: MessagePaginationOptions = {}
  ): Promise<PaginatedMessages> {
    const {
      page = 1,
      limit = 50,
      orderBy = 'sentAt',
      orderDirection = 'DESC',
    } = options;

    const whereClause: Record<string, unknown> = {};

    if (filters.conversationId) {
      whereClause.conversationId = filters.conversationId;
    }
    if (filters.senderId) {
      whereClause.senderId = filters.senderId;
    }
    if (filters.recipientId) {
      whereClause.recipientId = filters.recipientId;
    }
    if (filters.isRead !== undefined) {
      whereClause.isRead = filters.isRead;
    }
    if (filters.startDate || filters.endDate) {
      const sentAtCondition: Record<symbol, Date> = {};
      if (filters.startDate) {
        sentAtCondition[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        sentAtCondition[Op.lte] = filters.endDate;
      }
      whereClause.sentAt = sentAtCondition;
    }
    if (filters.searchQuery) {
      whereClause.content = {
        [Op.like]: `%${filters.searchQuery}%`,
      };
    }

    const { count, rows } = await Message.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'username', 'email', 'role'],
        },
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      messages: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: number, conversationId?: number): Promise<number> {
    const whereClause: Record<string, unknown> = {
      recipientId: userId,
      isRead: false,
    };

    if (conversationId) {
      whereClause.conversationId = conversationId;
    }

    return await Message.count({ where: whereClause });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: number): Promise<Message | null> {
    const message = await Message.findByPk(messageId);
    if (message && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }
    return message;
  }

  /**
   * Mark all messages in conversation as read for user
   */
  async markConversationAsRead(conversationId: number, userId: number): Promise<number> {
    const [count] = await Message.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          conversationId,
          recipientId: userId,
          isRead: false,
        },
      }
    );

    return count;
  }

  /**
   * Delete message
   */
  async delete(messageId: number): Promise<boolean> {
    const deleted = await Message.destroy({
      where: { messageId },
    });
    return deleted > 0;
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    userId: number,
    searchQuery: string,
    options: MessagePaginationOptions = {}
  ): Promise<PaginatedMessages> {
    const {
      page = 1,
      limit = 50,
      orderBy = 'sentAt',
      orderDirection = 'DESC',
    } = options;

    const { count, rows } = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { recipientId: userId },
        ],
        content: {
          [Op.like]: `%${searchQuery}%`,
        },
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'username', 'email', 'role'],
        },
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      messages: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get latest message for conversation
   */
  async getLatestMessage(conversationId: number): Promise<Message | null> {
    return await Message.findOne({
      where: { conversationId },
      order: [['sentAt', 'DESC']],
    });
  }

  /**
   * Delete old messages for cleanup
   */
  async deleteOldMessages(daysOld: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await Message.destroy({
      where: {
        sentAt: { [Op.lt]: cutoffDate },
      },
    });
  }
}

export const messageRepository = new MessageRepository();
