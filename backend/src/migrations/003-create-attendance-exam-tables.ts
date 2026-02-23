import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Attendance and Exam Tables
 * Creates attendance and exams tables with composite indexes
 * 
 * Requirements: 40.1, 40.2, 40.3, 40.8
 */

// eslint-disable-next-line max-lines-per-function
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create attendance table
  await queryInterface.createTable('attendance', {
    attendance_id: {
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
      onDelete: 'CASCADE'
    },
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Attendance date'
    },
    date_bs: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Date in Bikram Sambat format'
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
      allowNull: false,
      defaultValue: 'present'
    },
    period_number: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'For period-wise attendance'
    },
    marked_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Teacher who marked attendance'
    },
    marked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sync_status: {
      type: DataTypes.ENUM('synced', 'pending', 'error'),
      allowNull: false,
      defaultValue: 'synced',
      comment: 'For offline sync support'
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

  // Create exams table
  await queryInterface.createTable('exams', {
    exam_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('unit_test', 'first_terminal', 'second_terminal', 'final', 'practical', 'project'),
      allowNull: false
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
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    term_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'terms',
        key: 'term_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    exam_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Duration in minutes'
    },
    full_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 100
    },
    pass_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 35
    },
    theory_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 75
    },
    practical_marks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 25
    },
    weightage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100.00,
      comment: 'Percentage for final grade calculation'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
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

  // Create grades table
  await queryInterface.createTable('grades', {
    grade_id: {
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
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    theory_marks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    practical_marks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    total_marks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    grade: {
      type: DataTypes.ENUM('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG'),
      allowNull: false,
      comment: 'NEB grade'
    },
    grade_point: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      comment: 'Grade point as per NEB (0.0 to 4.0)'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    entered_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Teacher who entered the grade'
    },
    entered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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

  // Create composite index on attendance (student_id, date) for performance
  await queryInterface.addIndex('attendance', ['student_id', 'date'], {
    name: 'idx_attendance_student_date'
  });

  // Create additional indexes for attendance
  await queryInterface.addIndex('attendance', ['class_id'], {
    name: 'idx_attendance_class_id'
  });

  await queryInterface.addIndex('attendance', ['date'], {
    name: 'idx_attendance_date'
  });

  await queryInterface.addIndex('attendance', ['status'], {
    name: 'idx_attendance_status'
  });

  await queryInterface.addIndex('attendance', ['marked_by'], {
    name: 'idx_attendance_marked_by'
  });

  await queryInterface.addIndex('attendance', ['sync_status'], {
    name: 'idx_attendance_sync_status'
  });

  // Create composite index on exams (class_id, subject_id) for performance
  await queryInterface.addIndex('exams', ['class_id', 'subject_id'], {
    name: 'idx_exams_class_subject'
  });

  // Create additional indexes for exams
  await queryInterface.addIndex('exams', ['subject_id'], {
    name: 'idx_exams_subject_id'
  });

  await queryInterface.addIndex('exams', ['academic_year_id'], {
    name: 'idx_exams_academic_year_id'
  });

  await queryInterface.addIndex('exams', ['term_id'], {
    name: 'idx_exams_term_id'
  });

  await queryInterface.addIndex('exams', ['type'], {
    name: 'idx_exams_type'
  });

  await queryInterface.addIndex('exams', ['status'], {
    name: 'idx_exams_status'
  });

  await queryInterface.addIndex('exams', ['exam_date'], {
    name: 'idx_exams_exam_date'
  });

  // Create indexes for grades
  await queryInterface.addIndex('grades', ['exam_id'], {
    name: 'idx_grades_exam_id'
  });

  await queryInterface.addIndex('grades', ['student_id'], {
    name: 'idx_grades_student_id'
  });

  await queryInterface.addIndex('grades', ['grade'], {
    name: 'idx_grades_grade'
  });

  await queryInterface.addIndex('grades', ['entered_by'], {
    name: 'idx_grades_entered_by'
  });

  // Create unique constraint to prevent duplicate grades for same student and exam
  await queryInterface.addIndex('grades', ['exam_id', 'student_id'], {
    unique: true,
    name: 'idx_grades_exam_student_unique'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await queryInterface.dropTable('grades');
  await queryInterface.dropTable('exams');
  await queryInterface.dropTable('attendance');
}
