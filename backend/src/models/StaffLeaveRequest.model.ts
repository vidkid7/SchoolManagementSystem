import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

export type StaffLeaveType = 'casual' | 'sick' | 'personal' | 'other';
export type StaffLeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface StaffLeaveRequestAttributes {
  staffLeaveRequestId: number;
  staffId: number;
  leaveType: StaffLeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: StaffLeaveStatus;
  appliedBy: number;
  reviewedBy?: number | null;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StaffLeaveRequestCreationAttributes = Optional<StaffLeaveRequestAttributes,
  'staffLeaveRequestId' | 'status' | 'reviewedBy' | 'reviewedAt' | 'reviewNote' | 'createdAt' | 'updatedAt'>;

class StaffLeaveRequest extends Model<StaffLeaveRequestAttributes, StaffLeaveRequestCreationAttributes>
  implements StaffLeaveRequestAttributes {
  declare staffLeaveRequestId: number;
  declare staffId: number;
  declare leaveType: StaffLeaveType;
  declare startDate: Date;
  declare endDate: Date;
  declare reason: string;
  declare status: StaffLeaveStatus;
  declare appliedBy: number;
  declare reviewedBy?: number | null;
  declare reviewedAt?: Date | null;
  declare reviewNote?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StaffLeaveRequest.init({
  staffLeaveRequestId: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, field: 'staff_leave_request_id' },
  staffId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'staff_id', references: { model: 'staff', key: 'staff_id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  leaveType: { type: DataTypes.ENUM('casual', 'sick', 'personal', 'other'), allowNull: false, field: 'leave_type' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'), allowNull: false, defaultValue: 'pending' },
  appliedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'applied_by', references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
  reviewedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'reviewed_by', references: { model: 'users', key: 'user_id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
  reviewNote: { type: DataTypes.TEXT, allowNull: true, field: 'review_note' },
}, {
  sequelize,
  tableName: 'staff_leave_requests',
  modelName: 'StaffLeaveRequest',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['staff_id', 'start_date', 'end_date'] },
    { fields: ['status'] },
    { fields: ['applied_by'] },
  ],
});

export default StaffLeaveRequest;
