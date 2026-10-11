import { DataTypes, QueryInterface } from 'sequelize';

type ColumnDefinition = Record<string, unknown>;

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') return table;
  if (table && typeof table === 'object') {
    const value = Object.values(table as Record<string, unknown>)[0];
    if (typeof value === 'string') return value;
  }
  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function hasColumn(queryInterface: QueryInterface, tableName: string, columnName: string): Promise<boolean> {
  const columns = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(columns, columnName);
}

async function ensureColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
  definition: ColumnDefinition
): Promise<void> {
  if (!(await hasColumn(queryInterface, tableName, columnName))) {
    await queryInterface.addColumn(tableName, columnName, definition as never);
  }
}

async function ensureIndex(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  name: string
): Promise<void> {
  const indexes = await queryInterface.showIndex(tableName) as Array<{ name: string }>;
  if (!indexes.some(index => index.name === name)) {
    await queryInterface.addIndex(tableName, fields, { name });
  }
}

async function backfillIfAvailable(
  queryInterface: QueryInterface,
  tableName: string,
  target: string,
  source: string
): Promise<void> {
  if (await hasColumn(queryInterface, tableName, source)) {
    await queryInterface.sequelize.query(
      `UPDATE \`${tableName}\` SET \`${target}\` = \`${source}\` WHERE \`${target}\` IS NULL`
    );
  }
}

async function relaxLegacyColumn(
  queryInterface: QueryInterface,
  columnName: string,
  definition: ColumnDefinition
): Promise<void> {
  const columns = await queryInterface.describeTable('staff');
  if (columns[columnName] && !columns[columnName].allowNull) {
    await queryInterface.changeColumn('staff', columnName, { ...definition, allowNull: true } as never);
  }
}

async function createStaffAssignmentsTable(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, 'staff_assignments'))) {
    await queryInterface.createTable('staff_assignments', {
      assignment_id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      staff_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'staff', key: 'staff_id' },
      },
      academic_year_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'academic_years', key: 'academic_year_id' },
      },
      assignment_type: {
        type: DataTypes.ENUM('class_teacher', 'subject_teacher', 'department_head', 'shift_incharge'),
        allowNull: false,
      },
      class_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'classes', key: 'class_id' },
      },
      subject_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'subjects', key: 'subject_id' },
      },
      section: { type: DataTypes.STRING(10), allowNull: true },
      department: { type: DataTypes.STRING(100), allowNull: true },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      municipality_id: { type: DataTypes.UUID, allowNull: true },
      school_config_id: { type: DataTypes.UUID, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }

  await ensureColumn(queryInterface, 'staff_assignments', 'municipality_id', {
    type: DataTypes.UUID, allowNull: true,
  });
  await ensureColumn(queryInterface, 'staff_assignments', 'school_config_id', {
    type: DataTypes.UUID, allowNull: true,
  });
  await ensureIndex(queryInterface, 'staff_assignments', ['staff_id'], 'idx_staff_assignments_staff_id');
  await ensureIndex(queryInterface, 'staff_assignments', ['academic_year_id'], 'idx_staff_assignments_academic_year_id');
  await ensureIndex(queryInterface, 'staff_assignments', ['assignment_type'], 'idx_staff_assignments_assignment_type');
  await ensureIndex(queryInterface, 'staff_assignments', ['class_id'], 'idx_staff_assignments_class_id');
  await ensureIndex(queryInterface, 'staff_assignments', ['municipality_id'], 'idx_staff_assignments_municipality_id');
  await ensureIndex(queryInterface, 'staff_assignments', ['school_config_id'], 'idx_staff_assignments_school_config_id');
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, 'staff'))) {
    throw new Error('Cannot reconcile staff schema because the staff table is missing');
  }

  const columns: Array<[string, ColumnDefinition]> = [
    ['first_name_en', { type: DataTypes.STRING(50), allowNull: true }],
    ['middle_name_en', { type: DataTypes.STRING(50), allowNull: true }],
    ['last_name_en', { type: DataTypes.STRING(50), allowNull: true }],
    ['first_name_np', { type: DataTypes.STRING(50), allowNull: true }],
    ['middle_name_np', { type: DataTypes.STRING(50), allowNull: true }],
    ['last_name_np', { type: DataTypes.STRING(50), allowNull: true }],
    ['date_of_birth_bs', { type: DataTypes.STRING(10), allowNull: true }],
    ['date_of_birth_ad', { type: DataTypes.DATEONLY, allowNull: true }],
    ['blood_group', { type: DataTypes.STRING(10), allowNull: true }],
    ['address_en', { type: DataTypes.STRING(255), allowNull: true }],
    ['address_np', { type: DataTypes.STRING(255), allowNull: true }],
    ['employee_id', { type: DataTypes.STRING(50), allowNull: true }],
    ['category', { type: DataTypes.ENUM('teaching', 'non_teaching', 'administrative'), allowNull: true }],
    ['termination_date', { type: DataTypes.DATEONLY, allowNull: true }],
    ['salary', { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ['highest_qualification', { type: DataTypes.STRING(100), allowNull: true }],
    ['specialization', { type: DataTypes.STRING(100), allowNull: true }],
    ['teaching_license', { type: DataTypes.STRING(50), allowNull: true }],
    ['pan_number', { type: DataTypes.STRING(20), allowNull: true }],
  ];
  for (const [name, definition] of columns) {
    await ensureColumn(queryInterface, 'staff', name, definition);
  }

  await backfillIfAvailable(queryInterface, 'staff', 'first_name_en', 'first_name');
  await backfillIfAvailable(queryInterface, 'staff', 'middle_name_en', 'middle_name');
  await backfillIfAvailable(queryInterface, 'staff', 'last_name_en', 'last_name');
  await backfillIfAvailable(queryInterface, 'staff', 'date_of_birth_ad', 'date_of_birth');
  await backfillIfAvailable(queryInterface, 'staff', 'address_en', 'address');
  await backfillIfAvailable(queryInterface, 'staff', 'teaching_license', 'teaching_license_number');

  // The legacy schema requires values that the current model stores under
  // *_en fields. Make legacy-only columns optional so current model inserts
  // work while retaining the original data for existing rows.
  await relaxLegacyColumn(queryInterface, 'first_name', { type: DataTypes.STRING(50) });
  await relaxLegacyColumn(queryInterface, 'last_name', { type: DataTypes.STRING(50) });
  await relaxLegacyColumn(queryInterface, 'date_of_birth', { type: DataTypes.DATE });
  await relaxLegacyColumn(queryInterface, 'address', { type: DataTypes.TEXT });

  // Migrate enum values through a union first so existing `permanent` rows
  // remain valid while being translated to the current `full_time` value.
  await queryInterface.changeColumn('staff', 'employment_type', {
    type: DataTypes.ENUM('permanent', 'full_time', 'part_time', 'contract', 'temporary'),
    allowNull: false,
    defaultValue: 'full_time',
  });
  await queryInterface.sequelize.query(
    "UPDATE `staff` SET `employment_type` = 'full_time' WHERE `employment_type` = 'permanent'"
  );
  await queryInterface.changeColumn('staff', 'employment_type', {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'temporary'),
    allowNull: false,
    defaultValue: 'full_time',
  });
  await queryInterface.changeColumn('staff', 'status', {
    type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated', 'retired'),
    allowNull: false,
    defaultValue: 'active',
  });

  await ensureColumn(queryInterface, 'staff', 'municipality_id', {
    type: DataTypes.UUID, allowNull: true,
  });
  await ensureColumn(queryInterface, 'staff', 'school_config_id', {
    type: DataTypes.UUID, allowNull: true,
  });
  await ensureIndex(queryInterface, 'staff', ['category'], 'idx_staff_category');
  await ensureIndex(queryInterface, 'staff', ['department'], 'idx_staff_department');
  await ensureIndex(queryInterface, 'staff', ['employee_id'], 'idx_staff_employee_id');
  await ensureIndex(queryInterface, 'staff', ['municipality_id'], 'idx_staff_municipality_id');
  await ensureIndex(queryInterface, 'staff', ['school_config_id'], 'idx_staff_school_config_id');

  await createStaffAssignmentsTable(queryInterface);
}

// Preserve staff and assignment records if a release is rolled back.
export async function down(_queryInterface: QueryInterface): Promise<void> {}
