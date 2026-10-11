import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261011000002-ensure-admissions-table';

describe('admissions table migration', () => {
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
    await queryInterface.createTable('academic_years', {
      academic_year_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('creates admissions and the tenant columns and indexes used by the API', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);

    const columns = await queryInterface.describeTable('admissions');
    expect(columns.admission_id).toBeDefined();
    expect(columns.municipality_id).toBeDefined();
    expect(columns.school_config_id).toBeDefined();

    const indexes = await queryInterface.showIndex('admissions') as Array<{ name: string }>;
    expect(indexes.map(index => index.name)).toEqual(expect.arrayContaining([
      'idx_admissions_municipality_id',
      'idx_admissions_school_config_id',
    ]));
  });

  it('can run again without recreating the table or indexes', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);
    await expect(up(queryInterface)).resolves.toBeUndefined();
    expect(await queryInterface.describeTable('admissions')).toHaveProperty('school_config_id');
  });
});
