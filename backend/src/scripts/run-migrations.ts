import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import { DataTypes } from 'sequelize';
import * as createUsersTable from '../migrations/001-create-users-table';
import * as createCoreTables from '../migrations/002-create-core-tables';
import * as createAttendanceExamTables from '../migrations/003-create-attendance-exam-tables';
import * as createTimetableTables from '../migrations/012-create-timetable-tables';
import * as createGradingSchemes from '../migrations/20240206000001-create-grading-schemes';
import * as createAttendanceRules from '../migrations/20240206000002-create-attendance-rules';
import * as createRolesPermissions from '../migrations/20240207000001-create-roles-permissions';
import * as createMessagingTables from '../migrations/028-create-messaging-tables';
import * as createGroupMessagingTables from '../migrations/029-create-group-messaging-tables';
import * as createCertificateTemplatesTable from '../migrations/030-create-certificate-templates-table';
import * as createCertificatesTable from '../migrations/030-create-certificates-table';
import * as createDocumentsTable from '../migrations/031-create-documents-table';
import * as createSchoolConfigTable from '../migrations/032-create-school-config-table';
import * as addMunicipalityArchitecture from '../migrations/20260308000001-add-municipality-architecture';
import * as addSchoolTenantIsolation from '../migrations/20260308000002-add-school-tenant-isolation';
import * as addSchoolConfigFormatColumns from '../migrations/20260308000003-add-school-config-format-columns';
import * as createArchiveTables from '../migrations/033-create-archive-tables';
import * as createLeaveApplicationsTable from '../migrations/014-create-leave-applications-table';
import * as createFeeStructureTables from '../migrations/015-create-fee-structure-tables';
import * as createInvoiceTables from '../migrations/016-create-invoice-tables';
import * as createPaymentsTable from '../migrations/017-create-payments-table';
import * as createLibraryTables from '../migrations/023-create-library-tables';
import * as createHostelTables from '../migrations/20260315000005-create-hostel-tables';
import * as createAssignmentsTable from '../migrations/20260315000001-create-assignments-table';
import * as createAssignmentSubmissionsTable from '../migrations/20260315000002-create-assignment-submissions-table';
import * as createLessonPlansTable from '../migrations/20260315000003-create-lesson-plans-table';
import * as createSyllabusProgressTable from '../migrations/20260315000004-create-syllabus-progress-table';

/**
 * Migration Runner
 * Runs database migrations in order
 */

interface Migration {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  up: (queryInterface: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  down: (queryInterface: any) => Promise<void>;
}

const migrations: Migration[] = [
  {
    name: '001-create-users-table',
    up: createUsersTable.up,
    down: createUsersTable.down
  },
  {
    name: '002-create-core-tables',
    up: createCoreTables.up,
    down: createCoreTables.down
  },
  {
    name: '003-create-attendance-exam-tables',
    up: createAttendanceExamTables.up,
    down: createAttendanceExamTables.down
  },
  {
    name: '012-create-timetable-tables',
    up: createTimetableTables.up,
    down: createTimetableTables.down
  },
  {
    name: '20240206000001-create-grading-schemes',
    up: createGradingSchemes.up,
    down: createGradingSchemes.down
  },
  {
    name: '20240206000002-create-attendance-rules',
    up: createAttendanceRules.up,
    down: createAttendanceRules.down
  },
  {
    name: '20240207000001-create-roles-permissions',
    up: (createRolesPermissions as any).default.up,
    down: (createRolesPermissions as any).default.down
  },
  {
    name: '028-create-messaging-tables',
    up: createMessagingTables.up,
    down: createMessagingTables.down
  },
  {
    name: '029-create-group-messaging-tables',
    up: createGroupMessagingTables.up,
    down: createGroupMessagingTables.down
  },
  {
    name: '030-create-certificate-templates-table',
    up: createCertificateTemplatesTable.up,
    down: createCertificateTemplatesTable.down
  },
  {
    name: '030-create-certificates-table',
    up: createCertificatesTable.up,
    down: createCertificatesTable.down
  },
  {
    name: '031-create-documents-table',
    up: createDocumentsTable.up,
    down: createDocumentsTable.down
  },
  {
    name: '032-create-school-config-table',
    up: createSchoolConfigTable.up,
    down: createSchoolConfigTable.down
  },
  {
    name: '20260308000001-add-municipality-architecture',
    up: addMunicipalityArchitecture.up,
    down: addMunicipalityArchitecture.down
  },
  {
    name: '20260308000002-add-school-tenant-isolation',
    up: addSchoolTenantIsolation.up,
    down: addSchoolTenantIsolation.down
  },
  {
    name: '20260308000003-add-school-config-format-columns',
    up: addSchoolConfigFormatColumns.up,
    down: addSchoolConfigFormatColumns.down
  },
  {
    name: '033-create-archive-tables',
    up: (createArchiveTables as any).default.up,
    down: (createArchiveTables as any).default.down
  },
  {
    name: '014-create-leave-applications-table',
    up: createLeaveApplicationsTable.up,
    down: createLeaveApplicationsTable.down
  },
  {
    name: '015-create-fee-structure-tables',
    up: createFeeStructureTables.up,
    down: createFeeStructureTables.down
  },
  {
    name: '016-create-invoice-tables',
    up: createInvoiceTables.up,
    down: createInvoiceTables.down
  },
  {
    name: '017-create-payments-table',
    up: createPaymentsTable.up,
    down: createPaymentsTable.down
  },
  {
    name: '023-create-library-tables',
    up: createLibraryTables.up,
    down: createLibraryTables.down
  },
  {
    name: '20260315000005-create-hostel-tables',
    up: createHostelTables.up,
    down: createHostelTables.down
  },
  {
    name: '20260315000001-create-assignments-table',
    up: createAssignmentsTable.up,
    down: createAssignmentsTable.down
  },
  {
    name: '20260315000002-create-assignment-submissions-table',
    up: createAssignmentSubmissionsTable.up,
    down: createAssignmentSubmissionsTable.down
  },
  {
    name: '20260315000003-create-lesson-plans-table',
    up: createLessonPlansTable.up,
    down: createLessonPlansTable.down
  },
  {
    name: '20260315000004-create-syllabus-progress-table',
    up: createSyllabusProgressTable.up,
    down: createSyllabusProgressTable.down
  }
];

async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    await queryInterface.createTable('migrations', {
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      run_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }).catch(() => {});

    const [results] = await sequelize.query('SELECT name FROM migrations');
    const ranMigrations = new Set((results as { name: string }[]).map((r) => r.name));

    for (const migration of migrations) {
      if (ranMigrations.has(migration.name)) {
        logger.info(`Skipping already run migration: ${migration.name}`);
        continue;
      }
      logger.info(`Running migration: ${migration.name}`);
      try {
        await migration.up(queryInterface);
        await sequelize.query('INSERT INTO migrations (name) VALUES (?)', {
          replacements: [migration.name],
        });
        logger.info(`Migration completed: ${migration.name}`);
      } catch (error: unknown) {
        const err = error as { parent?: { code?: string } };
        if (err.parent?.code === 'ER_TABLE_EXISTS_ERROR' || err.parent?.code === 'ER_DUP_KEYNAME' || err.parent?.code === 'ER_FK_INCOMPATIBLE_COLUMNS' || err.parent?.code === 'ER_DUP_ENTRY') {
          await sequelize.query('INSERT INTO migrations (name) VALUES (?)', {
            replacements: [migration.name],
          });
          logger.info(`Migration skipped (already applied): ${migration.name}`);
        } else {
          throw error;
        }
      }
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

async function rollbackMigrations(): Promise<void> {
  try {
    logger.info('Rolling back database migrations...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    // Rollback migrations in reverse order
    for (let i = migrations.length - 1; i >= 0; i--) {
      const migration = migrations[i];
      logger.info(`Rolling back migration: ${migration.name}`);
      await migration.down(queryInterface);
      logger.info(`Rollback completed: ${migration.name}`);
    }

    logger.info('All migrations rolled back successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
}

// Check command line argument
const command = process.argv[2];

if (command === 'up') {
  runMigrations();
} else if (command === 'down') {
  rollbackMigrations();
} else {
  logger.error('Invalid command. Use "up" or "down"');
  process.exit(1);
}
