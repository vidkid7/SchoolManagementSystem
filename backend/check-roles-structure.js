const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRolesStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    // Get roles table structure
    const [columns] = await connection.execute('DESCRIBE roles');
    console.log('📋 Roles table structure:');
    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Extra || ''}`);
    });

    // Get existing roles
    const [roles] = await connection.execute('SELECT * FROM roles');
    console.log(`\n📋 Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id || role.role_id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkRolesStructure();
