import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  const columns = await queryInterface.describeTable('users');

  if (!Object.prototype.hasOwnProperty.call(columns, 'first_name')) {
    await queryInterface.addColumn('users', 'first_name', {
      type: DataTypes.STRING(50),
      allowNull: true,
    });
  }
  if (!Object.prototype.hasOwnProperty.call(columns, 'last_name')) {
    await queryInterface.addColumn('users', 'last_name', {
      type: DataTypes.STRING(50),
      allowNull: true,
    });
  }
}

export async function down(_queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  throw new Error('The user-name schema repair is non-destructive and cannot be rolled back automatically.');
}
