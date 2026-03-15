const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    console.log('🔧 Adding missing columns...\n');

    const tables = ['students', 'attendance', 'invoices', 'grades'];
    
    for (const table of tables) {
      console.log(`📋 Checking ${table} table...`);
      
      // Check if table exists
      const [tableExists] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = ? AND table_name = ?`,
        [process.env.DB_NAME, table]
      );
      
      if (tableExists[0].count === 0) {
        console.log(`⚠️  Table ${table} does not exist, skipping...`);
        continue;
      }

      // Check if municipality_id exists
      const [municipalityCol] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = ? AND column_name = 'municipality_id'`,
        [process.env.DB_NAME, table]
      );

      if (municipalityCol[0].count === 0) {
        await connection.execute(
          `ALTER TABLE ${table} ADD COLUMN municipality_id CHAR(36) NULL`
        );
        console.log(`✅ Added municipality_id to ${table}`);
      } else {
        console.log(`ℹ️  municipality_id already exists in ${table}`);
      }

      // Check if school_config_id exists
      const [schoolConfigCol] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = ? AND column_name = 'school_config_id'`,
        [process.env.DB_NAME, table]
      );

      if (schoolConfigCol[0].count === 0) {
        await connection.execute(
          `ALTER TABLE ${table} ADD COLUMN school_config_id CHAR(36) NULL`
        );
        console.log(`✅ Added school_config_id to ${table}`);
      } else {
        console.log(`ℹ️  school_config_id already exists in ${table}`);
      }
    }

    console.log('\n✨ All missing columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addMissingColumns();
