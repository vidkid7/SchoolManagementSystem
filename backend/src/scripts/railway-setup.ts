import 'dotenv/config';
import sequelize from '../config/database';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Railway Database Setup Script
 * Runs migrations and seeds initial data
 */

async function setupRailwayDatabase(): Promise<void> {
  try {
    logger.info('🚀 Starting Railway database setup...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    // Run all migrations
    logger.info('📦 Running migrations...');
    try {
      const { stdout: migrateOut } = await execAsync('npm run migrate:up');
      logger.info(migrateOut);
      logger.info('✅ Migrations completed');
    } catch (error: any) {
      logger.warn('Migration warning (may already be applied):', error.message);
    }

    // Seed database with users
    logger.info('🌱 Seeding database with initial users...');
    try {
      const { stdout: seedOut } = await execAsync('npm run seed');
      logger.info(seedOut);
      logger.info('✅ Database seeded');
    } catch (error: any) {
      logger.warn('Seeding warning (users may already exist):', error.message);
    }

    logger.info('🎉 Railway database setup completed successfully!');
    logger.info('');
    logger.info('Demo account credentials are not printed. Initialize the first administrator with the bootstrap-admin command and a one-time INITIAL_ADMIN_PASSWORD secret.');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Railway database setup failed:', error);
    process.exit(1);
  }
}

setupRailwayDatabase();
