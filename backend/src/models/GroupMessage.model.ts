/**
 * GroupMessage Model
 * 
 * Implements group message entity for group messaging
 * 
 * Requirements: 24.2, 24.8
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

// Interface for group message attributes
export interface GroupMessageAttributes {
  groupMessageId: number;
  groupConversationId: number;
  senderId: number;
  content: string;
  attachments?: object[];
  sentAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for creation attributes
export interface GroupMessageCreationAttributes 
  extends Optional<GroupMessageAttributes, 'groupMessageId' | 'sentAt'> {}

export class GroupMessage
  extends Model<GroupMessageAttributes, GroupMessageCreationAttributes>
  implements GroupMessageAttributes
{
  public groupMessageId!: number;
  public groupConversationId!: number;
  public senderId!: number;
  public content!: string;
  public attachments?: object[];
  public sentAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public toJSON(): object {
    return {
      groupMessageId: this.groupMessageId,
      groupConversationId: this.groupConversationId,
      senderId: this.senderId,
      content: this.content,
      attachments: this.attachments,
      sentAt: this.sentAt,
      createdAt: this.createdAt,
    };
  }
}

GroupMessage.init(
    {
      groupMessageId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: 'group_message_id',
      },
      groupConversationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'group_conversation_id',
        references: {
          model: 'group_conversations',
          key: 'group_conversation_id',
        },
      },
      senderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'sender_id',
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'sent_at',
      },
    },
    {
      sequelize,
      tableName: 'group_messages',
      timestamps: true,
      indexes: [
        {
          name: 'idx_group_messages_group_conversation_id',
          fields: ['group_conversation_id'],
        },
        {
          name: 'idx_group_messages_sender_id',
          fields: ['sender_id'],
        },
        {
          name: 'idx_group_messages_sent_at',
          fields: ['sent_at'],
        },
      ],
    }
  );

export default GroupMessage;
