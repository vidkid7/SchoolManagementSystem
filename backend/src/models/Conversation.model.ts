/**
 * Conversation Model
 * 
 * Implements conversation entity for managing one-on-one messaging threads
 * 
 * Requirements: 24.1, 24.5
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

// Interface for conversation attributes
export interface ConversationAttributes {
  conversationId: number;
  participant1Id: number;
  participant2Id: number;
  lastMessageId?: number;
  lastMessageAt?: Date;
  unreadCountUser1: number;
  unreadCountUser2: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for creation attributes
export interface ConversationCreationAttributes 
  extends Optional<ConversationAttributes, 'conversationId' | 'unreadCountUser1' | 'unreadCountUser2'> {}

export class Conversation
  extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes
{
  public conversationId!: number;
  public participant1Id!: number;
  public participant2Id!: number;
  public lastMessageId?: number;
  public lastMessageAt?: Date;
  public unreadCountUser1!: number;
  public unreadCountUser2!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getUnreadCount(userId: number): number {
    if (userId === this.participant1Id) {
      return this.unreadCountUser1;
    } else if (userId === this.participant2Id) {
      return this.unreadCountUser2;
    }
    return 0;
  }

  public async incrementUnreadCount(userId: number): Promise<void> {
    if (userId === this.participant1Id) {
      this.unreadCountUser1 += 1;
    } else if (userId === this.participant2Id) {
      this.unreadCountUser2 += 1;
    }
    await this.save();
  }

  public async resetUnreadCount(userId: number): Promise<void> {
    if (userId === this.participant1Id) {
      this.unreadCountUser1 = 0;
    } else if (userId === this.participant2Id) {
      this.unreadCountUser2 = 0;
    }
    await this.save();
  }

  public async updateLastMessage(messageId: number, messageDate: Date): Promise<void> {
    this.lastMessageId = messageId;
    this.lastMessageAt = messageDate;
    await this.save();
  }

  public hasParticipant(userId: number): boolean {
    return userId === this.participant1Id || userId === this.participant2Id;
  }

  public getOtherParticipantId(userId: number): number | null {
    if (userId === this.participant1Id) {
      return this.participant2Id;
    } else if (userId === this.participant2Id) {
      return this.participant1Id;
    }
    return null;
  }

  public toJSON(): object {
    return {
      conversationId: this.conversationId,
      participant1Id: this.participant1Id,
      participant2Id: this.participant2Id,
      lastMessageId: this.lastMessageId,
      lastMessageAt: this.lastMessageAt,
      unreadCountUser1: this.unreadCountUser1,
      unreadCountUser2: this.unreadCountUser2,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

Conversation.init(
    {
      conversationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: 'conversation_id',
      },
      participant1Id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'participant1_id',
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      participant2Id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'participant2_id',
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      lastMessageId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'last_message_id',
        references: {
          model: 'messages',
          key: 'message_id',
        },
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_message_at',
      },
      unreadCountUser1: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: 'unread_count_user1',
      },
      unreadCountUser2: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: 'unread_count_user2',
      },
    },
    {
      sequelize,
      tableName: 'conversations',
      timestamps: true,
      indexes: [
        {
          name: 'idx_conversations_participant1',
          fields: ['participant1_id'],
        },
        {
          name: 'idx_conversations_participant2',
          fields: ['participant2_id'],
        },
        {
          name: 'idx_conversations_participants',
          fields: ['participant1_id', 'participant2_id'],
          unique: true,
        },
        {
          name: 'idx_conversations_last_message_at',
          fields: ['last_message_at'],
        },
      ],
    }
  );

export default Conversation;
