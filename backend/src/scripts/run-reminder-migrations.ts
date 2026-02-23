import sequelize from '../config/database';
import logger from '../utils/logger';
import * as migration018 from '../migrations/018-create-fee-reminders-table';
import * as migration019 from '../migrations/019-create-reminder-config-table';

/**
 * Run fee reminder migrations
 */
async function runReminderMigrations() {
  try {
    logger.info('Running fee reminder migrations...');

    // Run migration 018
    logger.info('Running migration 018: create-fee-reminders-table');
    await migration018.up(sequelize.getQueryInterface());
    logger.info('✓ Migration 018 completed');

    // Run migration 019
    logger.info('Running migration 019: create-reminder-config-table');
    await migration019.up(sequelize.getQueryInterface());
    logger.info('✓ Migration 019 completed');

    logger.info('All fee reminder migrations completed successfully');
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runReminderMigrations();
