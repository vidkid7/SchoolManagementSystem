import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create fee_reminders table
 * 
 * This table tracks SMS reminders sent for overdue fee invoices
 * Requirements: 9.13
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('fee_reminders', {
    fee_reminder_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: 'Primary key'
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
      onDelete: 'CASCADE',
      comment: 'Link to student'
    },
    reminder_type: {
      type: DataTypes.ENUM('first', 'second', 'third', 'final'),
      allowNull: false,
      comment: 'Type of reminder (first, second, third, final)'
    },
    days_overdue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Number of days overdue when reminder was sent'
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Phone number where reminder was sent'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'SMS message content'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'delivered'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Reminder status'
    },
    sms_gateway_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'SMS gateway message ID for tracking'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when reminder was sent'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when reminder was delivered'
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for failure if status is failed'
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

  // Create indexes for efficient querying
  await queryInterface.addIndex('fee_reminders', ['invoice_id'], {
    name: 'idx_fee_reminders_invoice_id'
  });

  await queryInterface.addIndex('fee_reminders', ['student_id'], {
    name: 'idx_fee_reminders_student_id'
  });

  await queryInterface.addIndex('fee_reminders', ['status'], {
    name: 'idx_fee_reminders_status'
  });

  await queryInterface.addIndex('fee_reminders', ['sent_at'], {
    name: 'idx_fee_reminders_sent_at'
  });

  // Composite index for finding reminders by invoice and type
  await queryInterface.addIndex('fee_reminders', ['invoice_id', 'reminder_type'], {
    name: 'idx_fee_reminders_invoice_type'
  });

  // Composite index for finding reminders by student and status
  await queryInterface.addIndex('fee_reminders', ['student_id', 'status'], {
    name: 'idx_fee_reminders_student_status'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('fee_reminders');
}
