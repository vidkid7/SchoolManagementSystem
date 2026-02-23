/**
 * Migration: Create documents table
 * 
 * Creates table for storing documents with versioning, categorization, and access control
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8
 */

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('documents', {
    document_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    document_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(
        'academic',
        'administrative',
        'financial',
        'student_record',
        'staff_record',
        'curriculum',
        'exam',
        'other'
      ),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    compressed_size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    storage_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    thumbnail_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    parent_document_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'documents',
        key: 'document_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    uploaded_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    access_level: {
      type: DataTypes.ENUM('private', 'restricted', 'public'),
      allowNull: false,
      defaultValue: 'private',
    },
    allowed_roles: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    allowed_user_ids: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_compressed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    compression_ratio: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
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

  // Create indexes
  await queryInterface.addIndex('documents', ['document_number'], {
    name: 'idx_documents_number',
    unique: true,
  });

  await queryInterface.addIndex('documents', ['name'], {
    name: 'idx_documents_name',
  });

  await queryInterface.addIndex('documents', ['category'], {
    name: 'idx_documents_category',
  });

  await queryInterface.addIndex('documents', ['uploaded_by'], {
    name: 'idx_documents_uploaded_by',
  });

  await queryInterface.addIndex('documents', ['status'], {
    name: 'idx_documents_status',
  });

  await queryInterface.addIndex('documents', ['access_level'], {
    name: 'idx_documents_access_level',
  });

  await queryInterface.addIndex('documents', ['created_at'], {
    name: 'idx_documents_created_at',
  });

  await queryInterface.addIndex('documents', ['parent_document_id'], {
    name: 'idx_documents_parent',
  });

  // Create document access logs table
  await queryInterface.createTable('document_access_logs', {
    access_log_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    document_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'documents',
        key: 'document_id',
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
      onDelete: 'RESTRICT',
    },
    action: {
      type: DataTypes.ENUM('view', 'download', 'edit', 'delete', 'share', 'upload', 'preview'),
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
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
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create indexes for access logs
  await queryInterface.addIndex('document_access_logs', ['document_id'], {
    name: 'idx_doc_access_log_document',
  });

  await queryInterface.addIndex('document_access_logs', ['user_id'], {
    name: 'idx_doc_access_log_user',
  });

  await queryInterface.addIndex('document_access_logs', ['action'], {
    name: 'idx_doc_access_log_action',
  });

  await queryInterface.addIndex('document_access_logs', ['created_at'], {
    name: 'idx_doc_access_log_created_at',
  });

  await queryInterface.addIndex('document_access_logs', ['document_id', 'action'], {
    name: 'idx_doc_access_log_document_action',
  });

  await queryInterface.addIndex('document_access_logs', ['user_id', 'action'], {
    name: 'idx_doc_access_log_user_action',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('document_access_logs');
  await queryInterface.dropTable('documents');
}