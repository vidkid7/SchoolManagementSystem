/**
 * Run All Migrations Script
 * Runs all database migrations in order
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';

// Import all migrations
import * as migration001 from '../migrations/001-create-users-table';
import * as migration002 from '../migrations/002-create-core-tables';
import * as migration003 from '../migrations/003-create-attendance-exam-tables';
import * as migration004 from '../migrations/004-add-password-reset-fields';
import * as migration005 from '../migrations/005-create-audit-logs-table';
import * as migration006 from '../migrations/006-create-academic-history-table';
import * as migration007 from '../migrations/007-create-admissions-table';
import * as migration008 from '../migrations/008-create-staff-tables';
import * as migration009 from '../migrations/009-add-soft-delete-to-staff';
import * as migration010 from '../migrations/010-create-staff-documents-table';
import * as migration011 from '../migrations/011-create-class-subjects-table';
import * as migration012 from '../migrations/012-create-timetable-tables';

interface Migration {
  name: string;
  up: (queryInterface: any) => Promise<void>;
}

const migrations: Migration[] = [
  { name: '001-create-users-table', up: migration001.up },
  { name: '002-create-core-tables', up: migration002.up },
  { name: '003-create-attendance-exam-tables', up: migration003.up },
  { name: '004-add-password-reset-fields', up: migration004.up },
  { name: '005-create-audit-logs-table', up: migration005.up },
  { name: '006-create-academic-history-table', up: migration006.up },
  { name: '007-create-admissions-table', up: migration007.up },
  { name: '008-create-staff-tables', up: migration008.up },
  { name: '009-add-soft-delete-to-staff', up: migration009.up },
  { name: '010-create-staff-documents-table', up: migration010.up },
  { name: '011-create-class-subjects-table', up: migration011.up },
  { name: '012-create-timetable-tables', up: migration012.up },
];

async function runAllMigrations(): Promise<void> {
  try {
    logger.info('Running all migrations...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    for (const migration of migrations) {
      try {
        logger.info(`Running migration: ${migration.name}`);
        await migration.up(queryInterface);
        logger.info(`✅ Migration completed: ${migration.name}`);
      } catch (error: any) {
        // Skip if table already exists
        if (error.original?.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.original?.code === 'ER_DUP_KEYNAME') {
          logger.info(`⏭️  Skipping ${migration.name} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    logger.info('✅ All migrations completed successfully');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runAllMigrations();
