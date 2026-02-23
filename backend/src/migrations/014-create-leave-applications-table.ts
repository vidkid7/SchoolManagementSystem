import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Leave Applications Table
 * Creates leave_applications table with approval workflow support
 * 
 * Requirements: 6.11, 6.12
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create leave_applications table
  await queryInterface.createTable('leave_applications', {
    leave_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Leave start date'
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Leave end date'
    },
    start_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Start date in Bikram Sambat format'
    },
    end_date_bs: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'End date in Bikram Sambat format'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Reason for leave application'
    },
    applied_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'User who applied (student or parent)'
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when leave was applied'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    approved_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'User who approved/rejected the leave'
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when leave was approved/rejected'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for rejection (if rejected)'
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
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  // Create indexes for leave_applications
  await queryInterface.addIndex('leave_applications', ['student_id'], {
    name: 'idx_leave_student_id'
  });

  await queryInterface.addIndex('leave_applications', ['status'], {
    name: 'idx_leave_status'
  });

  await queryInterface.addIndex('leave_applications', ['start_date', 'end_date'], {
    name: 'idx_leave_dates'
  });

  await queryInterface.addIndex('leave_applications', ['applied_by'], {
    name: 'idx_leave_applied_by'
  });

  await queryInterface.addIndex('leave_applications', ['approved_by'], {
    name: 'idx_leave_approved_by'
  });

  await queryInterface.addIndex('leave_applications', ['student_id', 'status'], {
    name: 'idx_leave_student_status'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('leave_applications');
}
