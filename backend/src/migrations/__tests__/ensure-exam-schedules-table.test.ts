import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261018000002-ensure-exam-schedules-table';

describe('exam schedules table migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('exams', {
      exam_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
    await queryInterface.createTable('subjects', {
      subject_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('creates the schedule table when it is missing', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    const columns = await queryInterface.describeTable('exam_schedules');
    expect(columns).toHaveProperty('exam_schedule_id');
    expect(columns).toHaveProperty('exam_id');
    expect(columns).toHaveProperty('subject_id');
    expect(columns).toHaveProperty('date');
    expect(columns).toHaveProperty('start_time');
    expect(columns).toHaveProperty('end_time');
  });

  it('is safe to rerun', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    await expect(up(queryInterface, sequelize)).resolves.toBeUndefined();
  });
});
