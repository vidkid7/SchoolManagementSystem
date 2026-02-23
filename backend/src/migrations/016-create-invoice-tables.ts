import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Invoice Tables
 * Creates invoices and invoice_items tables
 * with proper foreign keys, indexes, and constraints
 * 
 * Requirements: 9.3, 9.10
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create invoices table
  await queryInterface.createTable('invoices', {
    invoice_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Unique invoice number (e.g., INV-2081-00001)'
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
    fee_structure_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'fee_structures',
        key: 'fee_structure_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Link to fee structure'
    },
    academic_year_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'academic_years',
        key: 'academic_year_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Link to academic year'
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Payment due date (YYYY-MM-DD)'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Subtotal before discount in NPR'
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Discount amount in NPR'
    },
    discount_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason for discount/concession'
    },
    discount_approval_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: true,
      comment: 'Approval status for discount'
    },
    discount_approved_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who approved the discount'
    },
    discount_approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when discount was approved'
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Total amount after discount in NPR'
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Amount paid so far in NPR'
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Remaining balance (total_amount - paid_amount) in NPR'
    },
    status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Invoice status'
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when invoice was generated'
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
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp'
    }
  });

  // Create invoice_items table
  await queryInterface.createTable('invoice_items', {
    invoice_item_id: {
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
    fee_component_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'fee_components',
        key: 'fee_component_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Link to fee component'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Description of the fee item'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount in NPR'
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

  // Create indexes for invoices
  await queryInterface.addIndex('invoices', ['invoice_number'], {
    unique: true,
    name: 'idx_invoices_invoice_number'
  });

  await queryInterface.addIndex('invoices', ['student_id'], {
    name: 'idx_invoices_student_id'
  });

  await queryInterface.addIndex('invoices', ['fee_structure_id'], {
    name: 'idx_invoices_fee_structure_id'
  });

  await queryInterface.addIndex('invoices', ['academic_year_id'], {
    name: 'idx_invoices_academic_year_id'
  });

  await queryInterface.addIndex('invoices', ['status'], {
    name: 'idx_invoices_status'
  });

  await queryInterface.addIndex('invoices', ['due_date'], {
    name: 'idx_invoices_due_date'
  });

  await queryInterface.addIndex('invoices', ['student_id', 'academic_year_id'], {
    name: 'idx_invoices_student_academic_year'
  });

  await queryInterface.addIndex('invoices', ['status', 'due_date'], {
    name: 'idx_invoices_status_due_date'
  });

  // Create indexes for invoice_items
  await queryInterface.addIndex('invoice_items', ['invoice_id'], {
    name: 'idx_invoice_items_invoice_id'
  });

  await queryInterface.addIndex('invoice_items', ['fee_component_id'], {
    name: 'idx_invoice_items_fee_component_id'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await queryInterface.dropTable('invoice_items');
  await queryInterface.dropTable('invoices');
}
