import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261011000001-ensure-calendar-notification-tables';

describe('calendar and notification table migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    await sequelize.getQueryInterface().createTable('users', {
      user_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('creates the required tables, tenant columns, and notification indexes', async () => {
    const queryInterface = sequelize.getQueryInterface();

    await up(queryInterface, sequelize);

    const tables = (await queryInterface.showAllTables()).map(table =>
      typeof table === 'string' ? table : Object.values(table as Record<string, string>)[0]
    );
    expect(tables).toContain('events');
    expect(tables).toContain('notifications');

    const notificationColumns = await queryInterface.describeTable('notifications');
    expect(notificationColumns.user_id).toBeDefined();
    expect(notificationColumns.is_read).toBeDefined();
    expect(notificationColumns.municipality_id).toBeDefined();

    const indexes = await queryInterface.showIndex('notifications') as Array<{ name: string }>;
    const indexNames = indexes.map(index => index.name);
    expect(indexNames).toEqual(expect.arrayContaining([
      'idx_notifications_user_id',
      'idx_notifications_user_read',
      'idx_notifications_category',
      'idx_notifications_created_at',
    ]));
  });

  it('is safe to run again without recreating tables or indexes', async () => {
    const queryInterface = sequelize.getQueryInterface();

    await up(queryInterface, sequelize);
    await expect(up(queryInterface, sequelize)).resolves.toBeUndefined();

    const notificationTables = (await queryInterface.showAllTables()).filter(table =>
      (typeof table === 'string' ? table : Object.values(table as Record<string, string>)[0]) === 'notifications'
    );
    expect(notificationTables).toHaveLength(1);
    const indexes = await queryInterface.showIndex('notifications') as Array<{ name: string }>;
    expect(indexes).toHaveLength(4);
  });
});
