/**
 * Run Exam Migrations Script
 * Creates all exam-related tables
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as migration022 from '../migrations/022-create-exam-schedules-table';
import * as migration024 from '../migrations/024-add-is-internal-to-exams';

interface Migration {
  name: string;
  tableName: string;
  up: (queryInterface: any, sequelize: any) => Promise<void>;
}

const migrations: Migration[] = [
  { name: '022-create-exam-schedules-table', tableName: 'exam_schedules', up: migration022.up },
  { name: '024-add-is-internal-to-exams', tableName: 'exams', up: migration024.up },
];

async function runExamMigrations(): Promise<void> {
  try {
    logger.info('Starting exam migrations...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    // Run each migration if its table doesn't exist or needs update
    for (const migration of migrations) {
      if (migration.name === '024-add-is-internal-to-exams') {
        // This is a column addition, check if column exists
        const tableDescription = await queryInterface.describeTable(migration.tableName);
        if (tableDescription.is_internal) {
          logger.info(`Column is_internal already exists in ${migration.tableName}, skipping migration ${migration.name}`);
          continue;
        }
      } else if (tables.includes(migration.tableName)) {
        logger.info(`Table ${migration.tableName} already exists, skipping migration ${migration.name}`);
        continue;
      }

      logger.info(`Running migration: ${migration.name}`);
      await migration.up(queryInterface, sequelize);
      logger.info(`Migration completed: ${migration.name}`);
    }

    logger.info('All exam migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Exam migrations failed:', error);
    process.exit(1);
  }
}

runExamMigrations();
