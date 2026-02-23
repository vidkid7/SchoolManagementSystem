import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Fee Structure Tables
 * Creates fee_structures and fee_components tables
 * with proper foreign keys, indexes, and constraints
 * 
 * Requirements: 9.1, 9.2
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create fee_structures table
  await queryInterface.createTable('fee_structures', {
    fee_structure_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Name of the fee structure (e.g., "Class 1-5 Morning Shift 2081")'
    },
    applicable_classes: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of grade levels [1,2,3...12]'
    },
    applicable_shifts: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of shifts ["morning", "day", "evening"]'
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
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total amount of all fee components in NPR'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this fee structure is currently active'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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

  // Create fee_components table
  await queryInterface.createTable('fee_components', {
    fee_component_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    fee_structure_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'fee_structures',
        key: 'fee_structure_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Link to fee structure'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Name of the fee component (e.g., "Admission Fee", "Monthly Tuition")'
    },
    type: {
      type: DataTypes.ENUM(
        'admission',
        'annual',
        'monthly',
        'exam',
        'transport',
        'hostel',
        'library',
        'lab',
        'eca',
        'development'
      ),
      allowNull: false,
      comment: 'Type of fee component'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount in NPR'
    },
    frequency: {
      type: DataTypes.ENUM('one_time', 'monthly', 'quarterly', 'annual'),
      allowNull: false,
      comment: 'How often this fee is charged'
    },
    is_mandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this fee component is mandatory'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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

  // Create indexes for fee_structures
  await queryInterface.addIndex('fee_structures', ['academic_year_id'], {
    name: 'idx_fee_structures_academic_year_id'
  });

  await queryInterface.addIndex('fee_structures', ['is_active'], {
    name: 'idx_fee_structures_is_active'
  });

  await queryInterface.addIndex('fee_structures', ['academic_year_id', 'is_active'], {
    name: 'idx_fee_structures_academic_year_active'
  });

  // Create indexes for fee_components
  await queryInterface.addIndex('fee_components', ['fee_structure_id'], {
    name: 'idx_fee_components_fee_structure_id'
  });

  await queryInterface.addIndex('fee_components', ['type'], {
    name: 'idx_fee_components_type'
  });

  await queryInterface.addIndex('fee_components', ['frequency'], {
    name: 'idx_fee_components_frequency'
  });

  await queryInterface.addIndex('fee_components', ['fee_structure_id', 'type'], {
    name: 'idx_fee_components_structure_type'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await queryInterface.dropTable('fee_components');
  await queryInterface.dropTable('fee_structures');
}
