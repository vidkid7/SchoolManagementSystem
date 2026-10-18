import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

/**
 * Ensure the exams column used by the current Exam model exists in deployed
 * databases. The original 024 migration was not registered in the release
 * migration runner, so some existing databases can be missing this column.
 */
export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  const columns = await queryInterface.describeTable('exams');

  if (!Object.prototype.hasOwnProperty.call(columns, 'is_internal')) {
    await queryInterface.addColumn('exams', 'is_internal', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }
}

export async function down(_queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  throw new Error('The exam schema repair migration is non-destructive and cannot be rolled back automatically.');
}
