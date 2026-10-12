import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize';
import * as createEcaTables from './025-create-eca-tables';
import * as createSportsTables from './026-create-sports-tables';
import * as createSportsEnrollments from './027-create-sports-enrollments-table';

const TENANT_TABLES = [
  'ecas',
  'eca_enrollments',
  'eca_events',
  'eca_achievements',
  'sports',
  'teams',
  'tournaments',
  'sports_enrollments',
  'sports_achievements',
];

const tableNameOf = (table: unknown): string => {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object' && 'tableName' in table) {
    return String((table as { tableName: unknown }).tableName);
  }
  return String(table);
};

const createRepeatSafeQueryInterface = async (queryInterface: QueryInterface): Promise<QueryInterface> => {
  const existingTables = new Set((await queryInterface.showAllTables()).map(tableNameOf));

  return new Proxy(queryInterface, {
    get(target, property) {
      if (property === 'createTable') {
        return async (
          tableName: string,
          attributes: Parameters<QueryInterface['createTable']>[1],
          options?: Parameters<QueryInterface['createTable']>[2],
        ) => {
          if (existingTables.has(tableName)) return;
          await target.createTable(tableName, attributes as never, options as never);
          existingTables.add(tableName);
        };
      }

      if (property === 'addIndex') {
        return async (tableName: string, fields: string[], options?: { name?: string }) => {
          const existingIndexes = (await target.showIndex(tableName)) as unknown as Array<{ name: string }>;
          if (options?.name && existingIndexes.some(index => index.name === options.name)) return;
          await target.addIndex(tableName, fields, options);
        };
      }

      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
};

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  const repeatSafeQueryInterface = await createRepeatSafeQueryInterface(queryInterface);

  await createEcaTables.up(repeatSafeQueryInterface, sequelize);
  await createSportsTables.up(repeatSafeQueryInterface, sequelize);
  await createSportsEnrollments.up(repeatSafeQueryInterface, sequelize);

  for (const tableName of TENANT_TABLES) {
    const tableColumns = await queryInterface.describeTable(tableName);
    const existingColumns = new Set(Object.keys(tableColumns).map(column => column.toLowerCase()));

    if (!existingColumns.has('municipality_id')) {
      await queryInterface.addColumn(tableName, 'municipality_id', {
        type: DataTypes.CHAR(36),
        allowNull: true,
      });
    }
    if (!existingColumns.has('school_config_id')) {
      await queryInterface.addColumn(tableName, 'school_config_id', {
        type: DataTypes.CHAR(36),
        allowNull: true,
      });
    }
  }
}

export async function down(_queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  throw new Error('The ECA and sports schema migration is non-destructive and cannot be rolled back automatically.');
}
