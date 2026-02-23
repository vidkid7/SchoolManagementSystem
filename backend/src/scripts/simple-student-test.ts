import * as dotenv from 'dotenv';
dotenv.config();

import Student from '../models/Student.model';
import { logger } from '../utils/logger';

async function simpleTest() {
  try {
    // Simple count
    const count = await Student.count();
    logger.info(`Total students: ${count}`);

    // Simple findAll
    const students = await Student.findAll({ limit: 10 });
    logger.info(`Found ${students.length} students`);
    
    students.forEach((s: any) => {
      logger.info(`  - ${s.studentId}: ${s.firstNameEn} ${s.lastNameEn} (${s.studentCode})`);
    });

  } catch (error) {
    logger.error('Error:', error);
  }
}

simpleTest();
