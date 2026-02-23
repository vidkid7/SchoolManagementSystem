/**
 * GroupConversation Model
 * 
 * Implements group conversation entity for class-based groups and announcement channels
 * 
 * Requirements: 24.2, 24.8, 24.9
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

// Interface for group conversation attributes
export interface GroupConversationAttributes {
  groupConversationId: number;
  name: string;
  type: 'class' | 'announcement' | 'custom';
  description?: string;
  classId?: number;
  createdBy: number;
  isAnnouncementOnly: boolean;
  lastMessageId?: number;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for creation attributes
export interface GroupConversationCreationAttributes 
  extends Optional<GroupConversationAttributes, 'groupConversationId' | 'isAnnouncementOnly' | 'isActive'> {}

export class GroupConversation
  extends Model<GroupConversationAttributes, GroupConversationCreationAttributes>
  implements GroupConversationAttributes
{
  public groupConversationId!: number;
  public name!: string;
  public type!: 'class' | 'announcement' | 'custom';
  public description?: string;
  public classId?: number;
  public createdBy!: number;
  public isAnnouncementOnly!: boolean;
  public lastMessageId?: number;
  public lastMessageAt?: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async updateLastMessage(messageId: number, messageDate: Date): Promise<void> {
    this.lastMessageId = messageId;
    this.lastMessageAt = messageDate;
    await this.save();
  }

  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  public async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
  }

  public toJSON(): object {
    return {
      groupConversationId: this.groupConversationId,
      name: this.name,
      type: this.type,
      description: this.description,
      classId: this.classId,
      createdBy: this.createdBy,
      isAnnouncementOnly: this.isAnnouncementOnly,
      lastMessageId: this.lastMessageId,
      lastMessageAt: this.lastMessageAt,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

GroupConversation.init(
    {
      groupConversationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: 'group_conversation_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('class', 'announcement', 'custom'),
        allowNull: false,
        defaultValue: 'custom',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      classId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'class_id',
        references: {
          model: 'classes',
          key: 'class_id',
        },
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      isAnnouncementOnly: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_announcement_only',
      },
      lastMessageId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'last_message_id',
        references: {
          model: 'group_messages',
          key: 'group_message_id',
        },
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_message_at',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      tableName: 'group_conversations',
      timestamps: true,
      indexes: [
        {
          name: 'idx_group_conversations_type',
          fields: ['type'],
        },
        {
          name: 'idx_group_conversations_class_id',
          fields: ['class_id'],
        },
        {
          name: 'idx_group_conversations_created_by',
          fields: ['created_by'],
        },
        {
          name: 'idx_group_conversations_is_active',
          fields: ['is_active'],
        },
        {
          name: 'idx_group_conversations_last_message_at',
          fields: ['last_message_at'],
        },
      ],
    }
  );

export default GroupConversation;
