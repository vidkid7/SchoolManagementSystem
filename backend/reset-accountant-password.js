const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetAccountantPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
  });

  try {
    console.log('🔧 Resetting accountant password and ensuring correct role...\n');
    
    const newPassword = 'accountant123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Get admin tenant IDs
    const [admins] = await connection.execute(
      'SELECT municipality_id, school_config_id FROM users WHERE role = ? LIMIT 1',
      ['School_Admin']
    );
    
    if (admins.length === 0) {
      console.log('❌ No admin user found!');
      return;
    }
    
    const admin = admins[0];
    
    // Update accountant user with correct role and password
    await connection.execute(
      `UPDATE users 
       SET password = ?, 
           role = ?, 
           municipality_id = ?, 
           school_config_id = ?,
           status = 'active'
       WHERE username = ?`,
      [hashedPassword, 'Accountant', admin.municipality_id, admin.school_config_id, 'accountant']
    );
    
    // Verify the update
    const [users] = await connection.execute(
      'SELECT user_id, username, role, municipality_id, school_config_id, status FROM users WHERE username = ?',
      ['accountant']
    );
    
    if (users.length === 0) {
      console.log('❌ Accountant user not found after update!');
      return;
    }
    
    const accountant = users[0];
    console.log('✅ Accountant user updated successfully!');
    console.log('\nUser Details:');
    console.log('  User ID:', accountant.user_id);
    console.log('  Username:', accountant.username);
    console.log('  Role:', accountant.role);
    console.log('  Municipality ID:', accountant.municipality_id);
    console.log('  School Config ID:', accountant.school_config_id);
    console.log('  Status:', accountant.status);
    console.log('  Password:', newPassword);
    
    console.log('\n✅ Password reset complete!');
    console.log('\n📋 Login Credentials:');
    console.log('  Username: accountant');
    console.log('  Password: accountant123');
    
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Clear browser cache and cookies (or use incognito mode)');
    console.log('2. Go to login page');
    console.log('3. Login with: accountant / accountant123');
    console.log('4. Try accessing admission pages');
    console.log('\nThis will create a fresh JWT token with the correct role!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

resetAccountantPassword();
