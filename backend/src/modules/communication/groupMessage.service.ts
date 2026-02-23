/**
 * GroupMessage Service
 * 
 * Business logic for group messaging operations
 * 
 * Requirements: 24.2, 24.3, 24.8, 24.9
 */

import {
  groupMessageRepository,
  GroupMessagePaginationOptions,
} from './groupMessage.repository';
import { groupConversationRepository } from './groupConversation.repository';
import { groupMemberRepository } from './groupMember.repository';
import { GroupMessageCreationAttributes } from '../../models/GroupMessage.model';
import { socketService } from '../../services/socket.service';

export interface SendGroupMessageData {
  groupConversationId: number;
  senderId: number;
  content: string;
  attachments?: object[];
}

export class GroupMessageService {
  /**
   * Send a message to a group
   * Enforces role-based restrictions for announcement-only groups
   */
  async sendGroupMessage(data: SendGroupMessageData) {
    // Verify group exists and is active
    const group = await groupConversationRepository.findById(data.groupConversationId);

    if (!group) {
      throw new Error('Group conversation not found');
    }

    if (!group.isActive) {
      throw new Error('Group conversation is not active');
    }

    // Verify sender is a member
    const isMember = await groupConversationRepository.isMember(
      data.groupConversationId,
      data.senderId
    );

    if (!isMember) {
      throw new Error('Access denied: User is not a member of this group');
    }

    // Enforce role-based restrictions for announcement-only groups (Requirement 24.9)
    if (group.isAnnouncementOnly) {
      const isAdmin = await groupConversationRepository.isAdmin(
        data.groupConversationId,
        data.senderId
      );

      if (!isAdmin) {
        throw new Error(
          'Access denied: Only admins can post in announcement-only groups'
        );
      }
    }

    // Create message
    const messageData: GroupMessageCreationAttributes = {
      groupConversationId: data.groupConversationId,
      senderId: data.senderId,
      content: data.content,
      attachments: data.attachments,
      sentAt: new Date(),
    };

    const message = await groupMessageRepository.create(messageData);

    // Update group last message
    await groupConversationRepository.updateLastMessage(
      data.groupConversationId,
      message.groupMessageId,
      message.sentAt
    );

    // Increment unread count for all members except sender
    await groupMemberRepository.incrementUnreadCountForMembers(
      data.groupConversationId,
      data.senderId
    );

    // Get all group members to emit real-time message (Requirement 24.3)
    const members = await groupMemberRepository.findByGroup(data.groupConversationId);
    const recipientIds = members
      .filter((m) => m.userId !== data.senderId)
      .map((m) => m.userId);

    // Emit real-time message to all group members via Socket.IO
    socketService.emitToUsers(recipientIds, 'group:message:new', {
      groupMessageId: message.groupMessageId,
      groupConversationId: data.groupConversationId,
      senderId: data.senderId,
      content: message.content,
      attachments: message.attachments,
      sentAt: message.sentAt,
    });

    return {
      message,
      group,
    };
  }

  /**
   * Get messages for a group conversation
   */
  async getGroupMessages(
    groupConversationId: number,
    userId: number,
    options?: GroupMessagePaginationOptions
  ) {
    // Verify user is member
    const isMember = await groupConversationRepository.isMember(groupConversationId, userId);

    if (!isMember) {
      throw new Error('Access denied: User is not a member of this group');
    }

    return await groupMessageRepository.findByGroupConversation(groupConversationId, options);
  }

  /**
   * Mark group messages as read for user
   */
  async markGroupAsRead(groupConversationId: number, userId: number) {
    // Verify user is member
    const isMember = await groupConversationRepository.isMember(groupConversationId, userId);

    if (!isMember) {
      throw new Error('Access denied: User is not a member of this group');
    }

    // Reset unread count
    const reset = await groupMemberRepository.resetUnreadCount(groupConversationId, userId);

    if (!reset) {
      throw new Error('Failed to mark group as read');
    }

    return { success: true };
  }

  /**
   * Get unread count for user across all groups
   */
  async getUnreadCount(userId: number) {
    return await groupMemberRepository.getTotalUnreadCount(userId);
  }

  /**
   * Search messages in group
   */
  async searchGroupMessages(
    groupConversationId: number,
    userId: number,
    searchQuery: string,
    options?: GroupMessagePaginationOptions
  ) {
    // Verify user is member
    const isMember = await groupConversationRepository.isMember(groupConversationId, userId);

    if (!isMember) {
      throw new Error('Access denied: User is not a member of this group');
    }

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new Error('Search query is required');
    }

    return await groupMessageRepository.searchMessages(
      groupConversationId,
      searchQuery,
      options
    );
  }

  /**
   * Delete group message
   * Only sender or group admin can delete
   */
  async deleteGroupMessage(groupMessageId: number, userId: number) {
    const message = await groupMessageRepository.findById(groupMessageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user is sender or admin
    const isSender = message.senderId === userId;
    const isAdmin = await groupConversationRepository.isAdmin(
      message.groupConversationId,
      userId
    );

    if (!isSender && !isAdmin) {
      throw new Error('Access denied: Only sender or admin can delete message');
    }

    const deleted = await groupMessageRepository.delete(groupMessageId);

    if (!deleted) {
      throw new Error('Failed to delete message');
    }

    // Emit deletion event to group members
    const members = await groupMemberRepository.findByGroup(message.groupConversationId);
    const memberIds = members.map((m) => m.userId);

    socketService.emitToUsers(memberIds, 'group:message:deleted', {
      groupMessageId: message.groupMessageId,
      groupConversationId: message.groupConversationId,
      deletedBy: userId,
    });

    return { success: true };
  }

  /**
   * Get message by ID
   */
  async getGroupMessageById(groupMessageId: number, userId: number) {
    const message = await groupMessageRepository.findById(groupMessageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is member of the group
    const isMember = await groupConversationRepository.isMember(
      message.groupConversationId,
      userId
    );

    if (!isMember) {
      throw new Error('Access denied');
    }

    return message;
  }
}

export const groupMessageService = new GroupMessageService();
