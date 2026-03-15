/**
 * Notification Routes
 *
 * All routes require authentication. Users can only access their own notifications.
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { notificationController } from './notification.controller';

const router = Router();

// GET /notifications — paginated list for current user
router.get('/', authenticate, notificationController.getNotifications);

// GET /notifications/unread-count — badge count
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// PUT /notifications/read-all — mark all as read
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// PUT /notifications/:id/read — mark one as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

// DELETE /notifications/:id
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
