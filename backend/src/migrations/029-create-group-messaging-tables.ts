/**
 * Migration: Create group messaging tables
 * 
 * Creates group_conversations, group_members, and group_messages tables
 * for class-based groups and announcement channels
 * 
 * Requirements: 24.2, 24.8, 24.9
 */

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create group_conversations table
  await queryInterface.createTable('group_conversations', {
    group_conversation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Group name (e.g., "Class 10-A Morning", "Teachers Announcement")',
    },
    type: {
      type: DataTypes.ENUM('class', 'announcement', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
      comment: 'Type of group conversation',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'class_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'For class-based groups',
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    is_announcement_only: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'If true, only admins/teachers can post',
    },
    last_message_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

  // Create indexes for group_conversations
  await queryInterface.addIndex('group_conversations', ['type'], {
    name: 'idx_group_conversations_type',
  });

  await queryInterface.addIndex('group_conversations', ['class_id'], {
    name: 'idx_group_conversations_class_id',
  });

  await queryInterface.addIndex('group_conversations', ['created_by'], {
    name: 'idx_group_conversations_created_by',
  });

  await queryInterface.addIndex('group_conversations', ['is_active'], {
    name: 'idx_group_conversations_is_active',
  });

  await queryInterface.addIndex('group_conversations', ['last_message_at'], {
    name: 'idx_group_conversations_last_message_at',
  });

  // Create group_members table
  await queryInterface.createTable('group_members', {
    group_member_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    group_conversation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'group_conversations',
        key: 'group_conversation_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      allowNull: false,
      defaultValue: 'member',
      comment: 'Admin can post in announcement-only groups',
    },
    unread_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    last_read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    joined_at: {
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

  // Create indexes for group_members
  await queryInterface.addIndex('group_members', ['group_conversation_id'], {
    name: 'idx_group_members_group_conversation_id',
  });

  await queryInterface.addIndex('group_members', ['user_id'], {
    name: 'idx_group_members_user_id',
  });

  await queryInterface.addIndex('group_members', ['group_conversation_id', 'user_id'], {
    name: 'idx_group_members_group_user',
    unique: true,
  });

  await queryInterface.addIndex('group_members', ['role'], {
    name: 'idx_group_members_role',
  });

  // Create group_messages table
  await queryInterface.createTable('group_messages', {
    group_message_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    group_conversation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'group_conversations',
        key: 'group_conversation_id',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSON,
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

  // Create indexes for group_messages
  await queryInterface.addIndex('group_messages', ['group_conversation_id'], {
    name: 'idx_group_messages_group_conversation_id',
  });

  await queryInterface.addIndex('group_messages', ['sender_id'], {
    name: 'idx_group_messages_sender_id',
  });

  await queryInterface.addIndex('group_messages', ['sent_at'], {
    name: 'idx_group_messages_sent_at',
  });

  // Add foreign key constraint for last_message_id after group_messages table is created
  await queryInterface.addConstraint('group_conversations', {
    fields: ['last_message_id'],
    type: 'foreign key',
    name: 'fk_group_conversations_last_message',
    references: {
      table: 'group_messages',
      field: 'group_message_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove foreign key constraint first
  await queryInterface.removeConstraint('group_conversations', 'fk_group_conversations_last_message');

  // Drop tables in reverse order
  await queryInterface.dropTable('group_messages');
  await queryInterface.dropTable('group_members');
  await queryInterface.dropTable('group_conversations');
}
