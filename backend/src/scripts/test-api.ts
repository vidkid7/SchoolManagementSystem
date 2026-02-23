import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import Class from '../models/Class.model';
import { Subject } from '../models/Subject.model';
import { logger } from '../utils/logger';

async function testAPI() {
  try {
    await sequelize.authenticate();
    
    // Test raw query
    const [rawSubjects] = await sequelize.query('SELECT * FROM subjects LIMIT 5');
    logger.info('Raw query subjects:', rawSubjects);
    
    // Test model query
    const modelSubjects = await Subject.findAll({ 
      limit: 5,
      raw: true 
    });
    logger.info('\nModel query subjects:', modelSubjects);
    
    // Test classes
    const classes = await Class.findAll({ 
      limit: 5,
      raw: true 
    });
    logger.info('\nClasses:', classes);
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

testAPI();
