import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Payment Method Enum
 */
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  ESEWA = 'esewa',
  KHALTI = 'khalti',
  IME_PAY = 'ime_pay'
}

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

/**
 * Installment Frequency Enum
 */
export enum InstallmentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  CUSTOM = 'custom'
}

/**
 * Installment Plan Status Enum
 */
export enum InstallmentPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Payment Attributes Interface
 */
export interface PaymentAttributes {
  paymentId: number;
  receiptNumber: string;
  invoiceId: number;
  studentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionId?: string;
  gatewayResponse?: any;
  receivedBy: number;
  remarks?: string;
  status: PaymentStatus;
  qrCode?: string;
  installmentNumber?: number;
  installmentPlanId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Payment Creation Attributes
 */
export interface PaymentCreationAttributes extends Optional<PaymentAttributes,
  'paymentId' | 'transactionId' | 'gatewayResponse' | 'remarks' | 'status' | 
  'qrCode' | 'installmentNumber' | 'installmentPlanId' | 'createdAt' | 'updatedAt'> {}

/**
 * Payment Model Class
 */
class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> 
  implements PaymentAttributes {
  public paymentId!: number;
  public receiptNumber!: string;
  public invoiceId!: number;
  public studentId!: number;
  public amount!: number;
  public paymentMethod!: PaymentMethod;
  public paymentDate!: string;
  public transactionId?: string;
  public gatewayResponse?: any;
  public receivedBy!: number;
  public remarks?: string;
  public status!: PaymentStatus;
  public qrCode?: string;
  public installmentNumber?: number;
  public installmentPlanId?: number;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if payment is online
   */
  public isOnlinePayment(): boolean {
    return [
      PaymentMethod.ESEWA,
      PaymentMethod.KHALTI,
      PaymentMethod.IME_PAY
    ].includes(this.paymentMethod);
  }

  /**
   * Check if payment is completed
   */
  public isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  /**
   * Check if payment is part of installment plan
   */
  public isInstallmentPayment(): boolean {
    return this.installmentPlanId !== null && this.installmentPlanId !== undefined;
  }

  /**
   * Mark payment as completed
   */
  public markAsCompleted(): void {
    this.status = PaymentStatus.COMPLETED;
  }

  /**
   * Mark payment as failed
   */
  public markAsFailed(): void {
    this.status = PaymentStatus.FAILED;
  }

  /**
   * Mark payment as refunded
   */
  public markAsRefunded(): void {
    this.status = PaymentStatus.REFUNDED;
  }
}

/**
 * Initialize Payment Model
 */
Payment.init(
  {
    paymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'payment_id'
    },
    receiptNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'receipt_number',
      validate: {
        notEmpty: true,
        len: [1, 50]
      },
      comment: 'Unique receipt number (e.g., RCP-2081-00001)'
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
      comment: 'Payment amount in NPR'
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
      field: 'payment_method',
      comment: 'Payment method used'
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'payment_date',
      comment: 'Date of payment (YYYY-MM-DD)'
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'transaction_id',
      comment: 'Transaction ID from payment gateway (for online payments)'
    },
    gatewayResponse: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'gateway_response',
      comment: 'Raw response from payment gateway'
    },
    receivedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'received_by',
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: 'User (accountant) who received the payment'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional remarks or notes'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.COMPLETED,
      comment: 'Payment status'
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'qr_code',
      comment: 'QR code data for receipt verification'
    },
    installmentNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'installment_number',
      comment: 'Installment number if part of installment plan'
    },
    installmentPlanId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'installment_plan_id',
      references: {
        model: 'installment_plans',
        key: 'installment_plan_id'
      },
      comment: 'Link to installment plan if applicable'
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
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['receipt_number']
      },
      {
        fields: ['invoice_id']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['payment_method']
      },
      {
        fields: ['payment_date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['transaction_id']
      },
      {
        fields: ['installment_plan_id']
      },
      {
        name: 'idx_payments_student_date',
        fields: ['student_id', 'payment_date']
      }
    ]
  }
);

/**
 * Installment Plan Attributes Interface
 */
export interface InstallmentPlanAttributes {
  installmentPlanId: number;
  invoiceId: number;
  studentId: number;
  totalAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  frequency: InstallmentFrequency;
  startDate: string;
  status: InstallmentPlanStatus;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Installment Plan Creation Attributes
 */
export interface InstallmentPlanCreationAttributes extends Optional<InstallmentPlanAttributes,
  'installmentPlanId' | 'status' | 'createdAt' | 'updatedAt'> {}

/**
 * Installment Plan Model Class
 */
class InstallmentPlan extends Model<InstallmentPlanAttributes, InstallmentPlanCreationAttributes> 
  implements InstallmentPlanAttributes {
  public installmentPlanId!: number;
  public invoiceId!: number;
  public studentId!: number;
  public totalAmount!: number;
  public numberOfInstallments!: number;
  public installmentAmount!: number;
  public frequency!: InstallmentFrequency;
  public startDate!: string;
  public status!: InstallmentPlanStatus;
  public createdBy!: number;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly payments?: Payment[];

  /**
   * Check if plan is active
   */
  public isActive(): boolean {
    return this.status === InstallmentPlanStatus.ACTIVE;
  }

  /**
   * Check if plan is completed
   */
  public isCompleted(): boolean {
    return this.status === InstallmentPlanStatus.COMPLETED;
  }

  /**
   * Mark plan as completed
   */
  public markAsCompleted(): void {
    this.status = InstallmentPlanStatus.COMPLETED;
  }

  /**
   * Mark plan as cancelled
   */
  public markAsCancelled(): void {
    this.status = InstallmentPlanStatus.CANCELLED;
  }

  /**
   * Calculate remaining installments
   */
  public async getRemainingInstallments(): Promise<number> {
    if (!this.payments) {
      const paidCount = await Payment.count({
        where: {
          installmentPlanId: this.installmentPlanId,
          status: PaymentStatus.COMPLETED
        }
      });
      return this.numberOfInstallments - paidCount;
    }
    const paidCount = this.payments.filter(p => p.status === PaymentStatus.COMPLETED).length;
    return this.numberOfInstallments - paidCount;
  }

  /**
   * Calculate remaining amount
   */
  public async getRemainingAmount(): Promise<number> {
    if (!this.payments) {
      const paidSum = await Payment.sum('amount', {
        where: {
          installmentPlanId: this.installmentPlanId,
          status: PaymentStatus.COMPLETED
        }
      });
      return Number(this.totalAmount) - (paidSum || 0);
    }
    const paidSum = this.payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return Number(this.totalAmount) - paidSum;
  }
}

/**
 * Initialize Installment Plan Model
 */
InstallmentPlan.init(
  {
    installmentPlanId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'installment_plan_id'
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
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
      validate: {
        min: 0
      },
      comment: 'Total amount to be paid in installments'
    },
    numberOfInstallments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'number_of_installments',
      validate: {
        min: 1
      },
      comment: 'Total number of installments'
    },
    installmentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'installment_amount',
      validate: {
        min: 0
      },
      comment: 'Amount per installment'
    },
    frequency: {
      type: DataTypes.ENUM(...Object.values(InstallmentFrequency)),
      allowNull: false,
      comment: 'Frequency of installments'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
      comment: 'Start date of installment plan'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(InstallmentPlanStatus)),
      allowNull: false,
      defaultValue: InstallmentPlanStatus.ACTIVE,
      comment: 'Status of installment plan'
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: 'User who created the installment plan'
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
    tableName: 'installment_plans',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['invoice_id']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['status']
      }
    ]
  }
);

// Define associations
InstallmentPlan.hasMany(Payment, {
  foreignKey: 'installmentPlanId',
  as: 'payments',
  onDelete: 'SET NULL'
});

Payment.belongsTo(InstallmentPlan, {
  foreignKey: 'installmentPlanId',
  as: 'installmentPlan'
});

export { Payment, InstallmentPlan };
export default Payment;
