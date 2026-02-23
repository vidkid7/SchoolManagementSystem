/**
 * Run ECA and Sports Migrations Script
 * Creates all ECA and sports-related tables
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as migration025 from '../migrations/025-create-eca-tables';
import * as migration026 from '../migrations/026-create-sports-tables';
import * as migration027 from '../migrations/027-create-sports-enrollments-table';

interface Migration {
  name: string;
  tableName: string;
  up: (queryInterface: any, sequelize: any) => Promise<void>;
}

const migrations: Migration[] = [
  { name: '025-create-eca-tables', tableName: 'ecas', up: migration025.up },
  { name: '026-create-sports-tables', tableName: 'sports', up: migration026.up },
  { name: '027-create-sports-enrollments-table', tableName: 'sports_enrollments', up: migration027.up },
];

async function runECASportsMigrations(): Promise<void> {
  try {
    logger.info('Starting ECA and Sports migrations...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    // Run each migration if its table doesn't exist
    for (const migration of migrations) {
      if (tables.includes(migration.tableName)) {
        logger.info(`Table ${migration.tableName} already exists, skipping migration ${migration.name}`);
        continue;
      }

      logger.info(`Running migration: ${migration.name}`);
      await migration.up(queryInterface, sequelize);
      logger.info(`Migration completed: ${migration.name}`);
    }

    logger.info('All ECA and Sports migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('ECA and Sports migrations failed:', error);
    process.exit(1);
  }
}

runECASportsMigrations();
