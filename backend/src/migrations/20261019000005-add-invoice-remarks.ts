import { DataTypes, QueryInterface } from 'sequelize';

async function getInvoiceColumns(queryInterface: QueryInterface): Promise<Record<string, unknown> | null> {
  try {
    return await queryInterface.describeTable('invoices');
  } catch {
    return null;
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const columns = await getInvoiceColumns(queryInterface);
  if (!columns || Object.prototype.hasOwnProperty.call(columns, 'remarks')) return;

  await queryInterface.addColumn('invoices', 'remarks', {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Optional invoice notes',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const columns = await getInvoiceColumns(queryInterface);
  if (columns && Object.prototype.hasOwnProperty.call(columns, 'remarks')) {
    await queryInterface.removeColumn('invoices', 'remarks');
  }
}
