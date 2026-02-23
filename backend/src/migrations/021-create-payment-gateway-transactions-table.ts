import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Payment Gateway Transactions Table
 * Creates table for tracking payment gateway transactions (eSewa, Khalti, IME Pay)
 * 
 * Requirements: 32.1, 32.6, 32.7
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create payment_gateway_transactions table
  await queryInterface.createTable('payment_gateway_transactions', {
    transaction_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    transaction_uuid: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Unique transaction UUID for gateway'
    },
    gateway: {
      type: DataTypes.ENUM('esewa', 'khalti', 'ime_pay'),
      allowNull: false,
      comment: 'Payment gateway used'
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
      comment: 'Transaction amount in NPR'
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Product code for gateway (e.g., EPAYTEST for eSewa test)'
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Transaction status'
    },
    initiated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When transaction was initiated'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When transaction was completed (success or failed)'
    },
    gateway_response: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Raw response from payment gateway'
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Signature for transaction verification'
    },
    verification_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Data used for signature verification'
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for transaction failure'
    },
    payment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'payment_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Link to payment record (after successful transaction)'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Transaction expiry time (typically 30 minutes)'
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

  // Create indexes
  await queryInterface.addIndex('payment_gateway_transactions', ['transaction_uuid'], {
    unique: true,
    name: 'idx_gateway_transactions_uuid'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['gateway'], {
    name: 'idx_gateway_transactions_gateway'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['invoice_id'], {
    name: 'idx_gateway_transactions_invoice_id'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['student_id'], {
    name: 'idx_gateway_transactions_student_id'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['status'], {
    name: 'idx_gateway_transactions_status'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['payment_id'], {
    name: 'idx_gateway_transactions_payment_id'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['initiated_at'], {
    name: 'idx_gateway_transactions_initiated_at'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['expires_at'], {
    name: 'idx_gateway_transactions_expires_at'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['gateway', 'status'], {
    name: 'idx_gateway_transactions_gateway_status'
  });

  await queryInterface.addIndex('payment_gateway_transactions', ['student_id', 'status'], {
    name: 'idx_gateway_transactions_student_status'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('payment_gateway_transactions');
}
