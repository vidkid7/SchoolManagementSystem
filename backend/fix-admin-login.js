const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixAdminLogin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    console.log('🔍 Checking admin user...');

    // Check if admin user exists
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );

    if (users.length === 0) {
      console.log('❌ Admin user not found.');
    } else {
      console.log('✅ Admin user found!');
      console.log('   Username:', users[0].username);
      console.log('   Email:', users[0].email);
      console.log('   Role:', users[0].role);
      console.log('   Status:', users[0].status);
      
      // Test current password
      console.log('\n🔐 Testing password "admin123"...');
      const currentPasswordMatch = await bcrypt.compare('admin123', users[0].password);
      
      if (currentPasswordMatch) {
        console.log('✅ Current password is already "admin123"');
      } else {
        // Reset password to admin123
        console.log('❌ Current password does not match. Resetting to: admin123');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await connection.execute(
          'UPDATE users SET password = ?, status = ?, failed_login_attempts = 0, account_locked_until = NULL, updated_at = NOW() WHERE username = ?',
          [hashedPassword, 'active', 'admin']
        );
        
        console.log('✅ Password reset successfully!');
      }
    }

    // Verify the password works
    const [verifyUsers] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );
    
    const passwordMatch = await bcrypt.compare('admin123', verifyUsers[0].password);
    console.log('\n🔐 Password verification:', passwordMatch ? '✅ PASS' : '❌ FAIL');
    
    if (passwordMatch) {
      console.log('\n✨ You can now login with:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixAdminLogin();
