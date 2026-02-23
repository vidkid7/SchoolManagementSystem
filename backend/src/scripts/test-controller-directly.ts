import * as dotenv from 'dotenv';
dotenv.config();

import StudentRepository from '../modules/student/student.repository';
import { calculatePagination } from '../utils/responseFormatter';
import { PAGINATION } from '../config/constants';
import { logger } from '../utils/logger';

async function testControllerLogic() {
  try {
    // Simulate exact controller logic
    const page = 1;
    const limit = 10;
    
    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    logger.info('Fetching with params:', { pageNum, limitNum, offset });

    const { students, total } = await StudentRepository.findAll(
      {},
      {
        limit: limitNum,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      }
    );

    logger.info('Repository returned:', {
      studentsCount: students.length,
      total,
      studentsType: typeof students,
      isArray: Array.isArray(students)
    });

    const meta = calculatePagination(total, pageNum, limitNum);

    logger.info('Meta:', meta);

    // Simulate response
    const response = {
      success: true,
      data: students,
      message: 'Students retrieved successfully',
      meta
    };

    // Test JSON serialization
    const jsonString = JSON.stringify(response);
    const parsed = JSON.parse(jsonString);

    logger.info('After JSON serialization:', {
      dataLength: parsed.data.length,
      metaTotal: parsed.meta.total,
      firstStudent: parsed.data[0] ? {
        id: parsed.data[0].studentId,
        code: parsed.data[0].studentCode,
        name: `${parsed.data[0].firstNameEn} ${parsed.data[0].lastNameEn}`
      } : 'No students'
    });

  } catch (error) {
    logger.error('Error:', error);
  }
}

testControllerLogic();
