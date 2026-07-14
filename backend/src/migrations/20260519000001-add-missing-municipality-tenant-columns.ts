import { DataTypes, QueryInterface } from 'sequelize';

const TABLES = ['notification_templates', 'archive_metadata'];

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') {
    return table;
  }

  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }

  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function hasColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const description = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(description, columnName);
  } catch {
    return false;
  }
}

async function hasIndex(
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<boolean> {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  return indexes.some((index) => index.name === indexName);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const tableName of TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }

    if (!(await hasColumn(queryInterface, tableName, 'municipality_id'))) {
      await queryInterface.addColumn(tableName, 'municipality_id', {
        type: DataTypes.UUID,
        allowNull: true,
      });
    }

    const indexName = `idx_${tableName}_municipality_id`;
    if (!(await hasIndex(queryInterface, tableName, indexName))) {
      await queryInterface.addIndex(tableName, ['municipality_id'], { name: indexName });
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const tableName of [...TABLES].reverse()) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }

    const indexName = `idx_${tableName}_municipality_id`;
    if (await hasIndex(queryInterface, tableName, indexName)) {
      await queryInterface.removeIndex(tableName, indexName);
    }

    if (await hasColumn(queryInterface, tableName, 'municipality_id')) {
      await queryInterface.removeColumn(tableName, 'municipality_id');
    }
  }
}
