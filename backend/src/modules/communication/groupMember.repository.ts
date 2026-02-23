/**
 * GroupMember Repository
 * 
 * Data access layer for group members
 * 
 * Requirements: 24.2, 24.9
 */

import { GroupMember, GroupMemberCreationAttributes } from '../../models/GroupMember.model';
import { Op } from 'sequelize';

class GroupMemberRepository {
  /**
   * Add member to group
   */
  async create(data: GroupMemberCreationAttributes): Promise<GroupMember> {
    return await GroupMember.create(data);
  }

  /**
   * Add multiple members to group
   */
  async bulkCreate(members: GroupMemberCreationAttributes[]): Promise<GroupMember[]> {
    return await GroupMember.bulkCreate(members);
  }

  /**
   * Find member by ID
   */
  async findById(groupMemberId: number): Promise<GroupMember | null> {
    return await GroupMember.findByPk(groupMemberId);
  }

  /**
   * Find member by group and user
   */
  async findByGroupAndUser(
    groupConversationId: number,
    userId: number
  ): Promise<GroupMember | null> {
    return await GroupMember.findOne({
      where: {
        groupConversationId,
        userId,
      },
    });
  }

  /**
   * Find all members of a group
   */
  async findByGroup(groupConversationId: number): Promise<GroupMember[]> {
    return await GroupMember.findAll({
      where: { groupConversationId },
      order: [['joinedAt', 'ASC']],
    });
  }

  /**
   * Find all groups for a user
   */
  async findByUser(userId: number): Promise<GroupMember[]> {
    return await GroupMember.findAll({
      where: { userId },
      order: [['joinedAt', 'DESC']],
    });
  }

  /**
   * Get member count for group
   */
  async getMemberCount(groupConversationId: number): Promise<number> {
    return await GroupMember.count({
      where: { groupConversationId },
    });
  }

  /**
   * Get admin count for group
   */
  async getAdminCount(groupConversationId: number): Promise<number> {
    return await GroupMember.count({
      where: {
        groupConversationId,
        role: 'admin',
      },
    });
  }

  /**
   * Increment unread count for all members except sender
   */
  async incrementUnreadCountForMembers(
    groupConversationId: number,
    excludeUserId: number
  ): Promise<number> {
    const [affectedCount] = await GroupMember.update(
      {
        unreadCount: GroupMember.sequelize!.literal('unread_count + 1'),
      },
      {
        where: {
          groupConversationId,
          userId: {
            [Op.ne]: excludeUserId,
          },
        },
      }
    );

    return affectedCount;
  }

  /**
   * Reset unread count for user
   */
  async resetUnreadCount(groupConversationId: number, userId: number): Promise<boolean> {
    const [affectedCount] = await GroupMember.update(
      {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
      {
        where: {
          groupConversationId,
          userId,
        },
      }
    );

    return affectedCount > 0;
  }

  /**
   * Get total unread count for user across all groups
   */
  async getTotalUnreadCount(userId: number): Promise<number> {
    const members = await GroupMember.findAll({
      where: { userId },
      attributes: ['unreadCount'],
    });

    return members.reduce((total, member) => total + member.unreadCount, 0);
  }

  /**
   * Update member role
   */
  async updateRole(
    groupConversationId: number,
    userId: number,
    role: 'admin' | 'member'
  ): Promise<boolean> {
    const [affectedCount] = await GroupMember.update(
      { role },
      {
        where: {
          groupConversationId,
          userId,
        },
      }
    );

    return affectedCount > 0;
  }

  /**
   * Remove member from group
   */
  async remove(groupConversationId: number, userId: number): Promise<boolean> {
    const affectedCount = await GroupMember.destroy({
      where: {
        groupConversationId,
        userId,
      },
    });

    return affectedCount > 0;
  }

  /**
   * Remove all members from group
   */
  async removeAllMembers(groupConversationId: number): Promise<number> {
    return await GroupMember.destroy({
      where: { groupConversationId },
    });
  }

  /**
   * Check if user is member
   */
  async isMember(groupConversationId: number, userId: number): Promise<boolean> {
    const member = await this.findByGroupAndUser(groupConversationId, userId);
    return member !== null;
  }

  /**
   * Check if user is admin
   */
  async isAdmin(groupConversationId: number, userId: number): Promise<boolean> {
    const member = await this.findByGroupAndUser(groupConversationId, userId);
    return member !== null && member.role === 'admin';
  }
}

export const groupMemberRepository = new GroupMemberRepository();
