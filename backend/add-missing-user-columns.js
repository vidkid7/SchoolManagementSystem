const { Sequelize } = require('sequelize');

const DATABASE_URL = "mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

async function addMissingColumns() {
  try {
    console.log('🔍 Connecting to Railway database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    console.log('📋 Checking users table structure...\n');
    
    // Check if columns exist
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'railway' 
      AND TABLE_NAME = 'users';
    `);
    
    const columnNames = columns.map(c => c.COLUMN_NAME);
    console.log('Existing columns:', columnNames.join(', '));
    console.log('');

    // Add municipality_id if missing
    if (!columnNames.includes('municipality_id')) {
      console.log('➕ Adding municipality_id column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN municipality_id VARCHAR(36) NULL AFTER status;
      `);
      console.log('✅ municipality_id column added\n');
    } else {
      console.log('✓ municipality_id column already exists\n');
    }

    // Add school_config_id if missing
    if (!columnNames.includes('school_config_id')) {
      console.log('➕ Adding school_config_id column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN school_config_id VARCHAR(36) NULL AFTER municipality_id;
      `);
      console.log('✅ school_config_id column added\n');
    } else {
      console.log('✓ school_config_id column already exists\n');
    }

    console.log('✅ All required columns are present!');
    console.log('\nYou can now try logging in again.');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissingColumns();
