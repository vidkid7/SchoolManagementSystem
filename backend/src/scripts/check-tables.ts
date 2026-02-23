import 'dotenv/config';
import sequelize from '../config/database';

async function checkTables(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const [classes] = await sequelize.query('DESCRIBE classes');
    console.log('\n=== Classes Table ===');
    console.log(JSON.stringify(classes, null, 2));

    const [subjects] = await sequelize.query('DESCRIBE subjects');
    console.log('\n=== Subjects Table ===');
    console.log(JSON.stringify(subjects, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();
