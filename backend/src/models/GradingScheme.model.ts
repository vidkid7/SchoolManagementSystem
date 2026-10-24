import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface GradingSchemeAttributes {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  grades: GradeDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeDefinition {
  grade: string;
  gradePoint: number;
  minPercentage: number;
  maxPercentage: number;
  description: string;
}

export interface GradingSchemeCreationAttributes
  extends Optional<
    GradingSchemeAttributes,
    'id' | 'description' | 'isDefault' | 'isActive' | 'createdAt' | 'updatedAt'
  > {}

export class GradingScheme
  extends Model<GradingSchemeAttributes, GradingSchemeCreationAttributes>
  implements GradingSchemeAttributes
{
  declare public id: string;
  declare public name: string;
  declare public description?: string;
  declare public isDefault: boolean;
  declare public isActive: boolean;
  declare public grades: GradeDefinition[];
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

GradingScheme.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    grades: {
      type: DataTypes.JSON,
      allowNull: false,
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
    tableName: 'grading_schemes',
    timestamps: true,
    underscored: true,
  }
);

export default GradingScheme;
