import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Audit Logs Table
 * Creates audit_logs table for tracking all create, update, delete operations
 * with field-level change history and 1-year retention policy
 * 
 * Requirements: 2.9, 38.1, 38.2, 38.6
 */

// eslint-disable-next-line max-lines-per-function
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('audit_logs', {
    audit_log_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: 'Unique identifier for audit log entry'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who performed the action'
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of entity (e.g., student, staff, user, etc.)'
    },
    entity_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'ID of the entity being modified'
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'restore'),
      allowNull: false,
      comment: 'Type of action performed'
    },
    old_value: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Previous state of the entity (null for create)'
    },
    new_value: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'New state of the entity (null for delete)'
    },
    changed_fields: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of field names that were changed (for update actions)'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of the user (supports IPv4 and IPv6)'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string from the request'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional context data (e.g., request ID, session ID)'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the action was performed'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Create indexes for efficient querying
  await queryInterface.addIndex('audit_logs', ['user_id'], {
    name: 'idx_audit_logs_user_id'
  });

  await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], {
    name: 'idx_audit_logs_entity'
  });

  await queryInterface.addIndex('audit_logs', ['action'], {
    name: 'idx_audit_logs_action'
  });

  await queryInterface.addIndex('audit_logs', ['timestamp'], {
    name: 'idx_audit_logs_timestamp'
  });

  // Composite index for common query patterns
  await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id', 'timestamp'], {
    name: 'idx_audit_logs_entity_timestamp'
  });

  await queryInterface.addIndex('audit_logs', ['user_id', 'timestamp'], {
    name: 'idx_audit_logs_user_timestamp'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('audit_logs');
}
