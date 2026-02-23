import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Add soft delete support to staff table
 * Requirements: 40.3 - Soft delete preservation
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add deleted_at column to staff table
  await queryInterface.addColumn('staff', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  });

  console.log('✅ Added deleted_at column to staff table');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove deleted_at column from staff table
  await queryInterface.removeColumn('staff', 'deleted_at');
  
  console.log('✅ Removed deleted_at column from staff table');
}
