/**
 * Conversation Service Unit Tests
 * 
 * Tests for conversation management business logic
 * 
 * Requirements: 24.1, 24.5
 */

import { conversationService } from '../conversation.service';
import { conversationRepository } from '../conversation.repository';
import { Conversation } from '../../../models/Conversation.model';

// Mock repository
jest.mock('../conversation.repository');

describe('ConversationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserConversations', () => {
    it('should get user conversations with pagination', async () => {
      const userId = 1;
      const options = { page: 1, limit: 20 };

      const mockResult = {
        conversations: [
          {
            conversationId: 1,
            participant1Id: 1,
            participant2Id: 2,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (conversationRepository.findByUser as jest.Mock).mockResolvedValue(mockResult);

      const result = await conversationService.getUserConversations(userId, options);

      expect(result).toEqual(mockResult);
      expect(conversationRepository.findByUser).toHaveBeenCalledWith(userId, options);
    });
  });

  describe('getConversationById', () => {
    it('should get conversation for authorized participant', async () => {
      const conversationId = 1;
      const userId = 1;

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
        hasParticipant: jest.fn().mockReturnValue(true),
      } as unknown as Conversation;

      (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

      const result = await conversationService.getConversationById(conversationId, userId);

      expect(result).toEqual(mockConversation);
      expect(mockConversation.hasParticipant).toHaveBeenCalledWith(userId);
    });

    it('should throw error when conversation not found', async () => {
      const conversationId = 999;
      const userId = 1;

      (conversationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        conversationService.getConversationById(conversationId, userId)
      ).rejects.toThrow('Conversation not found');
    });

    it('should throw error for unauthorized user', async () => {
      const conversationId = 1;
      const userId = 3;

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
        hasParticipant: jest.fn().mockReturnValue(false),
      } as unknown as Conversation;

      (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

      await expect(
        conversationService.getConversationById(conversationId, userId)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('getOrCreateConversation', () => {
    it('should create conversation between two users', async () => {
      const userId = 1;
      const otherUserId = 2;

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
      } as Conversation;

      (conversationRepository.findOrCreate as jest.Mock).mockResolvedValue(mockConversation);

      const result = await conversationService.getOrCreateConversation(userId, otherUserId);

      expect(result).toEqual(mockConversation);
      expect(conversationRepository.findOrCreate).toHaveBeenCalledWith(userId, otherUserId);
    });

    it('should throw error when trying to create conversation with self', async () => {
      const userId = 1;
      const otherUserId = 1;

      await expect(
        conversationService.getOrCreateConversation(userId, otherUserId)
      ).rejects.toThrow('Cannot create conversation with yourself');
    });
  });

  describe('getConversationBetweenUsers', () => {
    it('should get conversation between two users', async () => {
      const user1Id = 1;
      const user2Id = 2;
      const requesterId = 1;

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
      } as Conversation;

      (conversationRepository.findByParticipants as jest.Mock).mockResolvedValue(mockConversation);

      const result = await conversationService.getConversationBetweenUsers(
        user1Id,
        user2Id,
        requesterId
      );

      expect(result).toEqual(mockConversation);
    });

    it('should throw error when requester is not a participant', async () => {
      const user1Id = 1;
      const user2Id = 2;
      const requesterId = 3;

      await expect(
        conversationService.getConversationBetweenUsers(user1Id, user2Id, requesterId)
      ).rejects.toThrow('Access denied');
    });

    it('should throw error when conversation not found', async () => {
      const user1Id = 1;
      const user2Id = 2;
      const requesterId = 1;

      (conversationRepository.findByParticipants as jest.Mock).mockResolvedValue(null);

      await expect(
        conversationService.getConversationBetweenUsers(user1Id, user2Id, requesterId)
      ).rejects.toThrow('Conversation not found');
    });
  });

  describe('getUnreadCount', () => {
    it('should get total unread count for user', async () => {
      const userId = 1;

      (conversationRepository.getTotalUnreadCount as jest.Mock).mockResolvedValue(5);

      const result = await conversationService.getUnreadCount(userId);

      expect(result).toBe(5);
      expect(conversationRepository.getTotalUnreadCount).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation by participant', async () => {
      const conversationId = 1;
      const userId = 1;

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
        hasParticipant: jest.fn().mockReturnValue(true),
      } as unknown as Conversation;

      (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);
      (conversationRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await conversationService.deleteConversation(conversationId, userId);

      expect(result.success).toBe(true);
      expect(conversationRepository.delete).toHaveBeenCalledWith(conversationId);
    });

    it('should throw error when conversation not found', async () => {
      const conversationId = 999;
      const userId = 1;

      (conversationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        conversationService.deleteConversation(conversationId, userId)
      ).rejects.toThrow('Conversation not found');
    });

    it('should throw error for unauthorized user', async () => {
      const conversationId = 1;
      const userId = 3;

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
        hasParticipant: jest.fn().mockReturnValue(false),
      } as unknown as Conversation;

      (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

      await expect(
        conversationService.deleteConversation(conversationId, userId)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('getConversationWithUnreadCount', () => {
    it('should get conversation with unread count', async () => {
      const conversationId = 1;
      const userId = 1;

      const mockConversation = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
        unreadCountUser1: 3,
        unreadCountUser2: 0,
        hasParticipant: jest.fn().mockReturnValue(true),
        getUnreadCount: jest.fn().mockReturnValue(3),
        toJSON: jest.fn().mockReturnValue({
          conversationId: 1,
          participant1Id: 1,
          participant2Id: 2,
        }),
      } as unknown as Conversation;

      (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

      const result = await conversationService.getConversationWithUnreadCount(
        conversationId,
        userId
      );

      expect(result.unreadCount).toBe(3);
      expect(mockConversation.getUnreadCount).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserConversationsWithUnreadCounts', () => {
    it('should get all conversations with unread counts', async () => {
      const userId = 1;

      const mockConversation1 = {
        conversationId: 1,
        participant1Id: 1,
        participant2Id: 2,
        getUnreadCount: jest.fn().mockReturnValue(3),
        toJSON: jest.fn().mockReturnValue({
          conversationId: 1,
          participant1Id: 1,
          participant2Id: 2,
        }),
      } as unknown as Conversation;

      const mockConversation2 = {
        conversationId: 2,
        participant1Id: 1,
        participant2Id: 3,
        getUnreadCount: jest.fn().mockReturnValue(0),
        toJSON: jest.fn().mockReturnValue({
          conversationId: 2,
          participant1Id: 1,
          participant2Id: 3,
        }),
      } as unknown as Conversation;

      const mockResult = {
        conversations: [mockConversation1, mockConversation2],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (conversationRepository.findByUser as jest.Mock).mockResolvedValue(mockResult);

      const result = await conversationService.getUserConversationsWithUnreadCounts(userId);

      expect(result.conversations).toHaveLength(2);
      expect(result.conversations[0].unreadCount).toBe(3);
      expect(result.conversations[1].unreadCount).toBe(0);
    });
  });
});
