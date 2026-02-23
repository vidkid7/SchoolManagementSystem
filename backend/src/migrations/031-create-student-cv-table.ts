/**
 * Migration: Create Student CV Table
 * 
 * Creates the student_cv table for CV customization and preferences
 * 
 * Requirements: 26.3, 26.4
 */

import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('student_cv', {
      cv_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'student_id'
        },
        onDelete: 'CASCADE'
      },
      show_personal_info: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      show_academic_performance: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      show_attendance: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      show_eca: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      show_sports: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      show_certificates: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      show_awards: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      show_teacher_remarks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      skills: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]'
      },
      hobbies: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]'
      },
      career_goals: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      },
      personal_statement: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      },
      template_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'standard'
      },
      school_branding_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      last_generated_at: {
        type: DataTypes.DATE,
        allowNull: true
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
      }
    });

    // Add unique index on student_id
    await queryInterface.addIndex('student_cv', ['student_id'], {
      unique: true,
      name: 'student_cv_student_id_unique'
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('student_cv');
  }
};