import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';
import * as createLibraryTables from './023-create-library-tables';

const LIBRARY_TABLES = ['books', 'circulations', 'reservations', 'library_fines'];

const tableNameOf = (table: unknown): string => {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object' && 'tableName' in table) {
    return String((table as { tableName: unknown }).tableName);
  }
  return String(table);
};

async function repeatSafeInterface(queryInterface: QueryInterface): Promise<QueryInterface> {
  const tableNames = new Set((await queryInterface.showAllTables()).map(name => tableNameOf(name).toLowerCase()));

  return new Proxy(queryInterface, {
    get(target, property) {
      if (property === 'createTable') {
        return async (
          tableName: string,
          attributes: Parameters<QueryInterface['createTable']>[1],
          options?: Parameters<QueryInterface['createTable']>[2],
        ) => {
          if (tableNames.has(tableName.toLowerCase())) return;
          await target.createTable(tableName, attributes as never, options as never);
          tableNames.add(tableName.toLowerCase());
        };
      }
      if (property === 'addIndex') {
        return async (tableName: string, fields: string[], options?: { name?: string }) => {
          const indexes = await target.showIndex(tableName) as unknown as Array<{ name: string }>;
          if (options?.name && indexes.some(index => index.name === options.name)) return;
          await target.addIndex(tableName, fields, options);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  await createLibraryTables.up(await repeatSafeInterface(queryInterface), sequelize);

  const existingTables = new Set((await queryInterface.showAllTables()).map(name => tableNameOf(name).toLowerCase()));
  for (const tableName of LIBRARY_TABLES) {
    if (!existingTables.has(tableName)) continue;
    const columns = await queryInterface.describeTable(tableName);
    const existingColumns = new Set(Object.keys(columns).map(name => name.toLowerCase()));
    if (!existingColumns.has('municipality_id')) {
      await queryInterface.addColumn(tableName, 'municipality_id', { type: DataTypes.CHAR(36), allowNull: true });
    }
    if (!existingColumns.has('school_config_id')) {
      await queryInterface.addColumn(tableName, 'school_config_id', { type: DataTypes.CHAR(36), allowNull: true });
    }
  }

  // Publisher is optional in the book form and validation contract.
  const bookColumns = await queryInterface.describeTable('books');
  if (bookColumns.publisher && bookColumns.publisher.allowNull === false) {
    await queryInterface.changeColumn('books', 'publisher', { type: DataTypes.STRING(255), allowNull: true });
  }
}

export async function down(_queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  throw new Error('The library schema repair migration is non-destructive and cannot be rolled back automatically.');
}
