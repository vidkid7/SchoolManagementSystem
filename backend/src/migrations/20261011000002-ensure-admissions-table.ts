import { DataTypes, QueryInterface } from 'sequelize';
import { up as createAdmissionsTable } from './007-create-admissions-table';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object') {
    const value = Object.values(table as Record<string, unknown>)[0];
    if (typeof value === 'string') return value;
  }
  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function ensureColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<void> {
  const columns = await queryInterface.describeTable(tableName);
  if (!Object.prototype.hasOwnProperty.call(columns, columnName)) {
    await queryInterface.addColumn(tableName, columnName, { type: DataTypes.UUID, allowNull: true });
  }
}

async function ensureIndex(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
  name: string
): Promise<void> {
  const indexes = await queryInterface.showIndex(tableName) as Array<{ name: string }>;
  if (!indexes.some(index => index.name === name)) {
    await queryInterface.addIndex(tableName, [columnName], { name });
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, 'admissions'))) {
    await createAdmissionsTable(queryInterface);
  }

  // Historical tenant migrations ran before this table existed, so make sure
  // both columns used by admission queries are present on installations that
  // already recorded those migrations as complete.
  await ensureColumn(queryInterface, 'admissions', 'municipality_id');
  await ensureColumn(queryInterface, 'admissions', 'school_config_id');
  await ensureIndex(queryInterface, 'admissions', 'municipality_id', 'idx_admissions_municipality_id');
  await ensureIndex(queryInterface, 'admissions', 'school_config_id', 'idx_admissions_school_config_id');
}

// Preserve admission records if a release is rolled back.
export async function down(_queryInterface: QueryInterface): Promise<void> {}
