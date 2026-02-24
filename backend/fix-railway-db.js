/**
 * Fix Railway Database - Add missing columns
 * Run with: node fix-railway-db.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  logging: console.log
});

async function fixDatabase() {
  try {
    console.log('🔧 Fixing Railway database...\n');

    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Check which columns exist
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);

    // Add missing columns
    if (!existingColumns.includes('password_reset_token')) {
      console.log('\nAdding password_reset_token column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN password_reset_token VARCHAR(255) NULL
      `);
      console.log('✅ Added password_reset_token');
    } else {
      console.log('✅ password_reset_token already exists');
    }

    if (!existingColumns.includes('password_reset_expires')) {
      console.log('\nAdding password_reset_expires column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN password_reset_expires DATETIME NULL
      `);
      console.log('✅ Added password_reset_expires');
    } else {
      console.log('✅ password_reset_expires already exists');
    }

    // Add index if it doesn't exist
    try {
      console.log('\nAdding index...');
      await sequelize.query(`
        CREATE INDEX idx_users_password_reset_token 
        ON users(password_reset_token)
      `);
      console.log('✅ Added index');
    } catch (err) {
      if (err.message.includes('Duplicate key name')) {
        console.log('✅ Index already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Database fixed successfully!');
    console.log('\nVerifying columns...');

    const [results] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')
    `);

    console.log('\nColumns found:');
    console.table(results);

    console.log('\n🎉 All done! Try logging in now.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixDatabase();
