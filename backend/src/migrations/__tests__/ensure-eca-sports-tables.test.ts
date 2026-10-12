import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261011000004-ensure-eca-sports-tables';
import * as createEcaTables from '../025-create-eca-tables';

describe('ECA and sports schema migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('staff', {
      staff_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
    await queryInterface.createTable('students', {
      student_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
    await queryInterface.createTable('academic_years', {
      academic_year_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('creates all ECA and sports tables with tenant columns', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    const tables = (await queryInterface.showAllTables()).map(table =>
      typeof table === 'string' ? table : Object.values(table as Record<string, string>)[0]
    );
    for (const tableName of [
      'ecas', 'eca_enrollments', 'eca_events', 'eca_achievements',
      'sports', 'teams', 'tournaments', 'sports_enrollments', 'sports_achievements',
    ]) {
      expect(tables).toContain(tableName);
      const columns = await queryInterface.describeTable(tableName);
      expect(columns).toHaveProperty('municipality_id');
      expect(columns).toHaveProperty('school_config_id');
    }
  });

  it('can rerun when some ECA tables already exist and then rerun the completed migration', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await createEcaTables.up(queryInterface, sequelize);
    await queryInterface.dropTable('eca_enrollments');

    await up(queryInterface, sequelize);
    await expect(up(queryInterface, sequelize)).resolves.toBeUndefined();

    const columns = await queryInterface.describeTable('eca_enrollments');
    expect(columns).toHaveProperty('municipality_id');
    expect(columns).toHaveProperty('school_config_id');
  });
});
