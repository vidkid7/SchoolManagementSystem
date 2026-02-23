import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import StudentRepository from '../modules/student/student.repository';
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

async function testRepository() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Test findAll with no filters
    logger.info('\n=== Testing findAll with no filters ===');
    const result1 = await StudentRepository.findAll({}, { limit: 10, offset: 0 });
    logger.info(`Found ${result1.total} students, returned ${result1.students.length} students`);
    
    if (result1.students.length > 0) {
      logger.info('First student:', {
        id: result1.students[0].studentId,
        code: result1.students[0].studentCode,
        name: `${result1.students[0].firstNameEn} ${result1.students[0].lastNameEn}`
      });
    }

    // Test findAll with status filter
    logger.info('\n=== Testing findAll with status=active ===');
    const result2 = await StudentRepository.findAll(
      { status: 'active' as any },
      { limit: 10, offset: 0 }
    );
    logger.info(`Found ${result2.total} active students, returned ${result2.students.length} students`);

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testRepository();
