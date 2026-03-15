const mysql = require('mysql2/promise');
require('dotenv').config();

async function grantAdminPermissions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    console.log('🔧 Granting admin permissions...\n');

    // Get admin user's tenant IDs
    const [adminUser] = await connection.execute(
      'SELECT municipality_id, school_config_id FROM users WHERE username = ?',
      ['admin']
    );
    const { municipality_id, school_config_id } = adminUser[0];

    // Check if roles table exists and get School Admin role
    const [roles] = await connection.execute(
      `SELECT * FROM roles WHERE name = 'School Admin'`
    );

    if (roles.length === 0) {
      console.log('❌ School Admin role not found!');
      return;
    }
    
    console.log('✅ Found School Admin role');

    // Get all permissions
    const [permissions] = await connection.execute(
      `SELECT * FROM permissions`
    );

    console.log(`📋 Found ${permissions.length} permissions`);

    if (permissions.length === 0) {
      console.log('⚠️  No permissions found in database. Creating basic permissions...');
      
      const basicPermissions = [
        'view_dashboard', 'view_reports', 'view_students', 'create_students', 'edit_students', 'delete_students',
        'view_attendance', 'create_attendance', 'edit_attendance', 'delete_attendance',
        'view_exams', 'create_exams', 'edit_exams', 'delete_exams',
        'view_grades', 'create_grades', 'edit_grades', 'delete_grades',
        'view_finance', 'create_finance', 'edit_finance', 'delete_finance',
        'view_staff', 'create_staff', 'edit_staff', 'delete_staff',
        'view_library', 'create_library', 'edit_library', 'delete_library',
        'view_eca', 'create_eca', 'edit_eca', 'delete_eca',
        'view_sports', 'create_sports', 'edit_sports', 'delete_sports',
        'view_admissions', 'create_admissions', 'edit_admissions', 'delete_admissions'
      ];

      for (const perm of basicPermissions) {
        await connection.execute(
          `INSERT INTO permissions (name, description, resource, action, created_at, updated_at, municipality_id, school_config_id)
           VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
          [perm, `Permission to ${perm.replace('_', ' ')}`, perm.split('_')[1] || 'general', perm.split('_')[0], municipality_id, school_config_id]
        );
      }
      
      console.log(`✅ Created ${basicPermissions.length} basic permissions`);
    }

    // Get School Admin role ID
    const [schoolAdminRole] = await connection.execute(
      `SELECT * FROM roles WHERE name = 'School Admin'`
    );
    
    const roleId = schoolAdminRole[0].id;
    console.log(`\n📋 School Admin role ID: ${roleId}`);

    // Get all permissions again
    const [allPermissions] = await connection.execute(
      `SELECT * FROM permissions`
    );

    // Grant all permissions to School Admin
    console.log(`\n📋 Granting ${allPermissions.length} permissions to School Admin...`);
    
    let granted = 0;
    for (const permission of allPermissions) {
      const permissionId = permission.id || permission.permission_id;
      
      // Check if already granted
      const [existing] = await connection.execute(
        `SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?`,
        [roleId, permissionId]
      );

      if (existing.length === 0) {
        await connection.execute(
          `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at, municipality_id, school_config_id)
           VALUES (?, ?, NOW(), NOW(), ?, ?)`,
          [roleId, permissionId, municipality_id || null, school_config_id || null]
        );
        granted++;
      }
    }

    console.log(`✅ Granted ${granted} new permissions to School Admin`);
    console.log(`\n✨ Admin now has full access to all features!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

grantAdminPermissions();
