import { body, query, param } from 'express-validator';
import { AuditAction } from '@models/AuditLog.model';

/**
 * Audit Validation Rules
 * Requirements: 38.5
 */

export const getAuditLogsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  query('entityType')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Entity type must be between 1 and 50 characters'),
  
  query('entityId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer'),
  
  query('action')
    .optional()
    .isIn(Object.values(AuditAction))
    .withMessage(`Action must be one of: ${Object.values(AuditAction).join(', ')}`),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('ipAddress')
    .optional()
    .isIP()
    .withMessage('IP address must be valid'),
  
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['timestamp', 'entityType', 'action'])
    .withMessage('Sort by must be one of: timestamp, entityType, action'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
];

export const getAuditLogByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Audit log ID must be a positive integer')
];

export const getEntityAuditLogsValidation = [
  param('entityType')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Entity type must be between 1 and 50 characters'),
  
  param('entityId')
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const getUserAuditLogsValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const rotateAuditLogsValidation = [
  body('retentionDays')
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage('Retention days must be between 1 and 3650 (10 years)')
];
