import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Payment Gateway Enum
 */
export enum PaymentGateway {
  ESEWA = 'esewa',
  KHALTI = 'khalti',
  IME_PAY = 'ime_pay'
}

/**
 * Gateway Transaction Status Enum
 */
export enum GatewayTransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

/**
 * Payment Gateway Transaction Attributes Interface
 */
export interface PaymentGatewayTransactionAttributes {
  transactionId: number;
  transactionUuid: string;
  gateway: PaymentGateway;
  invoiceId: number;
  studentId: number;
  amount: number;
  productCode: string;
  status: GatewayTransactionStatus;
  initiatedAt: Date;
  completedAt?: Date;
  gatewayResponse?: any;
  signature?: string;
  verificationData?: any;
  failureReason?: string;
  paymentId?: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Payment Gateway Transaction Creation Attributes
 */
export interface PaymentGatewayTransactionCreationAttributes extends Optional<PaymentGatewayTransactionAttributes,
  'transactionId' | 'status' | 'initiatedAt' | 'completedAt' | 'gatewayResponse' | 
  'signature' | 'verificationData' | 'failureReason' | 'paymentId' | 'createdAt' | 'updatedAt'> {}

/**
 * Payment Gateway Transaction Model Class
 * Tracks payment gateway transactions for eSewa, Khalti, IME Pay
 * 
 * Requirements: 32.1, 32.6, 32.7
 */
class PaymentGatewayTransaction extends Model<PaymentGatewayTransactionAttributes, PaymentGatewayTransactionCreationAttributes> 
  implements PaymentGatewayTransactionAttributes {
  public transactionId!: number;
  public transactionUuid!: string;
  public gateway!: PaymentGateway;
  public invoiceId!: number;
  public studentId!: number;
  public amount!: number;
  public productCode!: string;
  public status!: GatewayTransactionStatus;
  public initiatedAt!: Date;
  public completedAt?: Date;
  public gatewayResponse?: any;
  public signature?: string;
  public verificationData?: any;
  public failureReason?: string;
  public paymentId?: number;
  public expiresAt!: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if transaction is pending
   */
  public isPending(): boolean {
    return this.status === GatewayTransactionStatus.PENDING;
  }

  /**
   * Check if transaction is successful
   */
  public isSuccess(): boolean {
    return this.status === GatewayTransactionStatus.SUCCESS;
  }

  /**
   * Check if transaction is failed
   */
  public isFailed(): boolean {
    return this.status === GatewayTransactionStatus.FAILED;
  }

  /**
   * Check if transaction is expired
   */
  public isExpired(): boolean {
    if (this.status === GatewayTransactionStatus.EXPIRED) {
      return true;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Mark transaction as success
   */
  public markAsSuccess(gatewayResponse: any, paymentId?: number): void {
    this.status = GatewayTransactionStatus.SUCCESS;
    this.completedAt = new Date();
    this.gatewayResponse = gatewayResponse;
    if (paymentId) {
      this.paymentId = paymentId;
    }
  }

  /**
   * Mark transaction as failed
   */
  public markAsFailed(reason: string, gatewayResponse?: any): void {
    this.status = GatewayTransactionStatus.FAILED;
    this.completedAt = new Date();
    this.failureReason = reason;
    if (gatewayResponse) {
      this.gatewayResponse = gatewayResponse;
    }
  }

  /**
   * Mark transaction as expired
   */
  public markAsExpired(): void {
    this.status = GatewayTransactionStatus.EXPIRED;
    this.completedAt = new Date();
  }

  /**
   * Check if transaction can be processed
   */
  public canBeProcessed(): boolean {
    return this.isPending() && !this.isExpired();
  }
}

/**
 * Initialize Payment Gateway Transaction Model
 */
PaymentGatewayTransaction.init(
  {
    transactionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'transaction_id'
    },
    transactionUuid: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'transaction_uuid',
      validate: {
        notEmpty: true,
        len: [1, 100]
      },
      comment: 'Unique transaction UUID for gateway'
    },
    gateway: {
      type: DataTypes.ENUM(...Object.values(PaymentGateway)),
      allowNull: false,
      comment: 'Payment gateway used'
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
      comment: 'Transaction amount in NPR'
    },
    productCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'product_code',
      comment: 'Product code for gateway (e.g., EPAYTEST for eSewa test)'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(GatewayTransactionStatus)),
      allowNull: false,
      defaultValue: GatewayTransactionStatus.PENDING,
      comment: 'Transaction status'
    },
    initiatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'initiated_at',
      comment: 'When transaction was initiated'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
      comment: 'When transaction was completed (success or failed)'
    },
    gatewayResponse: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'gateway_response',
      comment: 'Raw response from payment gateway'
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Signature for transaction verification'
    },
    verificationData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'verification_data',
      comment: 'Data used for signature verification'
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'failure_reason',
      comment: 'Reason for transaction failure'
    },
    paymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'payment_id',
      references: {
        model: 'payments',
        key: 'payment_id'
      },
      comment: 'Link to payment record (after successful transaction)'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
      comment: 'Transaction expiry time (typically 30 minutes)'
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
    tableName: 'payment_gateway_transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['transaction_uuid']
      },
      {
        fields: ['gateway']
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
        fields: ['payment_id']
      },
      {
        fields: ['initiated_at']
      },
      {
        fields: ['expires_at']
      },
      {
        name: 'idx_gateway_transactions_gateway_status',
        fields: ['gateway', 'status']
      },
      {
        name: 'idx_gateway_transactions_student_status',
        fields: ['student_id', 'status']
      }
    ]
  }
);

export { PaymentGatewayTransaction };
export default PaymentGatewayTransaction;
