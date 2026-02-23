import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Attendance Status Enum
 */
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused'
}

/**
 * Sync Status Enum for offline support
 */
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  ERROR = 'error'
}

/**
 * Attendance Record Attributes Interface
 */
export interface AttendanceRecordAttributes {
  attendanceId: number;
  studentId: number;
  classId: number;
  date: Date;
  dateBS?: string;
  status: AttendanceStatus;
  periodNumber?: number;
  markedBy: number;
  markedAt: Date;
  remarks?: string;
  syncStatus: SyncStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Attendance Record Creation Attributes (optional fields for creation)
 */
export interface AttendanceRecordCreationAttributes extends Optional<AttendanceRecordAttributes,
  'attendanceId' | 'dateBS' | 'periodNumber' | 'remarks' | 'syncStatus' | 
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Attendance Record Model Class
 * 
 * Supports:
 * - Period-wise attendance (with periodNumber)
 * - Day-wise attendance (periodNumber = null)
 * - Offline sync capabilities (syncStatus field)
 * - Audit trail (markedBy, markedAt)
 * 
 * Requirements: 6.1, 6.2, 6.14, 28.1
 */
class AttendanceRecord extends Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes> 
  implements AttendanceRecordAttributes {
  declare attendanceId: number;
  declare studentId: number;
  declare classId: number;
  declare date: Date;
  declare dateBS?: string;
  declare status: AttendanceStatus;
  declare periodNumber?: number;
  declare markedBy: number;
  declare markedAt: Date;
  declare remarks?: string;
  declare syncStatus: SyncStatus;
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  /**
   * Check if attendance is marked as present (including late)
   */
  public isPresent(): boolean {
    return this.status === AttendanceStatus.PRESENT || this.status === AttendanceStatus.LATE;
  }

  /**
   * Check if attendance is marked as absent
   */
  public isAbsent(): boolean {
    return this.status === AttendanceStatus.ABSENT;
  }

  /**
   * Check if attendance is excused
   */
  public isExcused(): boolean {
    return this.status === AttendanceStatus.EXCUSED;
  }

  /**
   * Check if attendance is period-wise
   */
  public isPeriodWise(): boolean {
    return this.periodNumber !== null && this.periodNumber !== undefined;
  }

  /**
   * Check if attendance is day-wise
   */
  public isDayWise(): boolean {
    return !this.isPeriodWise();
  }

  /**
   * Check if attendance is synced
   */
  public isSynced(): boolean {
    return this.syncStatus === SyncStatus.SYNCED;
  }

  /**
   * Check if attendance is pending sync
   */
  public isPendingSync(): boolean {
    return this.syncStatus === SyncStatus.PENDING;
  }

  /**
   * Check if attendance has sync error
   */
  public hasSyncError(): boolean {
    return this.syncStatus === SyncStatus.ERROR;
  }

  /**
   * Get formatted date string
   */
  public getFormattedDate(): string {
    return this.date.toISOString().split('T')[0];
  }

  /**
   * Get display date (BS if available, otherwise AD)
   */
  public getDisplayDate(): string {
    return this.dateBS || this.getFormattedDate();
  }
}

/**
 * Initialize Attendance Record Model
 */
AttendanceRecord.init(
  {
    attendanceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'attendance_id'
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
      references: {
        model: 'students',
        key: 'student_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'class_id',
      references: {
        model: 'classes',
        key: 'class_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Attendance date'
    },
    dateBS: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'date_bs',
      comment: 'Date in Bikram Sambat format (YYYY-MM-DD)',
      validate: {
        is: /^\d{4}-\d{2}-\d{2}$/
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AttendanceStatus)),
      allowNull: false,
      defaultValue: AttendanceStatus.PRESENT,
      validate: {
        isIn: [Object.values(AttendanceStatus)]
      }
    },
    periodNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'period_number',
      comment: 'For period-wise attendance. Null for day-wise attendance.',
      validate: {
        min: 1,
        max: 10
      }
    },
    markedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'marked_by',
      comment: 'Teacher/user who marked attendance',
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    markedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'marked_at',
      comment: 'Timestamp when attendance was marked'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional remarks or notes'
    },
    syncStatus: {
      type: DataTypes.ENUM(...Object.values(SyncStatus)),
      allowNull: false,
      defaultValue: SyncStatus.SYNCED,
      field: 'sync_status',
      comment: 'Sync status for offline support',
      validate: {
        isIn: [Object.values(SyncStatus)]
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  },
  {
    sequelize,
    tableName: 'attendance',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        // Composite index for performance (student_id, date)
        name: 'idx_attendance_student_date',
        fields: ['student_id', 'date']
      },
      {
        // Index for class queries
        name: 'idx_attendance_class_id',
        fields: ['class_id']
      },
      {
        // Index for date queries
        name: 'idx_attendance_date',
        fields: ['date']
      },
      {
        // Index for status queries
        name: 'idx_attendance_status',
        fields: ['status']
      },
      {
        // Index for marked_by queries
        name: 'idx_attendance_marked_by',
        fields: ['marked_by']
      },
      {
        // Index for sync status queries (offline support)
        name: 'idx_attendance_sync_status',
        fields: ['sync_status']
      },
      {
        // Composite index for period-wise attendance queries
        name: 'idx_attendance_class_date_period',
        fields: ['class_id', 'date', 'period_number']
      }
    ]
  }
);

export default AttendanceRecord;
