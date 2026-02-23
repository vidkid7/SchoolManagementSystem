import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before any other imports
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as createLeaveApplicationsTable from '../migrations/014-create-leave-applications-table';

/**
 * Leave Applications Migration Runner
 * Runs the leave applications table migration
 */

async function runMigration(): Promise<void> {
  try {
    logger.info('Starting leave applications migration...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    // Run migration
    logger.info('Running migration: 014-create-leave-applications-table');
    await createLeaveApplicationsTable.up(queryInterface);
    logger.info('Migration completed: 014-create-leave-applications-table');

    logger.info('Leave applications migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

async function rollbackMigration(): Promise<void> {
  try {
    logger.info('Rolling back leave applications migration...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    // Rollback migration
    logger.info('Rolling back migration: 014-create-leave-applications-table');
    await createLeaveApplicationsTable.down(queryInterface);
    logger.info('Rollback completed: 014-create-leave-applications-table');

    logger.info('Leave applications migration rolled back successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
}

// Check command line argument
const command = process.argv[2];

if (command === 'up') {
  runMigration();
} else if (command === 'down') {
  rollbackMigration();
} else {
  logger.error('Invalid command. Use "up" or "down"');
  process.exit(1);
}
