/**
 * Staff Attendance Model
 * 
 * Tracks daily attendance for staff members
 */

import { DataTypes, Model, Optional } from 'sequelize';

export interface StaffAttendanceAttributes {
  staffAttendanceId: number;
  staffId: number;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'on_leave' | 'half_day';
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  remarks?: string;
  markedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffAttendanceCreationAttributes 
  extends Optional<StaffAttendanceAttributes, 'staffAttendanceId' | 'checkInTime' | 'checkOutTime' | 'workingHours' | 'remarks' | 'markedBy'> {}

export class StaffAttendance
  extends Model<StaffAttendanceAttributes, StaffAttendanceCreationAttributes>
  implements StaffAttendanceAttributes
{
  declare staffAttendanceId: number;
  declare staffId: number;
  declare date: Date;
  declare status: 'present' | 'absent' | 'late' | 'on_leave' | 'half_day';
  declare checkInTime?: string;
  declare checkOutTime?: string;
  declare workingHours?: number;
  declare remarks?: string;
  declare markedBy?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public toJSON(): object {
    return {
      staffAttendanceId: this.staffAttendanceId,
      staffId: this.staffId,
      date: this.date,
      status: this.status,
      checkInTime: this.checkInTime,
      checkOutTime: this.checkOutTime,
      workingHours: this.workingHours,
      remarks: this.remarks,
      markedBy: this.markedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function initStaffAttendance(sequelize: any): typeof StaffAttendance {
  StaffAttendance.init(
    {
      staffAttendanceId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      staffId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'on_leave', 'half_day'),
        allowNull: false,
        defaultValue: 'present',
      },
      checkInTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      checkOutTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      workingHours: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      markedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'staff_attendance',
      timestamps: true,
      indexes: [
        {
          name: 'idx_staff_attendance_staff_id',
          fields: ['staff_id'],
        },
        {
          name: 'idx_staff_attendance_date',
          fields: ['date'],
        },
        {
          name: 'idx_staff_attendance_status',
          fields: ['status'],
        },
        {
          name: 'idx_staff_attendance_staff_date',
          fields: ['staff_id', 'date'],
        },
        {
          name: 'unique_staff_date',
          fields: ['staff_id', 'date'],
          unique: true,
        },
      ],
    }
  );

  return StaffAttendance;
}

export default StaffAttendance;
