import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import Student from '../models/Student.model';
import { logger } from '../utils/logger';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

async function checkStudents() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    const count = await Student.count();
    logger.info(`Total students in database: ${count}`);

    const students = await Student.findAll({
      limit: 10,
      raw: true,
      attributes: ['studentId', 'studentCode', 'firstNameEn', 'lastNameEn', 'status', 'currentClassId']
    });

    logger.info('\nFirst 10 students:');
    students.forEach((s: any) => {
      logger.info(`  - ID: ${s.studentId}, Code: ${s.studentCode}, Name: ${s.firstNameEn} ${s.lastNameEn}, Status: ${s.status}, ClassID: ${s.currentClassId}`);
    });

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkStudents();
