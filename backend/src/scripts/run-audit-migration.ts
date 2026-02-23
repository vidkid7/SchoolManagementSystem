import sequelize from '@config/database';
import { logger } from '@utils/logger';
import * as migration from '../migrations/005-create-audit-logs-table';

/**
 * Run the audit logs migration
 */
async function runAuditMigration(): Promise<void> {
  try {
    logger.info('Starting audit logs migration...');

    // Ensure database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Run the migration
    await migration.up(sequelize.getQueryInterface());
    logger.info('Audit logs migration completed successfully');

    // Close database connection
    await sequelize.close();
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running audit logs migration', { error });
    process.exit(1);
  }
}

// Run the migration
runAuditMigration();
