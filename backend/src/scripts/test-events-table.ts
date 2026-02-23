import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';

async function testEventsTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Test if table exists
    const [tables]: any = await sequelize.query(`
      SHOW TABLES LIKE 'events';
    `);
    
    if (tables.length === 0) {
      console.log('❌ Events table does not exist');
      process.exit(1);
    }
    
    console.log('✓ Events table exists');

    // Test query
    const [events]: any = await sequelize.query(`
      SELECT * FROM events LIMIT 5;
    `);
    
    console.log(`✓ Found ${events.length} events`);
    
    if (events.length > 0) {
      console.log('\nSample event:');
      console.log(events[0]);
    }

    await sequelize.close();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testEventsTable();
