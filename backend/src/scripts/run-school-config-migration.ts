import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as schoolConfigMigration from '../migrations/032-create-school-config-table';

async function runMigration(): Promise<void> {
  try {
    logger.info('Running school config migration...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    await schoolConfigMigration.up(queryInterface);
    logger.info('School config migration completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
