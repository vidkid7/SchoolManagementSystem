import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@config/database';

export interface AttendanceRuleAttributes {
  id: string;
  name: string;
  description?: string;
  // Attendance thresholds
  minimumAttendancePercentage: number;
  lowAttendanceThreshold: number;
  criticalAttendanceThreshold: number;
  // Correction settings
  correctionWindowHours: number;
  allowTeacherCorrection: boolean;
  allowAdminCorrection: boolean;
  // Leave settings
  maxLeaveDaysPerMonth: number;
  maxLeaveDaysPerYear: number;
  requireLeaveApproval: boolean;
  // Alert settings
  enableLowAttendanceAlerts: boolean;
  alertParents: boolean;
  alertAdmins: boolean;
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRuleCreationAttributes
  extends Optional<
    AttendanceRuleAttributes,
    | 'id'
    | 'description'
    | 'minimumAttendancePercentage'
    | 'lowAttendanceThreshold'
    | 'criticalAttendanceThreshold'
    | 'correctionWindowHours'
    | 'allowTeacherCorrection'
    | 'allowAdminCorrection'
    | 'maxLeaveDaysPerMonth'
    | 'maxLeaveDaysPerYear'
    | 'requireLeaveApproval'
    | 'enableLowAttendanceAlerts'
    | 'alertParents'
    | 'alertAdmins'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class AttendanceRule
  extends Model<AttendanceRuleAttributes, AttendanceRuleCreationAttributes>
  implements AttendanceRuleAttributes
{
  declare id: string;
  declare name: string;
  declare description?: string;
  declare minimumAttendancePercentage: number;
  declare lowAttendanceThreshold: number;
  declare criticalAttendanceThreshold: number;
  declare correctionWindowHours: number;
  declare allowTeacherCorrection: boolean;
  declare allowAdminCorrection: boolean;
  declare maxLeaveDaysPerMonth: number;
  declare maxLeaveDaysPerYear: number;
  declare requireLeaveApproval: boolean;
  declare enableLowAttendanceAlerts: boolean;
  declare alertParents: boolean;
  declare alertAdmins: boolean;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AttendanceRule.init(
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
    minimumAttendancePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 75.0,
      field: 'minimum_attendance_percentage',
    },
    lowAttendanceThreshold: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 75.0,
      field: 'low_attendance_threshold',
    },
    criticalAttendanceThreshold: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 60.0,
      field: 'critical_attendance_threshold',
    },
    correctionWindowHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24,
      field: 'correction_window_hours',
    },
    allowTeacherCorrection: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'allow_teacher_correction',
    },
    allowAdminCorrection: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'allow_admin_correction',
    },
    maxLeaveDaysPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: 'max_leave_days_per_month',
    },
    maxLeaveDaysPerYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'max_leave_days_per_year',
    },
    requireLeaveApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'require_leave_approval',
    },
    enableLowAttendanceAlerts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'enable_low_attendance_alerts',
    },
    alertParents: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'alert_parents',
    },
    alertAdmins: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'alert_admins',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'attendance_rules',
    timestamps: true,
    underscored: true,
  }
);

export default AttendanceRule;
