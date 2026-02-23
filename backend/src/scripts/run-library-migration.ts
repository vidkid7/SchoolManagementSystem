/**
 * Run Library Migration Script
 * Creates the books and library-related tables
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as migration023 from '../migrations/023-create-library-tables';

async function runLibraryMigration(): Promise<void> {
  try {
    logger.info('Starting library migration...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    // Check if books table already exists
    const tables = await queryInterface.showAllTables();
    
    if (tables.includes('books')) {
      logger.info('Books table already exists, skipping migration');
      process.exit(0);
    }

    // Run migration
    logger.info('Running migration: 023-create-library-tables');
    await migration023.up(queryInterface, sequelize);
    logger.info('Library migration completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Library migration failed:', error);
    process.exit(1);
  }
}

runLibraryMigration();
