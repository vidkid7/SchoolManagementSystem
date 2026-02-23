/**
 * Notification Model
 * 
 * Implements notification entity for in-app notifications
 * 
 * Requirements: 22.1, 22.4, 22.5
 */

import { DataTypes, Model, Optional } from 'sequelize';

// Interface for notification attributes
export interface NotificationAttributes {
  notificationId: number;
  userId: number;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library' | 'general';
  title: string;
  message: string;
  data?: object;
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for creation attributes
export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'notificationId' | 'isRead'> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public notificationId!: number;
  public userId!: number;
  public type!: 'info' | 'warning' | 'success' | 'error';
  public category!: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library' | 'general';
  public title!: string;
  public message!: string;
  public data?: object;
  public isRead!: boolean;
  public readAt?: Date;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async markAsRead(): Promise<void> {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }

  public async markAsUnread(): Promise<void> {
    this.isRead = false;
    this.readAt = undefined;
    await this.save();
  }

  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  public isUnread(): boolean {
    return !this.isRead && !this.isExpired();
  }

  public toJSON(): object {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      type: this.type,
      category: this.category,
      title: this.title,
      message: this.message,
      data: this.data,
      isRead: this.isRead,
      readAt: this.readAt,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };
  }
}

// Initialize Notification model
export function initNotification(sequelize: any): typeof Notification {
  Notification.init(
    {
      notificationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      type: {
        type: DataTypes.ENUM('info', 'warning', 'success', 'error'),
        allowNull: false,
        defaultValue: 'info',
      },
      category: {
        type: DataTypes.ENUM('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general'),
        allowNull: false,
        defaultValue: 'general',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      data: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        {
          name: 'idx_notifications_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_notifications_user_read',
          fields: ['user_id', 'is_read'],
        },
        {
          name: 'idx_notifications_category',
          fields: ['category'],
        },
        {
          name: 'idx_notifications_created_at',
          fields: ['created_at'],
        },
      ],
    }
  );

  return Notification;
}

export default Notification;
