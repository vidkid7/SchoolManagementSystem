/**
 * Run Finance Migrations Script
 * Creates all finance-related tables (fee structure, invoices, payments, etc.)
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';
import * as migration015 from '../migrations/015-create-fee-structure-tables';
import * as migration016 from '../migrations/016-create-invoice-tables';
import * as migration017 from '../migrations/017-create-payments-table';
import * as migration018 from '../migrations/018-create-fee-reminders-table';
import * as migration019 from '../migrations/019-create-reminder-config-table';
import * as migration020 from '../migrations/020-create-refunds-table';
import * as migration021 from '../migrations/021-create-payment-gateway-transactions-table';
import { QueryInterface, Sequelize } from 'sequelize';

interface Migration {
  name: string;
  tableName: string;
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => Promise<void>;
}

const migrations: Migration[] = [
  { name: '015-create-fee-structure-tables', tableName: 'fee_structures', up: migration015.up },
  { name: '016-create-invoice-tables', tableName: 'invoices', up: migration016.up },
  { name: '017-create-payments-table', tableName: 'payments', up: migration017.up },
  { name: '018-create-fee-reminders-table', tableName: 'fee_reminders', up: migration018.up },
  { name: '019-create-reminder-config-table', tableName: 'reminder_configs', up: migration019.up },
  { name: '020-create-refunds-table', tableName: 'refunds', up: migration020.up },
  { name: '021-create-payment-gateway-transactions-table', tableName: 'payment_gateway_transactions', up: migration021.up },
];

async function runFinanceMigrations(): Promise<void> {
  try {
    logger.info('Starting finance migrations...');

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

    logger.info('All finance migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Finance migrations failed:', error);
    process.exit(1);
  }
}

runFinanceMigrations();
