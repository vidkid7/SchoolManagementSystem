import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Add is_internal column to exams table
 * 
 * This migration adds support for internal assessment tracking
 * by adding an is_internal flag to distinguish internal assessments
 * from terminal exams.
 * 
 * Requirements: 7.11
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('exams', 'is_internal', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'True for internal assessments (25-50% weightage), false for terminal exams'
  });

  // Add index for filtering internal vs terminal exams
  await queryInterface.addIndex('exams', ['is_internal'], {
    name: 'idx_exams_is_internal'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('exams', 'idx_exams_is_internal');
  await queryInterface.removeColumn('exams', 'is_internal');
}
