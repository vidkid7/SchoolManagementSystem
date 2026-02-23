import * as dotenv from 'dotenv';
dotenv.config();

import StudentRepository from '../modules/student/student.repository';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/constants';

async function testExactAPICall() {
  try {
    // Simulate exact API call
    const page = 1;
    const limit = 10;
    
    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    logger.info('Calling StudentRepository.findAll with:', {
      filters: {},
      options: {
        limit: limitNum,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      }
    });

    const result = await StudentRepository.findAll(
      {},
      {
        limit: limitNum,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      }
    );

    logger.info('Result:', {
      total: result.total,
      studentsCount: result.students.length,
      studentsType: typeof result.students,
      isArray: Array.isArray(result.students)
    });

    if (result.students.length > 0) {
      logger.info('First student:', result.students[0]);
    }

  } catch (error) {
    logger.error('Error:', error);
  }
}

testExactAPICall();
