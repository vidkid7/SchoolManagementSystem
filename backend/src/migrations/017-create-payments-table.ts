import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Payments Table
 * Creates payments table for tracking fee payments
 * with support for multiple payment methods including Nepal payment gateways
 * 
 * Requirements: 9.5, 9.7, 9.8, 9.9, 9.11
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create installment_plans table FIRST (without foreign keys that reference payments)
  await queryInterface.createTable('installment_plans', {
    installment_plan_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    invoice_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'invoice_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Link to invoice'
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Link to student'
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Total amount to be paid in installments'
    },
    number_of_installments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Total number of installments'
    },
    installment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount per installment'
    },
    frequency: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'custom'),
      allowNull: false,
      comment: 'Frequency of installments'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Start date of installment plan'
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Status of installment plan'
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'User who created the installment plan'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Create payments table SECOND (now installment_plans exists)
  await queryInterface.createTable('payments', {
    payment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Unique receipt number (e.g., RCP-2081-00001)'
    },
    invoice_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'invoice_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Link to invoice'
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Link to student'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Payment amount in NPR'
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay'),
      allowNull: false,
      comment: 'Payment method used'
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date of payment (YYYY-MM-DD)'
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Transaction ID from payment gateway (for online payments)'
    },
    gateway_response: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Raw response from payment gateway'
    },
    received_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'User (accountant) who received the payment'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional remarks or notes'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'completed',
      comment: 'Payment status'
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'QR code data for receipt verification'
    },
    installment_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Installment number if part of installment plan'
    },
    installment_plan_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'installment_plans',
        key: 'installment_plan_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Link to installment plan if applicable'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Create indexes for installment_plans
  await queryInterface.addIndex('installment_plans', ['invoice_id'], {
    name: 'idx_installment_plans_invoice_id'
  });

  await queryInterface.addIndex('installment_plans', ['student_id'], {
    name: 'idx_installment_plans_student_id'
  });

  await queryInterface.addIndex('installment_plans', ['status'], {
    name: 'idx_installment_plans_status'
  });

  // Create indexes for payments
  await queryInterface.addIndex('payments', ['receipt_number'], {
    unique: true,
    name: 'idx_payments_receipt_number'
  });

  await queryInterface.addIndex('payments', ['invoice_id'], {
    name: 'idx_payments_invoice_id'
  });

  await queryInterface.addIndex('payments', ['student_id'], {
    name: 'idx_payments_student_id'
  });

  await queryInterface.addIndex('payments', ['payment_method'], {
    name: 'idx_payments_payment_method'
  });

  await queryInterface.addIndex('payments', ['payment_date'], {
    name: 'idx_payments_payment_date'
  });

  await queryInterface.addIndex('payments', ['status'], {
    name: 'idx_payments_status'
  });

  await queryInterface.addIndex('payments', ['transaction_id'], {
    name: 'idx_payments_transaction_id'
  });

  await queryInterface.addIndex('payments', ['installment_plan_id'], {
    name: 'idx_payments_installment_plan_id'
  });

  await queryInterface.addIndex('payments', ['student_id', 'payment_date'], {
    name: 'idx_payments_student_date'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await queryInterface.dropTable('payments');
  await queryInterface.dropTable('installment_plans');
}
