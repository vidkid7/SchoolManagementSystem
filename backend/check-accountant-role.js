const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAccountantRole() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
  });

  try {
    console.log('Checking accountant user role...\n');
    
    const [rows] = await connection.execute(
      'SELECT user_id, username, role FROM users WHERE username = ?',
      ['accountant']
    );

    if (rows.length === 0) {
      console.log('❌ Accountant user not found!');
      return;
    }

    const accountant = rows[0];
    console.log('✅ Accountant user found:');
    console.log('User ID:', accountant.user_id);
    console.log('Username:', accountant.username);
    console.log('Role:', accountant.role);
    
    console.log('\n📋 Expected role for admissions access: "Accountant"');
    console.log('📋 Current role:', accountant.role);
    
    if (accountant.role === 'Accountant') {
      console.log('\n✅ Role matches! User should have access to admissions.');
    } else {
      console.log('\n❌ Role does NOT match!');
      console.log('Current role is:', accountant.role);
      console.log('Updating role to "Accountant"...');
      
      await connection.execute(
        'UPDATE users SET role = ? WHERE username = ?',
        ['Accountant', 'accountant']
      );
      
      console.log('✅ Role updated successfully!');
      console.log('\n⚠️  IMPORTANT: Please logout and login again for changes to take effect.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkAccountantRole();
