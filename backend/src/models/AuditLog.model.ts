import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Audit Log Model
 * Tracks all create, update, delete operations with field-level change history
 * Requirements: 2.9, 38.1, 38.2, 38.6
 */

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RESTORE = 'restore'
}

export interface AuditLogAttributes {
  auditLogId: number;
  userId: number | null;
  entityType: string;
  entityId: number;
  action: AuditAction;
  oldValue: unknown | null;
  newValue: unknown | null;
  changedFields: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
  createdAt: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 
  'auditLogId' | 'userId' | 'oldValue' | 'newValue' | 'changedFields' | 
  'ipAddress' | 'userAgent' | 'metadata' | 'timestamp' | 'createdAt'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> 
  implements AuditLogAttributes {
  declare auditLogId: number;
  declare userId: number | null;
  declare entityType: string;
  declare entityId: number;
  declare action: AuditAction;
  declare oldValue: unknown | null;
  declare newValue: unknown | null;
  declare changedFields: string[] | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare metadata: Record<string, unknown> | null;
  declare timestamp: Date;
  declare createdAt: Date;
}

AuditLog.init(
  {
    auditLogId: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'audit_log_id'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'user_id'
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'entity_type'
    },
    entityId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'entity_id'
    },
    action: {
      type: DataTypes.ENUM(...Object.values(AuditAction)),
      allowNull: false
    },
    oldValue: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'old_value'
    },
    newValue: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'new_value'
    },
    changedFields: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'changed_fields'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false, // We manage timestamp manually
    underscored: true
  }
);

export default AuditLog;
