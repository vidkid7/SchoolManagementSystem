import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';
import { initEvent } from '../models/Event.model';

async function initializeEventModel() {
  try {
    console.log('Initializing Event model...');
    
    // Initialize the Event model
    const Event = initEvent(sequelize);
    
    console.log('✓ Event model initialized');
    
    // Test a simple query
    const count = await Event.count();
    console.log(`✓ Event model working - found ${count} events`);
    
    await sequelize.close();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initializeEventModel();
