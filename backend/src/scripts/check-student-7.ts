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

async function checkStudent7() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Get student 7 with all fields
    const [students]: any = await sequelize.query(`
      SELECT 
        s.*,
        c.grade_level,
        c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.class_id
      WHERE s.student_id = 7
    `);

    if (students.length > 0) {
      const student = students[0];
      console.log('\n=== Student 7 Full Data ===');
      console.log(JSON.stringify(student, null, 2));
    } else {
      console.log('Student 7 not found');
    }

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkStudent7();
