import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export type HostelLeaveStatus = 'pending' | 'approved' | 'rejected';

export interface HostelLeaveRequestAttributes {
  id: number;
  studentId: number;
  reason: string;
  fromDate: string;
  toDate: string;
  status: HostelLeaveStatus;
  remarks?: string;
  processedBy?: number;
  processedAt?: Date;
  schoolConfigId?: string;
  municipalityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HostelLeaveRequestCreationAttributes extends Optional<
  HostelLeaveRequestAttributes,
  'id' | 'status' | 'remarks' | 'processedBy' | 'processedAt' |
  'schoolConfigId' | 'municipalityId' | 'createdAt' | 'updatedAt'
> {}

class HostelLeaveRequest
  extends Model<HostelLeaveRequestAttributes, HostelLeaveRequestCreationAttributes>
  implements HostelLeaveRequestAttributes {
  declare id: number;
  declare studentId: number;
  declare reason: string;
  declare fromDate: string;
  declare toDate: string;
  declare status: HostelLeaveStatus;
  declare remarks?: string;
  declare processedBy?: number;
  declare processedAt?: Date;
  declare schoolConfigId?: string;
  declare municipalityId?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HostelLeaveRequest.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fromDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'from_date',
    },
    toDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'to_date',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'processed_by',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
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
    tableName: 'hostel_leave_requests',
    modelName: 'HostelLeaveRequest',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['student_id'] },
      { fields: ['status'] },
      { fields: ['from_date'] },
      { fields: ['to_date'] },
      { fields: ['processed_by'] },
      { fields: ['school_config_id'] },
      { fields: ['municipality_id'] },
    ],
  }
);

export default HostelLeaveRequest;
