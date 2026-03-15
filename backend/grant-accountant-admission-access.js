const mysql = require('mysql2/promise');
require('dotenv').config();

async function grantAdmissionAccess() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
  });

  try {
    console.log('🔧 Granting admission access to accountant user...\n');
    
    // Check current accountant user
    const [users] = await connection.execute(
      'SELECT user_id, username, role FROM users WHERE username = ?',
      ['accountant']
    );

    if (users.length === 0) {
      console.log('❌ Accountant user not found!');
      return;
    }

    const accountant = users[0];
    console.log('Current accountant user:');
    console.log('  User ID:', accountant.user_id);
    console.log('  Username:', accountant.username);
    console.log('  Role:', accountant.role);
    
    // Update role to exact match
    console.log('\n📝 Updating role to ensure exact match...');
    await connection.execute(
      'UPDATE users SET role = ? WHERE username = ?',
      ['Accountant', 'accountant']
    );
    console.log('✅ Role updated to: Accountant');
    
    // Check if permissions table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'permissions'"
    );
    
    if (tables.length > 0) {
      console.log('\n📝 Checking permissions table...');
      
      // Check if accountant has admission permissions
      const [perms] = await connection.execute(
        'SELECT * FROM permissions WHERE user_id = ? AND resource LIKE ?',
        [accountant.user_id, '%admission%']
      );
      
      if (perms.length === 0) {
        console.log('⚠️  No admission permissions found. Adding...');
        
        // Add admission permissions
        const admissionPermissions = [
          'admissions:read',
          'admissions:create',
          'admissions:update',
          'admissions:delete'
        ];
        
        for (const perm of admissionPermissions) {
          await connection.execute(
            'INSERT INTO permissions (user_id, resource, action) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE action = VALUES(action)',
            [accountant.user_id, 'admissions', perm.split(':')[1]]
          );
        }
        
        console.log('✅ Admission permissions added');
      } else {
        console.log('✅ Admission permissions already exist');
      }
    }
    
    // Check role_permissions table
    const [rolePermTables] = await connection.execute(
      "SHOW TABLES LIKE 'role_permissions'"
    );
    
    if (rolePermTables.length > 0) {
      console.log('\n📝 Checking role_permissions table...');
      
      const [rolePerms] = await connection.execute(
        'SELECT * FROM role_permissions WHERE role = ? AND resource LIKE ?',
        ['Accountant', '%admission%']
      );
      
      if (rolePerms.length === 0) {
        console.log('⚠️  No admission role permissions found. Adding...');
        
        const admissionActions = ['read', 'create', 'update', 'delete'];
        
        for (const action of admissionActions) {
          await connection.execute(
            'INSERT INTO role_permissions (role, resource, action) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE action = VALUES(action)',
            ['Accountant', 'admissions', action]
          );
        }
        
        console.log('✅ Role permissions added');
      } else {
        console.log('✅ Role permissions already exist');
      }
    }
    
    console.log('\n✅ All permissions granted successfully!');
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Logout from the application');
    console.log('2. Clear browser cache and cookies');
    console.log('3. Login again with: accountant / accountant123');
    console.log('4. Try accessing admission pages again');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

grantAdmissionAccess();
