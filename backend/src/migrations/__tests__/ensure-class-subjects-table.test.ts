import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261018000005-ensure-class-subjects-table';

describe('class subjects table migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const queryInterface = sequelize.getQueryInterface();
    for (const table of ['classes', 'subjects', 'staff']) {
      await queryInterface.createTable(table, {
        [`${table === 'classes' ? 'class' : table === 'subjects' ? 'subject' : 'staff'}_id`]: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        }
      });
    }
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('creates the assignment table with its foreign keys and unique class-subject index', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);

    const columns = await queryInterface.describeTable('class_subjects');
    expect(columns).toHaveProperty('class_subject_id');
    expect(columns).toHaveProperty('class_id');
    expect(columns).toHaveProperty('subject_id');
    expect(columns).toHaveProperty('teacher_id');

    const indexes = await queryInterface.showIndex('class_subjects');
    expect(indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'idx_class_subjects_unique', unique: true })
    ]));
  });

  it('is safe to rerun when the table already exists', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);
    await expect(up(queryInterface)).resolves.toBeUndefined();
  });
});
