/**
 * Communication Validation
 * 
 * Input validation schemas for messaging operations
 * 
 * Requirements: 24.1, 24.5
 */

import Joi from 'joi';

export const communicationValidation = {
  /**
   * Validation for sending a message
   */
  sendMessage: Joi.object({
    recipientId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Recipient ID must be a number',
        'number.positive': 'Recipient ID must be positive',
        'any.required': 'Recipient ID is required',
      }),
    content: Joi.string()
      .min(1)
      .max(5000)
      .required()
      .messages({
        'string.empty': 'Message content cannot be empty',
        'string.max': 'Message content cannot exceed 5000 characters',
        'any.required': 'Message content is required',
      }),
    attachments: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().valid('image', 'document', 'video', 'audio').required(),
          url: Joi.string().uri().required(),
          name: Joi.string().required(),
          size: Joi.number().positive().required(),
        })
      )
      .max(5)
      .optional()
      .messages({
        'array.max': 'Maximum 5 attachments allowed',
      }),
  }),

  /**
   * Validation for getting or creating conversation
   */
  getOrCreateConversation: Joi.object({
    otherUserId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required',
      }),
  }),

  /**
   * Validation for pagination query parameters
   */
  paginationQuery: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
  }),

  /**
   * Validation for search query
   */
  searchQuery: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Search query cannot be empty',
        'string.max': 'Search query cannot exceed 100 characters',
        'any.required': 'Search query is required',
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(50),
  }),

  /**
   * Validation for conversation ID parameter
   */
  conversationIdParam: Joi.object({
    conversationId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Conversation ID must be a number',
        'number.positive': 'Conversation ID must be positive',
        'any.required': 'Conversation ID is required',
      }),
  }),

  /**
   * Validation for message ID parameter
   */
  messageIdParam: Joi.object({
    messageId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Message ID must be a number',
        'number.positive': 'Message ID must be positive',
        'any.required': 'Message ID is required',
      }),
  }),

  /**
   * Validation for creating a group conversation
   */
  createGroupConversation: Joi.object({
    name: Joi.string()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Group name cannot be empty',
        'string.max': 'Group name cannot exceed 255 characters',
        'any.required': 'Group name is required',
      }),
    type: Joi.string()
      .valid('class', 'announcement', 'custom')
      .required()
      .messages({
        'any.only': 'Type must be one of: class, announcement, custom',
        'any.required': 'Type is required',
      }),
    description: Joi.string()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    classId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Class ID must be a number',
        'number.positive': 'Class ID must be positive',
      }),
    isAnnouncementOnly: Joi.boolean()
      .optional()
      .default(false),
    memberIds: Joi.array()
      .items(Joi.number().integer().positive())
      .optional()
      .messages({
        'array.base': 'Member IDs must be an array',
      }),
    adminIds: Joi.array()
      .items(Joi.number().integer().positive())
      .optional()
      .messages({
        'array.base': 'Admin IDs must be an array',
      }),
  }),

  /**
   * Validation for sending a group message
   */
  sendGroupMessage: Joi.object({
    groupConversationId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Group conversation ID must be a number',
        'number.positive': 'Group conversation ID must be positive',
        'any.required': 'Group conversation ID is required',
      }),
    content: Joi.string()
      .min(1)
      .max(5000)
      .required()
      .messages({
        'string.empty': 'Message content cannot be empty',
        'string.max': 'Message content cannot exceed 5000 characters',
        'any.required': 'Message content is required',
      }),
    attachments: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().valid('image', 'document', 'video', 'audio').required(),
          url: Joi.string().uri().required(),
          name: Joi.string().required(),
          size: Joi.number().positive().required(),
        })
      )
      .max(5)
      .optional()
      .messages({
        'array.max': 'Maximum 5 attachments allowed',
      }),
  }),

  /**
   * Validation for group conversation ID parameter
   */
  groupConversationIdParam: Joi.object({
    groupConversationId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Group conversation ID must be a number',
        'number.positive': 'Group conversation ID must be positive',
        'any.required': 'Group conversation ID is required',
      }),
  }),

  /**
   * Validation for adding members to group
   */
  addGroupMembers: Joi.object({
    userIds: Joi.array()
      .items(Joi.number().integer().positive())
      .min(1)
      .required()
      .messages({
        'array.base': 'User IDs must be an array',
        'array.min': 'At least one user ID is required',
        'any.required': 'User IDs are required',
      }),
  }),

  /**
   * Validation for removing member from group
   */
  removeGroupMember: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required',
      }),
  }),

  /**
   * Validation for updating group conversation
   */
  updateGroupConversation: Joi.object({
    name: Joi.string()
      .min(1)
      .max(255)
      .optional()
      .messages({
        'string.empty': 'Group name cannot be empty',
        'string.max': 'Group name cannot exceed 255 characters',
      }),
    description: Joi.string()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    isAnnouncementOnly: Joi.boolean()
      .optional(),
  }),

  /**
   * Validation for group message ID parameter
   */
  groupMessageIdParam: Joi.object({
    groupMessageId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Group message ID must be a number',
        'number.positive': 'Group message ID must be positive',
        'any.required': 'Group message ID is required',
      }),
  }),

  /**
   * Validation for deleting attachment
   */
  deleteAttachment: Joi.object({
    attachmentUrl: Joi.string()
      .uri({ relativeOnly: true })
      .required()
      .messages({
        'string.empty': 'Attachment URL cannot be empty',
        'string.uri': 'Attachment URL must be a valid URI',
        'any.required': 'Attachment URL is required',
      }),
  }),

  /**
   * Validation for creating announcement
   */
  createAnnouncement: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Announcement title is required',
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot exceed 255 characters',
        'any.required': 'Announcement title is required',
      }),
    content: Joi.string()
      .min(10)
      .max(5000)
      .required()
      .messages({
        'string.empty': 'Announcement content is required',
        'string.min': 'Content must be at least 10 characters',
        'string.max': 'Content cannot exceed 5000 characters',
        'any.required': 'Announcement content is required',
      }),
    targetAudience: Joi.string()
      .valid('all', 'students', 'parents', 'teachers', 'staff')
      .default('all')
      .messages({
        'any.only': 'Invalid target audience',
      }),
    targetClasses: Joi.array()
      .items(Joi.number().integer().positive())
      .optional()
      .messages({
        'array.base': 'Target classes must be an array',
        'number.positive': 'Class ID must be positive',
      }),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium')
      .messages({
        'any.only': 'Priority must be low, medium, or high',
      }),
    expiresAt: Joi.date()
      .min('now')
      .optional()
      .messages({
        'date.min': 'Expiry date must be in the future',
      }),
  }),

  /**
   * Validation for updating announcement
   */
  updateAnnouncement: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .optional(),
    content: Joi.string()
      .min(10)
      .max(5000)
      .optional(),
    targetAudience: Joi.string()
      .valid('all', 'students', 'parents', 'teachers', 'staff')
      .optional(),
    targetClasses: Joi.array()
      .items(Joi.number().integer().positive())
      .optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .optional(),
    expiresAt: Joi.date()
      .min('now')
      .optional()
      .allow(null),
  }),
};
