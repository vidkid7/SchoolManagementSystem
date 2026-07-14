import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_NAME = 'behavior_records';

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

async function hasIndex(
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<boolean> {
  if (!(await hasTable(queryInterface, tableName))) {
    return false;
  }
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  return indexes.some((index) => index.name === indexName);
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  fields: string[],
  name: string
): Promise<void> {
  if (!(await hasIndex(queryInterface, TABLE_NAME, name))) {
    await queryInterface.addIndex(TABLE_NAME, fields, { name });
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, TABLE_NAME))) {
    await queryInterface.createTable(TABLE_NAME, {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('positive', 'negative', 'neutral'),
        allowNull: false,
        defaultValue: 'neutral',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'other',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      action_taken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recorded_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      school_config_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      municipality_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }

  await addIndexIfMissing(queryInterface, ['student_id'], 'idx_behavior_records_student_id');
  await addIndexIfMissing(queryInterface, ['recorded_by'], 'idx_behavior_records_recorded_by');
  await addIndexIfMissing(queryInterface, ['type'], 'idx_behavior_records_type');
  await addIndexIfMissing(queryInterface, ['category'], 'idx_behavior_records_category');
  await addIndexIfMissing(queryInterface, ['date'], 'idx_behavior_records_date');
  await addIndexIfMissing(queryInterface, ['school_config_id'], 'idx_behavior_records_school_config_id');
  await addIndexIfMissing(queryInterface, ['municipality_id'], 'idx_behavior_records_municipality_id');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  if (await hasTable(queryInterface, TABLE_NAME)) {
    await queryInterface.dropTable(TABLE_NAME);
  }
}
