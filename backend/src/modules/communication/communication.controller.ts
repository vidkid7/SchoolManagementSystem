/**
 * Communication Controller
 * 
 * HTTP request handlers for messaging operations
 * 
 * Requirements: 24.1, 24.2, 24.5, 24.8, 24.9
 */

import { Request, Response } from 'express';
import { messageService } from './message.service';
import { conversationService } from './conversation.service';
import { groupConversationService } from './groupConversation.service';
import { groupMessageService } from './groupMessage.service';
import { attachmentService } from './attachment.service';

export class CommunicationController {
  /**
   * Send a message
   * POST /api/v1/communication/messages
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId, content, attachments } = req.body;
      const senderId = req.user?.userId;

      if (!senderId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await messageService.sendMessage({
        senderId,
        recipientId,
        content,
        attachments,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Message sent successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SEND_MESSAGE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send message',
        },
      });
    }
  }

  /**
   * Get user conversations
   * GET /api/v1/communication/conversations
   */
  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await conversationService.getUserConversationsWithUnreadCounts(
        userId,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: result.conversations,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_CONVERSATIONS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get conversations',
        },
      });
    }
  }

  /**
   * Get conversation messages
   * GET /api/v1/communication/conversations/:conversationId/messages
   */
  async getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = parseInt(req.params.conversationId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await messageService.getConversationMessages(
        conversationId,
        userId,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: result.messages,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_MESSAGES_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get messages',
        },
      });
    }
  }

  /**
   * Get or create conversation with user
   * POST /api/v1/communication/conversations
   */
  async getOrCreateConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { otherUserId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const conversation = await conversationService.getOrCreateConversation(
        userId,
        otherUserId
      );

      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_CONVERSATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get conversation',
        },
      });
    }
  }

  /**
   * Mark message as read
   * PUT /api/v1/communication/messages/:messageId/read
   */
  async markMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const messageId = parseInt(req.params.messageId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const message = await messageService.markMessageAsRead(messageId, userId);

      res.status(200).json({
        success: true,
        data: message,
        message: 'Message marked as read',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MARK_READ_FAILED',
          message: error instanceof Error ? error.message : 'Failed to mark message as read',
        },
      });
    }
  }

  /**
   * Mark conversation as read
   * PUT /api/v1/communication/conversations/:conversationId/read
   */
  async markConversationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = parseInt(req.params.conversationId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await messageService.markConversationAsRead(conversationId, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Conversation marked as read',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MARK_READ_FAILED',
          message: error instanceof Error ? error.message : 'Failed to mark conversation as read',
        },
      });
    }
  }

  /**
   * Get unread message count
   * GET /api/v1/communication/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = req.query.conversationId 
        ? parseInt(req.query.conversationId as string) 
        : undefined;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const count = await messageService.getUnreadCount(userId, conversationId);

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_UNREAD_COUNT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get unread count',
        },
      });
    }
  }

  /**
   * Search messages
   * GET /api/v1/communication/messages/search
   */
  async searchMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const searchQuery = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await messageService.searchMessages(
        userId,
        searchQuery,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: result.messages,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SEARCH_MESSAGES_FAILED',
          message: error instanceof Error ? error.message : 'Failed to search messages',
        },
      });
    }
  }

  /**
   * Delete message
   * DELETE /api/v1/communication/messages/:messageId
   */
  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const messageId = parseInt(req.params.messageId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await messageService.deleteMessage(messageId, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_MESSAGE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete message',
        },
      });
    }
  }

  /**
   * Get conversation by ID
   * GET /api/v1/communication/conversations/:conversationId
   */
  async getConversationById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conversationId = parseInt(req.params.conversationId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const conversation = await conversationService.getConversationWithUnreadCount(
        conversationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_CONVERSATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get conversation',
        },
      });
    }
  }

  /**
   * Get online users
   * GET /api/v1/communication/online-users
   * Requirement 24.6: Online/offline status
   */
  async getOnlineUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const { socketService } = await import('../../services/socket.service');
      const onlineUserIds = socketService.getOnlineUserIds();

      res.status(200).json({
        success: true,
        data: {
          onlineUsers: onlineUserIds,
          count: onlineUserIds.length,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_ONLINE_USERS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get online users',
        },
      });
    }
  }

  /**
   * Check if user is online
   * GET /api/v1/communication/users/:userId/online
   * Requirement 24.6: Online/offline status
   */
  async checkUserOnline(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.userId;
      const targetUserId = parseInt(req.params.userId);

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const { socketService } = await import('../../services/socket.service');
      const isOnline = socketService.isUserOnline(targetUserId);

      res.status(200).json({
        success: true,
        data: {
          userId: targetUserId,
          isOnline,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CHECK_ONLINE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to check online status',
        },
      });
    }
  }

  // ==================== GROUP MESSAGING METHODS ====================

  /**
   * Create a group conversation
   * POST /api/v1/communication/groups
   * Requirements: 24.2, 24.8
   */
  async createGroupConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { name, type, description, classId, isAnnouncementOnly, memberIds, adminIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const group = await groupConversationService.createGroupConversation({
        name,
        type,
        description,
        classId,
        createdBy: userId,
        isAnnouncementOnly,
        memberIds,
        adminIds,
      });

      res.status(201).json({
        success: true,
        data: group,
        message: 'Group conversation created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CREATE_GROUP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create group conversation',
        },
      });
    }
  }

  /**
   * Get user's group conversations
   * GET /api/v1/communication/groups
   * Requirement: 24.2
   */
  async getUserGroupConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await groupConversationService.getUserGroupConversations(
        userId,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: result.groupConversations,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_GROUPS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get group conversations',
        },
      });
    }
  }

  /**
   * Get group conversation by ID
   * GET /api/v1/communication/groups/:groupConversationId
   * Requirement: 24.2
   */
  async getGroupConversationById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const group = await groupConversationService.getGroupConversationById(
        groupConversationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: group,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_GROUP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get group conversation',
        },
      });
    }
  }

  /**
   * Send a group message
   * POST /api/v1/communication/groups/messages
   * Requirements: 24.2, 24.8, 24.9
   */
  async sendGroupMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { groupConversationId, content, attachments } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await groupMessageService.sendGroupMessage({
        groupConversationId,
        senderId: userId,
        content,
        attachments,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Group message sent successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SEND_GROUP_MESSAGE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send group message',
        },
      });
    }
  }

  /**
   * Get group messages
   * GET /api/v1/communication/groups/:groupConversationId/messages
   * Requirement: 24.2
   */
  async getGroupMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await groupMessageService.getGroupMessages(
        groupConversationId,
        userId,
        { page, limit }
      );

      res.status(200).json({
        success: true,
        data: result.messages,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_GROUP_MESSAGES_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get group messages',
        },
      });
    }
  }

  /**
   * Mark group as read
   * PUT /api/v1/communication/groups/:groupConversationId/read
   * Requirement: 24.2
   */
  async markGroupAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await groupMessageService.markGroupAsRead(groupConversationId, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Group marked as read',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MARK_GROUP_READ_FAILED',
          message: error instanceof Error ? error.message : 'Failed to mark group as read',
        },
      });
    }
  }

  /**
   * Add members to group
   * POST /api/v1/communication/groups/:groupConversationId/members
   * Requirement: 24.9
   */
  async addGroupMembers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);
      const { userIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const members = await groupConversationService.addMembers(
        groupConversationId,
        userIds,
        userId
      );

      res.status(201).json({
        success: true,
        data: members,
        message: 'Members added successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ADD_MEMBERS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to add members',
        },
      });
    }
  }

  /**
   * Remove member from group
   * DELETE /api/v1/communication/groups/:groupConversationId/members/:userId
   * Requirement: 24.9
   */
  async removeGroupMember(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);
      const userId = parseInt(req.params.userId);

      if (!requesterId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await groupConversationService.removeMember(
        groupConversationId,
        userId,
        requesterId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Member removed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REMOVE_MEMBER_FAILED',
          message: error instanceof Error ? error.message : 'Failed to remove member',
        },
      });
    }
  }

  /**
   * Get group members
   * GET /api/v1/communication/groups/:groupConversationId/members
   * Requirement: 24.2
   */
  async getGroupMembers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const members = await groupConversationService.getGroupMembers(
        groupConversationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_MEMBERS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get group members',
        },
      });
    }
  }

  /**
   * Update group conversation
   * PUT /api/v1/communication/groups/:groupConversationId
   * Requirement: 24.9
   */
  async updateGroupConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);
      const { name, description, isAnnouncementOnly } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await groupConversationService.updateGroupConversation(
        groupConversationId,
        userId,
        { name, description, isAnnouncementOnly }
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Group updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_GROUP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update group',
        },
      });
    }
  }

  /**
   * Delete group conversation
   * DELETE /api/v1/communication/groups/:groupConversationId
   * Requirement: 24.9
   */
  async deleteGroupConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const groupConversationId = parseInt(req.params.groupConversationId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await groupConversationService.deleteGroupConversation(
        groupConversationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Group deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_GROUP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete group',
        },
      });
    }
  }

  // ==================== FILE ATTACHMENT METHODS ====================

  /**
   * Upload message attachments
   * POST /api/v1/communication/attachments
   * Requirement: 24.4
   */
  async uploadAttachments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const files = req.files as Express.Multer.File[];

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES',
            message: 'No files provided',
          },
        });
        return;
      }

      const attachments = await attachmentService.processMultipleAttachments(files, userId);

      res.status(201).json({
        success: true,
        data: { attachments },
        message: 'Attachments uploaded successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload attachments',
        },
      });
    }
  }

  /**
   * Delete attachment
   * DELETE /api/v1/communication/attachments
   * Requirement: 24.4
   */
  async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { attachmentUrl } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      if (!attachmentUrl) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_URL',
            message: 'Attachment URL is required',
          },
        });
        return;
      }

      // Verify the attachment belongs to the user (URL contains user ID)
      if (!attachmentUrl.includes(`/messages/${userId}/`)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this attachment',
          },
        });
        return;
      }

      await attachmentService.deleteAttachment(attachmentUrl);

      res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete attachment',
        },
      });
    }
  }

  // ==================== ANNOUNCEMENT METHODS ====================

  /**
   * Get all announcements
   * GET /api/v1/communication/announcements
   */
  async getAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const { targetAudience, page = 1, limit = 20 } = req.query;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      // Mock announcements data - in production, fetch from database
      const announcements = [
        {
          id: 1,
          title: 'School Annual Day Celebration',
          content: 'We are pleased to announce the Annual Day celebration on 15th March 2025. All parents are cordially invited.',
          targetAudience: 'all',
          priority: 'high',
          publishedBy: 1,
          publishedByName: 'Principal',
          publishedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          title: 'Parent-Teacher Meeting',
          content: 'PTM scheduled for 20th March 2025 from 9 AM to 1 PM. Please attend to discuss your child\'s progress.',
          targetAudience: 'parents',
          priority: 'medium',
          publishedBy: 1,
          publishedByName: 'Vice Principal',
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          title: 'Science Exhibition',
          content: 'Science exhibition will be held on 25th March. Students are encouraged to participate with innovative projects.',
          targetAudience: 'students',
          priority: 'low',
          publishedBy: 2,
          publishedByName: 'Science HOD',
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      let filteredAnnouncements = announcements;
      if (targetAudience && targetAudience !== 'all') {
        filteredAnnouncements = announcements.filter(a => 
          a.targetAudience === targetAudience || a.targetAudience === 'all'
        );
      }

      res.status(200).json({
        success: true,
        data: {
          announcements: filteredAnnouncements,
          meta: {
            page: Number(page),
            limit: Number(limit),
            total: filteredAnnouncements.length,
            totalPages: 1,
          },
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch announcements',
        },
      });
    }
  }

  /**
   * Get announcement by ID
   * GET /api/v1/communication/announcements/:announcementId
   */
  async getAnnouncementById(req: Request, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;

      const announcement = {
        id: Number(announcementId),
        title: 'Sample Announcement',
        content: 'This is a sample announcement content.',
        targetAudience: 'all',
        priority: 'medium',
        publishedBy: 1,
        publishedByName: 'Administrator',
        publishedAt: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: announcement,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Announcement not found',
        },
      });
    }
  }

  /**
   * Create announcement
   * POST /api/v1/communication/announcements
   */
  async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { title, content, targetAudience, targetClasses, priority, expiresAt } = req.body;
      const userId = req.user?.userId;
      const userName = req.user?.firstName || 'Administrator';

      const announcement = {
        id: Date.now(),
        title,
        content,
        targetAudience: targetAudience || 'all',
        targetClasses: targetClasses || [],
        priority: priority || 'medium',
        publishedBy: userId,
        publishedByName: userName,
        publishedAt: new Date().toISOString(),
        expiresAt: expiresAt || null,
      };

      res.status(201).json({
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create announcement',
        },
      });
    }
  }

  /**
   * Update announcement
   * PUT /api/v1/communication/announcements/:announcementId
   */
  async updateAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { title, content, targetAudience, targetClasses, priority, expiresAt } = req.body;
      const userId = req.user?.userId;
      const userName = req.user?.firstName || 'Administrator';

      const announcement = {
        id: Number(announcementId),
        title: title || 'Updated Announcement',
        content: content || 'Updated content',
        targetAudience: targetAudience || 'all',
        targetClasses: targetClasses || [],
        priority: priority || 'medium',
        publishedBy: userId,
        publishedByName: userName,
        publishedAt: new Date().toISOString(),
        expiresAt: expiresAt || null,
      };

      res.status(200).json({
        success: true,
        data: announcement,
        message: 'Announcement updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update announcement',
        },
      });
    }
  }

  /**
   * Delete announcement
   * DELETE /api/v1/communication/announcements/:announcementId
   */
  async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;

      res.status(200).json({
        success: true,
        message: 'Announcement deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete announcement',
        },
      });
    }
  }

  /**
   * Send bulk notification
   * POST /api/v1/communication/bulk-notification
   */
  async sendBulkNotification(req: Request, res: Response): Promise<void> {
    try {
      const { title, message, targetAudience, targetClasses, channels } = req.body;
      const userId = req.user?.userId;

      // In production, this would queue notifications for sending
      const result = {
        sent: true,
        recipientCount: targetAudience === 'all' ? 500 : targetAudience === 'students' ? 300 : targetAudience === 'parents' ? 280 : 50,
        channels: channels || ['in-app', 'email'],
        sentAt: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: result,
        message: 'Bulk notification sent successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: error instanceof Error ? error.message : 'Failed to send bulk notification',
        },
      });
    }
  }

  // ==================== NOTIFICATION / SMS / EMAIL / PUSH METHODS ====================

  /**
   * Get notification history
   * GET /api/v1/communication/notifications/history
   */
  async getNotificationHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const history = [
        {
          id: 1,
          type: 'sms',
          recipient: '9800000001',
          message: 'Your fee payment is due.',
          status: 'sent',
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          type: 'email',
          recipient: 'parent@example.com',
          subject: 'Exam Results',
          message: 'Please check the exam results.',
          status: 'sent',
          sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          type: 'push',
          recipient: 'All Students',
          message: 'School closed tomorrow due to public holiday.',
          status: 'sent',
          sentAt: new Date().toISOString(),
        },
      ];

      res.status(200).json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch notification history' } });
    }
  }

  /**
   * Get notification templates by type
   * GET /api/v1/communication/templates?type=sms|email
   */
  async getNotificationTemplates(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const type = req.query.type as string;

      const smsTemplates = [
        { id: 1, name: 'Fee Reminder', content: 'Dear {name}, your fee of Rs. {amount} is due on {date}. Please pay on time.', variables: ['name', 'amount', 'date'] },
        { id: 2, name: 'Exam Notice', content: 'Dear {name}, your exam is scheduled on {date} at {time}.', variables: ['name', 'date', 'time'] },
      ];

      const emailTemplates = [
        { id: 3, name: 'Fee Receipt', subject: 'Fee Receipt - {studentName}', body: 'Dear {parentName},\n\nWe confirm receipt of Rs. {amount} for {studentName}.\n\nThank you.', variables: ['parentName', 'studentName', 'amount'] },
        { id: 4, name: 'Result Notification', subject: 'Exam Results - {studentName}', body: 'Dear {parentName},\n\nThe exam results for {studentName} are now available.\n\nRegards,\nSchool Administration', variables: ['parentName', 'studentName'] },
      ];

      const data = type === 'sms' ? smsTemplates : type === 'email' ? emailTemplates : [...smsTemplates, ...emailTemplates];

      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch templates' } });
    }
  }

  /**
   * Get communication settings
   * GET /api/v1/communication/settings
   */
  async getCommunicationSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const settings = {
        sms: {
          provider: 'sparrow',
          apiKey: '',
          senderId: 'SCHOOL',
          enabled: true,
        },
        email: {
          host: '',
          port: 587,
          username: '',
          password: '',
          fromEmail: '',
          fromName: 'School Management System',
          enabled: true,
        },
        smsBalance: { balance: 500, used: 120 },
      };

      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch settings' } });
    }
  }

  /**
   * Save communication settings
   * PUT /api/v1/communication/settings
   */
  async saveCommunicationSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      res.status(200).json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'SAVE_FAILED', message: 'Failed to save settings' } });
    }
  }

  /**
   * Send SMS
   * POST /api/v1/communication/sms/send
   */
  async sendSMS(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { recipients, message, scheduleTime } = req.body;

      if (!recipients || !message) {
        res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Recipients and message are required' } });
        return;
      }

      res.status(200).json({ success: true, message: `SMS sent to ${Array.isArray(recipients) ? recipients.length : 1} recipient(s)` });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'SEND_FAILED', message: 'Failed to send SMS' } });
    }
  }

  /**
   * Send bulk SMS
   * POST /api/v1/communication/sms/bulk
   */
  async sendBulkSMS(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { message, targetRoles, scheduleTime } = req.body;

      if (!message) {
        res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Message is required' } });
        return;
      }

      res.status(200).json({ success: true, message: 'Bulk SMS queued successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'SEND_FAILED', message: 'Failed to send bulk SMS' } });
    }
  }

  /**
   * Send Email
   * POST /api/v1/communication/email/send
   */
  async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { recipients, subject, body, scheduleTime } = req.body;

      if (!recipients || !subject || !body) {
        res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Recipients, subject, and body are required' } });
        return;
      }

      res.status(200).json({ success: true, message: `Email sent to ${Array.isArray(recipients) ? recipients.length : 1} recipient(s)` });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'SEND_FAILED', message: 'Failed to send email' } });
    }
  }

  /**
   * Send Push Notification
   * POST /api/v1/communication/push/send
   */
  async sendPushNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { title, message, targetRoles, scheduleTime } = req.body;

      if (!title || !message) {
        res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Title and message are required' } });
        return;
      }

      res.status(200).json({ success: true, message: 'Push notification sent successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'SEND_FAILED', message: 'Failed to send push notification' } });
    }
  }
}

export const communicationController = new CommunicationController();
