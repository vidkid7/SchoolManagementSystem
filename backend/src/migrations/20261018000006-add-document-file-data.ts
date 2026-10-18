import { DataTypes, QueryInterface } from 'sequelize';

/** Store uploaded document bytes in TiDB so they survive Render instance replacement. */
export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes('documents')) return;

  const columns = await queryInterface.describeTable('documents');
  if (columns.file_data) return;

  await queryInterface.addColumn('documents', 'file_data', {
    type: DataTypes.BLOB('medium'),
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes('documents')) return;

  const columns = await queryInterface.describeTable('documents');
  if (columns.file_data) await queryInterface.removeColumn('documents', 'file_data');
}
