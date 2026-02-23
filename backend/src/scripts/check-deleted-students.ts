import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
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

async function checkDeletedStudents() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Check total students
    const [totalResult]: any = await sequelize.query('SELECT COUNT(*) as count FROM students');
    logger.info(`Total students (including deleted): ${totalResult[0].count}`);

    // Check non-deleted students
    const [activeResult]: any = await sequelize.query('SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL');
    logger.info(`Active students (deleted_at IS NULL): ${activeResult[0].count}`);

    // Check deleted students
    const [deletedResult]: any = await sequelize.query('SELECT COUNT(*) as count FROM students WHERE deleted_at IS NOT NULL');
    logger.info(`Deleted students (deleted_at IS NOT NULL): ${deletedResult[0].count}`);

    // Show first 10 students with their deleted_at status
    const [students]: any = await sequelize.query(`
      SELECT student_id, student_code, first_name_en, last_name_en, status, current_class_id, deleted_at 
      FROM students 
      LIMIT 10
    `);

    logger.info('\nFirst 10 students:');
    students.forEach((s: any) => {
      logger.info(`  - ID: ${s.student_id}, Code: ${s.student_code}, Name: ${s.first_name_en} ${s.last_name_en}, Status: ${s.status}, ClassID: ${s.current_class_id}, DeletedAt: ${s.deleted_at}`);
    });

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkDeletedStudents();
