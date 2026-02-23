import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Academic History Table
 * Creates academic_history table to maintain student promotion records
 * 
 * Requirements: 2.10
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('academic_history', {
    history_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Reference to student'
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Academic year for this record'
    },
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Class the student was in'
    },
    grade_level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Grade level (1-12)'
    },
    roll_number: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'Roll number in that class'
    },
    attendance_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Overall attendance percentage for the year'
    },
    gpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'GPA for the academic year'
    },
    total_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'Total marks obtained'
    },
    rank: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'Rank in class'
    },
    completion_status: {
      type: DataTypes.ENUM('completed', 'promoted', 'failed', 'transferred', 'dropped'),
      allowNull: false,
      defaultValue: 'completed',
      comment: 'Status of completion for this academic year'
    },
    promotion_eligible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether student was eligible for promotion'
    },
    promoted_to_class: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'Grade level promoted to (grade_level + 1)'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional remarks or notes'
    },
    promoted_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who performed the promotion'
    },
    promoted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of promotion'
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

  // Create indexes for academic_history
  await queryInterface.addIndex('academic_history', ['student_id'], {
    name: 'idx_academic_history_student_id'
  });

  await queryInterface.addIndex('academic_history', ['academic_year_id'], {
    name: 'idx_academic_history_academic_year_id'
  });

  await queryInterface.addIndex('academic_history', ['class_id'], {
    name: 'idx_academic_history_class_id'
  });

  await queryInterface.addIndex('academic_history', ['student_id', 'academic_year_id'], {
    unique: true,
    name: 'idx_academic_history_student_year_unique'
  });

  await queryInterface.addIndex('academic_history', ['completion_status'], {
    name: 'idx_academic_history_completion_status'
  });

  await queryInterface.addIndex('academic_history', ['promotion_eligible'], {
    name: 'idx_academic_history_promotion_eligible'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('academic_history');
}
