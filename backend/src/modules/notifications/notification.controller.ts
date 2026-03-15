/**
 * Notification Controller
 *
 * REST API handlers for in-app notifications.
 * All endpoints operate on the authenticated user's own notifications.
 */

import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { logger } from '../../utils/logger';

class NotificationController {
  /**
   * GET /notifications
   * List notifications for the authenticated user (paginated, filterable).
   */
  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId as number;

      const filters: any = {};
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.isRead !== undefined) filters.isRead = req.query.isRead === 'true';
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const options: any = {};
      if (req.query.page) options.page = parseInt(req.query.page as string, 10);
      if (req.query.limit) options.limit = Math.min(parseInt(req.query.limit as string, 10), 100);

      const result = await notificationService.getUserNotifications(userId, filters, options);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /notifications/unread-count
   * Returns badge count for the navbar bell.
   */
  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId as number;
      const category = req.query.category as string | undefined;
      const count = await notificationService.getUnreadCount(userId, category);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /notifications/:id/read
   * Mark a single notification as read.
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId as number;
      const notificationId = parseInt(req.params.id, 10);

      const notification = await notificationService.markAsRead(notificationId, userId);
      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.json({ success: true, data: notification });
    } catch (err: any) {
      if (err.statusCode === 403) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      next(err);
    }
  };

  /**
   * PUT /notifications/read-all
   * Mark all (or all in a category) notifications as read.
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId as number;
      const category = req.query.category as string | undefined;
      const count = await notificationService.markAllAsRead(userId, category);
      res.json({ success: true, data: { updated: count } });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /notifications/:id
   * Delete a notification.
   */
  deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId as number;
      const notificationId = parseInt(req.params.id, 10);

      const deleted = await notificationService.deleteNotification(notificationId, userId);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.json({ success: true, message: 'Notification deleted' });
    } catch (err: any) {
      if (err.statusCode === 403) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      next(err);
    }
  };
}

export const notificationController = new NotificationController();
