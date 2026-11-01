import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const columns = await queryInterface.describeTable('users');
  if (!Object.prototype.hasOwnProperty.call(columns, 'is_system_account')) {
    await queryInterface.addColumn('users', 'is_system_account', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const columns = await queryInterface.describeTable('users');
  if (Object.prototype.hasOwnProperty.call(columns, 'is_system_account')) {
    await queryInterface.removeColumn('users', 'is_system_account');
  }
}
