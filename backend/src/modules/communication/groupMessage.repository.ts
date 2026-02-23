/**
 * GroupMessage Repository
 * 
 * Data access layer for group messages
 * 
 * Requirements: 24.2, 24.8
 */

import { GroupMessage, GroupMessageCreationAttributes } from '../../models/GroupMessage.model';
import { Op } from 'sequelize';

export interface GroupMessagePaginationOptions {
  page?: number;
  limit?: number;
  beforeMessageId?: number;
}

class GroupMessageRepository {
  /**
   * Create a new group message
   */
  async create(data: GroupMessageCreationAttributes): Promise<GroupMessage> {
    return await GroupMessage.create(data);
  }

  /**
   * Find message by ID
   */
  async findById(groupMessageId: number): Promise<GroupMessage | null> {
    return await GroupMessage.findByPk(groupMessageId);
  }

  /**
   * Find messages for a group conversation
   */
  async findByGroupConversation(
    groupConversationId: number,
    options?: GroupMessagePaginationOptions
  ): Promise<{ messages: GroupMessage[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const offset = (page - 1) * limit;

    const whereClause: any = { groupConversationId };

    // Support cursor-based pagination for real-time loading
    if (options?.beforeMessageId) {
      whereClause.groupMessageId = {
        [Op.lt]: options.beforeMessageId,
      };
    }

    const { rows, count } = await GroupMessage.findAndCountAll({
      where: whereClause,
      order: [['sentAt', 'DESC']],
      limit,
      offset,
    });

    return {
      messages: rows.reverse(), // Reverse to show oldest first
      total: count,
      page,
      limit,
    };
  }

  /**
   * Search messages in group
   */
  async searchMessages(
    groupConversationId: number,
    searchQuery: string,
    options?: GroupMessagePaginationOptions
  ): Promise<{ messages: GroupMessage[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const offset = (page - 1) * limit;

    const { rows, count } = await GroupMessage.findAndCountAll({
      where: {
        groupConversationId,
        content: {
          [Op.like]: `%${searchQuery}%`,
        },
      },
      order: [['sentAt', 'DESC']],
      limit,
      offset,
    });

    return {
      messages: rows,
      total: count,
      page,
      limit,
    };
  }

  /**
   * Get message count for group
   */
  async getMessageCount(groupConversationId: number): Promise<number> {
    return await GroupMessage.count({
      where: { groupConversationId },
    });
  }

  /**
   * Delete message
   */
  async delete(groupMessageId: number): Promise<boolean> {
    const affectedCount = await GroupMessage.destroy({
      where: { groupMessageId },
    });

    return affectedCount > 0;
  }

  /**
   * Delete all messages in group
   */
  async deleteAllMessages(groupConversationId: number): Promise<number> {
    return await GroupMessage.destroy({
      where: { groupConversationId },
    });
  }

  /**
   * Get latest message for group
   */
  async getLatestMessage(groupConversationId: number): Promise<GroupMessage | null> {
    return await GroupMessage.findOne({
      where: { groupConversationId },
      order: [['sentAt', 'DESC']],
    });
  }
}

export const groupMessageRepository = new GroupMessageRepository();
