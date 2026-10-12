import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261012000001-widen-staff-emergency-contact';

describe('staff emergency contact migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    await sequelize.getQueryInterface().createTable('staff', {
      staff_id: { type: DataTypes.INTEGER, primaryKey: true },
      emergency_contact: { type: DataTypes.STRING(20), allowNull: false },
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('widens a legacy required column and permits the current form value', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);

    const column = (await queryInterface.describeTable('staff')).emergency_contact;
    expect(column.allowNull).toBe(true);
    expect(column.type.toLowerCase()).toContain('varchar(100)');

    const value = 'QA Emergency Contact: 9800000002';
    await sequelize.query('INSERT INTO staff (staff_id, emergency_contact) VALUES (1, :value)', {
      replacements: { value },
    });
    const [rows] = await sequelize.query('SELECT emergency_contact FROM staff');
    expect(rows).toEqual([{ emergency_contact: value }]);
  });
});
