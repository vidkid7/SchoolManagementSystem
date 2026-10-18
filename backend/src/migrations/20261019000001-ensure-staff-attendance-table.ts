import { DataTypes, QueryInterface } from 'sequelize';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table.toLowerCase();
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, unknown>);
    if (typeof values[0] === 'string') return values[0].toLowerCase();
  }
  return '';
}

/** Create the staff attendance schema if an earlier release omitted it. */
export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = new Set((await queryInterface.showAllTables()).map(normalizeTableName));

  if (!tables.has('staff_attendance')) {
    await queryInterface.createTable('staff_attendance', {
      staff_attendance_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      staff_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'staff', key: 'staff_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'on_leave', 'half_day'),
        allowNull: false,
        defaultValue: 'present',
      },
      check_in_time: { type: DataTypes.TIME, allowNull: true },
      check_out_time: { type: DataTypes.TIME, allowNull: true },
      working_hours: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      marked_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      municipality_id: { type: DataTypes.CHAR(36), allowNull: true },
      school_config_id: { type: DataTypes.CHAR(36), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }

  const columns = await queryInterface.describeTable('staff_attendance');
  if (!columns.municipality_id) {
    await queryInterface.addColumn('staff_attendance', 'municipality_id', {
      type: DataTypes.CHAR(36),
      allowNull: true,
    });
  }
  if (!columns.school_config_id) {
    await queryInterface.addColumn('staff_attendance', 'school_config_id', {
      type: DataTypes.CHAR(36),
      allowNull: true,
    });
  }

  const indexes = await queryInterface.showIndex('staff_attendance') as Array<{ name: string }>;
  const ensureIndex = async (name: string, fields: string[], unique = false): Promise<void> => {
    if (!indexes.some(index => index.name === name)) {
      await queryInterface.addIndex('staff_attendance', fields, { name, unique });
    }
  };

  await ensureIndex('idx_staff_attendance_staff_id', ['staff_id']);
  await ensureIndex('idx_staff_attendance_date', ['date']);
  await ensureIndex('idx_staff_attendance_status', ['status']);
  await ensureIndex('idx_staff_attendance_staff_date', ['staff_id', 'date']);
  await ensureIndex('unique_staff_date', ['staff_id', 'date'], true);
  await ensureIndex('idx_staff_attendance_municipality_id', ['municipality_id']);
  await ensureIndex('idx_staff_attendance_school_config_id', ['school_config_id']);
}

export async function down(): Promise<void> {
  throw new Error('The staff attendance schema repair is non-destructive and cannot be rolled back automatically.');
}
