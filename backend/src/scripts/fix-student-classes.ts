import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import Student from '../models/Student.model';
import Class from '../models/Class.model';
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

async function fixStudentClasses() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Get all classes
    const classes: any[] = await Class.findAll({ raw: true });
    logger.info(`Found ${classes.length} classes`);

    // Get students without class
    const studentsWithoutClass = await Student.findAll({
      where: { currentClassId: null } as any,
      raw: true
    });

    logger.info(`Found ${studentsWithoutClass.length} students without class`);

    // Assign random classes
    for (const student of studentsWithoutClass) {
      const randomClass = classes[Math.floor(Math.random() * classes.length)];
      await Student.update(
        { currentClassId: randomClass.classId },
        { where: { studentId: (student as any).studentId } }
      );
    }

    logger.info(`✅ Updated ${studentsWithoutClass.length} students with class assignments`);

    // Verify
    const stillWithoutClass = await Student.count({
      where: { currentClassId: null } as any
    });

    logger.info(`Students still without class: ${stillWithoutClass}`);

  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixStudentClasses();
