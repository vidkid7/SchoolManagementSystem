import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

/**
 * Leave Application Status Enum
 */
export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Leave Application Attributes Interface
 */
export interface LeaveApplicationAttributes {
  leaveId: number;
  studentId: number;
  startDate: Date;
  endDate: Date;
  startDateBS?: string;
  endDateBS?: string;
  reason: string;
  appliedBy: number;
  appliedAt: Date;
  status: LeaveStatus;
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Leave Application Creation Attributes (optional fields for creation)
 */
export interface LeaveApplicationCreationAttributes extends Optional<LeaveApplicationAttributes,
  'leaveId' | 'startDateBS' | 'endDateBS' | 'appliedAt' | 'status' | 
  'approvedBy' | 'approvedAt' | 'rejectionReason' | 'remarks' | 
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Leave Application Model Class
 * 
 * Supports:
 * - Leave application submission by students/parents
 * - Approval workflow (pending → approved/rejected)
 * - Auto-marking attendance as "excused" for approved leaves
 * - Notifications on status changes
 * 
 * Requirements: 6.11, 6.12
 */
class LeaveApplication extends Model<LeaveApplicationAttributes, LeaveApplicationCreationAttributes> 
  implements LeaveApplicationAttributes {
  declare leaveId: number;
  declare studentId: number;
  declare startDate: Date;
  declare endDate: Date;
  declare startDateBS?: string;
  declare endDateBS?: string;
  declare reason: string;
  declare appliedBy: number;
  declare appliedAt: Date;
  declare status: LeaveStatus;
  declare approvedBy?: number;
  declare approvedAt?: Date;
  declare rejectionReason?: string;
  declare remarks?: string;
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare deletedAt?: Date;

  /**
   * Check if leave is pending approval
   */
  public isPending(): boolean {
    return this.status === LeaveStatus.PENDING;
  }

  /**
   * Check if leave is approved
   */
  public isApproved(): boolean {
    return this.status === LeaveStatus.APPROVED;
  }

  /**
   * Check if leave is rejected
   */
  public isRejected(): boolean {
    return this.status === LeaveStatus.REJECTED;
  }

  /**
   * Get the number of days for this leave
   */
  public getDurationInDays(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  }

  /**
   * Get formatted date range string
   */
  public getDateRangeString(): string {
    const start = this.startDate.toISOString().split('T')[0];
    const end = this.endDate.toISOString().split('T')[0];
    return `${start} to ${end}`;
  }

  /**
   * Get display date range (BS if available, otherwise AD)
   */
  public getDisplayDateRange(): string {
    if (this.startDateBS && this.endDateBS) {
      return `${this.startDateBS} to ${this.endDateBS} BS`;
    }
    return this.getDateRangeString();
  }

  /**
   * Check if leave application can be edited
   * Only pending applications can be edited
   */
  public canEdit(): boolean {
    return this.isPending();
  }

  /**
   * Check if leave application can be cancelled
   * Only pending applications can be cancelled
   */
  public canCancel(): boolean {
    return this.isPending();
  }
}

/**
 * Initialize Leave Application Model
 */
export function initLeaveApplication(sequelize: Sequelize): typeof LeaveApplication {
  LeaveApplication.init(
    {
      leaveId: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        field: 'leave_id'
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
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'start_date',
        comment: 'Leave start date'
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'end_date',
        comment: 'Leave end date'
      },
      startDateBS: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'start_date_bs',
        comment: 'Start date in Bikram Sambat format (YYYY-MM-DD)',
        validate: {
          is: /^\d{4}-\d{2}-\d{2}$/
        }
      },
      endDateBS: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'end_date_bs',
        comment: 'End date in Bikram Sambat format (YYYY-MM-DD)',
        validate: {
          is: /^\d{4}-\d{2}-\d{2}$/
        }
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Reason for leave application',
        validate: {
          notEmpty: true,
          len: [10, 1000]
        }
      },
      appliedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'applied_by',
        comment: 'User ID who applied (student or parent)',
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      appliedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'applied_at',
        comment: 'Timestamp when leave was applied'
      },
      status: {
        type: DataTypes.ENUM(...Object.values(LeaveStatus)),
        allowNull: false,
        defaultValue: LeaveStatus.PENDING,
        validate: {
          isIn: [Object.values(LeaveStatus)]
        }
      },
      approvedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'approved_by',
        comment: 'User ID who approved/rejected the leave',
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
        comment: 'Timestamp when leave was approved/rejected'
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
        comment: 'Reason for rejection (if rejected)'
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional remarks or notes'
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
      tableName: 'leave_applications',
      timestamps: true,
      paranoid: true, // Soft delete
      underscored: true,
      indexes: [
        {
          // Index for student queries
          name: 'idx_leave_student_id',
          fields: ['student_id']
        },
        {
          // Index for status queries
          name: 'idx_leave_status',
          fields: ['status']
        },
        {
          // Index for date range queries
          name: 'idx_leave_dates',
          fields: ['start_date', 'end_date']
        },
        {
          // Index for applied_by queries
          name: 'idx_leave_applied_by',
          fields: ['applied_by']
        },
        {
          // Index for approved_by queries
          name: 'idx_leave_approved_by',
          fields: ['approved_by']
        },
        {
          // Composite index for student and status queries
          name: 'idx_leave_student_status',
          fields: ['student_id', 'status']
        }
      ]
    }
  );

  return LeaveApplication;
}

export default LeaveApplication;
