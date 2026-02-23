import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before any other imports
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as createFeeStructureTables from '../migrations/015-create-fee-structure-tables';

/**
 * Fee Structure Migration Runner
 * Runs the fee structure migration
 */

async function runMigration(): Promise<void> {
  try {
    logger.info('Starting fee structure migration...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    // Run migration
    logger.info('Running migration: 015-create-fee-structure-tables');
    await createFeeStructureTables.up(queryInterface);
    logger.info('Migration completed: 015-create-fee-structure-tables');

    logger.info('Fee structure migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

async function rollbackMigration(): Promise<void> {
  try {
    logger.info('Rolling back fee structure migration...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    // Rollback migration
    logger.info('Rolling back migration: 015-create-fee-structure-tables');
    await createFeeStructureTables.down(queryInterface);
    logger.info('Rollback completed: 015-create-fee-structure-tables');

    logger.info('Fee structure migration rolled back successfully');
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
