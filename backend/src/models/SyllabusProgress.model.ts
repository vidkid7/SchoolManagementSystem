import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface SyllabusProgressAttributes {
  id: number;
  teacherId: number;
  subject: string;
  className?: string;
  unit: string;
  topic?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SyllabusProgressCreationAttributes extends Optional<SyllabusProgressAttributes,
  'id' | 'className' | 'topic' | 'status' | 'progress' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'> {}

class SyllabusProgress extends Model<SyllabusProgressAttributes, SyllabusProgressCreationAttributes>
  implements SyllabusProgressAttributes {
  declare id: number;
  declare teacherId: number;
  declare subject: string;
  declare className?: string;
  declare unit: string;
  declare topic?: string;
  declare status: 'not-started' | 'in-progress' | 'completed';
  declare progress: number;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SyllabusProgress.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'teacher_id',
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    className: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'class_name',
    },
    unit: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('not-started', 'in-progress', 'completed'),
      allowNull: false,
      defaultValue: 'not-started',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
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
    tableName: 'syllabus_progress',
    modelName: 'SyllabusProgress',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [
      { fields: ['teacher_id'] },
      { fields: ['subject'] },
      { fields: ['class_name'] },
      { fields: ['status'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
      {
        unique: true,
        name: 'idx_syllabus_progress_teacher_subject_unit',
        fields: ['teacher_id', 'subject', 'unit'],
      },
    ],
  }
);

export default SyllabusProgress;
