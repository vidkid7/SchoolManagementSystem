import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';
import { HostelMealType } from './HostelMessMenu.model';

export type HostelMealAttendanceStatus = 'present' | 'absent';

export interface HostelMealAttendanceAttributes {
  id: number;
  date: string;
  mealType: HostelMealType;
  studentId: number;
  status: HostelMealAttendanceStatus;
  markedBy?: number;
  markedAt: Date;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelMealAttendanceCreationAttributes extends Optional<
  HostelMealAttendanceAttributes,
  'id' | 'status' | 'markedBy' | 'markedAt' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'
> {}

class HostelMealAttendance
  extends Model<HostelMealAttendanceAttributes, HostelMealAttendanceCreationAttributes>
  implements HostelMealAttendanceAttributes {
  declare id: number;
  declare date: string;
  declare mealType: HostelMealType;
  declare studentId: number;
  declare status: HostelMealAttendanceStatus;
  declare markedBy?: number;
  declare markedAt: Date;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelMealAttendance.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
      allowNull: false,
      field: 'meal_type',
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
    },
    status: {
      type: DataTypes.ENUM('present', 'absent'),
      allowNull: false,
      defaultValue: 'present',
    },
    markedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'marked_by',
    },
    markedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'marked_at',
    },
    schoolConfigId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'school_config_id',
    },
    municipalityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'municipality_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'hostel_meal_attendance',
    modelName: 'HostelMealAttendance',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['date'] },
      { fields: ['meal_type'] },
      { fields: ['student_id'] },
      { unique: true, fields: ['date', 'meal_type', 'student_id'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelMealAttendance;
