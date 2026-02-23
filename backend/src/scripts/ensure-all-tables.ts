/**
 * Ensure All Tables Script
 * Ensures all required tables exist by running migrations and catching errors
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';

async function ensureAllTables(): Promise<void> {
  try {
    logger.info('Ensuring all tables exist...');

    await sequelize.authenticate();
    logger.info('Database connection established');

    // Use sequelize.sync to create all tables from models
    // This will create tables if they don't exist, but won't modify existing ones
    await sequelize.sync({ alter: false });
    
    logger.info('✅ All tables ensured');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to ensure tables:', error);
    process.exit(1);
  }
}

ensureAllTables();
