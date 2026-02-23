import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create reminder_config table
 * 
 * This table stores configurable reminder intervals and settings
 * Requirements: 9.13
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('reminder_config', {
    reminder_config_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: 'Primary key'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Configuration name (e.g., "default", "strict", "lenient")'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of this configuration'
    },
    first_reminder_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: 'Days after due date to send first reminder'
    },
    second_reminder_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      comment: 'Days after due date to send second reminder'
    },
    third_reminder_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 14,
      comment: 'Days after due date to send third reminder'
    },
    final_reminder_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: 'Days after due date to send final reminder'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this configuration is active'
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this is the default configuration'
    },
    message_template_first: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SMS template for first reminder. Variables: {studentName}, {amount}, {dueDate}, {invoiceNumber}'
    },
    message_template_second: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SMS template for second reminder'
    },
    message_template_third: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SMS template for third reminder'
    },
    message_template_final: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SMS template for final reminder'
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
  await queryInterface.addIndex('reminder_config', ['is_active'], {
    name: 'idx_reminder_config_is_active'
  });

  await queryInterface.addIndex('reminder_config', ['is_default'], {
    name: 'idx_reminder_config_is_default'
  });

  // Insert default configuration
  await queryInterface.bulkInsert('reminder_config', [
    {
      name: 'default',
      description: 'Default reminder configuration',
      first_reminder_days: 3,
      second_reminder_days: 7,
      third_reminder_days: 14,
      final_reminder_days: 30,
      is_active: true,
      is_default: true,
      message_template_first: 'Dear Parent, Fee payment of NPR {amount} for {studentName} is overdue by {daysOverdue} days. Invoice: {invoiceNumber}. Please pay at the earliest. - School',
      message_template_second: 'Reminder: Fee payment of NPR {amount} for {studentName} is still pending (overdue by {daysOverdue} days). Invoice: {invoiceNumber}. Please clear dues immediately. - School',
      message_template_third: 'URGENT: Fee payment of NPR {amount} for {studentName} is overdue by {daysOverdue} days. Invoice: {invoiceNumber}. Please contact school office. - School',
      message_template_final: 'FINAL NOTICE: Fee payment of NPR {amount} for {studentName} is overdue by {daysOverdue} days. Invoice: {invoiceNumber}. Immediate action required. - School',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('reminder_config');
}
