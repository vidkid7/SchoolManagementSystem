const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

// Railway database connection
const DATABASE_URL = 'mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

async function seedMunicipalityAdmin() {
  try {
    console.log('🔍 Connecting to Railway MySQL database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');

    // Check table structure
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM users;`);
    const userIdColumn = columns.find(c => c.Field === 'user_id');
    const roleColumn = columns.find(c => c.Field === 'role');
    console.log(`User ID column type: ${userIdColumn.Type}`);
    console.log(`Role column type: ${roleColumn.Type}\n`);

    // Check existing roles in users table
    const [existingRoles] = await sequelize.query(`
      SELECT DISTINCT role FROM users WHERE role IS NOT NULL LIMIT 10;
    `);
    console.log('Existing role values in users table:', existingRoles.map(r => r.role).join(', '));
    console.log('');

    // Check if user already exists
    const [existingUser] = await sequelize.query(`
      SELECT user_id, username, email, role, status
      FROM users
      WHERE email = 'municipality.admin@school.edu.np' OR username = 'municipalityadmin'
      LIMIT 1;
    `);

    if (existingUser.length > 0) {
      console.log('ℹ️  Municipality admin user already exists:');
      console.log(`  User ID: ${existingUser[0].user_id}`);
      console.log(`  Username: ${existingUser[0].username}`);
      console.log(`  Email: ${existingUser[0].email}`);
      console.log(`  Role: ${existingUser[0].role}`);
      console.log(`  Status: ${existingUser[0].status}\n`);
      
      // Check roles
      const [userRoles] = await sequelize.query(`
        SELECT r.name, r.code
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = '${existingUser[0].user_id}';
      `);
      
      if (userRoles.length > 0) {
        console.log('  Assigned roles:');
        userRoles.forEach(role => {
          console.log(`    - ${role.name} (${role.code})`);
        });
      } else {
        console.log('  ⚠️  No roles assigned!');
      }
      console.log('');
      await sequelize.close();
      return;
    }

    console.log('⚠️  Municipality admin user not found. Creating...\n');

    // Get Municipality_Admin role
    const [municipalityRole] = await sequelize.query(`
      SELECT id, name, code FROM roles 
      WHERE code = 'MUNICIPALITY_ADMIN' 
      LIMIT 1;
    `);

    if (municipalityRole.length === 0) {
      console.error('❌ MUNICIPALITY_ADMIN role not found in database!');
      console.log('\nAvailable roles:');
      const [allRoles] = await sequelize.query('SELECT id, code, name FROM roles ORDER BY code;');
      allRoles.forEach(role => {
        console.log(`  - ${role.code}: ${role.name} (ID: ${role.id})`);
      });
      console.log('\n⚠️  Please ensure the MUNICIPALITY_ADMIN role exists first.');
      await sequelize.close();
      process.exit(1);
    }

    const roleId = municipalityRole[0].id;
    const roleName = municipalityRole[0].name;
    console.log(`✅ Found role: ${roleName} (${municipalityRole[0].code}, ID: ${roleId})\n`);

    // Hash the password
    const hashedPassword = await bcrypt.hash('Municipality@123', 10);

    console.log('🔧 Creating municipality admin user...');

    // Create municipality admin user (user_id is auto-increment)
    await sequelize.query(`
      INSERT INTO users (
        username, email, password,
        role, status,
        created_at, updated_at
      ) VALUES (
        'municipalityadmin', 
        'municipality.admin@school.edu.np',
        '${hashedPassword}',
        'Municipality_Admin',
        'active',
        NOW(),
        NOW()
      );
    `);

    console.log('✅ Municipality admin user created!\n');

    // Get the created user ID
    const [newUser] = await sequelize.query(`
      SELECT user_id FROM users WHERE username = 'municipalityadmin' LIMIT 1;
    `);
    const userId = newUser[0].user_id;

    // Assign MUNICIPALITY_ADMIN role
    await sequelize.query(`
      INSERT INTO user_roles (user_id, role_id, created_at)
      VALUES ('${userId}', '${roleId}', NOW());
    `);

    console.log('✅ Role assigned successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Municipality Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Username: municipalityadmin');
    console.log('  Email:    municipality.admin@school.edu.np');
    console.log('  Password: Municipality@123');
    console.log('  Role:     Municipality_Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await sequelize.close();
    console.log('✅ Process completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('SQL Error:', error.original.message);
    }
    if (error.sql) {
      console.error('SQL Query:', error.sql);
    }
    await sequelize.close();
    process.exit(1);
  }
}

seedMunicipalityAdmin();
