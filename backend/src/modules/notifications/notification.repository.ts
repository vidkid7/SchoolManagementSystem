/**
 * Notification Repository
 * 
 * Database operations for notifications
 */

import { Op } from 'sequelize';
import { Notification, NotificationCreationAttributes } from '../../models/Notification.model';

export interface NotificationFilters {
  userId: number;
  category?: string;
  type?: string;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationPaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'title';
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(data: NotificationCreationAttributes): Promise<Notification> {
    return Notification.create(data);
  }

  /**
   * Find notification by ID
   */
  async findById(notificationId: number): Promise<Notification | null> {
    return Notification.findByPk(notificationId);
  }

  /**
   * Find notifications by user with filters and pagination
   */
  async findByUser(
    filters: NotificationFilters,
    options: NotificationPaginationOptions = {}
  ): Promise<PaginatedNotifications> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'createdAt',
      orderDirection = 'DESC',
    } = options;

    const whereClause: any = { userId: filters.userId };

    if (filters.category) {
      whereClause.category = filters.category;
    }
    if (filters.type) {
      whereClause.type = filters.type;
    }
    if (filters.isRead !== undefined) {
      whereClause.isRead = filters.isRead;
    }
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt[Op.lte] = filters.endDate;
      }
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      order: [[orderBy, orderDirection]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      notifications: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: number, category?: string): Promise<number> {
    const whereClause: any = {
      userId,
      isRead: false,
    };

    if (category) {
      whereClause.category = category;
    }

    // Exclude expired notifications
    whereClause[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } },
    ];

    return Notification.count({ where: whereClause });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<Notification | null> {
    const notification = await Notification.findByPk(notificationId);
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }
    return notification;
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: number, category?: string): Promise<number> {
    const whereClause: any = {
      userId,
      isRead: false,
    };

    if (category) {
      whereClause.category = category;
    }

    const [count] = await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      { where: whereClause }
    );

    return count;
  }

  /**
   * Delete notification
   */
  async delete(notificationId: number): Promise<boolean> {
    const deleted = await Notification.destroy({
      where: { notificationId },
    });
    return deleted > 0;
  }

  /**
   * Delete expired notifications
   */
  async deleteExpired(): Promise<number> {
    return Notification.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });
  }

  /**
   * Delete old notifications for cleanup
   */
  async deleteOldNotifications(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return Notification.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate },
        isRead: true,
      },
    });
  }

  /**
   * Bulk create notifications
   */
  async bulkCreate(data: NotificationCreationAttributes[]): Promise<Notification[]> {
    return Notification.bulkCreate(data);
  }

  /**
   * Find unread notifications for real-time updates
   */
  async findUnreadForRealtime(userId: number): Promise<Notification[]> {
    return Notification.findAll({
      where: {
        userId,
        isRead: false,
        [Op.or]: [
          { expiresAt: { [Op.is]: null } } as any,
          { expiresAt: { [Op.gt]: new Date() } },
        ],
      } as any,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }
}

export const notificationRepository = new NotificationRepository();
