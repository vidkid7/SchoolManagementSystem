/**
 * Migration: Create Certificate Templates Table
 * 
 * Creates database table for certificate template management
 * 
 * Requirements: 25.2
 */

import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.createTable('certificate_templates', {
    template_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'character',
        'transfer',
        'academic_excellence',
        'eca',
        'sports',
        'course_completion',
        'bonafide'
      ),
      allowNull: false,
    },
    template_html: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: '[]',
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

  // Create indexes
  await queryInterface.addIndex('certificate_templates', ['type'], {
    name: 'idx_certificate_templates_type',
  });

  await queryInterface.addIndex('certificate_templates', ['is_active'], {
    name: 'idx_certificate_templates_active',
  });

  await queryInterface.addIndex('certificate_templates', ['type', 'is_active'], {
    name: 'idx_certificate_templates_type_active',
  });
}

export async function down(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  await queryInterface.dropTable('certificate_templates');
}
