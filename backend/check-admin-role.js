const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdminRole() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'school_management_system',
  });

  console.log('✅ Connected to database');

  try {
    // Check admin user
    const [users] = await connection.execute(`
      SELECT user_id, username, email, role, municipality_id, school_config_id
      FROM users 
      WHERE username = 'admin'
    `);

    if (users.length > 0) {
      console.log('\n👤 Admin User Details:');
      console.log(JSON.stringify(users[0], null, 2));
      
      // Check if role matches expected enum
      const expectedRole = 'School_Admin';
      const actualRole = users[0].role;
      
      if (actualRole === expectedRole) {
        console.log(`\n✅ Role matches: ${actualRole}`);
      } else {
        console.log(`\n⚠️  Role mismatch!`);
        console.log(`   Expected: ${expectedRole}`);
        console.log(`   Actual: ${actualRole}`);
        
        // Update to correct role
        console.log('\n🔄 Updating admin role to School_Admin...');
        await connection.execute(`
          UPDATE users 
          SET role = 'School_Admin'
          WHERE username = 'admin'
        `);
        console.log('✅ Admin role updated');
      }
    } else {
      console.log('❌ Admin user not found');
    }

    // Check UserRole enum values
    console.log('\n📋 Checking UserRole enum values...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'school_management_system']);
    
    if (columns.length > 0) {
      console.log('Role enum values:', columns[0].COLUMN_TYPE);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

checkAdminRole().catch(console.error);
