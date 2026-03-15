import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface LessonPlanAttributes {
  id: number;
  subject: string;
  className?: string;
  section?: string;
  topic: string;
  date?: Date;
  duration: number;
  objectives: object[];
  materials?: string;
  methodology?: string;
  assessment?: string;
  status: 'draft' | 'scheduled' | 'completed' | 'reviewed' | 'approved';
  createdBy?: number;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface LessonPlanCreationAttributes extends Optional<LessonPlanAttributes,
  'id' | 'className' | 'section' | 'date' | 'duration' | 'objectives' |
  'materials' | 'methodology' | 'assessment' | 'status' | 'createdBy' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class LessonPlan extends Model<LessonPlanAttributes, LessonPlanCreationAttributes>
  implements LessonPlanAttributes {
  declare id: number;
  declare subject: string;
  declare className?: string;
  declare section?: string;
  declare topic: string;
  declare date?: Date;
  declare duration: number;
  declare objectives: object[];
  declare materials?: string;
  declare methodology?: string;
  declare assessment?: string;
  declare status: 'draft' | 'scheduled' | 'completed' | 'reviewed' | 'approved';
  declare createdBy?: number;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;
}

LessonPlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
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
    section: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    topic: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45,
    },
    objectives: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    materials: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    methodology: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assessment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'completed', 'reviewed', 'approved'),
      allowNull: false,
      defaultValue: 'draft',
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'lesson_plans',
    modelName: 'LessonPlan',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['subject'] },
      { fields: ['class_name'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
      { fields: ['date'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default LessonPlan;
