import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261018000001-ensure-exam-is-internal-column';

describe('exam is_internal column migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    await sequelize.getQueryInterface().createTable('exams', {
      exam_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('adds the model column with the expected default', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    const columns = await queryInterface.describeTable('exams');
    expect(columns.is_internal).toBeDefined();
    expect(columns.is_internal.allowNull).toBe(false);
    expect(columns.is_internal.defaultValue).toBe(false);
  });

  it('is safe to rerun and preserves an existing column', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface, sequelize);

    await expect(up(queryInterface, sequelize)).resolves.toBeUndefined();
    expect(await queryInterface.describeTable('exams')).toHaveProperty('is_internal');
  });
});
