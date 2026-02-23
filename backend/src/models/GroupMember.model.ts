/**
 * GroupMember Model
 * 
 * Implements group member entity for managing group membership
 * 
 * Requirements: 24.2, 24.9
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

// Interface for group member attributes
export interface GroupMemberAttributes {
  groupMemberId: number;
  groupConversationId: number;
  userId: number;
  role: 'admin' | 'member';
  unreadCount: number;
  lastReadAt?: Date;
  joinedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for creation attributes
export interface GroupMemberCreationAttributes 
  extends Optional<GroupMemberAttributes, 'groupMemberId' | 'role' | 'unreadCount' | 'joinedAt'> {}

export class GroupMember
  extends Model<GroupMemberAttributes, GroupMemberCreationAttributes>
  implements GroupMemberAttributes
{
  public groupMemberId!: number;
  public groupConversationId!: number;
  public userId!: number;
  public role!: 'admin' | 'member';
  public unreadCount!: number;
  public lastReadAt?: Date;
  public joinedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async incrementUnreadCount(): Promise<void> {
    this.unreadCount += 1;
    await this.save();
  }

  public async resetUnreadCount(): Promise<void> {
    this.unreadCount = 0;
    this.lastReadAt = new Date();
    await this.save();
  }

  public async promoteToAdmin(): Promise<void> {
    this.role = 'admin';
    await this.save();
  }

  public async demoteToMember(): Promise<void> {
    this.role = 'member';
    await this.save();
  }

  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public toJSON(): object {
    return {
      groupMemberId: this.groupMemberId,
      groupConversationId: this.groupConversationId,
      userId: this.userId,
      role: this.role,
      unreadCount: this.unreadCount,
      lastReadAt: this.lastReadAt,
      joinedAt: this.joinedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

GroupMember.init(
    {
      groupMemberId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: 'group_member_id',
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
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      unreadCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: 'unread_count',
      },
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_read_at',
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'joined_at',
      },
    },
    {
      sequelize,
      tableName: 'group_members',
      timestamps: true,
      indexes: [
        {
          name: 'idx_group_members_group_conversation_id',
          fields: ['group_conversation_id'],
        },
        {
          name: 'idx_group_members_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_group_members_group_user',
          fields: ['group_conversation_id', 'user_id'],
          unique: true,
        },
        {
          name: 'idx_group_members_role',
          fields: ['role'],
        },
      ],
    }
  );

export default GroupMember;
