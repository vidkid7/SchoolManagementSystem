/**
 * Create Database Script
 * Creates the school_management_system database if it doesn't exist
 */

import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function createDatabase(): Promise<void> {
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
    
    // Create database if it doesn't exist
    await sequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    
    logger.info(`✅ Database '${dbName}' created successfully (or already exists)`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to create database:', error);
    process.exit(1);
  }
}

createDatabase();
