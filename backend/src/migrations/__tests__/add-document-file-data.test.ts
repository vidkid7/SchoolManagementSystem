import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261018000006-add-document-file-data';

describe('document file data migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    await sequelize.getQueryInterface().createTable('documents', {
      document_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('adds a nullable binary column for persisted file contents', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);

    const columns = await queryInterface.describeTable('documents');
    expect(columns.file_data).toBeDefined();
    expect(columns.file_data.allowNull).toBe(true);
  });

  it('can be rerun safely', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);
    await expect(up(queryInterface)).resolves.toBeUndefined();
  });
});
