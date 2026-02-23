import { DataTypes, Model } from 'sequelize';
import sequelize from '@config/database';

/**
 * Subject Type Enum
 */
export enum SubjectType {
  COMPULSORY = 'compulsory',
  OPTIONAL = 'optional'
}

/**
 * Stream Enum (for Classes 11-12)
 */
export enum Stream {
  SCIENCE = 'science',
  MANAGEMENT = 'management',
  HUMANITIES = 'humanities',
  TECHNICAL = 'technical'
}

/**
 * Subject Model
 * Requirements: 5.4, 5.5, N2.1-N2.7
 */
class Subject extends Model {
  declare subjectId: number;
  declare code: string;
  declare nameEn: string;
  declare nameNp: string;
  declare type: SubjectType;
  declare stream?: Stream;
  declare creditHours: number;
  declare theoryMarks: number;
  declare practicalMarks: number;
  declare passMarks: number;
  declare fullMarks: number;
  declare applicableClasses: number[]; // Array of grade levels [1,2,3...12]
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Subject.init(
  {
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'subject_id'
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    nameEn: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name_en'
    },
    nameNp: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name_np'
    },
    type: {
      type: DataTypes.ENUM(...Object.values(SubjectType)),
      allowNull: false
    },
    stream: {
      type: DataTypes.ENUM(...Object.values(Stream)),
      allowNull: true,
      comment: 'For Classes 11-12'
    },
    creditHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      field: 'credit_hours',
      validate: { min: 1 }
    },
    theoryMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 75,
      field: 'theory_marks'
    },
    practicalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25,
      field: 'practical_marks'
    },
    passMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 35,
      field: 'pass_marks'
    },
    fullMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      field: 'full_marks'
    },
    applicableClasses: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'applicable_classes',
      comment: 'Array of grade levels [1,2,3...12]'
    }
  },
  {
    sequelize,
    tableName: 'subjects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['type'] },
      { fields: ['stream'] }
    ]
  }
);

/**
 * Class Subject Junction Table
 * Links classes to subjects with optional teacher assignment
 * Requirements: 5.5
 */
class ClassSubject extends Model {
  declare classSubjectId: number;
  declare classId: number;
  declare subjectId: number;
  declare teacherId?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ClassSubject.init(
  {
    classSubjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'class_subject_id'
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
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
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
    }
  },
  {
    sequelize,
    tableName: 'class_subjects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['class_id', 'subject_id'], unique: true }
    ]
  }
);

export { Subject, ClassSubject };
