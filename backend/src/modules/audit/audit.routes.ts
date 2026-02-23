import { Router } from 'express';
import auditController from './audit.controller';
import { authenticate, authorize } from '@middleware/auth';
import { validate } from '@middleware/validation';
import {
  getAuditLogsValidation,
  getAuditLogByIdValidation,
  getEntityAuditLogsValidation,
  getUserAuditLogsValidation,
  rotateAuditLogsValidation
} from './audit.validation';

/**
 * Audit Routes
 * Requirements: 38.5, 38.6, 38.7
 */

const router = Router();

// All audit routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['school_admin']));

/**
 * @route   GET /api/v1/audit/logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin only
 */
router.get(
  '/logs',
  validate(getAuditLogsValidation),
  auditController.getAuditLogs
);

/**
 * @route   GET /api/v1/audit/logs/:id
 * @desc    Get audit log by ID
 * @access  Admin only
 */
router.get(
  '/logs/:id',
  validate(getAuditLogByIdValidation),
  auditController.getAuditLogById
);

/**
 * @route   GET /api/v1/audit/entity/:entityType/:entityId
 * @desc    Get audit logs for a specific entity
 * @access  Admin only
 */
router.get(
  '/entity/:entityType/:entityId',
  validate(getEntityAuditLogsValidation),
  auditController.getEntityAuditLogs
);

/**
 * @route   GET /api/v1/audit/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Admin only
 */
router.get(
  '/user/:userId',
  validate(getUserAuditLogsValidation),
  auditController.getUserAuditLogs
);

/**
 * @route   GET /api/v1/audit/stats
 * @desc    Get audit log statistics
 * @access  Admin only
 */
router.get(
  '/stats',
  auditController.getAuditLogStats
);

/**
 * @route   POST /api/v1/audit/rotate
 * @desc    Rotate audit logs (delete old logs)
 * @access  Admin only
 */
router.post(
  '/rotate',
  validate(rotateAuditLogsValidation),
  auditController.rotateAuditLogs
);

/**
 * @route   GET /api/v1/audit/export
 * @desc    Export audit logs
 * @access  Admin only
 */
router.get(
  '/export',
  validate(getAuditLogsValidation),
  auditController.exportAuditLogs
);

export default router;
