import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Timetable and Period Tables
 * Creates timetables, periods, syllabi, and syllabus_topics tables
 * with proper foreign keys, indexes, and audit columns
 * 
 * Requirements: 5.6, 5.7, 5.8, 5.9
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create timetables table
  await queryInterface.createTable('timetables', {
    timetable_id: {
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
      onDelete: 'CASCADE'
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '0-6 (Sunday-Saturday)'
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

  // Create periods table
  await queryInterface.createTable('periods', {
    period_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    timetable_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'timetables',
        key: 'timetable_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    period_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Period sequence number (1, 2, 3, etc.)'
    },
    start_time: {
      type: DataTypes.STRING(5),
      allowNull: false,
      comment: 'HH:mm format (e.g., 09:00)'
    },
    end_time: {
      type: DataTypes.STRING(5),
      allowNull: false,
      comment: 'HH:mm format (e.g., 09:45)'
    },
    subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'subjects',
        key: 'subject_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'staff',
        key: 'staff_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Classroom or lab number'
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

  // Create syllabi table
  await queryInterface.createTable('syllabi', {
    syllabus_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    subject_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'subject_id'
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
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    completed_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Overall syllabus completion percentage (0-100)'
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

  // Create syllabus_topics table
  await queryInterface.createTable('syllabus_topics', {
    topic_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    syllabus_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'syllabi',
        key: 'syllabus_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Topic title'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed topic description'
    },
    estimated_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: 'Estimated teaching hours for this topic'
    },
    completed_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Actual completed teaching hours'
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'not_started'
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

  // Create indexes for timetables
  await queryInterface.addIndex('timetables', ['class_id', 'academic_year_id', 'day_of_week'], {
    unique: true,
    name: 'idx_timetables_class_year_day'
  });

  await queryInterface.addIndex('timetables', ['academic_year_id'], {
    name: 'idx_timetables_academic_year_id'
  });

  // Create indexes for periods
  await queryInterface.addIndex('periods', ['timetable_id', 'period_number'], {
    unique: true,
    name: 'idx_periods_timetable_period'
  });

  await queryInterface.addIndex('periods', ['teacher_id'], {
    name: 'idx_periods_teacher_id'
  });

  await queryInterface.addIndex('periods', ['subject_id'], {
    name: 'idx_periods_subject_id'
  });

  // Create indexes for syllabi
  await queryInterface.addIndex('syllabi', ['subject_id', 'class_id', 'academic_year_id'], {
    unique: true,
    name: 'idx_syllabi_subject_class_year'
  });

  await queryInterface.addIndex('syllabi', ['class_id'], {
    name: 'idx_syllabi_class_id'
  });

  // Create indexes for syllabus_topics
  await queryInterface.addIndex('syllabus_topics', ['syllabus_id'], {
    name: 'idx_syllabus_topics_syllabus_id'
  });

  await queryInterface.addIndex('syllabus_topics', ['status'], {
    name: 'idx_syllabus_topics_status'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await queryInterface.dropTable('syllabus_topics');
  await queryInterface.dropTable('syllabi');
  await queryInterface.dropTable('periods');
  await queryInterface.dropTable('timetables');
}
