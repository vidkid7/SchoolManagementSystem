/**
 * Message Model
 * 
 * Implements message entity for one-on-one messaging
 * 
 * Requirements: 24.1, 24.5
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

// Interface for message attributes
export interface MessageAttributes {
  messageId: number;
  conversationId: number;
  senderId: number;
  recipientId: number;
  content: string;
  attachments?: object[];
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for creation attributes
export interface MessageCreationAttributes 
  extends Optional<MessageAttributes, 'messageId' | 'isRead' | 'sentAt'> {}

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  declare public messageId: number;
  declare public conversationId: number;
  declare public senderId: number;
  declare public recipientId: number;
  declare public content: string;
  declare public attachments?: object[];
  declare public isRead: boolean;
  declare public readAt?: Date;
  declare public sentAt: Date;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  // Instance methods
  public async markAsRead(): Promise<void> {
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
      await this.save();
    }
  }

  public toJSON(): object {
    return {
      messageId: this.messageId,
      conversationId: this.conversationId,
      senderId: this.senderId,
      recipientId: this.recipientId,
      content: this.content,
      attachments: this.attachments,
      isRead: this.isRead,
      readAt: this.readAt,
      sentAt: this.sentAt,
      createdAt: this.createdAt,
    };
  }
}

Message.init(
    {
      messageId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: 'message_id',
      },
      conversationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'conversation_id',
        references: {
          model: 'conversations',
          key: 'conversation_id',
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
      recipientId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'recipient_id',
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
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'read_at',
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
      tableName: 'messages',
      timestamps: true,
      indexes: [
        {
          name: 'idx_messages_conversation_id',
          fields: ['conversation_id'],
        },
        {
          name: 'idx_messages_sender_id',
          fields: ['sender_id'],
        },
        {
          name: 'idx_messages_recipient_id',
          fields: ['recipient_id'],
        },
        {
          name: 'idx_messages_sent_at',
          fields: ['sent_at'],
        },
        {
          name: 'idx_messages_is_read',
          fields: ['is_read'],
        },
      ],
    }
  );

export default Message;
