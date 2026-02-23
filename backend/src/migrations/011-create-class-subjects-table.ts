import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Class Subjects Junction Table
 * Creates class_subjects table for class-subject-teacher assignments
 * 
 * Requirements: 5.5, N2.1-N2.7
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create class_subjects junction table
  await queryInterface.createTable('class_subjects', {
    class_subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Reference to classes table'
    },
    subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'subject_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Reference to subjects table'
    },
    teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'staff',
        key: 'staff_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Optional teacher assignment for this subject in this class'
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

  // Create unique constraint to prevent duplicate class-subject assignments
  await queryInterface.addIndex('class_subjects', ['class_id', 'subject_id'], {
    unique: true,
    name: 'idx_class_subjects_unique'
  });

  // Create index on class_id for faster lookups
  await queryInterface.addIndex('class_subjects', ['class_id'], {
    name: 'idx_class_subjects_class_id'
  });

  // Create index on subject_id for faster lookups
  await queryInterface.addIndex('class_subjects', ['subject_id'], {
    name: 'idx_class_subjects_subject_id'
  });

  // Create index on teacher_id for faster lookups
  await queryInterface.addIndex('class_subjects', ['teacher_id'], {
    name: 'idx_class_subjects_teacher_id'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('class_subjects');
}
