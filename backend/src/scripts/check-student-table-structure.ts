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
    logging: false,
  }
);

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Get students table structure
    const [studentColumns]: any = await sequelize.query(`
      DESCRIBE students
    `);

    logger.info('\nStudents table columns:');
    studentColumns.forEach((col: any) => {
      logger.info(`  - ${col.Field} (${col.Type})`);
    });

    // Get a sample student with class info
    const [students]: any = await sequelize.query(`
      SELECT 
        s.student_id, 
        s.student_code, 
        s.first_name_en, 
        s.last_name_en, 
        s.current_class_id,
        c.grade_level,
        c.section
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.class_id
      LIMIT 10
    `);

    logger.info('\nFirst 10 students with class info:');
    students.forEach((s: any) => {
      logger.info(`  - ${s.student_code}: ${s.first_name_en} ${s.last_name_en} - Grade ${s.grade_level}, Section ${s.section}`);
    });

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();
