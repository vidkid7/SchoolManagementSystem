/**
 * Message Service Unit Tests
 * 
 * Tests for messaging business logic
 * 
 * Requirements: 24.1, 24.5
 */

import { messageService } from '../message.service';
import { messageRepository } from '../message.repository';
import { conversationRepository } from '../conversation.repository';
import { Message } from '../../../models/Message.model';
import { Conversation } from '../../../models/Conversation.model';

// Mock repositories
jest.mock('../message.repository');
jest.mock('../conversation.repository');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const sendMessageData = {
        senderId: 1,
        recipientId: 2,
        content: 'Hello, this is a test message',
      };

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
      } as Conversation;

      const mockMessage = {
        messageId: 1,
        conversationId: 1,
        senderId: 1,
        recipientId: 2,
        content: 'Hello, this is a test message',
        sentAt: new Date(),
      } as Message;

      (conversationRepository.findOrCreate as jest.Mock).mockResolvedValue(mockConversation);
      (messageRepository.create as jest.Mock).mockResolvedValue(mockMessage);
      (conversationRepository.updateLastMessage as jest.Mock).mockResolvedValue(mockConversation);
      (conversationRepository.incrementUnreadCount as jest.Mock).mockResolvedValue(undefined);

      const result = await messageService.sendMessage(sendMessageData);

      expect(result.message).toEqual(mockMessage);
      expect(result.conversation).toEqual(mockConversation);
      expect(conversationRepository.findOrCreate).toHaveBeenCalledWith(1, 2);
      expect(messageRepository.create).toHaveBeenCalled();
      expect(conversationRepository.updateLastMessage).toHaveBeenCalled();
      expect(conversationRepository.incrementUnreadCount).toHaveBeenCalledWith(1, 2);
    });

    it('should throw error when sending message to self', async () => {
      const sendMessageData = {
        senderId: 1,
        recipientId: 1,
        content: 'Hello',
      };

      await expect(messageService.sendMessage(sendMessageData)).rejects.toThrow(
        'Cannot send message to yourself'
      );
    });

    it('should handle attachments', async () => {
      const sendMessageData = {
        senderId: 1,
        recipientId: 2,
        content: 'Check this file',
        attachments: [
          {
            type: 'document',
            url: 'https://example.com/file.pdf',
            name: 'document.pdf',
            size: 1024,
          },
        ],
      };

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
      } as Conversation;

      const mockMessage = {
        messageId: 1,
        conversationId: 1,
        senderId: 1,
        recipientId: 2,
        content: 'Check this file',
        attachments: sendMessageData.attachments,
        sentAt: new Date(),
      } as Message;

      (conversationRepository.findOrCreate as jest.Mock).mockResolvedValue(mockConversation);
      (messageRepository.create as jest.Mock).mockResolvedValue(mockMessage);
      (conversationRepository.updateLastMessage as jest.Mock).mockResolvedValue(mockConversation);
      (conversationRepository.incrementUnreadCount as jest.Mock).mockResolvedValue(undefined);

      const result = await messageService.sendMessage(sendMessageData);

      expect(result.message.attachments).toEqual(sendMessageData.attachments);
    });
  });

  describe('getConversationMessages', () => {
    it('should get messages for authorized participant', async () => {
      const conversationId = 1;
      const userId = 1;

      const mockMessages = {
        messages: [
          {
            messageId: 1,
            conversationId: 1,
            senderId: 1,
            recipientId: 2,
            content: 'Hello',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      (conversationRepository.isParticipant as jest.Mock).mockResolvedValue(true);
      (messageRepository.findByConversation as jest.Mock).mockResolvedValue(mockMessages);

      const result = await messageService.getConversationMessages(conversationId, userId);

      expect(result).toEqual(mockMessages);
      expect(conversationRepository.isParticipant).toHaveBeenCalledWith(conversationId, userId);
    });

    it('should throw error for unauthorized user', async () => {
      const conversationId = 1;
      const userId = 3;

      (conversationRepository.isParticipant as jest.Mock).mockResolvedValue(false);

      await expect(
        messageService.getConversationMessages(conversationId, userId)
      ).rejects.toThrow('User is not a participant in this conversation');
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark message as read by recipient', async () => {
      const messageId = 1;
      const userId = 2;

      const mockMessage = {
        messageId: 1,
        senderId: 1,
        recipientId: 2,
        content: 'Hello',
        isRead: false,
      } as Message;

      const mockUpdatedMessage = {
        ...mockMessage,
        isRead: true,
        readAt: new Date(),
      } as Message;

      (messageRepository.findById as jest.Mock).mockResolvedValue(mockMessage);
      (messageRepository.markAsRead as jest.Mock).mockResolvedValue(mockUpdatedMessage);

      const result = await messageService.markMessageAsRead(messageId, userId);

      expect(result).toEqual(mockUpdatedMessage);
      expect(messageRepository.markAsRead).toHaveBeenCalledWith(messageId);
    });

    it('should throw error when non-recipient tries to mark as read', async () => {
      const messageId = 1;
      const userId = 3;

      const mockMessage = {
        messageId: 1,
        senderId: 1,
        recipientId: 2,
        content: 'Hello',
      } as Message;

      (messageRepository.findById as jest.Mock).mockResolvedValue(mockMessage);

      await expect(messageService.markMessageAsRead(messageId, userId)).rejects.toThrow(
        'Only recipient can mark message as read'
      );
    });

    it('should throw error when message not found', async () => {
      const messageId = 999;
      const userId = 2;

      (messageRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(messageService.markMessageAsRead(messageId, userId)).rejects.toThrow(
        'Message not found'
      );
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all messages in conversation as read', async () => {
      const conversationId = 1;
      const userId = 2;

      (conversationRepository.isParticipant as jest.Mock).mockResolvedValue(true);
      (messageRepository.markConversationAsRead as jest.Mock).mockResolvedValue(5);
      (conversationRepository.resetUnreadCount as jest.Mock).mockResolvedValue(undefined);

      const result = await messageService.markConversationAsRead(conversationId, userId);

      expect(result.markedCount).toBe(5);
      expect(conversationRepository.resetUnreadCount).toHaveBeenCalledWith(conversationId, userId);
    });

    it('should throw error for unauthorized user', async () => {
      const conversationId = 1;
      const userId = 3;

      (conversationRepository.isParticipant as jest.Mock).mockResolvedValue(false);

      await expect(
        messageService.markConversationAsRead(conversationId, userId)
      ).rejects.toThrow('User is not a participant in this conversation');
    });
  });

  describe('searchMessages', () => {
    it('should search messages successfully', async () => {
      const userId = 1;
      const searchQuery = 'test';

      const mockResults = {
        messages: [
          {
            messageId: 1,
            content: 'This is a test message',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      (messageRepository.searchMessages as jest.Mock).mockResolvedValue(mockResults);

      const result = await messageService.searchMessages(userId, searchQuery);

      expect(result).toEqual(mockResults);
      expect(messageRepository.searchMessages).toHaveBeenCalledWith(userId, searchQuery, undefined);
    });

    it('should throw error for empty search query', async () => {
      const userId = 1;
      const searchQuery = '';

      await expect(messageService.searchMessages(userId, searchQuery)).rejects.toThrow(
        'Search query is required'
      );
    });
  });

  describe('deleteMessage', () => {
    it('should delete message by sender', async () => {
      const messageId = 1;
      const userId = 1;

      const mockMessage = {
        messageId: 1,
        senderId: 1,
        recipientId: 2,
        content: 'Hello',
      } as Message;

      (messageRepository.findById as jest.Mock).mockResolvedValue(mockMessage);
      (messageRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await messageService.deleteMessage(messageId, userId);

      expect(result.success).toBe(true);
      expect(messageRepository.delete).toHaveBeenCalledWith(messageId);
    });

    it('should throw error when non-sender tries to delete', async () => {
      const messageId = 1;
      const userId = 2;

      const mockMessage = {
        messageId: 1,
        senderId: 1,
        recipientId: 2,
        content: 'Hello',
      } as Message;

      (messageRepository.findById as jest.Mock).mockResolvedValue(mockMessage);

      await expect(messageService.deleteMessage(messageId, userId)).rejects.toThrow(
        'Only sender can delete message'
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread count for specific conversation', async () => {
      const userId = 1;
      const conversationId = 1;

      (messageRepository.getUnreadCount as jest.Mock).mockResolvedValue(3);

      const result = await messageService.getUnreadCount(userId, conversationId);

      expect(result).toBe(3);
      expect(messageRepository.getUnreadCount).toHaveBeenCalledWith(userId, conversationId);
    });

    it('should get total unread count across all conversations', async () => {
      const userId = 1;

      (conversationRepository.getTotalUnreadCount as jest.Mock).mockResolvedValue(10);

      const result = await messageService.getUnreadCount(userId);

      expect(result).toBe(10);
      expect(conversationRepository.getTotalUnreadCount).toHaveBeenCalledWith(userId);
    });
  });
});
