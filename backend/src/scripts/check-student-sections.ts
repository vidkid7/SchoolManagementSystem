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

async function checkStudentSections() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Check students with sections
    const [students]: any = await sequelize.query(`
      SELECT 
        student_id, 
        student_code, 
        first_name_en, 
        last_name_en, 
        section,
        current_class_id
      FROM students 
      LIMIT 10
    `);

    logger.info('\nFirst 10 students:');
    students.forEach((s: any) => {
      logger.info(`  - ID: ${s.student_id}, Code: ${s.student_code}, Name: ${s.first_name_en} ${s.last_name_en}, Section: ${s.section || 'NULL'}, ClassID: ${s.current_class_id}`);
    });

    // Count students by section
    const [sectionCounts]: any = await sequelize.query(`
      SELECT section, COUNT(*) as count 
      FROM students 
      WHERE deleted_at IS NULL 
      GROUP BY section
    `);

    logger.info('\nStudents by section:');
    sectionCounts.forEach((sc: any) => {
      logger.info(`  - Section ${sc.section || 'NULL'}: ${sc.count} students`);
    });

    // Check classes table
    const [classes]: any = await sequelize.query(`
      SELECT class_id, grade_level, section 
      FROM classes 
      LIMIT 10
    `);

    logger.info('\nFirst 10 classes:');
    classes.forEach((c: any) => {
      logger.info(`  - ClassID: ${c.class_id}, Grade: ${c.grade_level}, Section: ${c.section}`);
    });

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkStudentSections();
