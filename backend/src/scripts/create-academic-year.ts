import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { AcademicYear } from '../models/AcademicYear.model';
import { logger } from '../utils/logger';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log,
  }
);

async function createAcademicYear() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Check existing
    const existing = await AcademicYear.findAll({ raw: true });
    logger.info(`Found ${existing.length} academic years`);
    
    if (existing.length > 0) {
      existing.forEach((ay: any) => {
        logger.info(`  - ${ay.name} (ID: ${ay.academicYearId}, Current: ${ay.isCurrent})`);
        logger.info(`    Raw data:`, JSON.stringify(ay));
      });
    }

    // Create if none exist
    if (existing.length === 0) {
      const newAY = await AcademicYear.create({
        name: '2081-2082',
        startDateBS: '2081-04-01',
        endDateBS: '2082-03-32',
        startDateAD: new Date('2024-07-15'),
        endDateAD: new Date('2025-07-14'),
        isCurrent: true,
      } as any);
      
      logger.info(`Created academic year: ${newAY.name} (ID: ${(newAY as any).academicYearId})`);
    }

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

createAcademicYear();
