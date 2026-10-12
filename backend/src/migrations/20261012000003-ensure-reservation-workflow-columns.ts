import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';

const RESERVATION_COLUMNS = {
  available_date: { type: DataTypes.DATEONLY, allowNull: true },
  queue_position: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  cancelled_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
} as const;

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  const columns = await queryInterface.describeTable('reservations');
  const existingColumns = new Set(Object.keys(columns).map(name => name.toLowerCase()));

  for (const [name, definition] of Object.entries(RESERVATION_COLUMNS)) {
    if (!existingColumns.has(name)) {
      await queryInterface.addColumn('reservations', name, definition);
    }
  }

  // The original table migration predates the "available" reservation state.
  // Extend a MySQL/TiDB ENUM only when it does not already contain that value.
  const statusType = String(columns.status?.type ?? '').toUpperCase();
  if (statusType.startsWith('ENUM(') && !statusType.includes("'AVAILABLE'")) {
    await queryInterface.changeColumn('reservations', 'status', {
      type: DataTypes.ENUM('pending', 'available', 'fulfilled', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });
  }
}

export async function down(_queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  throw new Error('The reservation schema repair migration is non-destructive and cannot be rolled back automatically.');
}
