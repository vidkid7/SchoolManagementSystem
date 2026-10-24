import { DataTypes, QueryInterface } from 'sequelize';

const tableName = 'school_config';

async function getColumns(queryInterface: QueryInterface): Promise<Record<string, unknown> | null> {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return null;
  }
}

const columns = {
  city: { type: DataTypes.STRING(100), allowNull: true },
  district: { type: DataTypes.STRING(100), allowNull: true },
  province: { type: DataTypes.STRING(100), allowNull: true },
  postal_code: { type: DataTypes.STRING(20), allowNull: true },
  established_year: { type: DataTypes.INTEGER, allowNull: true },
  affiliation_number: { type: DataTypes.STRING(100), allowNull: true },
  principal_name: { type: DataTypes.STRING(255), allowNull: true },
  principal_name_np: { type: DataTypes.STRING(255), allowNull: true },
  primary_color: { type: DataTypes.STRING(20), allowNull: true },
  secondary_color: { type: DataTypes.STRING(20), allowNull: true },
  accent_color: { type: DataTypes.STRING(20), allowNull: true },
};

export async function up(queryInterface: QueryInterface): Promise<void> {
  const existingColumns = await getColumns(queryInterface);
  if (!existingColumns) return;

  for (const [name, definition] of Object.entries(columns)) {
    if (!Object.prototype.hasOwnProperty.call(existingColumns, name)) {
      await queryInterface.addColumn(tableName, name, definition);
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const existingColumns = await getColumns(queryInterface);
  if (!existingColumns) return;

  for (const name of Object.keys(columns).reverse()) {
    if (Object.prototype.hasOwnProperty.call(existingColumns, name)) {
      await queryInterface.removeColumn(tableName, name);
    }
  }
}
