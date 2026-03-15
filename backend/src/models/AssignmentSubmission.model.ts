import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface AssignmentSubmissionAttributes {
  id: number;
  assignmentId: number;
  studentId: number;
  content: string;
  attachments: object[];
  status: 'submitted' | 'graded' | 'late';
  marks?: number;
  feedback?: string;
  submittedDate?: Date;
  gradedAt?: Date;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignmentSubmissionCreationAttributes extends Optional<AssignmentSubmissionAttributes,
  'id' | 'attachments' | 'status' | 'marks' | 'feedback' | 'submittedDate' | 'gradedAt' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'> {}

class AssignmentSubmission extends Model<AssignmentSubmissionAttributes, AssignmentSubmissionCreationAttributes>
  implements AssignmentSubmissionAttributes {
  declare id: number;
  declare assignmentId: number;
  declare studentId: number;
  declare content: string;
  declare attachments: object[];
  declare status: 'submitted' | 'graded' | 'late';
  declare marks?: number;
  declare feedback?: string;
  declare submittedDate?: Date;
  declare gradedAt?: Date;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AssignmentSubmission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    assignmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'assignment_id',
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded', 'late'),
      allowNull: false,
      defaultValue: 'submitted',
    },
    marks: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submittedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      field: 'submitted_date',
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'graded_at',
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
    tableName: 'assignment_submissions',
    modelName: 'AssignmentSubmission',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [
      { fields: ['assignment_id'] },
      { fields: ['student_id'] },
      { fields: ['status'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
      {
        unique: true,
        name: 'idx_assignment_submissions_assignment_student',
        fields: ['assignment_id', 'student_id'],
      },
    ],
  }
);

export default AssignmentSubmission;
