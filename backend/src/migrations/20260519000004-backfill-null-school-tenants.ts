import { QueryInterface } from 'sequelize';

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
  'certificate_templates',
  'documents',
  'document_access_logs',
  'archive_metadata',
  'notification_templates',
  'timetables',
  'academic_history',
  'assignments',
  'assignment_submissions',
  'lesson_plans',
  'syllabus_progress',
  'hostel_rooms',
  'hostel_residents',
  'hostel_incidents',
  'hostel_visitors',
  'behavior_records',
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

async function getFallbackTenant(queryInterface: QueryInterface): Promise<{
  schoolConfigId: string;
  municipalityId: string | null;
} | null> {
  if (!(await hasTable(queryInterface, 'school_config'))) {
    return null;
  }

  const [adminRows] = await queryInterface.sequelize.query(
    `SELECT sc.id AS schoolConfigId, sc.municipality_id AS municipalityId
     FROM school_config sc
     INNER JOIN users u ON u.school_config_id = sc.id
     WHERE u.status = 'active'
       AND u.role IN ('School_Admin', 'Municipality_Admin')
     ORDER BY CASE WHEN u.username = 'admin' THEN 0 ELSE 1 END,
              sc.created_at ASC,
              sc.id ASC
     LIMIT 1`
  );

  const adminTenant = (
    adminRows as Array<{ schoolConfigId: string; municipalityId: string | null }>
  )[0];

  if (adminTenant?.schoolConfigId) {
    return adminTenant;
  }

  const [schoolRows] = await queryInterface.sequelize.query(
    `SELECT id AS schoolConfigId, municipality_id AS municipalityId
     FROM school_config
     WHERE is_active = 1
     ORDER BY created_at ASC, id ASC
     LIMIT 1`
  );

  const schoolTenant = (
    schoolRows as Array<{ schoolConfigId: string; municipalityId: string | null }>
  )[0];

  return schoolTenant?.schoolConfigId ? schoolTenant : null;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const fallbackTenant = await getFallbackTenant(queryInterface);
  if (!fallbackTenant) {
    return;
  }

  for (const tableName of TENANT_TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }

    const hasSchoolConfigId = await hasColumn(queryInterface, tableName, 'school_config_id');
    const hasMunicipalityId = await hasColumn(queryInterface, tableName, 'municipality_id');

    if (!hasSchoolConfigId && !hasMunicipalityId) {
      continue;
    }

    if (hasSchoolConfigId) {
      await queryInterface.sequelize.query(
        `UPDATE \`${tableName}\`
         SET school_config_id = :schoolConfigId
         WHERE school_config_id IS NULL`,
        { replacements: { schoolConfigId: fallbackTenant.schoolConfigId } }
      );
    }

    if (hasMunicipalityId && fallbackTenant.municipalityId) {
      await queryInterface.sequelize.query(
        `UPDATE \`${tableName}\`
         SET municipality_id = :municipalityId
         WHERE municipality_id IS NULL`,
        { replacements: { municipalityId: fallbackTenant.municipalityId } }
      );
    }
  }
}

export async function down(): Promise<void> {
  // Keep tenant ownership on existing rows. Reversing this would hide data again.
}
