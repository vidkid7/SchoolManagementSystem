/**
 * Communication Routes
 * 
 * Route definitions for messaging operations
 * 
 * Requirements: 24.1, 24.2, 24.3, 24.5, 24.6, 24.7, 24.8, 24.9
 */

import { Router } from 'express';
import { communicationController } from './communication.controller';
import { communicationValidation } from './communication.validation';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { attachmentUpload } from './attachment.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/communication/messages
 * @desc    Send a message
 * @access  Private (authenticated users)
 */
router.post(
  '/messages',
  validate(communicationValidation.sendMessage),
  communicationController.sendMessage.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/conversations
 * @desc    Get user conversations
 * @access  Private (authenticated users)
 */
router.get(
  '/conversations',
  validate(communicationValidation.paginationQuery, 'query'),
  communicationController.getConversations.bind(communicationController)
);

/**
 * @route   POST /api/v1/communication/conversations
 * @desc    Get or create conversation with user
 * @access  Private (authenticated users)
 */
router.post(
  '/conversations',
  validate(communicationValidation.getOrCreateConversation),
  communicationController.getOrCreateConversation.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/conversations/:conversationId
 * @desc    Get conversation by ID
 * @access  Private (authenticated users)
 */
router.get(
  '/conversations/:conversationId',
  validate(communicationValidation.conversationIdParam, 'params'),
  communicationController.getConversationById.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/conversations/:conversationId/messages
 * @desc    Get messages for a conversation
 * @access  Private (authenticated users)
 */
router.get(
  '/conversations/:conversationId/messages',
  validate(communicationValidation.conversationIdParam, 'params'),
  validate(communicationValidation.paginationQuery, 'query'),
  communicationController.getConversationMessages.bind(communicationController)
);

/**
 * @route   PUT /api/v1/communication/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private (authenticated users)
 */
router.put(
  '/messages/:messageId/read',
  validate(communicationValidation.messageIdParam, 'params'),
  communicationController.markMessageAsRead.bind(communicationController)
);

/**
 * @route   PUT /api/v1/communication/conversations/:conversationId/read
 * @desc    Mark all messages in conversation as read
 * @access  Private (authenticated users)
 */
router.put(
  '/conversations/:conversationId/read',
  validate(communicationValidation.conversationIdParam, 'params'),
  communicationController.markConversationAsRead.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/unread-count
 * @desc    Get unread message count
 * @access  Private (authenticated users)
 */
router.get(
  '/unread-count',
  communicationController.getUnreadCount.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/messages/search
 * @desc    Search messages
 * @access  Private (authenticated users)
 */
router.get(
  '/messages/search',
  validate(communicationValidation.searchQuery, 'query'),
  communicationController.searchMessages.bind(communicationController)
);

/**
 * @route   DELETE /api/v1/communication/messages/:messageId
 * @desc    Delete a message
 * @access  Private (authenticated users)
 */
router.delete(
  '/messages/:messageId',
  validate(communicationValidation.messageIdParam, 'params'),
  communicationController.deleteMessage.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/online-users
 * @desc    Get list of online users
 * @access  Private (authenticated users)
 * Requirement 24.6: Online/offline status
 */
router.get(
  '/online-users',
  communicationController.getOnlineUsers.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/users/:userId/online
 * @desc    Check if specific user is online
 * @access  Private (authenticated users)
 * Requirement 24.6: Online/offline status
 */
router.get(
  '/users/:userId/online',
  communicationController.checkUserOnline.bind(communicationController)
);

// ==================== GROUP MESSAGING ROUTES ====================

/**
 * @route   POST /api/v1/communication/groups
 * @desc    Create a group conversation
 * @access  Private (authenticated users)
 * Requirements: 24.2, 24.8
 */
router.post(
  '/groups',
  validate(communicationValidation.createGroupConversation),
  communicationController.createGroupConversation.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/groups
 * @desc    Get user's group conversations
 * @access  Private (authenticated users)
 * Requirement: 24.2
 */
router.get(
  '/groups',
  validate(communicationValidation.paginationQuery, 'query'),
  communicationController.getUserGroupConversations.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/groups/:groupConversationId
 * @desc    Get group conversation by ID
 * @access  Private (authenticated users)
 * Requirement: 24.2
 */
router.get(
  '/groups/:groupConversationId',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  communicationController.getGroupConversationById.bind(communicationController)
);

/**
 * @route   PUT /api/v1/communication/groups/:groupConversationId
 * @desc    Update group conversation
 * @access  Private (group admins only)
 * Requirement: 24.9
 */
router.put(
  '/groups/:groupConversationId',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  validate(communicationValidation.updateGroupConversation),
  communicationController.updateGroupConversation.bind(communicationController)
);

/**
 * @route   DELETE /api/v1/communication/groups/:groupConversationId
 * @desc    Delete group conversation
 * @access  Private (group admins only)
 * Requirement: 24.9
 */
router.delete(
  '/groups/:groupConversationId',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  communicationController.deleteGroupConversation.bind(communicationController)
);

/**
 * @route   POST /api/v1/communication/groups/messages
 * @desc    Send a group message
 * @access  Private (group members, admins only for announcement groups)
 * Requirements: 24.2, 24.8, 24.9
 */
router.post(
  '/groups/messages',
  validate(communicationValidation.sendGroupMessage),
  communicationController.sendGroupMessage.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/groups/:groupConversationId/messages
 * @desc    Get group messages
 * @access  Private (group members only)
 * Requirement: 24.2
 */
router.get(
  '/groups/:groupConversationId/messages',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  validate(communicationValidation.paginationQuery, 'query'),
  communicationController.getGroupMessages.bind(communicationController)
);

/**
 * @route   PUT /api/v1/communication/groups/:groupConversationId/read
 * @desc    Mark group as read
 * @access  Private (group members only)
 * Requirement: 24.2
 */
router.put(
  '/groups/:groupConversationId/read',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  communicationController.markGroupAsRead.bind(communicationController)
);

/**
 * @route   POST /api/v1/communication/groups/:groupConversationId/members
 * @desc    Add members to group
 * @access  Private (group admins only)
 * Requirement: 24.9
 */
router.post(
  '/groups/:groupConversationId/members',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  validate(communicationValidation.addGroupMembers),
  communicationController.addGroupMembers.bind(communicationController)
);

/**
 * @route   DELETE /api/v1/communication/groups/:groupConversationId/members/:userId
 * @desc    Remove member from group
 * @access  Private (group admins or self)
 * Requirement: 24.9
 */
router.delete(
  '/groups/:groupConversationId/members/:userId',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  communicationController.removeGroupMember.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/groups/:groupConversationId/members
 * @desc    Get group members
 * @access  Private (group members only)
 * Requirement: 24.2
 */
router.get(
  '/groups/:groupConversationId/members',
  validate(communicationValidation.groupConversationIdParam, 'params'),
  communicationController.getGroupMembers.bind(communicationController)
);

// ==================== FILE ATTACHMENT ROUTES ====================

/**
 * @route   POST /api/v1/communication/attachments
 * @desc    Upload message attachments
 * @access  Private (authenticated users)
 * Requirement: 24.4
 */
router.post(
  '/attachments',
  attachmentUpload.array('files', 5),
  communicationController.uploadAttachments.bind(communicationController)
);

/**
 * @route   DELETE /api/v1/communication/attachments
 * @desc    Delete an attachment
 * @access  Private (authenticated users)
 * Requirement: 24.4
 */
router.delete(
  '/attachments',
  validate(communicationValidation.deleteAttachment),
  communicationController.deleteAttachment.bind(communicationController)
);

// ==================== ANNOUNCEMENT ROUTES ====================

/**
 * @route   GET /api/v1/communication/announcements
 * @desc    Get all announcements
 * @access  Private (authenticated users)
 * Requirement: 24.8
 */
router.get(
  '/announcements',
  communicationController.getAnnouncements.bind(communicationController)
);

/**
 * @route   GET /api/v1/communication/announcements/:announcementId
 * @desc    Get announcement by ID
 * @access  Private (authenticated users)
 * Requirement: 24.8
 */
router.get(
  '/announcements/:announcementId',
  communicationController.getAnnouncementById.bind(communicationController)
);

/**
 * @route   POST /api/v1/communication/announcements
 * @desc    Create announcement
 * @access  Private (admin, teacher)
 * Requirement: 24.8
 */
router.post(
  '/announcements',
  validate(communicationValidation.createAnnouncement),
  communicationController.createAnnouncement.bind(communicationController)
);

/**
 * @route   PUT /api/v1/communication/announcements/:announcementId
 * @desc    Update announcement
 * @access  Private (admin, announcement creator)
 * Requirement: 24.8
 */
router.put(
  '/announcements/:announcementId',
  validate(communicationValidation.updateAnnouncement),
  communicationController.updateAnnouncement.bind(communicationController)
);

/**
 * @route   DELETE /api/v1/communication/announcements/:announcementId
 * @desc    Delete announcement
 * @access  Private (admin, announcement creator)
 * Requirement: 24.8
 */
router.delete(
  '/announcements/:announcementId',
  communicationController.deleteAnnouncement.bind(communicationController)
);

/**
 * @route   POST /api/v1/communication/bulk-notification
 * @desc    Send bulk notification
 * @access  Private (admin only)
 * Requirement: 24.8
 */
router.post(
  '/bulk-notification',
  communicationController.sendBulkNotification.bind(communicationController)
);

// ==================== NOTIFICATION CENTER ROUTES ====================

router.get(
  '/notifications/history',
  communicationController.getNotificationHistory.bind(communicationController)
);

router.get(
  '/templates',
  communicationController.getNotificationTemplates.bind(communicationController)
);

router.get(
  '/settings',
  communicationController.getCommunicationSettings.bind(communicationController)
);

router.put(
  '/settings',
  communicationController.saveCommunicationSettings.bind(communicationController)
);

router.post(
  '/sms/send',
  communicationController.sendSMS.bind(communicationController)
);

router.post(
  '/sms/bulk',
  communicationController.sendBulkSMS.bind(communicationController)
);

router.post(
  '/email/send',
  communicationController.sendEmail.bind(communicationController)
);

router.post(
  '/push/send',
  communicationController.sendPushNotification.bind(communicationController)
);

export default router;
