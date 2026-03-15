const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAccountantUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'school_management_system',
  });

  console.log('✅ Connected to database');

  try {
    // Get admin tenant IDs
    const [adminUsers] = await connection.execute(`
      SELECT municipality_id, school_config_id 
      FROM users 
      WHERE role = 'School_Admin' 
      LIMIT 1
    `);

    if (adminUsers.length === 0) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    const { municipality_id, school_config_id } = adminUsers[0];
    console.log(`\n🏢 Using tenant IDs from admin user:`);
    console.log(`   Municipality: ${municipality_id}`);
    console.log(`   School: ${school_config_id}`);

    // Check if accountant user already exists
    const [existingUsers] = await connection.execute(`
      SELECT user_id, username FROM users WHERE username = 'accountant'
    `);

    if (existingUsers.length > 0) {
      console.log('\n⚠️  Accountant user already exists. Updating password...');
      
      const hashedPassword = await bcrypt.hash('accountant123', 10);
      
      await connection.execute(`
        UPDATE users 
        SET password = ?, 
            role = 'Accountant',
            status = 'active',
            municipality_id = ?,
            school_config_id = ?
        WHERE username = 'accountant'
      `, [hashedPassword, municipality_id, school_config_id]);
      
      console.log('✅ Accountant user updated');
      console.log('\n📋 Login Credentials:');
      console.log('   Username: accountant');
      console.log('   Password: accountant123');
      console.log('   Role: Accountant');
      
    } else {
      console.log('\n👤 Creating new accountant user...');
      
      const hashedPassword = await bcrypt.hash('accountant123', 10);
      
      await connection.execute(`
        INSERT INTO users (
          username, 
          email, 
          password, 
          role, 
          status,
          municipality_id,
          school_config_id,
          failed_login_attempts,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'accountant',
        'accountant@school.edu.np',
        hashedPassword,
        'Accountant',
        'active',
        municipality_id,
        school_config_id,
        0
      ]);
      
      console.log('✅ Accountant user created successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('   Username: accountant');
      console.log('   Password: accountant123');
      console.log('   Email: accountant@school.edu.np');
      console.log('   Role: Accountant');
    }

    console.log('\n🎯 After login, the accountant will see:');
    console.log('   - Finance Dashboard as landing page');
    console.log('   - Finance statistics and metrics');
    console.log('   - Recent transactions');
    console.log('   - Overdue invoices');
    console.log('   - Quick access to finance features');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createAccountantUser().catch(console.error);
