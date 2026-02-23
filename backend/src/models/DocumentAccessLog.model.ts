/**
 * Document Access Log Model
 * 
 * Implements audit logging for document access events
 * 
 * Requirements: 27.4
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface DocumentAccessLogAttributes {
  accessLogId: number;
  documentId: number;
  userId: number;
  action: 'view' | 'download' | 'edit' | 'delete' | 'share' | 'upload' | 'preview';
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  createdAt?: Date;
}

export interface DocumentAccessLogCreationAttributes
  extends Optional<DocumentAccessLogAttributes, 'accessLogId' | 'success' | 'createdAt'> {}

export class DocumentAccessLog
  extends Model<DocumentAccessLogAttributes, DocumentAccessLogCreationAttributes>
  implements DocumentAccessLogAttributes
{
  public accessLogId!: number;
  public documentId!: number;
  public userId!: number;
  public action!: 'view' | 'download' | 'edit' | 'delete' | 'share' | 'upload' | 'preview';
  public ipAddress?: string;
  public userAgent?: string;
  public details?: Record<string, any>;
  public success!: boolean;
  public errorMessage?: string;
  public readonly createdAt!: Date;

  public toJSON(): object {
    return {
      accessLogId: this.accessLogId,
      documentId: this.documentId,
      userId: this.userId,
      action: this.action,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      details: this.details,
      success: this.success,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt,
    };
  }
}

export function initDocumentAccessLog(sequelize: any): typeof DocumentAccessLog {
  DocumentAccessLog.init(
    {
      accessLogId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      documentId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'document_id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      action: {
        type: DataTypes.ENUM('view', 'download', 'edit', 'delete', 'share', 'upload', 'preview'),
        allowNull: false,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      details: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'document_access_logs',
      timestamps: true,
      updatedAt: false, // Access logs are immutable
      underscored: true,
      indexes: [
        {
          name: 'idx_doc_access_log_document',
          fields: ['document_id'],
        },
        {
          name: 'idx_doc_access_log_user',
          fields: ['user_id'],
        },
        {
          name: 'idx_doc_access_log_action',
          fields: ['action'],
        },
        {
          name: 'idx_doc_access_log_created_at',
          fields: ['created_at'],
        },
        {
          name: 'idx_doc_access_log_document_action',
          fields: ['document_id', 'action'],
        },
        {
          name: 'idx_doc_access_log_user_action',
          fields: ['user_id', 'action'],
        },
      ],
    }
  );

  return DocumentAccessLog;
}

export default DocumentAccessLog;