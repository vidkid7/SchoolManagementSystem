/**
 * Notification Routes
 *
 * All routes require authentication. Users can only access their own notifications.
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { notificationController } from './notification.controller';
import {
  notificationCategoryQuerySchema,
  notificationIdParamSchema,
  notificationListQuerySchema,
} from './notification.validation';

const router = Router();

// GET /notifications — paginated list for current user
router.get('/', authenticate, validate(notificationListQuerySchema, 'query'), notificationController.getNotifications);

// GET /notifications/unread-count — badge count
router.get('/unread-count', authenticate, validate(notificationCategoryQuerySchema, 'query'), notificationController.getUnreadCount);

// PUT /notifications/read-all — mark all as read
router.put('/read-all', authenticate, validate(notificationCategoryQuerySchema, 'query'), notificationController.markAllAsRead);

// PUT /notifications/:id/read — mark one as read
router.put('/:id/read', authenticate, validate(notificationIdParamSchema, 'params'), notificationController.markAsRead);

// DELETE /notifications/:id
router.delete('/:id', authenticate, validate(notificationIdParamSchema, 'params'), notificationController.deleteNotification);

export default router;
