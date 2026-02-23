import 'dotenv/config';
import sequelize from '../config/database';

async function fixEmergencyContactColumn() {
  try {
    console.log('Updating emergency_contact column size...');
    
    await sequelize.query(`
      ALTER TABLE staff 
      MODIFY COLUMN emergency_contact VARCHAR(100)
    `);
    
    console.log('✅ Successfully updated emergency_contact column to VARCHAR(100)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating column:', error);
    process.exit(1);
  }
}

fixEmergencyContactColumn();
