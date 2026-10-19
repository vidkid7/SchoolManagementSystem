import { DataTypes, QueryInterface } from 'sequelize';
import { up as createRefundsTable } from './020-create-refunds-table';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (values.length > 0 && typeof values[0] === 'string') return values[0];
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
  const indexes = await queryInterface.showIndex(tableName) as Array<{ name: string }>;
  return indexes.some((index) => index.name === indexName);
}

async function hasForeignKey(
  queryInterface: QueryInterface,
  columnName: string
): Promise<boolean> {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'refunds'
       AND COLUMN_NAME = :columnName
       AND REFERENCED_TABLE_NAME IS NOT NULL
     LIMIT 1`,
    { replacements: { columnName } }
  );
  return (rows as Array<{ CONSTRAINT_NAME: string }>).length > 0;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, 'refunds'))) {
    await createRefundsTable(queryInterface);
  }

  if (await hasTable(queryInterface, 'school_config')) {
    if (!(await hasColumn(queryInterface, 'refunds', 'school_config_id'))) {
      await queryInterface.addColumn('refunds', 'school_config_id', {
        type: DataTypes.UUID,
        allowNull: true,
      });
    }

    if (!(await hasForeignKey(queryInterface, 'school_config_id'))) {
      await queryInterface.addConstraint('refunds', {
        fields: ['school_config_id'],
        type: 'foreign key',
        name: 'fk_refunds_school_config_id',
        references: { table: 'school_config', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!(await hasIndex(queryInterface, 'refunds', 'idx_refunds_school_config_id'))) {
      await queryInterface.addIndex('refunds', ['school_config_id'], {
        name: 'idx_refunds_school_config_id',
      });
    }
  }

  if (await hasTable(queryInterface, 'municipalities')) {
    if (!(await hasColumn(queryInterface, 'refunds', 'municipality_id'))) {
      await queryInterface.addColumn('refunds', 'municipality_id', {
        type: DataTypes.UUID,
        allowNull: true,
      });
    }

    if (!(await hasIndex(queryInterface, 'refunds', 'idx_refunds_municipality_id'))) {
      await queryInterface.addIndex('refunds', ['municipality_id'], {
        name: 'idx_refunds_municipality_id',
      });
    }

    if (
      (await hasColumn(queryInterface, 'refunds', 'school_config_id')) &&
      !(await hasIndex(queryInterface, 'refunds', 'idx_refunds_muni_school'))
    ) {
      await queryInterface.addIndex('refunds', ['municipality_id', 'school_config_id'], {
        name: 'idx_refunds_muni_school',
      });
    }

    if (
      (await hasColumn(queryInterface, 'school_config', 'municipality_id')) &&
      (await hasColumn(queryInterface, 'refunds', 'school_config_id'))
    ) {
      await queryInterface.sequelize.query(
        `UPDATE refunds r
         INNER JOIN school_config sc ON r.school_config_id = sc.id
         SET r.municipality_id = sc.municipality_id
         WHERE r.municipality_id IS NULL AND sc.municipality_id IS NOT NULL`
      );
    }
  }
}

export async function down(_queryInterface: QueryInterface): Promise<void> {
  // Keep the refunds table and tenant ownership data during rollback.
}
