import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';

async function fixTimetableAutoIncrement() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Check current table structure
    const [tableInfo]: any = await sequelize.query(`
      SHOW CREATE TABLE timetables;
    `);
    console.log('\nCurrent table structure:');
    console.log(tableInfo[0]['Create Table']);

    // Check if auto_increment is set
    const [columns]: any = await sequelize.query(`
      SHOW COLUMNS FROM timetables WHERE Field = 'timetable_id';
    `);
    console.log('\nCurrent timetable_id column:');
    console.log(columns[0]);

    // Fix the auto_increment if needed
    console.log('\nFixing auto_increment...');
    await sequelize.query(`
      ALTER TABLE timetables 
      MODIFY COLUMN timetable_id INT UNSIGNED NOT NULL AUTO_INCREMENT;
    `);

    console.log('Auto_increment fixed!');

    // Verify the fix
    const [columnsAfter]: any = await sequelize.query(`
      SHOW COLUMNS FROM timetables WHERE Field = 'timetable_id';
    `);
    console.log('\nFixed timetable_id column:');
    console.log(columnsAfter[0]);

    await sequelize.close();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTimetableAutoIncrement();
