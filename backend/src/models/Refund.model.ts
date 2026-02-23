import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Refund Status Enum
 */
export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

/**
 * Refund Attributes Interface
 */
export interface RefundAttributes {
  refundId: number;
  paymentId: number;
  invoiceId: number;
  studentId: number;
  amount: number;
  reason: string;
  requestedBy: number;
  requestedAt: Date;
  status: RefundStatus;
  approvedBy?: number;
  approvedAt?: Date;
  rejectedBy?: number;
  rejectedAt?: Date;
  rejectionReason?: string;
  completedAt?: Date;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Refund Creation Attributes
 */
export interface RefundCreationAttributes extends Optional<RefundAttributes,
  'refundId' | 'status' | 'requestedAt' | 'approvedBy' | 'approvedAt' | 
  'rejectedBy' | 'rejectedAt' | 'rejectionReason' | 'completedAt' | 
  'remarks' | 'createdAt' | 'updatedAt'> {}

/**
 * Refund Model Class
 * Tracks refund requests with approval workflow
 * 
 * Requirements: 9.14
 */
class Refund extends Model<RefundAttributes, RefundCreationAttributes> 
  implements RefundAttributes {
  public refundId!: number;
  public paymentId!: number;
  public invoiceId!: number;
  public studentId!: number;
  public amount!: number;
  public reason!: string;
  public requestedBy!: number;
  public requestedAt!: Date;
  public status!: RefundStatus;
  public approvedBy?: number;
  public approvedAt?: Date;
  public rejectedBy?: number;
  public rejectedAt?: Date;
  public rejectionReason?: string;
  public completedAt?: Date;
  public remarks?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if refund is pending
   */
  public isPending(): boolean {
    return this.status === RefundStatus.PENDING;
  }

  /**
   * Check if refund is approved
   */
  public isApproved(): boolean {
    return this.status === RefundStatus.APPROVED;
  }

  /**
   * Check if refund is rejected
   */
  public isRejected(): boolean {
    return this.status === RefundStatus.REJECTED;
  }

  /**
   * Check if refund is completed
   */
  public isCompleted(): boolean {
    return this.status === RefundStatus.COMPLETED;
  }

  /**
   * Approve refund
   */
  public approve(approvedBy: number): void {
    this.status = RefundStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
  }

  /**
   * Reject refund
   */
  public reject(rejectedBy: number, reason: string): void {
    this.status = RefundStatus.REJECTED;
    this.rejectedBy = rejectedBy;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
  }

  /**
   * Mark refund as completed
   */
  public markAsCompleted(): void {
    this.status = RefundStatus.COMPLETED;
    this.completedAt = new Date();
  }
}

/**
 * Initialize Refund Model
 */
Refund.init(
  {
    refundId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'refund_id'
    },
    paymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'payment_id',
      references: {
        model: 'payments',
        key: 'payment_id'
      },
      comment: 'Link to payment being refunded'
    },
    invoiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'invoice_id',
      references: {
        model: 'invoices',
        key: 'invoice_id'
      },
      comment: 'Link to invoice'
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
      references: {
        model: 'students',
        key: 'student_id'
      },
      comment: 'Link to student'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Refund amount in NPR'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Reason for refund request'
    },
    requestedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'requested_by',
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: 'User who requested the refund'
    },
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'requested_at',
      comment: 'Timestamp when refund was requested'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RefundStatus)),
      allowNull: false,
      defaultValue: RefundStatus.PENDING,
      comment: 'Refund status'
    },
    approvedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'approved_by',
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: 'User who approved the refund'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
      comment: 'Timestamp when refund was approved'
    },
    rejectedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'rejected_by',
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: 'User who rejected the refund'
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rejected_at',
      comment: 'Timestamp when refund was rejected'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
      comment: 'Reason for rejection'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
      comment: 'Timestamp when refund was completed'
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
    }
  },
  {
    sequelize,
    tableName: 'refunds',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['payment_id']
      },
      {
        fields: ['invoice_id']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['requested_by']
      },
      {
        fields: ['approved_by']
      },
      {
        name: 'idx_refunds_student_status',
        fields: ['student_id', 'status']
      }
    ]
  }
);

export default Refund;
