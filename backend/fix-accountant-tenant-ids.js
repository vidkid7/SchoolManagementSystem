const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAccountantTenantIds() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
  });

  try {
    console.log('🔧 Checking accountant tenant IDs...\n');
    
    // Get admin user's tenant IDs
    const [admins] = await connection.execute(
      'SELECT municipality_id, school_config_id FROM users WHERE role = ? LIMIT 1',
      ['School_Admin']
    );
    
    if (admins.length === 0) {
      console.log('❌ No admin user found to copy tenant IDs from!');
      return;
    }
    
    const admin = admins[0];
    console.log('Admin tenant IDs:');
    console.log('  Municipality ID:', admin.municipality_id);
    console.log('  School Config ID:', admin.school_config_id);
    
    // Check accountant user
    const [accountants] = await connection.execute(
      'SELECT user_id, username, role, municipality_id, school_config_id FROM users WHERE username = ?',
      ['accountant']
    );
    
    if (accountants.length === 0) {
      console.log('❌ Accountant user not found!');
      return;
    }
    
    const accountant = accountants[0];
    console.log('\nCurrent accountant user:');
    console.log('  User ID:', accountant.user_id);
    console.log('  Username:', accountant.username);
    console.log('  Role:', accountant.role);
    console.log('  Municipality ID:', accountant.municipality_id || 'NULL');
    console.log('  School Config ID:', accountant.school_config_id || 'NULL');
    
    // Update if missing
    if (!accountant.municipality_id || !accountant.school_config_id) {
      console.log('\n📝 Updating tenant IDs...');
      
      await connection.execute(
        'UPDATE users SET municipality_id = ?, school_config_id = ?, role = ? WHERE username = ?',
        [admin.municipality_id, admin.school_config_id, 'Accountant', 'accountant']
      );
      
      console.log('✅ Tenant IDs updated successfully!');
      console.log('  Municipality ID:', admin.municipality_id);
      console.log('  School Config ID:', admin.school_config_id);
    } else {
      console.log('\n✅ Tenant IDs already set correctly!');
    }
    
    console.log('\n⚠️  IMPORTANT: Logout and login again for changes to take effect!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

fixAccountantTenantIds();
