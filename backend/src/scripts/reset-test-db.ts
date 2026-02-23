/**
 * Reset Test Database Script
 * Drops and recreates the test database with all tables
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

async function resetTestDatabase(): Promise<void> {
  // Connect to MySQL without specifying a database
  const sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: false
  });

  try {
    await sequelize.authenticate();
    logger.info('Connected to MySQL server');

    const dbName = process.env.DB_NAME || 'school_management_system';
    
    // Drop database if exists
    await sequelize.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    logger.info(`✅ Database '${dbName}' dropped`);
    
    // Create database
    await sequelize.query(
      `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    logger.info(`✅ Database '${dbName}' created`);
    
    await sequelize.close();
    
    // Now sync all models
    const appSequelize = require('../config/database').default;
    await appSequelize.authenticate();
    logger.info('Connected to new database');
    
    // Sync all models (create tables)
    await appSequelize.sync({ force: false });
    logger.info('✅ All tables created from models');
    
    await appSequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to reset database:', error);
    process.exit(1);
  }
}

resetTestDatabase();
