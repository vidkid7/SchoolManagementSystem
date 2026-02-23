import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import { logger } from '../utils/logger';

async function checkData() {
  try {
    await sequelize.authenticate();
    
    const [classes] = await sequelize.query('SELECT * FROM classes LIMIT 5');
    const [subjects] = await sequelize.query('SELECT * FROM subjects LIMIT 10');
    
    logger.info('Sample Classes:');
    logger.info(JSON.stringify(classes, null, 2));
    
    logger.info('\nSample Subjects:');
    logger.info(JSON.stringify(subjects, null, 2));
    
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkData();
