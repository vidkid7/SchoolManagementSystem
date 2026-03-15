/**
 * Notification Service
 *
 * Business logic for in-app notifications with real-time Socket.IO push.
 */

import { notificationRepository, NotificationFilters, NotificationPaginationOptions } from './notification.repository';
import { NotificationCreationAttributes } from '../../models/Notification.model';
import { socketService } from '../../services/socket.service';
import { logger } from '../../utils/logger';

class NotificationService {
  /**
   * Create a notification in DB and push it via Socket.IO.
   */
  async send(
    userId: number,
    type: NotificationCreationAttributes['type'],
    category: NotificationCreationAttributes['category'],
    title: string,
    message: string,
    data?: object,
    expiresAt?: Date
  ) {
    const notification = await notificationRepository.create({
      userId,
      type,
      category,
      title,
      message,
      data,
      expiresAt,
    });

    socketService.emitNotification(userId, notification.toJSON());
    return notification;
  }

  /**
   * Bulk-send the same notification to multiple users.
   */
  async sendToMany(
    userIds: number[],
    type: NotificationCreationAttributes['type'],
    category: NotificationCreationAttributes['category'],
    title: string,
    message: string,
    data?: object
  ) {
    const records: NotificationCreationAttributes[] = userIds.map((userId) => ({
      userId,
      type,
      category,
      title,
      message,
      data,
    }));

    const notifications = await notificationRepository.bulkCreate(records);

    notifications.forEach((n) => socketService.emitNotification(n.userId, n.toJSON()));

    return notifications;
  }

  /**
   * Get paginated notifications for a user.
   */
  async getUserNotifications(
    userId: number,
    filters: Omit<NotificationFilters, 'userId'> = {},
    options: NotificationPaginationOptions = {}
  ) {
    return notificationRepository.findByUser({ ...filters, userId }, options);
  }

  /**
   * Get unread notification count for navbar badge.
   */
  async getUnreadCount(userId: number, category?: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId, category);
  }

  /**
   * Mark a single notification as read (with ownership check).
   */
  async markAsRead(notificationId: number, userId: number) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) return null;
    if (notification.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
    return notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: number, category?: string): Promise<number> {
    return notificationRepository.markAllAsRead(userId, category);
  }

  /**
   * Delete a notification (with ownership check).
   */
  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) return false;
    if (notification.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
    return notificationRepository.delete(notificationId);
  }

  /**
   * Cleanup job: delete expired and old read notifications.
   */
  async cleanup() {
    try {
      const expired = await notificationRepository.deleteExpired();
      const old = await notificationRepository.deleteOldNotifications(90);
      logger.info(`Notification cleanup: removed ${expired} expired, ${old} old notifications`);
    } catch (err) {
      logger.error('Notification cleanup error:', err);
    }
  }
}

export const notificationService = new NotificationService();
