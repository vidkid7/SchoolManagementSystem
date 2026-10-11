import { DataTypes, Sequelize } from 'sequelize';
import { up } from '../20261011000003-reconcile-staff-schema';

describe('staff schema reconciliation migration', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    await sequelize.getQueryInterface().createTable('staff', {
      staff_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      staff_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      first_name: { type: DataTypes.STRING(50), allowNull: false },
      middle_name: { type: DataTypes.STRING(50), allowNull: true },
      last_name: { type: DataTypes.STRING(50), allowNull: false },
      date_of_birth: { type: DataTypes.DATE, allowNull: false },
      gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: false },
      emergency_contact: { type: DataTypes.STRING(20), allowNull: false },
      join_date: { type: DataTypes.DATE, allowNull: false },
      position: { type: DataTypes.STRING(100), allowNull: false },
      department: { type: DataTypes.STRING(100), allowNull: true },
      employment_type: { type: DataTypes.ENUM('permanent', 'temporary', 'contract'), allowNull: false, defaultValue: 'permanent' },
      salary_grade: { type: DataTypes.STRING(20), allowNull: true },
      teaching_license_number: { type: DataTypes.STRING(50), allowNull: true },
      citizenship_number: { type: DataTypes.STRING(50), allowNull: true },
      status: { type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated'), allowNull: false, defaultValue: 'active' },
      photo_url: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await sequelize.query(`INSERT INTO staff (
      staff_code, first_name, middle_name, last_name, date_of_birth, gender, address, phone,
      email, emergency_contact, join_date, position, department, employment_type, status,
      created_at, updated_at
    ) VALUES (
      'LEGACY-1', 'Legacy', 'M', 'Teacher', '1980-01-01', 'male', 'Old address', '9800000000',
      'legacy@example.test', '9800000001', '2020-01-01', 'Teacher', 'Science', 'permanent', 'active',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('adds current model columns, preserves legacy values, and creates assignments', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);

    const columns = await queryInterface.describeTable('staff');
    for (const name of [
      'first_name_en', 'middle_name_en', 'last_name_en', 'first_name_np', 'date_of_birth_ad',
      'blood_group', 'address_en', 'employee_id', 'category', 'termination_date', 'salary',
      'highest_qualification', 'teaching_license', 'pan_number', 'municipality_id', 'school_config_id',
    ]) {
      expect(columns[name]).toBeDefined();
    }
    expect(columns.first_name.allowNull).toBe(true);
    expect(columns.date_of_birth.allowNull).toBe(true);
    expect(columns.address.allowNull).toBe(true);
    const [rows] = await sequelize.query('SELECT first_name_en, middle_name_en, last_name_en, address_en, employment_type FROM staff');
    expect(rows).toEqual([{
      first_name_en: 'Legacy', middle_name_en: 'M', last_name_en: 'Teacher',
      address_en: 'Old address', employment_type: 'full_time',
    }]);

    const tables = (await queryInterface.showAllTables()).map(table =>
      typeof table === 'string' ? table : Object.values(table as Record<string, string>)[0]
    );
    expect(tables).toContain('staff_assignments');
    expect(await queryInterface.describeTable('staff_assignments')).toHaveProperty('school_config_id');
  });

  it('can run again without duplicate indexes or tables', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await up(queryInterface);
    await expect(up(queryInterface)).resolves.toBeUndefined();
    const tables = await queryInterface.showAllTables();
    expect(tables).toContain('staff_assignments');
  });
});
