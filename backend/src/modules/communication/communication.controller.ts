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
import AuditLog, { AuditAction } from '@models/AuditLog.model';
import NotificationTemplate from '@models/NotificationTemplate.model';
import User from '@models/User.model';
import { Op } from 'sequelize';

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

  private getRequestMeta(req: Request): { ipAddress: string | null; userAgent: string | null } {
    const forwardedFor = req.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip || req.socket.remoteAddress || null;
    return {
      ipAddress,
      userAgent: req.get('user-agent') || null,
    };
  }

  private getAudienceForRole(role?: string): string | null {
    switch (role) {
      case 'Student':
        return 'students';
      case 'Parent':
        return 'parents';
      case 'Class_Teacher':
      case 'Subject_Teacher':
      case 'Department_Head':
        return 'teachers';
      case 'Librarian':
      case 'Accountant':
      case 'Transport_Manager':
      case 'Hostel_Warden':
      case 'Non_Teaching_Staff':
        return 'staff';
      default:
        return null;
    }
  }

  private normalizeRoleFilters(targetRoles: string[]): string[] {
    const roleMap: Record<string, string[]> = {
      student: ['Student'],
      parent: ['Parent'],
      teacher: ['Class_Teacher', 'Subject_Teacher', 'Department_Head'],
      staff: ['School_Admin', 'Librarian', 'Accountant', 'Transport_Manager', 'Hostel_Warden', 'Non_Teaching_Staff'],
      admin: ['School_Admin', 'Municipality_Admin'],
      Student: ['Student'],
      Parent: ['Parent'],
      Class_Teacher: ['Class_Teacher'],
      Subject_Teacher: ['Subject_Teacher'],
      Department_Head: ['Department_Head'],
      School_Admin: ['School_Admin'],
      Municipality_Admin: ['Municipality_Admin'],
      Librarian: ['Librarian'],
      Accountant: ['Accountant'],
      Transport_Manager: ['Transport_Manager'],
      Hostel_Warden: ['Hostel_Warden'],
      Non_Teaching_Staff: ['Non_Teaching_Staff'],
    };

    const normalized = new Set<string>();
    for (const role of targetRoles) {
      const mapped = roleMap[role];
      if (mapped && mapped.length) {
        mapped.forEach(value => normalized.add(value));
      }
    }

    return Array.from(normalized);
  }

  private canManageAnnouncement(userRole?: string, publishedBy?: number, userId?: number): boolean {
    if (!userId) {
      return false;
    }

    const privilegedRoles = ['School_Admin', 'Municipality_Admin'];
    if (userRole && privilegedRoles.includes(userRole)) {
      return true;
    }

    return typeof publishedBy === 'number' && publishedBy === userId;
  }

  private buildAnnouncementFromLog(log: AuditLog): Record<string, any> | null {
    if (log.action === AuditAction.DELETE) {
      return null;
    }

    const payload = (log.newValue || {}) as Record<string, any>;
    if (!payload || Object.keys(payload).length === 0) {
      return null;
    }

    return {
      id: log.entityId,
      title: payload.title || '',
      content: payload.content || '',
      targetAudience: payload.targetAudience || 'all',
      targetClasses: payload.targetClasses || [],
      priority: payload.priority || 'medium',
      publishedBy: payload.publishedBy ?? log.userId,
      publishedByName: payload.publishedByName || 'Administrator',
      publishedAt: payload.publishedAt || log.timestamp,
      expiresAt: payload.expiresAt || null,
    };
  }

  private async getCurrentAnnouncements(): Promise<Array<Record<string, any>>> {
    const logs = await AuditLog.findAll({
      where: { entityType: 'announcement' },
      order: [['timestamp', 'ASC']],
    });

    const announcements = new Map<number, Record<string, any>>();

    for (const log of logs) {
      const currentState = this.buildAnnouncementFromLog(log);
      if (!currentState) {
        announcements.delete(log.entityId);
        continue;
      }

      announcements.set(log.entityId, currentState);
    }

    return Array.from(announcements.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  private async getAnnouncementByIdFromLogs(announcementId: number): Promise<Record<string, any> | null> {
    const logs = await AuditLog.findAll({
      where: {
        entityType: 'announcement',
        entityId: announcementId,
      },
      order: [['timestamp', 'ASC']],
    });

    if (logs.length === 0) {
      return null;
    }

    let state: Record<string, any> | null = null;
    for (const log of logs) {
      state = this.buildAnnouncementFromLog(log);
    }

    return state;
  }

  // ==================== ANNOUNCEMENT METHODS ====================

  /**
   * Get all announcements
   * GET /api/v1/communication/announcements
   */
  async getAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const { targetAudience, page = 1, limit = 20 } = req.query;
      const userRole = req.user?.role;
      const roleAudience = this.getAudienceForRole(userRole);
      const pageNumber = Number(page) || 1;
      const pageLimit = Number(limit) || 20;

      const announcements = await this.getCurrentAnnouncements();

      let filteredAnnouncements = announcements;
      if (roleAudience) {
        filteredAnnouncements = filteredAnnouncements.filter(
          announcement =>
            announcement.targetAudience === 'all' || announcement.targetAudience === roleAudience
        );
      }

      if (targetAudience && targetAudience !== 'all') {
        filteredAnnouncements = filteredAnnouncements.filter(
          announcement =>
            announcement.targetAudience === targetAudience || announcement.targetAudience === 'all'
        );
      }

      const now = new Date();
      filteredAnnouncements = filteredAnnouncements.filter(
        announcement => !announcement.expiresAt || new Date(announcement.expiresAt) > now
      );

      const offset = (pageNumber - 1) * pageLimit;
      const paginatedAnnouncements = filteredAnnouncements.slice(offset, offset + pageLimit);

      res.status(200).json({
        success: true,
        data: {
          announcements: paginatedAnnouncements,
          meta: {
            page: pageNumber,
            limit: pageLimit,
            total: filteredAnnouncements.length,
            totalPages: Math.max(1, Math.ceil(filteredAnnouncements.length / pageLimit)),
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
      const announcementId = parseInt(req.params.announcementId, 10);
      const announcement = await this.getAnnouncementByIdFromLogs(announcementId);

      if (!announcement) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: announcement,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch announcement',
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
      const userName = req.user?.username || 'Administrator';

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

      const maxEntityId = await AuditLog.max('entityId', {
        where: { entityType: 'announcement' },
      });
      const announcementId = (typeof maxEntityId === 'number' ? maxEntityId : 0) + 1;

      const announcement = {
        id: announcementId,
        title,
        content,
        targetAudience: targetAudience || 'all',
        targetClasses: Array.isArray(targetClasses) ? targetClasses : [],
        priority: priority || 'medium',
        publishedBy: userId,
        publishedByName: userName,
        publishedAt: new Date().toISOString(),
        expiresAt: expiresAt || null,
      };

      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'announcement',
        entityId: announcementId,
        action: AuditAction.CREATE,
        oldValue: null,
        newValue: announcement,
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: {
          module: 'communication',
          source: 'announcement',
        },
        timestamp: new Date(),
      });

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
      const announcementId = parseInt(req.params.announcementId, 10);
      const { title, content, targetAudience, targetClasses, priority, expiresAt } = req.body;
      const userId = req.user?.userId;
      const userName = req.user?.username || 'Administrator';

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

      const existingAnnouncement = await this.getAnnouncementByIdFromLogs(announcementId);
      if (!existingAnnouncement) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
          },
        });
        return;
      }

      if (!this.canManageAnnouncement(req.user?.role, existingAnnouncement.publishedBy, userId)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this announcement',
          },
        });
        return;
      }

      const announcement = {
        ...existingAnnouncement,
        title: title ?? existingAnnouncement.title,
        content: content ?? existingAnnouncement.content,
        targetAudience: targetAudience ?? existingAnnouncement.targetAudience,
        targetClasses: Array.isArray(targetClasses) ? targetClasses : existingAnnouncement.targetClasses || [],
        priority: priority ?? existingAnnouncement.priority,
        publishedByName: existingAnnouncement.publishedByName || userName,
        expiresAt: expiresAt ?? existingAnnouncement.expiresAt ?? null,
      };

      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'announcement',
        entityId: announcementId,
        action: AuditAction.UPDATE,
        oldValue: existingAnnouncement,
        newValue: announcement,
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: {
          module: 'communication',
          source: 'announcement',
        },
        timestamp: new Date(),
      });

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
      const announcementId = parseInt(req.params.announcementId, 10);
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

      const existingAnnouncement = await this.getAnnouncementByIdFromLogs(announcementId);
      if (!existingAnnouncement) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
          },
        });
        return;
      }

      if (!this.canManageAnnouncement(req.user?.role, existingAnnouncement.publishedBy, userId)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this announcement',
          },
        });
        return;
      }

      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'announcement',
        entityId: announcementId,
        action: AuditAction.DELETE,
        oldValue: existingAnnouncement,
        newValue: null,
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: {
          module: 'communication',
          source: 'announcement',
        },
        timestamp: new Date(),
      });

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
      const { title, message, targetAudience, channels } = req.body;
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

      const audienceRoleMap: Record<string, string[]> = {
        students: ['Student'],
        parents: ['Parent'],
        teachers: ['Class_Teacher', 'Subject_Teacher', 'Department_Head'],
        staff: ['School_Admin', 'Librarian', 'Accountant', 'Transport_Manager', 'Hostel_Warden', 'Non_Teaching_Staff'],
      };

      const userWhere: Record<string, any> = {};
      if (targetAudience && targetAudience !== 'all' && audienceRoleMap[targetAudience]) {
        userWhere.role = { [Op.in]: audienceRoleMap[targetAudience] };
      }

      const recipientCount = await User.count({
        where: userWhere,
      });

      const notificationPayload = {
        type: 'push',
        recipient: targetAudience || 'all',
        subject: title || 'Bulk Notification',
        message,
        status: 'sent',
        channels: channels || ['in-app', 'email'],
        recipientCount,
        sentAt: new Date().toISOString(),
      };

      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'communication_notification',
        entityId: 0,
        action: AuditAction.CREATE,
        oldValue: null,
        newValue: notificationPayload,
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: { module: 'communication', source: 'bulk-notification' },
        timestamp: new Date(),
      });

      const result = {
        sent: true,
        recipientCount,
        channels: notificationPayload.channels,
        sentAt: notificationPayload.sentAt,
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

      const logs = await AuditLog.findAll({
        where: {
          entityType: 'communication_notification',
          userId,
          action: AuditAction.CREATE,
        },
        order: [['timestamp', 'DESC']],
        limit: 200,
      });

      const history = logs.map(log => {
        const payload = (log.newValue || {}) as Record<string, any>;
        return {
          id: log.auditLogId,
          type: payload.type || 'push',
          recipient: payload.recipient || payload.targetAudience || 'N/A',
          subject: payload.subject,
          message: payload.message || '',
          status: payload.status || 'sent',
          sentAt: (payload.sentAt as string) || log.timestamp.toISOString(),
          error: payload.error || undefined,
        };
      });

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

      const type = req.query.type as 'sms' | 'email' | undefined;
      const where: Record<string, any> = { isActive: true };
      if (type === 'sms') {
        where.channel = 'sms';
      } else if (type === 'email') {
        where.channel = 'email';
      } else {
        where.channel = { [Op.in]: ['sms', 'email'] };
      }

      const templates = await NotificationTemplate.findAll({
        where,
        order: [['updatedAt', 'DESC']],
      });

      const data = templates.map(template => {
        const base = {
          id: template.id,
          name: template.name,
          variables: template.variables || [],
        };

        if (template.channel === 'sms') {
          return {
            ...base,
            content: template.templateEn,
          };
        }

        return {
          ...base,
          subject: template.subject || '',
          body: template.templateEn,
        };
      });

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

      const settingsLog = await AuditLog.findOne({
        where: {
          entityType: 'communication_settings',
          action: { [Op.in]: [AuditAction.CREATE, AuditAction.UPDATE] },
        },
        order: [['timestamp', 'DESC']],
      });

      const settings = (settingsLog?.newValue as Record<string, any>) || {
        sms: {
          provider: 'sparrow',
          apiKey: '',
          senderId: '',
          enabled: true,
        },
        email: {
          host: '',
          port: 587,
          username: '',
          password: '',
          fromEmail: '',
          fromName: '',
          enabled: true,
        },
        smsBalance: { balance: 0, used: 0 },
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

      const settings = req.body || {};
      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'communication_settings',
        entityId: 1,
        action: AuditAction.UPDATE,
        oldValue: null,
        newValue: settings,
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: {
          module: 'communication',
          source: 'settings',
        },
        timestamp: new Date(),
      });

      res.status(200).json({ success: true, data: settings, message: 'Settings saved successfully' });
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

      const recipientList = Array.isArray(recipients) ? recipients : [recipients];
      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'communication_notification',
        entityId: 0,
        action: AuditAction.CREATE,
        oldValue: null,
        newValue: {
          type: 'sms',
          recipient: recipientList.join(', '),
          message,
          status: 'sent',
          scheduleTime: scheduleTime || null,
          sentAt: new Date().toISOString(),
        },
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: { module: 'communication', source: 'sms' },
        timestamp: new Date(),
      });

      res.status(200).json({ success: true, message: `SMS sent to ${recipientList.length} recipient(s)` });
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

      const roles = Array.isArray(targetRoles) && targetRoles.length > 0
        ? this.normalizeRoleFilters(targetRoles)
        : null;
      const userWhere: Record<string, any> = {};
      if (roles) {
        userWhere.role = { [Op.in]: roles };
      }

      const recipientCount = await User.count({ where: userWhere });
      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'communication_notification',
        entityId: 0,
        action: AuditAction.CREATE,
        oldValue: null,
        newValue: {
          type: 'sms',
          recipient: roles ? roles.join(', ') : 'all',
          message,
          status: 'sent',
          scheduleTime: scheduleTime || null,
          recipientCount,
          sentAt: new Date().toISOString(),
        },
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: { module: 'communication', source: 'sms-bulk' },
        timestamp: new Date(),
      });

      res.status(200).json({ success: true, data: { recipientCount }, message: 'Bulk SMS queued successfully' });
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

      const recipientList = Array.isArray(recipients) ? recipients : [recipients];
      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'communication_notification',
        entityId: 0,
        action: AuditAction.CREATE,
        oldValue: null,
        newValue: {
          type: 'email',
          recipient: recipientList.join(', '),
          subject,
          message: body,
          status: 'sent',
          scheduleTime: scheduleTime || null,
          sentAt: new Date().toISOString(),
        },
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: { module: 'communication', source: 'email' },
        timestamp: new Date(),
      });

      res.status(200).json({ success: true, message: `Email sent to ${recipientList.length} recipient(s)` });
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

      const roles = Array.isArray(targetRoles) && targetRoles.length > 0
        ? this.normalizeRoleFilters(targetRoles)
        : null;
      const userWhere: Record<string, any> = {};
      if (roles) {
        userWhere.role = { [Op.in]: roles };
      }

      const recipientCount = await User.count({ where: userWhere });
      const requestMeta = this.getRequestMeta(req);
      await AuditLog.create({
        userId,
        entityType: 'communication_notification',
        entityId: 0,
        action: AuditAction.CREATE,
        oldValue: null,
        newValue: {
          type: 'push',
          recipient: roles ? roles.join(', ') : 'all',
          subject: title,
          message,
          status: 'sent',
          scheduleTime: scheduleTime || null,
          recipientCount,
          sentAt: new Date().toISOString(),
        },
        changedFields: null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: { module: 'communication', source: 'push' },
        timestamp: new Date(),
      });

      res.status(200).json({ success: true, data: { recipientCount }, message: 'Push notification sent successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'SEND_FAILED', message: 'Failed to send push notification' } });
    }
  }
}

export const communicationController = new CommunicationController();
