import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface AssignmentAttributes {
  id: number;
  title: string;
  subject: string;
  className?: string;
  section?: string;
  description?: string;
  dueDate: Date;
  totalMarks?: number;
  attachments: object[];
  createdBy?: number;
  status: 'active' | 'closed' | 'draft';
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface AssignmentCreationAttributes extends Optional<AssignmentAttributes,
  'id' | 'className' | 'section' | 'description' | 'totalMarks' | 'attachments' |
  'createdBy' | 'status' | 'schoolConfigId' | 'municipalityId' |
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Assignment extends Model<AssignmentAttributes, AssignmentCreationAttributes>
  implements AssignmentAttributes {
  declare id: number;
  declare title: string;
  declare subject: string;
  declare className?: string;
  declare section?: string;
  declare description?: string;
  declare dueDate: Date;
  declare totalMarks?: number;
  declare attachments: object[];
  declare createdBy?: number;
  declare status: 'active' | 'closed' | 'draft';
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;
}

Assignment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'due_date',
    },
    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'total_marks',
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by',
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'draft'),
      allowNull: false,
      defaultValue: 'active',
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
    tableName: 'assignments',
    modelName: 'Assignment',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['subject'] },
      { fields: ['class_name'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
      { fields: ['due_date'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default Assignment;
