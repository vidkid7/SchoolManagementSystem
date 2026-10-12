import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261012000002-ensure-library-tables';

describe('library schema repair migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('users', {
      user_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
    await queryInterface.createTable('students', {
      student_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('creates every library table with tenant columns and optional publisher', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    for (const tableName of ['books', 'circulations', 'reservations', 'library_fines']) {
      const columns = await queryInterface.describeTable(tableName);
      expect(columns).toHaveProperty('municipality_id');
      expect(columns).toHaveProperty('school_config_id');
    }
    expect((await queryInterface.describeTable('books')).publisher.allowNull).toBe(true);
  });

  it('repairs missing tables and is safe to rerun', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);
    await queryInterface.dropTable('library_fines');
    await queryInterface.dropTable('circulations');

    await expect(up(queryInterface, sequelize)).resolves.toBeUndefined();
    await expect(up(queryInterface, sequelize)).resolves.toBeUndefined();
    expect(await queryInterface.describeTable('circulations')).toHaveProperty('municipality_id');
    expect(await queryInterface.describeTable('library_fines')).toHaveProperty('school_config_id');
  });
});
