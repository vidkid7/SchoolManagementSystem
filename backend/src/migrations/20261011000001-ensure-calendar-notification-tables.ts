import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { up as createEventsTable } from './031-create-events-table';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, unknown>);
    if (typeof values[0] === 'string') return values[0];
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
    const columns = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(columns, columnName);
  } catch {
    return false;
  }
}

async function addMunicipalityColumnIfMissing(
  queryInterface: QueryInterface,
  tableName: string
): Promise<void> {
  if (!(await hasColumn(queryInterface, tableName, 'municipality_id'))) {
    await queryInterface.addColumn(tableName, 'municipality_id', {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  name: string
): Promise<void> {
  const indexes = await queryInterface.showIndex(tableName) as Array<{ name: string }>;
  if (!indexes.some(index => index.name === name)) {
    await queryInterface.addIndex(tableName, fields, { name });
  }
}

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  if (!(await hasTable(queryInterface, 'events'))) {
    await createEventsTable(queryInterface, sequelize);
  }
  await addMunicipalityColumnIfMissing(queryInterface, 'events');

  if (!(await hasTable(queryInterface, 'notifications'))) {
    await queryInterface.createTable('notifications', {
      notification_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM('info', 'warning', 'success', 'error'),
        allowNull: false,
        defaultValue: 'info',
      },
      category: {
        type: DataTypes.ENUM('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general'),
        allowNull: false,
        defaultValue: 'general',
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      data: { type: DataTypes.JSON, allowNull: true },
      is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      read_at: { type: DataTypes.DATE, allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: true },
      municipality_id: { type: DataTypes.UUID, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }

  await addMunicipalityColumnIfMissing(queryInterface, 'notifications');
  await addIndexIfMissing(queryInterface, 'notifications', ['user_id'], 'idx_notifications_user_id');
  await addIndexIfMissing(queryInterface, 'notifications', ['user_id', 'is_read'], 'idx_notifications_user_read');
  await addIndexIfMissing(queryInterface, 'notifications', ['category'], 'idx_notifications_category');
  await addIndexIfMissing(queryInterface, 'notifications', ['created_at'], 'idx_notifications_created_at');
}

// Preserve event and notification data if a release is rolled back.
export async function down(_queryInterface: QueryInterface): Promise<void> {}
