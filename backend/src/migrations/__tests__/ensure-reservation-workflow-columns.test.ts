import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261012000003-ensure-reservation-workflow-columns';
import * as libraryTables from '../023-create-library-tables';

describe('reservation workflow column migration', () => {
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
    await queryInterface.createTable('books', {
      book_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
    await libraryTables.up(queryInterface, sequelize);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('adds fields used by reservation create, queue and cancel flows', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    const columns = await queryInterface.describeTable('reservations');
    expect(columns).toHaveProperty('available_date');
    expect(columns).toHaveProperty('queue_position');
    expect(columns).toHaveProperty('cancelled_by');
  });

  it('is safe to rerun', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    await expect(up(queryInterface, sequelize)).resolves.toBeUndefined();
  });
});
