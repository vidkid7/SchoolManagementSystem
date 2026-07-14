import { DataTypes, QueryInterface } from 'sequelize';

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (typeof values[0] === 'string') return values[0];
  }
  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function hasIndex(
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<boolean> {
  if (!(await hasTable(queryInterface, tableName))) return false;
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  return indexes.some((index) => index.name === indexName);
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  name: string,
  unique = false
): Promise<void> {
  if (!(await hasIndex(queryInterface, tableName, name))) {
    await queryInterface.addIndex(tableName, fields, { name, unique });
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, 'hostel_discipline_records'))) {
    await queryInterface.createTable('hostel_discipline_records', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      violation: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      action: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      severity: {
        type: DataTypes.ENUM('minor', 'moderate', 'major'),
        allowNull: false,
        defaultValue: 'minor',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM('open', 'resolved'),
        allowNull: false,
        defaultValue: 'open',
      },
      recorded_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      school_config_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      municipality_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }

  if (!(await hasTable(queryInterface, 'hostel_leave_requests'))) {
    await queryInterface.createTable('hostel_leave_requests', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      from_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      to_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processed_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      school_config_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      municipality_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }

  if (!(await hasTable(queryInterface, 'hostel_mess_menus'))) {
    await queryInterface.createTable('hostel_mess_menus', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      day: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      meal_type: {
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
        allowNull: false,
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      special_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      school_config_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      municipality_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }

  if (!(await hasTable(queryInterface, 'hostel_meal_attendance'))) {
    await queryInterface.createTable('hostel_meal_attendance', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      meal_type: {
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
        allowNull: false,
      },
      student_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('present', 'absent'),
        allowNull: false,
        defaultValue: 'present',
      },
      marked_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      marked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      school_config_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      municipality_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }

  if (!(await hasTable(queryInterface, 'hostel_inventory_items'))) {
    await queryInterface.createTable('hostel_inventory_items', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pcs',
      },
      min_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      school_config_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      municipality_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }

  await addIndexIfMissing(queryInterface, 'hostel_discipline_records', ['student_id'], 'idx_hostel_discipline_student_id');
  await addIndexIfMissing(queryInterface, 'hostel_discipline_records', ['severity'], 'idx_hostel_discipline_severity');
  await addIndexIfMissing(queryInterface, 'hostel_discipline_records', ['status'], 'idx_hostel_discipline_status');
  await addIndexIfMissing(queryInterface, 'hostel_discipline_records', ['date'], 'idx_hostel_discipline_date');
  await addIndexIfMissing(queryInterface, 'hostel_discipline_records', ['recorded_by'], 'idx_hostel_discipline_recorded_by');
  await addIndexIfMissing(queryInterface, 'hostel_discipline_records', ['school_config_id'], 'idx_hostel_discipline_school_config_id');
  await addIndexIfMissing(queryInterface, 'hostel_discipline_records', ['municipality_id'], 'idx_hostel_discipline_municipality_id');

  await addIndexIfMissing(queryInterface, 'hostel_leave_requests', ['student_id'], 'idx_hostel_leave_student_id');
  await addIndexIfMissing(queryInterface, 'hostel_leave_requests', ['status'], 'idx_hostel_leave_status');
  await addIndexIfMissing(queryInterface, 'hostel_leave_requests', ['from_date'], 'idx_hostel_leave_from_date');
  await addIndexIfMissing(queryInterface, 'hostel_leave_requests', ['to_date'], 'idx_hostel_leave_to_date');
  await addIndexIfMissing(queryInterface, 'hostel_leave_requests', ['processed_by'], 'idx_hostel_leave_processed_by');
  await addIndexIfMissing(queryInterface, 'hostel_leave_requests', ['school_config_id'], 'idx_hostel_leave_school_config_id');
  await addIndexIfMissing(queryInterface, 'hostel_leave_requests', ['municipality_id'], 'idx_hostel_leave_municipality_id');

  await addIndexIfMissing(queryInterface, 'hostel_mess_menus', ['day'], 'idx_hostel_mess_day');
  await addIndexIfMissing(queryInterface, 'hostel_mess_menus', ['meal_type'], 'idx_hostel_mess_meal_type');
  await addIndexIfMissing(queryInterface, 'hostel_mess_menus', ['school_config_id'], 'idx_hostel_mess_school_config_id');
  await addIndexIfMissing(queryInterface, 'hostel_mess_menus', ['municipality_id'], 'idx_hostel_mess_municipality_id');

  await addIndexIfMissing(queryInterface, 'hostel_meal_attendance', ['date'], 'idx_hostel_meal_attendance_date');
  await addIndexIfMissing(queryInterface, 'hostel_meal_attendance', ['meal_type'], 'idx_hostel_meal_attendance_meal_type');
  await addIndexIfMissing(queryInterface, 'hostel_meal_attendance', ['student_id'], 'idx_hostel_meal_attendance_student_id');
  await addIndexIfMissing(queryInterface, 'hostel_meal_attendance', ['date', 'meal_type', 'student_id'], 'idx_hostel_meal_attendance_unique', true);
  await addIndexIfMissing(queryInterface, 'hostel_meal_attendance', ['school_config_id'], 'idx_hostel_meal_attendance_school_config_id');
  await addIndexIfMissing(queryInterface, 'hostel_meal_attendance', ['municipality_id'], 'idx_hostel_meal_attendance_municipality_id');

  await addIndexIfMissing(queryInterface, 'hostel_inventory_items', ['name'], 'idx_hostel_inventory_name');
  await addIndexIfMissing(queryInterface, 'hostel_inventory_items', ['category'], 'idx_hostel_inventory_category');
  await addIndexIfMissing(queryInterface, 'hostel_inventory_items', ['quantity'], 'idx_hostel_inventory_quantity');
  await addIndexIfMissing(queryInterface, 'hostel_inventory_items', ['school_config_id'], 'idx_hostel_inventory_school_config_id');
  await addIndexIfMissing(queryInterface, 'hostel_inventory_items', ['municipality_id'], 'idx_hostel_inventory_municipality_id');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const tableName of [
    'hostel_inventory_items',
    'hostel_meal_attendance',
    'hostel_mess_menus',
    'hostel_leave_requests',
    'hostel_discipline_records',
  ]) {
    if (await hasTable(queryInterface, tableName)) {
      await queryInterface.dropTable(tableName);
    }
  }
}
