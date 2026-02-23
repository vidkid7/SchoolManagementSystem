import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Add Password Reset Fields to Users Table
 * Adds password_reset_token and password_reset_expires fields
 * Requirements: 1.11
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('users', 'password_reset_token', {
    type: DataTypes.STRING(255),
    allowNull: true
  });

  await queryInterface.addColumn('users', 'password_reset_expires', {
    type: DataTypes.DATE,
    allowNull: true
  });

  // Add index for faster lookups
  await queryInterface.addIndex('users', ['password_reset_token'], {
    name: 'idx_users_password_reset_token'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('users', 'idx_users_password_reset_token');
  await queryInterface.removeColumn('users', 'password_reset_expires');
  await queryInterface.removeColumn('users', 'password_reset_token');
}
