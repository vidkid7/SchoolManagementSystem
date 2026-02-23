import { DataTypes, Model } from 'sequelize';
import sequelize from '@config/database';

/**
 * Day of Week Enum
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

/**
 * Timetable Model
 * Requirements: 5.6, 5.7
 */
class Timetable extends Model {
  public timetableId!: number;
  public classId!: number;
  public academicYearId!: number;
  public dayOfWeek!: DayOfWeek;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Timetable.init(
  {
    timetableId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'timetable_id'
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'class_id',
      references: {
        model: 'classes',
        key: 'class_id'
      }
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      }
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week',
      validate: { min: 0, max: 6 }
    }
  },
  {
    sequelize,
    tableName: 'timetables',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['class_id', 'academic_year_id', 'day_of_week'] }
    ]
  }
);

/**
 * Period Model
 */
class Period extends Model {
  public periodId!: number;
  public timetableId!: number;
  public periodNumber!: number;
  public startTime!: string;
  public endTime!: string;
  public subjectId?: number;
  public teacherId?: number;
  public roomNumber?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Period.init(
  {
    periodId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'period_id'
    },
    timetableId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'timetable_id',
      references: {
        model: 'timetables',
        key: 'timetable_id'
      }
    },
    periodNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_number'
    },
    startTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'start_time',
      comment: 'HH:mm format'
    },
    endTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'end_time',
      comment: 'HH:mm format'
    },
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'subject_id',
      references: {
        model: 'subjects',
        key: 'subject_id'
      }
    },
    teacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'teacher_id',
      references: {
        model: 'staff',
        key: 'staff_id'
      }
    },
    roomNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'room_number'
    }
  },
  {
    sequelize,
    tableName: 'periods',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['timetable_id', 'period_number'] }
    ]
  }
);

/**
 * Syllabus Model
 * Requirements: 5.8, 5.9
 */
class Syllabus extends Model {
  public syllabusId!: number;
  public subjectId!: number;
  public classId!: number;
  public academicYearId!: number;
  public completedPercentage!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Syllabus.init(
  {
    syllabusId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'syllabus_id'
    },
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'subject_id',
      references: {
        model: 'subjects',
        key: 'subject_id'
      }
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'class_id',
      references: {
        model: 'classes',
        key: 'class_id'
      }
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      }
    },
    completedPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'completed_percentage'
    }
  },
  {
    sequelize,
    tableName: 'syllabi',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['subject_id', 'class_id', 'academic_year_id'], unique: true }
    ]
  }
);

/**
 * Syllabus Topic Model
 */
class SyllabusTopic extends Model {
  public topicId!: number;
  public syllabusId!: number;
  public title!: string;
  public description?: string;
  public estimatedHours!: number;
  public completedHours!: number;
  public status!: 'not_started' | 'in_progress' | 'completed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SyllabusTopic.init(
  {
    topicId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'topic_id'
    },
    syllabusId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'syllabus_id',
      references: {
        model: 'syllabi',
        key: 'syllabus_id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'estimated_hours'
    },
    completedHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'completed_hours'
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'not_started'
    }
  },
  {
    sequelize,
    tableName: 'syllabus_topics',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['syllabus_id'] }
    ]
  }
);

// Define associations
Timetable.hasMany(Period, {
  foreignKey: 'timetableId',
  as: 'periods',
  onDelete: 'CASCADE'
});

Period.belongsTo(Timetable, {
  foreignKey: 'timetableId',
  as: 'timetable'
});

// Import Subject and Staff for associations
import { Subject } from './Subject.model';
import Staff from './Staff.model';

Period.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject'
});

Period.belongsTo(Staff, {
  foreignKey: 'teacherId',
  as: 'teacher'
});

Syllabus.hasMany(SyllabusTopic, {
  foreignKey: 'syllabusId',
  as: 'topics',
  onDelete: 'CASCADE'
});

SyllabusTopic.belongsTo(Syllabus, {
  foreignKey: 'syllabusId',
  as: 'syllabus'
});

export { Timetable, Period, Syllabus, SyllabusTopic };
export { DayOfWeek as WeekDay };
