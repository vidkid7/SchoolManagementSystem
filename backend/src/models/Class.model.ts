import { DataTypes, Model } from 'sequelize';
import sequelize from '@config/database';

/**
 * Shift Enum
 */
export enum Shift {
  MORNING = 'morning',
  DAY = 'day',
  EVENING = 'evening'
}

/**
 * Class Model
 * Requirements: 5.3, N5.1
 */
class Class extends Model {
  // Remove public field declarations to avoid shadowing Sequelize getters/setters
  // TypeScript will infer types from Class.init() below
  declare classId: number;
  declare academicYearId: number;
  declare gradeLevel: number;
  declare section: string;
  declare shift: Shift;
  declare classTeacherId?: number;
  declare capacity: number;
  declare currentStrength: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;
}

Class.init(
  {
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'class_id'
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
    gradeLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'grade_level',
      comment: 'Grade level (1-12)',
      validate: { min: 1, max: 12 }
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'section',
      comment: 'Section (A, B, C, etc.)'
    },
    shift: {
      type: DataTypes.ENUM(...Object.values(Shift)),
      allowNull: false,
      defaultValue: Shift.MORNING,
      field: 'shift'
    },
    classTeacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'class_teacher_id',
      references: {
        model: 'staff',
        key: 'staff_id'
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 40,
      field: 'capacity'
    },
    currentStrength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'current_strength'
    }
  },
  {
    sequelize,
    tableName: 'classes',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['academic_year_id', 'grade_level', 'section', 'shift'], unique: true },
      { fields: ['grade_level'] }
    ]
  }
);

export default Class;
