/**
 * GroupConversation Repository
 * 
 * Data access layer for group conversations
 * 
 * Requirements: 24.2, 24.8, 24.9
 */

import { GroupConversation, GroupConversationCreationAttributes } from '../../models/GroupConversation.model';
import { GroupMember } from '../../models/GroupMember.model';
import { Op } from 'sequelize';

export interface GroupConversationPaginationOptions {
  page?: number;
  limit?: number;
}

class GroupConversationRepository {
  /**
   * Create a new group conversation
   */
  async create(data: GroupConversationCreationAttributes): Promise<GroupConversation> {
    return await GroupConversation.create(data);
  }

  /**
   * Find group conversation by ID
   */
  async findById(groupConversationId: number): Promise<GroupConversation | null> {
    return await GroupConversation.findByPk(groupConversationId);
  }

  /**
   * Find all group conversations for a user
   */
  async findByUser(
    userId: number,
    options?: GroupConversationPaginationOptions
  ): Promise<{ groupConversations: GroupConversation[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    // Find all group memberships for the user
    const memberships = await GroupMember.findAll({
      where: { userId },
      attributes: ['groupConversationId'],
    });

    const groupConversationIds = memberships.map((m) => m.groupConversationId);

    if (groupConversationIds.length === 0) {
      return {
        groupConversations: [],
        total: 0,
        page,
        limit,
      };
    }

    const { rows, count } = await GroupConversation.findAndCountAll({
      where: {
        groupConversationId: {
          [Op.in]: groupConversationIds,
        },
        isActive: true,
      },
      order: [['lastMessageAt', 'DESC']],
      limit,
      offset,
    });

    return {
      groupConversations: rows,
      total: count,
      page,
      limit,
    };
  }

  /**
   * Find group conversation by class ID
   */
  async findByClassId(classId: number): Promise<GroupConversation | null> {
    return await GroupConversation.findOne({
      where: {
        classId,
        type: 'class',
        isActive: true,
      },
    });
  }

  /**
   * Find all announcement channels
   */
  async findAnnouncementChannels(
    options?: GroupConversationPaginationOptions
  ): Promise<{ groupConversations: GroupConversation[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await GroupConversation.findAndCountAll({
      where: {
        type: 'announcement',
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      groupConversations: rows,
      total: count,
      page,
      limit,
    };
  }

  /**
   * Update last message
   */
  async updateLastMessage(
    groupConversationId: number,
    messageId: number,
    messageDate: Date
  ): Promise<boolean> {
    const [affectedCount] = await GroupConversation.update(
      {
        lastMessageId: messageId,
        lastMessageAt: messageDate,
      },
      {
        where: { groupConversationId },
      }
    );

    return affectedCount > 0;
  }

  /**
   * Check if user is member of group
   */
  async isMember(groupConversationId: number, userId: number): Promise<boolean> {
    const member = await GroupMember.findOne({
      where: {
        groupConversationId,
        userId,
      },
    });

    return member !== null;
  }

  /**
   * Check if user is admin of group
   */
  async isAdmin(groupConversationId: number, userId: number): Promise<boolean> {
    const member = await GroupMember.findOne({
      where: {
        groupConversationId,
        userId,
        role: 'admin',
      },
    });

    return member !== null;
  }

  /**
   * Deactivate group conversation
   */
  async deactivate(groupConversationId: number): Promise<boolean> {
    const [affectedCount] = await GroupConversation.update(
      { isActive: false },
      { where: { groupConversationId } }
    );

    return affectedCount > 0;
  }

  /**
   * Activate group conversation
   */
  async activate(groupConversationId: number): Promise<boolean> {
    const [affectedCount] = await GroupConversation.update(
      { isActive: true },
      { where: { groupConversationId } }
    );

    return affectedCount > 0;
  }

  /**
   * Delete group conversation
   */
  async delete(groupConversationId: number): Promise<boolean> {
    const affectedCount = await GroupConversation.destroy({
      where: { groupConversationId },
    });

    return affectedCount > 0;
  }

  /**
   * Update group conversation
   */
  async update(
    groupConversationId: number,
    data: Partial<GroupConversationCreationAttributes>
  ): Promise<boolean> {
    const [affectedCount] = await GroupConversation.update(data, {
      where: { groupConversationId },
    });

    return affectedCount > 0;
  }
}

export const groupConversationRepository = new GroupConversationRepository();
