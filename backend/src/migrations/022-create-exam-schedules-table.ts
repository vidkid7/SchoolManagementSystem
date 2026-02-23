import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Exam Schedules Table
 * Creates exam_schedules table for scheduling exams with room assignments and invigilators
 * 
 * Requirements: 7.3, 7.4
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create exam_schedules table
  await queryInterface.createTable('exam_schedules', {
    exam_schedule_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    exam_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'exam_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'subject_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Exam date'
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: 'Exam start time'
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: 'Exam end time'
    },
    room_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Room/Hall number for exam'
    },
    invigilators: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of teacher IDs assigned as invigilators'
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

  // Create indexes for exam_schedules
  await queryInterface.addIndex('exam_schedules', ['exam_id'], {
    name: 'idx_exam_schedules_exam_id'
  });

  await queryInterface.addIndex('exam_schedules', ['subject_id'], {
    name: 'idx_exam_schedules_subject_id'
  });

  await queryInterface.addIndex('exam_schedules', ['date'], {
    name: 'idx_exam_schedules_date'
  });

  await queryInterface.addIndex('exam_schedules', ['room_number'], {
    name: 'idx_exam_schedules_room_number'
  });

  // Composite index for date and time queries
  await queryInterface.addIndex('exam_schedules', ['date', 'start_time'], {
    name: 'idx_exam_schedules_date_time'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('exam_schedules');
}
