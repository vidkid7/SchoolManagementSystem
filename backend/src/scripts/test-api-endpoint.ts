import * as dotenv from 'dotenv';
dotenv.config();

import Student from '../models/Student.model';
import { logger } from '../utils/logger';

async function testAPIEndpoint() {
  try {
    // Test 1: Direct model query
    logger.info('=== Test 1: Direct Model Query ===');
    const students = await Student.findAll({ 
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    
    logger.info(`Found ${students.length} students`);
    
    // Test 2: Check if toJSON works
    logger.info('\n=== Test 2: Check toJSON ===');
    if (students.length > 0) {
      const firstStudent = students[0];
      const jsonData = firstStudent.toJSON();
      logger.info('First student as JSON:', {
        id: jsonData.studentId,
        code: jsonData.studentCode,
        name: `${jsonData.firstNameEn} ${jsonData.lastNameEn}`
      });
    }
    
    // Test 3: Simulate Express JSON serialization
    logger.info('\n=== Test 3: Express JSON Serialization ===');
    const response = {
      success: true,
      data: students,
      message: 'Students retrieved successfully'
    };
    
    const jsonString = JSON.stringify(response);
    const parsed = JSON.parse(jsonString);
    
    logger.info(`Serialized data length: ${parsed.data.length}`);
    if (parsed.data.length > 0) {
      logger.info('First student after serialization:', {
        id: parsed.data[0].studentId,
        code: parsed.data[0].studentCode,
        name: `${parsed.data[0].firstNameEn} ${parsed.data[0].lastNameEn}`
      });
    }
    
  } catch (error) {
    logger.error('Error:', error);
  }
}

testAPIEndpoint();
