import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Update staff emergency_contact field size
 * Increases emergency_contact from VARCHAR(20) to VARCHAR(100)
 * to accommodate "Name: PhoneNumber" format
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('staff', 'emergency_contact', {
    type: DataTypes.STRING(100),
    allowNull: true
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.changeColumn('staff', 'emergency_contact', {
    type: DataTypes.STRING(20),
    allowNull: true
  });
}
