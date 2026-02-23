/**
 * Migration: Create messaging tables
 * 
 * Creates conversations and messages tables for one-on-one messaging
 * 
 * Requirements: 24.1, 24.5
 */

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create conversations table
  await queryInterface.createTable('conversations', {
    conversation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    participant1_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    participant2_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    last_message_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unread_count_user1: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    unread_count_user2: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create indexes for conversations
  await queryInterface.addIndex('conversations', ['participant1_id'], {
    name: 'idx_conversations_participant1',
  });

  await queryInterface.addIndex('conversations', ['participant2_id'], {
    name: 'idx_conversations_participant2',
  });

  await queryInterface.addIndex('conversations', ['participant1_id', 'participant2_id'], {
    name: 'idx_conversations_participants',
    unique: true,
  });

  await queryInterface.addIndex('conversations', ['last_message_at'], {
    name: 'idx_conversations_last_message_at',
  });

  // Create messages table
  await queryInterface.createTable('messages', {
    message_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'conversation_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    sender_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    recipient_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create indexes for messages
  await queryInterface.addIndex('messages', ['conversation_id'], {
    name: 'idx_messages_conversation_id',
  });

  await queryInterface.addIndex('messages', ['sender_id'], {
    name: 'idx_messages_sender_id',
  });

  await queryInterface.addIndex('messages', ['recipient_id'], {
    name: 'idx_messages_recipient_id',
  });

  await queryInterface.addIndex('messages', ['sent_at'], {
    name: 'idx_messages_sent_at',
  });

  await queryInterface.addIndex('messages', ['is_read'], {
    name: 'idx_messages_is_read',
  });

  // Add foreign key constraint for last_message_id after messages table is created
  await queryInterface.addConstraint('conversations', {
    fields: ['last_message_id'],
    type: 'foreign key',
    name: 'fk_conversations_last_message',
    references: {
      table: 'messages',
      field: 'message_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove foreign key constraint first
  await queryInterface.removeConstraint('conversations', 'fk_conversations_last_message');

  // Drop messages table
  await queryInterface.dropTable('messages');

  // Drop conversations table
  await queryInterface.dropTable('conversations');
}
