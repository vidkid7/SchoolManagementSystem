/**
 * GroupMessage Service Tests
 * 
 * Unit tests for group messaging operations with role-based restrictions
 * 
 * Requirements: 24.2, 24.3, 24.8, 24.9
 */

import { groupMessageService } from '../groupMessage.service';
import { groupMessageRepository } from '../groupMessage.repository';
import { groupConversationRepository } from '../groupConversation.repository';
import { groupMemberRepository } from '../groupMember.repository';
import { socketService } from '../../../services/socket.service';

// Mock dependencies
jest.mock('../groupMessage.repository');
jest.mock('../groupConversation.repository');
jest.mock('../groupMember.repository');
jest.mock('../../../services/socket.service');

describe('GroupMessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendGroupMessage', () => {
    it('should send message in regular group', async () => {
      const mockGroup = {
        groupConversationId: 1,
        name: 'Test Group',
        type: 'custom' as const,
        isActive: true,
        isAnnouncementOnly: false,
      };

      const mockMessage = {
        groupMessageId: 1,
        groupConversationId: 1,
        senderId: 1,
        content: 'Hello group!',
        sentAt: new Date(),
      };

      const mockMembers = [
        { userId: 1, role: 'admin' },
        { userId: 2, role: 'member' },
        { userId: 3, role: 'member' },
      ];

      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(mockGroup);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);
      (groupMessageRepository.create as jest.Mock).mockResolvedValue(mockMessage);
      (groupConversationRepository.updateLastMessage as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.incrementUnreadCountForMembers as jest.Mock).mockResolvedValue(2);
      (groupMemberRepository.findByGroup as jest.Mock).mockResolvedValue(mockMembers);
      (socketService.emitToUsers as jest.Mock).mockImplementation(() => {});

      const result = await groupMessageService.sendGroupMessage({
        groupConversationId: 1,
        senderId: 1,
        content: 'Hello group!',
      });

      expect(result.message).toEqual(mockMessage);
      expect(result.group).toEqual(mockGroup);
      expect(groupMessageRepository.create).toHaveBeenCalled();
      expect(groupConversationRepository.updateLastMessage).toHaveBeenCalledWith(
        1,
        1,
        mockMessage.sentAt
      );
      expect(groupMemberRepository.incrementUnreadCountForMembers).toHaveBeenCalledWith(1, 1);
      expect(socketService.emitToUsers).toHaveBeenCalledWith(
        [2, 3],
        'group:message:new',
        expect.objectContaining({
          groupMessageId: 1,
          groupConversationId: 1,
          senderId: 1,
          content: 'Hello group!',
        })
      );
    });

    it('should enforce role-based restrictions in announcement-only group (Requirement 24.9)', async () => {
      const mockGroup = {
        groupConversationId: 1,
        name: 'Announcements',
        type: 'announcement' as const,
        isActive: true,
        isAnnouncementOnly: true,
      };

      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(mockGroup);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);

      await expect(
        groupMessageService.sendGroupMessage({
          groupConversationId: 1,
          senderId: 2,
          content: 'Trying to post',
        })
      ).rejects.toThrow('Access denied: Only admins can post in announcement-only groups');
    });

    it('should allow admin to post in announcement-only group (Requirement 24.9)', async () => {
      const mockGroup = {
        groupConversationId: 1,
        name: 'Announcements',
        type: 'announcement' as const,
        isActive: true,
        isAnnouncementOnly: true,
      };

      const mockMessage = {
        groupMessageId: 1,
        groupConversationId: 1,
        senderId: 1,
        content: 'Important announcement',
        sentAt: new Date(),
      };

      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(mockGroup);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMessageRepository.create as jest.Mock).mockResolvedValue(mockMessage);
      (groupConversationRepository.updateLastMessage as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.incrementUnreadCountForMembers as jest.Mock).mockResolvedValue(2);
      (groupMemberRepository.findByGroup as jest.Mock).mockResolvedValue([
        { userId: 1, role: 'admin' },
        { userId: 2, role: 'member' },
      ]);
      (socketService.emitToUsers as jest.Mock).mockImplementation(() => {});

      const result = await groupMessageService.sendGroupMessage({
        groupConversationId: 1,
        senderId: 1,
        content: 'Important announcement',
      });

      expect(result.message).toEqual(mockMessage);
      expect(groupMessageRepository.create).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        groupMessageService.sendGroupMessage({
          groupConversationId: 1,
          senderId: 1,
          content: 'Hello',
        })
      ).rejects.toThrow('Group conversation not found');
    });

    it('should throw error if group is not active', async () => {
      const mockGroup = {
        groupConversationId: 1,
        isActive: false,
      };

      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(mockGroup);

      await expect(
        groupMessageService.sendGroupMessage({
          groupConversationId: 1,
          senderId: 1,
          content: 'Hello',
        })
      ).rejects.toThrow('Group conversation is not active');
    });

    it('should throw error if sender is not a member', async () => {
      const mockGroup = {
        groupConversationId: 1,
        isActive: true,
        isAnnouncementOnly: false,
      };

      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(mockGroup);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(false);

      await expect(
        groupMessageService.sendGroupMessage({
          groupConversationId: 1,
          senderId: 1,
          content: 'Hello',
        })
      ).rejects.toThrow('Access denied: User is not a member of this group');
    });
  });

  describe('getGroupMessages', () => {
    it('should return messages if user is member', async () => {
      const mockMessages = [
        { groupMessageId: 1, content: 'Message 1' },
        { groupMessageId: 2, content: 'Message 2' },
      ];

      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);
      (groupMessageRepository.findByGroupConversation as jest.Mock).mockResolvedValue({
        messages: mockMessages,
        total: 2,
        page: 1,
        limit: 50,
      });

      const result = await groupMessageService.getGroupMessages(1, 1);

      expect(result.messages).toEqual(mockMessages);
      expect(result.total).toBe(2);
    });

    it('should throw error if user is not member', async () => {
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(false);

      await expect(
        groupMessageService.getGroupMessages(1, 1)
      ).rejects.toThrow('Access denied: User is not a member of this group');
    });
  });

  describe('markGroupAsRead', () => {
    it('should mark group as read for user', async () => {
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.resetUnreadCount as jest.Mock).mockResolvedValue(true);

      const result = await groupMessageService.markGroupAsRead(1, 1);

      expect(result).toEqual({ success: true });
      expect(groupMemberRepository.resetUnreadCount).toHaveBeenCalledWith(1, 1);
    });

    it('should throw error if user is not member', async () => {
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(false);

      await expect(
        groupMessageService.markGroupAsRead(1, 1)
      ).rejects.toThrow('Access denied: User is not a member of this group');
    });
  });

  describe('deleteGroupMessage', () => {
    it('should allow sender to delete their message', async () => {
      const mockMessage = {
        groupMessageId: 1,
        groupConversationId: 1,
        senderId: 1,
        content: 'Test message',
      };

      (groupMessageRepository.findById as jest.Mock).mockResolvedValue(mockMessage);
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);
      (groupMessageRepository.delete as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.findByGroup as jest.Mock).mockResolvedValue([
        { userId: 1 },
        { userId: 2 },
      ]);
      (socketService.emitToUsers as jest.Mock).mockImplementation(() => {});

      const result = await groupMessageService.deleteGroupMessage(1, 1);

      expect(result).toEqual({ success: true });
      expect(groupMessageRepository.delete).toHaveBeenCalledWith(1);
      expect(socketService.emitToUsers).toHaveBeenCalledWith(
        [1, 2],
        'group:message:deleted',
        expect.objectContaining({
          groupMessageId: 1,
          groupConversationId: 1,
          deletedBy: 1,
        })
      );
    });

    it('should allow admin to delete any message', async () => {
      const mockMessage = {
        groupMessageId: 1,
        groupConversationId: 1,
        senderId: 2,
        content: 'Test message',
      };

      (groupMessageRepository.findById as jest.Mock).mockResolvedValue(mockMessage);
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMessageRepository.delete as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.findByGroup as jest.Mock).mockResolvedValue([
        { userId: 1 },
        { userId: 2 },
      ]);
      (socketService.emitToUsers as jest.Mock).mockImplementation(() => {});

      const result = await groupMessageService.deleteGroupMessage(1, 1);

      expect(result).toEqual({ success: true });
    });

    it('should throw error if user is neither sender nor admin', async () => {
      const mockMessage = {
        groupMessageId: 1,
        groupConversationId: 1,
        senderId: 2,
        content: 'Test message',
      };

      (groupMessageRepository.findById as jest.Mock).mockResolvedValue(mockMessage);
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);

      await expect(
        groupMessageService.deleteGroupMessage(1, 3)
      ).rejects.toThrow('Access denied: Only sender or admin can delete message');
    });
  });

  describe('searchGroupMessages', () => {
    it('should search messages if user is member', async () => {
      const mockMessages = [
        { groupMessageId: 1, content: 'Hello world' },
      ];

      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);
      (groupMessageRepository.searchMessages as jest.Mock).mockResolvedValue({
        messages: mockMessages,
        total: 1,
        page: 1,
        limit: 50,
      });

      const result = await groupMessageService.searchGroupMessages(1, 1, 'hello');

      expect(result.messages).toEqual(mockMessages);
    });

    it('should throw error if search query is empty', async () => {
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);

      await expect(
        groupMessageService.searchGroupMessages(1, 1, '')
      ).rejects.toThrow('Search query is required');
    });
  });
});
