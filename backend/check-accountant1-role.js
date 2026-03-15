const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAccountant1Role() {
  console.log('🔍 Checking accountant1 user\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    // Check accountant1 user
    const [users] = await connection.execute(
      'SELECT user_id, username, email, role, municipality_id, school_config_id FROM users WHERE username = ?',
      ['accountant1']
    );

    if (users.length === 0) {
      console.log('❌ accountant1 user not found!');
      return;
    }

    const user = users[0];
    console.log('User details:');
    console.log(JSON.stringify(user, null, 2));

    if (user.role !== 'Accountant') {
      console.log(`\n⚠️ Role is "${user.role}" but should be "Accountant"`);
      console.log('\nFixing role...');
      
      await connection.execute(
        'UPDATE users SET role = ? WHERE user_id = ?',
        ['Accountant', user.user_id]
      );
      
      console.log('✅ Role updated to "Accountant"');
      console.log('\n⚠️ You need to logout and login again for changes to take effect!');
    } else {
      console.log('\n✅ Role is correct: Accountant');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAccountant1Role().catch(console.error);
