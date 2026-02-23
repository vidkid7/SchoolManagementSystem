import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create refunds table
 * Tracks refund requests with approval workflow
 * 
 * Requirements: 9.14
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('refunds', {
    refund_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: 'Primary key'
    },
    payment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'payments',
        key: 'payment_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Link to payment being refunded'
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
      comment: 'Refund amount in NPR'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Reason for refund request'
    },
    requested_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'User who requested the refund'
    },
    requested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when refund was requested'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Refund status'
    },
    approved_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who approved the refund'
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when refund was approved'
    },
    rejected_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who rejected the refund'
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when refund was rejected'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for rejection'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when refund was completed'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional remarks or notes'
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
  await queryInterface.addIndex('refunds', ['payment_id'], {
    name: 'idx_refunds_payment_id'
  });

  await queryInterface.addIndex('refunds', ['invoice_id'], {
    name: 'idx_refunds_invoice_id'
  });

  await queryInterface.addIndex('refunds', ['student_id'], {
    name: 'idx_refunds_student_id'
  });

  await queryInterface.addIndex('refunds', ['status'], {
    name: 'idx_refunds_status'
  });

  await queryInterface.addIndex('refunds', ['requested_by'], {
    name: 'idx_refunds_requested_by'
  });

  await queryInterface.addIndex('refunds', ['approved_by'], {
    name: 'idx_refunds_approved_by'
  });

  await queryInterface.addIndex('refunds', ['student_id', 'status'], {
    name: 'idx_refunds_student_status'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('refunds');
}
