const { Sequelize } = require('sequelize');

const DATABASE_URL = "mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function fixUserRoles() {
  try {
    console.log('🔍 Connecting to Railway database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // Check if user_roles table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'user_roles';");
    
    if (tables.length === 0) {
      console.log('❌ user_roles table does not exist!');
      console.log('The system might be using the old role system (role column in users table)');
      console.log('This is fine - the login should work with the role column.\n');
      
      // Show users and their roles
      const [users] = await sequelize.query(`
        SELECT user_id, username, email, role, status 
        FROM users 
        ORDER BY user_id;
      `);
      
      console.log('👥 Users in database:');
      console.log('='.repeat(80));
      users.forEach(u => {
        console.log(`${u.user_id}. ${u.username.padEnd(20)} ${u.email.padEnd(30)} ${u.role.padEnd(20)} ${u.status}`);
      });
      
      await sequelize.close();
      return;
    }

    // Check user_roles entries
    const [userRoles] = await sequelize.query(`
      SELECT COUNT(*) as count FROM user_roles;
    `);
    
    console.log(`📋 User-Role mappings: ${userRoles[0].count}\n`);

    if (userRoles[0].count === 0) {
      console.log('⚠️  No user-role mappings found. Creating them...\n');
      
      // Get all users and roles
      const [users] = await sequelize.query('SELECT user_id, username, role FROM users;');
      const [roles] = await sequelize.query('SELECT id, code FROM roles;');
      
      // Create a map of role codes
      const roleMap = {};
      roles.forEach(r => {
        roleMap[r.code] = r.id;
      });
      
      // Assign roles to users
      for (const user of users) {
        let roleCode = user.role.toUpperCase().replace(/ /g, '_');
        const roleId = roleMap[roleCode];
        
        if (roleId) {
          await sequelize.query(`
            INSERT INTO user_roles (user_id, role_id, created_at)
            VALUES (${user.user_id}, '${roleId}', NOW())
            ON DUPLICATE KEY UPDATE role_id = '${roleId}';
          `);
          console.log(`✅ Assigned ${roleCode} to ${user.username}`);
        } else {
          console.log(`⚠️  Role ${roleCode} not found for ${user.username}`);
        }
      }
      
      console.log('\n✅ User-role mappings created!');
    } else {
      console.log('ℹ️  User-role mappings already exist.');
    }

    await sequelize.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserRoles();
