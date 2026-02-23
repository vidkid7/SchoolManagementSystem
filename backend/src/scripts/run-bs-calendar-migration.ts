import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as migration from '../migrations/013-create-bs-calendar-table';

/**
 * Script to run BS calendar migration
 */

async function runMigration(): Promise<void> {
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Database connection established');

    logger.info('Running BS calendar migration...');
    await migration.up(sequelize.getQueryInterface());
    logger.info('Migration completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
