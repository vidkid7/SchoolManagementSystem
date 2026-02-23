import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create staff_documents table
 * Requirements: 4.5
 * 
 * This migration creates the staff_documents table to store staff documents
 * with versioning support and category organization.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('staff_documents', {
    document_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    staff_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'staff',
        key: 'staff_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    category: {
      type: DataTypes.ENUM(
        'certificate',
        'contract',
        'id_proof',
        'qualification',
        'experience',
        'medical',
        'other'
      ),
      allowNull: false,
      comment: 'Document category: certificate, contract, id_proof, etc.'
    },
    document_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'User-friendly document name'
    },
    original_file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Original uploaded file name'
    },
    document_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Relative URL path to the document'
    },
    file_size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'File size in bytes'
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'MIME type of the document'
    },
    version: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: 'Document version number'
    },
    is_latest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Flag indicating if this is the latest version'
    },
    uploaded_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'User ID who uploaded the document'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional description or notes about the document'
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Document expiry date (for contracts, licenses, etc.)'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create indexes for better query performance
  await queryInterface.addIndex('staff_documents', ['staff_id'], {
    name: 'idx_staff_documents_staff_id'
  });

  await queryInterface.addIndex('staff_documents', ['category'], {
    name: 'idx_staff_documents_category'
  });

  await queryInterface.addIndex('staff_documents', ['is_latest'], {
    name: 'idx_staff_documents_is_latest'
  });

  await queryInterface.addIndex('staff_documents', ['staff_id', 'category', 'is_latest'], {
    name: 'idx_staff_documents_staff_category_latest'
  });

  await queryInterface.addIndex('staff_documents', ['expiry_date'], {
    name: 'idx_staff_documents_expiry_date'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('staff_documents');
}
