const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    // Get table structure
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('📋 Users table structure:');
    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    // Get admin user
    const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    if (users.length > 0) {
      console.log('\n👤 Admin user details:');
      console.log(JSON.stringify(users[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUserTable();
