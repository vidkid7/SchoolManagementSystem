/**
 * GroupConversation Service
 * 
 * Business logic for group conversation management
 * 
 * Requirements: 24.2, 24.8, 24.9
 */

import {
  groupConversationRepository,
  GroupConversationPaginationOptions,
} from './groupConversation.repository';
import { groupMemberRepository } from './groupMember.repository';
import { GroupConversationCreationAttributes } from '../../models/GroupConversation.model';
import { GroupMemberCreationAttributes } from '../../models/GroupMember.model';

export interface CreateGroupConversationData {
  name: string;
  type: 'class' | 'announcement' | 'custom';
  description?: string;
  classId?: number;
  createdBy: number;
  isAnnouncementOnly?: boolean;
  memberIds?: number[];
  adminIds?: number[];
}

export class GroupConversationService {
  /**
   * Create a new group conversation
   */
  async createGroupConversation(data: CreateGroupConversationData) {
    // Validate class-based group
    if (data.type === 'class' && !data.classId) {
      throw new Error('Class ID is required for class-based groups');
    }

    // Check if class group already exists
    if (data.type === 'class' && data.classId) {
      const existing = await groupConversationRepository.findByClassId(data.classId);
      if (existing) {
        throw new Error('Group conversation already exists for this class');
      }
    }

    // Create group conversation
    const groupData: GroupConversationCreationAttributes = {
      name: data.name,
      type: data.type,
      description: data.description,
      classId: data.classId,
      createdBy: data.createdBy,
      isAnnouncementOnly: data.isAnnouncementOnly || false,
    };

    const group = await groupConversationRepository.create(groupData);

    // Add creator as admin
    await groupMemberRepository.create({
      groupConversationId: group.groupConversationId,
      userId: data.createdBy,
      role: 'admin',
    });

    // Add additional admins
    if (data.adminIds && data.adminIds.length > 0) {
      const adminMembers: GroupMemberCreationAttributes[] = data.adminIds
        .filter((id) => id !== data.createdBy) // Don't duplicate creator
        .map((userId) => ({
          groupConversationId: group.groupConversationId,
          userId,
          role: 'admin',
        }));

      if (adminMembers.length > 0) {
        await groupMemberRepository.bulkCreate(adminMembers);
      }
    }

    // Add regular members
    if (data.memberIds && data.memberIds.length > 0) {
      const members: GroupMemberCreationAttributes[] = data.memberIds
        .filter((id) => id !== data.createdBy && !data.adminIds?.includes(id)) // Don't duplicate
        .map((userId) => ({
          groupConversationId: group.groupConversationId,
          userId,
          role: 'member',
        }));

      if (members.length > 0) {
        await groupMemberRepository.bulkCreate(members);
      }
    }

    return group;
  }

  /**
   * Get group conversation by ID
   */
  async getGroupConversationById(groupConversationId: number, userId: number) {
    const group = await groupConversationRepository.findById(groupConversationId);

    if (!group) {
      throw new Error('Group conversation not found');
    }

    // Verify user is member
    const isMember = await groupConversationRepository.isMember(groupConversationId, userId);
    if (!isMember) {
      throw new Error('Access denied: User is not a member of this group');
    }

    return group;
  }

  /**
   * Get all group conversations for a user
   */
  async getUserGroupConversations(userId: number, options?: GroupConversationPaginationOptions) {
    return await groupConversationRepository.findByUser(userId, options);
  }

  /**
   * Get group conversation by class ID
   */
  async getGroupConversationByClassId(classId: number, userId: number) {
    const group = await groupConversationRepository.findByClassId(classId);

    if (!group) {
      throw new Error('Group conversation not found for this class');
    }

    // Verify user is member
    const isMember = await groupConversationRepository.isMember(
      group.groupConversationId,
      userId
    );
    if (!isMember) {
      throw new Error('Access denied: User is not a member of this group');
    }

    return group;
  }

  /**
   * Get all announcement channels
   */
  async getAnnouncementChannels(options?: GroupConversationPaginationOptions) {
    return await groupConversationRepository.findAnnouncementChannels(options);
  }

  /**
   * Add member to group
   */
  async addMember(groupConversationId: number, userId: number, requesterId: number) {
    // Verify requester is admin
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, requesterId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can add members');
    }

    // Check if user is already a member
    const isMember = await groupConversationRepository.isMember(groupConversationId, userId);
    if (isMember) {
      throw new Error('User is already a member of this group');
    }

    // Add member
    return await groupMemberRepository.create({
      groupConversationId,
      userId,
      role: 'member',
    });
  }

  /**
   * Add multiple members to group
   */
  async addMembers(groupConversationId: number, userIds: number[], requesterId: number) {
    // Verify requester is admin
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, requesterId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can add members');
    }

    // Filter out existing members
    const existingMembers = await groupMemberRepository.findByGroup(groupConversationId);
    const existingUserIds = existingMembers.map((m) => m.userId);
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return [];
    }

    // Add members
    const members: GroupMemberCreationAttributes[] = newUserIds.map((userId) => ({
      groupConversationId,
      userId,
      role: 'member',
    }));

    return await groupMemberRepository.bulkCreate(members);
  }

  /**
   * Remove member from group
   */
  async removeMember(groupConversationId: number, userId: number, requesterId: number) {
    // Verify requester is admin or removing themselves
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, requesterId);
    const isSelf = userId === requesterId;

    if (!isAdmin && !isSelf) {
      throw new Error('Access denied: Only admins can remove members');
    }

    // Prevent removing the last admin
    if (isAdmin) {
      const adminCount = await groupMemberRepository.getAdminCount(groupConversationId);
      const memberToRemove = await groupMemberRepository.findByGroupAndUser(
        groupConversationId,
        userId
      );

      if (memberToRemove?.role === 'admin' && adminCount <= 1) {
        throw new Error('Cannot remove the last admin from the group');
      }
    }

    const removed = await groupMemberRepository.remove(groupConversationId, userId);

    if (!removed) {
      throw new Error('Failed to remove member');
    }

    return { success: true };
  }

  /**
   * Promote member to admin
   */
  async promoteMemberToAdmin(groupConversationId: number, userId: number, requesterId: number) {
    // Verify requester is admin
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, requesterId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can promote members');
    }

    // Verify user is member
    const member = await groupMemberRepository.findByGroupAndUser(groupConversationId, userId);
    if (!member) {
      throw new Error('User is not a member of this group');
    }

    if (member.role === 'admin') {
      throw new Error('User is already an admin');
    }

    const updated = await groupMemberRepository.updateRole(groupConversationId, userId, 'admin');

    if (!updated) {
      throw new Error('Failed to promote member');
    }

    return { success: true };
  }

  /**
   * Demote admin to member
   */
  async demoteAdminToMember(groupConversationId: number, userId: number, requesterId: number) {
    // Verify requester is admin
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, requesterId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can demote members');
    }

    // Prevent demoting the last admin
    const adminCount = await groupMemberRepository.getAdminCount(groupConversationId);
    if (adminCount <= 1) {
      throw new Error('Cannot demote the last admin');
    }

    const updated = await groupMemberRepository.updateRole(groupConversationId, userId, 'member');

    if (!updated) {
      throw new Error('Failed to demote admin');
    }

    return { success: true };
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupConversationId: number, userId: number) {
    // Verify user is member
    const isMember = await groupConversationRepository.isMember(groupConversationId, userId);
    if (!isMember) {
      throw new Error('Access denied: User is not a member of this group');
    }

    return await groupMemberRepository.findByGroup(groupConversationId);
  }

  /**
   * Update group conversation
   */
  async updateGroupConversation(
    groupConversationId: number,
    userId: number,
    data: { name?: string; description?: string; isAnnouncementOnly?: boolean }
  ) {
    // Verify user is admin
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, userId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can update group settings');
    }

    const updated = await groupConversationRepository.update(groupConversationId, data);

    if (!updated) {
      throw new Error('Failed to update group conversation');
    }

    return { success: true };
  }

  /**
   * Deactivate group conversation
   */
  async deactivateGroupConversation(groupConversationId: number, userId: number) {
    // Verify user is admin
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, userId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can deactivate groups');
    }

    const deactivated = await groupConversationRepository.deactivate(groupConversationId);

    if (!deactivated) {
      throw new Error('Failed to deactivate group conversation');
    }

    return { success: true };
  }

  /**
   * Delete group conversation
   */
  async deleteGroupConversation(groupConversationId: number, userId: number) {
    // Verify user is admin
    const isAdmin = await groupConversationRepository.isAdmin(groupConversationId, userId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can delete groups');
    }

    // Remove all members first
    await groupMemberRepository.removeAllMembers(groupConversationId);

    // Delete group
    const deleted = await groupConversationRepository.delete(groupConversationId);

    if (!deleted) {
      throw new Error('Failed to delete group conversation');
    }

    return { success: true };
  }
}

export const groupConversationService = new GroupConversationService();
