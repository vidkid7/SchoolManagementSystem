/**
 * Migration: Create certificates table
 * 
 * Creates table for storing generated certificates with PDF URLs and QR codes
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('certificates', {
    certificate_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    certificate_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    template_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'certificate_templates',
        key: 'template_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    type: {
      type: DataTypes.ENUM(
        'character',
        'transfer',
        'academic_excellence',
        'eca',
        'sports',
        'course_completion',
        'bonafide',
        'conduct',
        'participation'
      ),
      allowNull: false,
    },
    issued_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    issued_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    pdf_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    issued_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    verification_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'revoked'),
      allowNull: false,
      defaultValue: 'active',
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revoked_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    revoked_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
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
  await queryInterface.addIndex('certificates', ['certificate_number'], {
    name: 'idx_certificates_number',
    unique: true,
  });

  await queryInterface.addIndex('certificates', ['student_id'], {
    name: 'idx_certificates_student',
  });

  await queryInterface.addIndex('certificates', ['type'], {
    name: 'idx_certificates_type',
  });

  await queryInterface.addIndex('certificates', ['status'], {
    name: 'idx_certificates_status',
  });

  await queryInterface.addIndex('certificates', ['issued_date'], {
    name: 'idx_certificates_issued_date',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('certificates');
}
