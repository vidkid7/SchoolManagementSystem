import { DataTypes, QueryInterface } from 'sequelize';

// ALL tables that should be municipality-scoped
const MUNICIPALITY_TENANT_TABLES = [
  // Original tenant tables from 20260308000002 (already have school_config_id)
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
  // Additional tables that also need municipality_id
  'grading_schemes',
  'notification_templates',
  'audit_logs',
  'notifications',
  'archive_metadata',
  'certificate_templates',
  'documents',
  'document_access_logs',
  'messages',
  'conversations',
  'group_messages',
  'group_conversations',
  'group_members',
  'timetables',
  'academic_histories',
  'attendance_rules',
  'reminder_configs',
];

/* ------------------------------------------------------------------ */
/*  Helper functions (same pattern as 20260308000002)                  */
/* ------------------------------------------------------------------ */

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

/**
 * Find the name of an existing foreign key constraint on a column.
 * MySQL stores FK info in information_schema.
 */
async function findForeignKeyConstraint(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<string | null> {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = :tableName
       AND COLUMN_NAME = :columnName
       AND REFERENCED_TABLE_NAME IS NOT NULL
     LIMIT 1`,
    { replacements: { tableName, columnName } }
  );
  const result = rows as Array<{ CONSTRAINT_NAME: string }>;
  return result.length > 0 ? result[0].CONSTRAINT_NAME : null;
}

/* ------------------------------------------------------------------ */
/*  UP                                                                 */
/* ------------------------------------------------------------------ */

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Bail out if the municipalities table doesn't exist yet
  if (!(await hasTable(queryInterface, 'municipalities'))) {
    console.log('[migration] municipalities table does not exist – skipping');
    return;
  }

  /* ------------------------------------------------------------------
   * Step 1: Add municipality_id column to every tenant table
   * ----------------------------------------------------------------*/
  for (const tableName of MUNICIPALITY_TENANT_TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      console.log(`[migration] table "${tableName}" does not exist – skipping`);
      continue;
    }

    if (await hasColumn(queryInterface, tableName, 'municipality_id')) {
      console.log(`[migration] "${tableName}".municipality_id already exists – skipping column add`);
      continue;
    }

    await queryInterface.addColumn(tableName, 'municipality_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'municipalities',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    console.log(`[migration] added municipality_id to "${tableName}"`);
  }

  /* ------------------------------------------------------------------
   * Step 2: Backfill municipality_id from school_config
   * Only for tables that have BOTH school_config_id and municipality_id
   * ----------------------------------------------------------------*/
  if (
    (await hasTable(queryInterface, 'school_config')) &&
    (await hasColumn(queryInterface, 'school_config', 'municipality_id'))
  ) {
    for (const tableName of MUNICIPALITY_TENANT_TABLES) {
      if (!(await hasTable(queryInterface, tableName))) {
        continue;
      }
      if (!(await hasColumn(queryInterface, tableName, 'school_config_id'))) {
        continue;
      }
      if (!(await hasColumn(queryInterface, tableName, 'municipality_id'))) {
        continue;
      }

      await queryInterface.sequelize.query(
        `UPDATE \`${tableName}\` t
         INNER JOIN school_config sc ON t.school_config_id = sc.id
         SET t.municipality_id = sc.municipality_id
         WHERE t.municipality_id IS NULL
           AND sc.municipality_id IS NOT NULL`
      );

      console.log(`[migration] backfilled municipality_id on "${tableName}" from school_config`);
    }
  }

  /* ------------------------------------------------------------------
   * Step 3: Add indexes
   *   - Standalone index on municipality_id
   *   - Composite index on (municipality_id, school_config_id) where
   *     both columns exist
   * ----------------------------------------------------------------*/
  for (const tableName of MUNICIPALITY_TENANT_TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }
    if (!(await hasColumn(queryInterface, tableName, 'municipality_id'))) {
      continue;
    }

    // Standalone municipality_id index
    await addIndexIfMissing(
      queryInterface,
      tableName,
      ['municipality_id'],
      `idx_${tableName}_municipality_id`
    );

    // Composite index when school_config_id also exists
    if (await hasColumn(queryInterface, tableName, 'school_config_id')) {
      await addIndexIfMissing(
        queryInterface,
        tableName,
        ['municipality_id', 'school_config_id'],
        `idx_${tableName}_muni_school`
      );
    }
  }

  /* ------------------------------------------------------------------
   * Step 4: Upgrade school_config FK to municipalities to use CASCADE
   *
   * The original migration (20260308000001) created the FK with
   * ON DELETE SET NULL. We upgrade it to ON DELETE CASCADE so that
   * deleting a municipality cascades to its school configs.
   * ----------------------------------------------------------------*/
  if (
    (await hasTable(queryInterface, 'school_config')) &&
    (await hasColumn(queryInterface, 'school_config', 'municipality_id'))
  ) {
    const fkName = await findForeignKeyConstraint(
      queryInterface,
      'school_config',
      'municipality_id'
    );

    if (fkName) {
      // Drop the old FK
      await queryInterface.removeConstraint('school_config', fkName);

      // Re-add with ON DELETE CASCADE
      await queryInterface.addConstraint('school_config', {
        fields: ['municipality_id'],
        type: 'foreign key',
        name: 'fk_school_config_municipality_id',
        references: {
          table: 'municipalities',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });

      console.log('[migration] upgraded school_config.municipality_id FK to ON DELETE CASCADE');
    }
  }

  console.log('[migration] 20260311000001-add-municipality-id-to-all-tenant-tables – UP complete');
}

/* ------------------------------------------------------------------ */
/*  DOWN                                                               */
/* ------------------------------------------------------------------ */

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove municipality_id column (and associated indexes/FK) from all tenant tables
  for (const tableName of MUNICIPALITY_TENANT_TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }
    if (!(await hasColumn(queryInterface, tableName, 'municipality_id'))) {
      continue;
    }

    // Remove composite index first
    if (await hasColumn(queryInterface, tableName, 'school_config_id')) {
      await removeIndexIfExists(queryInterface, tableName, `idx_${tableName}_muni_school`);
    }

    // Remove standalone municipality_id index
    await removeIndexIfExists(queryInterface, tableName, `idx_${tableName}_municipality_id`);

    // Remove the column (drops its FK constraint automatically in MySQL)
    await queryInterface.removeColumn(tableName, 'municipality_id');

    console.log(`[migration] removed municipality_id from "${tableName}"`);
  }

  // Restore school_config FK to ON DELETE SET NULL (original behaviour)
  if (
    (await hasTable(queryInterface, 'school_config')) &&
    (await hasColumn(queryInterface, 'school_config', 'municipality_id'))
  ) {
    const fkName = await findForeignKeyConstraint(
      queryInterface,
      'school_config',
      'municipality_id'
    );

    if (fkName) {
      await queryInterface.removeConstraint('school_config', fkName);

      await queryInterface.addConstraint('school_config', {
        fields: ['municipality_id'],
        type: 'foreign key',
        name: 'fk_school_config_municipality_id',
        references: {
          table: 'municipalities',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });

      console.log('[migration] restored school_config.municipality_id FK to ON DELETE SET NULL');
    }
  }

  console.log('[migration] 20260311000001-add-municipality-id-to-all-tenant-tables – DOWN complete');
}
