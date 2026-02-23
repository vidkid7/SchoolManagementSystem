import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/database';

/**
 * Invoice Status Enum
 */
export enum InvoiceStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

/**
 * Discount Approval Status Enum
 */
export enum DiscountApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Invoice Item Attributes Interface
 */
export interface InvoiceItemAttributes {
  invoiceItemId: number;
  invoiceId: number;
  feeComponentId: number;
  description: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Invoice Item Creation Attributes
 */
export interface InvoiceItemCreationAttributes extends Optional<InvoiceItemAttributes,
  'invoiceItemId' | 'createdAt' | 'updatedAt'> {}

/**
 * Invoice Item Model Class
 */
class InvoiceItem extends Model<InvoiceItemAttributes, InvoiceItemCreationAttributes> 
  implements InvoiceItemAttributes {
  public invoiceItemId!: number;
  public invoiceId!: number;
  public feeComponentId!: number;
  public description!: string;
  public amount!: number;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/**
 * Initialize Invoice Item Model
 */
InvoiceItem.init(
  {
    invoiceItemId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'invoice_item_id'
    },
    invoiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'invoice_id',
      references: {
        model: 'invoices',
        key: 'invoice_id'
      }
    },
    feeComponentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'fee_component_id',
      references: {
        model: 'fee_components',
        key: 'fee_component_id'
      },
      comment: 'Link to fee component'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: 'Description of the fee item'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Amount in NPR'
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
    tableName: 'invoice_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['invoice_id']
      },
      {
        fields: ['fee_component_id']
      }
    ]
  }
);

/**
 * Invoice Attributes Interface
 */
export interface InvoiceAttributes {
  invoiceId: number;
  invoiceNumber: string;
  studentId: number;
  feeStructureId: number;
  academicYearId: number;
  dueDate: string;
  subtotal: number;
  discount: number;
  discountReason?: string;
  discountApprovalStatus?: DiscountApprovalStatus;
  discountApprovedBy?: number;
  discountApprovedAt?: Date;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  generatedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Invoice Creation Attributes
 */
export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes,
  'invoiceId' | 'paidAmount' | 'balance' | 'status' | 'generatedAt' | 
  'discountReason' | 'discountApprovalStatus' | 'discountApprovedBy' | 
  'discountApprovedAt' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * Invoice Model Class
 */
class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> 
  implements InvoiceAttributes {
  public invoiceId!: number;
  public invoiceNumber!: string;
  public studentId!: number;
  public feeStructureId!: number;
  public academicYearId!: number;
  public dueDate!: string;
  public subtotal!: number;
  public discount!: number;
  public discountReason?: string;
  public discountApprovalStatus?: DiscountApprovalStatus;
  public discountApprovedBy?: number;
  public discountApprovedAt?: Date;
  public totalAmount!: number;
  public paidAmount!: number;
  public balance!: number;
  public status!: InvoiceStatus;
  public generatedAt!: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // Association properties
  public readonly invoiceItems?: InvoiceItem[];

  /**
   * Calculate balance: total_amount - paid_amount
   */
  public calculateBalance(): number {
    const total = typeof this.totalAmount === 'number' ? this.totalAmount : Number(this.totalAmount);
    const paid = typeof this.paidAmount === 'number' ? this.paidAmount : Number(this.paidAmount);
    return total - paid;
  }

  /**
   * Update invoice status based on balance
   * - pending: balance === totalAmount (no payment)
   * - partial: 0 < balance < totalAmount (partial payment)
   * - paid: balance === 0 (fully paid)
   * - overdue: balance > 0 && dueDate < today
   */
  public updateStatus(): InvoiceStatus {
    const balance = this.calculateBalance();
    const total = typeof this.totalAmount === 'number' ? this.totalAmount : Number(this.totalAmount);
    const today = new Date();
    const dueDate = new Date(this.dueDate);

    if (balance === 0) {
      return InvoiceStatus.PAID;
    } else if (balance === total) {
      // Check if overdue
      if (dueDate < today) {
        return InvoiceStatus.OVERDUE;
      }
      return InvoiceStatus.PENDING;
    } else {
      // Partial payment
      if (dueDate < today) {
        return InvoiceStatus.OVERDUE;
      }
      return InvoiceStatus.PARTIAL;
    }
  }

  /**
   * Apply discount to invoice
   */
  public applyDiscount(discountAmount: number, reason?: string): void {
    const subtotal = typeof this.subtotal === 'number' ? this.subtotal : Number(this.subtotal);
    
    if (discountAmount < 0) {
      throw new Error('Discount amount cannot be negative');
    }
    if (discountAmount > subtotal) {
      throw new Error('Discount amount cannot exceed subtotal');
    }

    this.discount = discountAmount;
    this.discountReason = reason;
    this.totalAmount = subtotal - discountAmount;
    this.balance = this.calculateBalance();
    this.status = this.updateStatus();
  }

  /**
   * Record payment
   */
  public recordPayment(amount: number): void {
    const balance = this.calculateBalance();
    const paid = typeof this.paidAmount === 'number' ? this.paidAmount : Number(this.paidAmount);
    
    if (amount < 0) {
      throw new Error('Payment amount cannot be negative');
    }
    if (amount > balance) {
      throw new Error('Payment amount cannot exceed balance');
    }

    this.paidAmount = paid + amount;
    this.balance = this.calculateBalance();
    this.status = this.updateStatus();
  }

  /**
   * Check if invoice is overdue
   */
  public isOverdue(): boolean {
    const balance = this.calculateBalance();
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    return balance > 0 && dueDate < today;
  }

  /**
   * Check if discount requires approval
   */
  public requiresDiscountApproval(): boolean {
    const discount = typeof this.discount === 'number' ? this.discount : Number(this.discount);
    return discount > 0 && 
           (!this.discountApprovalStatus || 
            this.discountApprovalStatus === DiscountApprovalStatus.PENDING);
  }

  /**
   * Approve discount
   */
  public approveDiscount(approvedBy: number): void {
    const discount = typeof this.discount === 'number' ? this.discount : Number(this.discount);
    if (discount === 0) {
      throw new Error('No discount to approve');
    }
    this.discountApprovalStatus = DiscountApprovalStatus.APPROVED;
    this.discountApprovedBy = approvedBy;
    this.discountApprovedAt = new Date();
  }

  /**
   * Reject discount
   */
  public rejectDiscount(): void {
    const discount = typeof this.discount === 'number' ? this.discount : Number(this.discount);
    const subtotal = typeof this.subtotal === 'number' ? this.subtotal : Number(this.subtotal);
    
    if (discount === 0) {
      throw new Error('No discount to reject');
    }
    // Revert discount
    this.totalAmount = subtotal;
    this.discount = 0;
    this.discountReason = undefined;
    this.discountApprovalStatus = DiscountApprovalStatus.REJECTED;
    this.balance = this.calculateBalance();
    this.status = this.updateStatus();
  }
}

/**
 * Initialize Invoice Model
 */
Invoice.init(
  {
    invoiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: 'invoice_id'
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'invoice_number',
      validate: {
        notEmpty: true,
        len: [1, 50]
      },
      comment: 'Unique invoice number (e.g., INV-2081-00001)'
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
    feeStructureId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'fee_structure_id',
      references: {
        model: 'fee_structures',
        key: 'fee_structure_id'
      },
      comment: 'Link to fee structure'
    },
    academicYearId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'academic_year_id',
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      comment: 'Link to academic year'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date',
      comment: 'Payment due date (YYYY-MM-DD)'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Subtotal before discount in NPR'
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Discount amount in NPR'
    },
    discountReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'discount_reason',
      comment: 'Reason for discount/concession'
    },
    discountApprovalStatus: {
      type: DataTypes.ENUM(...Object.values(DiscountApprovalStatus)),
      allowNull: true,
      field: 'discount_approval_status',
      comment: 'Approval status for discount'
    },
    discountApprovedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'discount_approved_by',
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: 'User who approved the discount'
    },
    discountApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'discount_approved_at',
      comment: 'Timestamp when discount was approved'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
      validate: {
        min: 0
      },
      comment: 'Total amount after discount in NPR'
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'paid_amount',
      validate: {
        min: 0
      },
      comment: 'Amount paid so far in NPR'
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'balance',
      validate: {
        min: 0
      },
      comment: 'Remaining balance (total_amount - paid_amount) in NPR'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
      allowNull: false,
      defaultValue: InvoiceStatus.PENDING,
      comment: 'Invoice status'
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'generated_at',
      comment: 'Timestamp when invoice was generated'
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
      field: 'deleted_at',
      comment: 'Soft delete timestamp'
    }
  },
  {
    sequelize,
    tableName: 'invoices',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['invoice_number']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['fee_structure_id']
      },
      {
        fields: ['academic_year_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['due_date']
      },
      {
        name: 'idx_invoices_student_academic_year',
        fields: ['student_id', 'academic_year_id']
      },
      {
        name: 'idx_invoices_status_due_date',
        fields: ['status', 'due_date']
      }
    ]
  }
);

// Define associations
Invoice.hasMany(InvoiceItem, {
  foreignKey: 'invoiceId',
  as: 'invoiceItems',
  onDelete: 'CASCADE'
});

InvoiceItem.belongsTo(Invoice, {
  foreignKey: 'invoiceId',
  as: 'invoice'
});

export { Invoice, InvoiceItem };
export default Invoice;
