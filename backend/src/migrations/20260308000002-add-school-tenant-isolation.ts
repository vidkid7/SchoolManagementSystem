import { DataTypes, QueryInterface } from 'sequelize';

const TENANT_TABLES = [
  'admissions',
  'academic_years',
  'terms',
  'classes',
  'subjects',
  'class_subjects',
  'students',
  'staff',
  'staff_assignments',
  'staff_documents',
  'staff_attendance',
  'attendance',
  'leave_applications',
  'exams',
  'exam_schedules',
  'grades',
  'fee_structures',
  'fee_components',
  'invoices',
  'invoice_items',
  'payments',
  'installment_plans',
  'refunds',
  'fee_reminders',
  'books',
  'circulations',
  'reservations',
  'library_fines',
  'sports',
  'teams',
  'tournaments',
  'sports_enrollments',
  'sports_achievements',
  'ecas',
  'eca_events',
  'eca_enrollments',
  'eca_achievements',
  'events',
  'certificates',
];

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') {
    return table;
  }

  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }

  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function hasColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const description = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(description, columnName);
  } catch {
    return false;
  }
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  indexName: string
): Promise<void> {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  const exists = indexes.some((index: any) => index.name === indexName);
  if (!exists) {
    await queryInterface.addIndex(tableName, fields, { name: indexName });
  }
}

async function removeIndexIfExists(
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<void> {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  const exists = indexes.some((index: any) => index.name === indexName);
  if (exists) {
    await queryInterface.removeIndex(tableName, indexName);
  }
}

async function getSingleSchoolConfigId(queryInterface: QueryInterface): Promise<string | null> {
  if (!(await hasTable(queryInterface, 'school_config'))) {
    return null;
  }

  const [rows] = await queryInterface.sequelize.query(
    'SELECT id FROM school_config ORDER BY created_at ASC LIMIT 2'
  );
  const schoolRows = rows as Array<{ id: string }>;

  if (schoolRows.length !== 1) {
    return null;
  }

  return schoolRows[0].id;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await hasTable(queryInterface, 'school_config'))) {
    return;
  }

  for (const tableName of TENANT_TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }

    if (!(await hasColumn(queryInterface, tableName, 'school_config_id'))) {
      await queryInterface.addColumn(tableName, 'school_config_id', {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'school_config',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    const indexName = `idx_${tableName}_school_config_id`;
    await addIndexIfMissing(queryInterface, tableName, ['school_config_id'], indexName);
  }

  const singleSchoolConfigId = await getSingleSchoolConfigId(queryInterface);
  if (!singleSchoolConfigId) {
    return;
  }

  for (const tableName of TENANT_TABLES) {
    if (
      !(await hasTable(queryInterface, tableName)) ||
      !(await hasColumn(queryInterface, tableName, 'school_config_id'))
    ) {
      continue;
    }

    await queryInterface.sequelize.query(
      `UPDATE \`${tableName}\` SET school_config_id = :schoolConfigId WHERE school_config_id IS NULL`,
      {
        replacements: { schoolConfigId: singleSchoolConfigId },
      }
    );
  }

  if (await hasTable(queryInterface, 'users')) {
    if (await hasColumn(queryInterface, 'users', 'school_config_id')) {
      await queryInterface.sequelize.query(
        `
          UPDATE users
          SET school_config_id = :schoolConfigId
          WHERE school_config_id IS NULL AND role <> 'Municipality_Admin'
        `,
        {
          replacements: { schoolConfigId: singleSchoolConfigId },
        }
      );
    }

    if (
      (await hasColumn(queryInterface, 'users', 'municipality_id')) &&
      (await hasColumn(queryInterface, 'school_config', 'municipality_id'))
    ) {
      await queryInterface.sequelize.query(
        `
          UPDATE users u
          INNER JOIN school_config sc ON u.school_config_id = sc.id
          SET u.municipality_id = sc.municipality_id
          WHERE u.municipality_id IS NULL AND sc.municipality_id IS NOT NULL
        `
      );
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const tableName of TENANT_TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }

    if (await hasColumn(queryInterface, tableName, 'school_config_id')) {
      const indexName = `idx_${tableName}_school_config_id`;
      await removeIndexIfExists(queryInterface, tableName, indexName);
      await queryInterface.removeColumn(tableName, 'school_config_id');
    }
  }
}
