require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

// Railway DATABASE_URL should be set as environment variable
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required!');
  console.log('\nUsage:');
  console.log('  $env:DATABASE_URL = "your_railway_mysql_url"');
  console.log('  node backend/check-and-seed-municipality-admin.js');
  process.exit(1);
}

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

async function checkAndSeedMunicipalityAdmin() {
  try {
    console.log('🔍 Connecting to Railway MySQL database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');

    // Check if municipality admin user exists
    const [existingUser] = await sequelize.query(`
      SELECT user_id, username, email, first_name, last_name, is_active
      FROM users
      WHERE email = 'municipality.admin@school.edu.np'
      LIMIT 1;
    `);

    if (existingUser.length > 0) {
      console.log('ℹ️  Municipality admin user already exists:');
      console.log(`  Username: ${existingUser[0].username}`);
      console.log(`  Email: ${existingUser[0].email}`);
      console.log(`  Name: ${existingUser[0].first_name} ${existingUser[0].last_name}`);
      console.log(`  Active: ${existingUser[0].is_active ? 'Yes' : 'No'}\n`);
      
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
      
      await sequelize.close();
      return;
    }

    console.log('⚠️  Municipality admin user not found. Creating...\n');

    // Get Municipality Admin role
    const [municipalityRole] = await sequelize.query(`
      SELECT id, name FROM roles 
      WHERE code = 'MUNICIPALITY_ADMIN' 
      LIMIT 1;
    `);

    if (municipalityRole.length === 0) {
      console.error('❌ MUNICIPALITY_ADMIN role not found in database!');
      console.log('\nAvailable roles:');
      const [allRoles] = await sequelize.query('SELECT code, name FROM roles;');
      allRoles.forEach(role => {
        console.log(`  - ${role.code}: ${role.name}`);
      });
      console.log('\nPlease ensure the MUNICIPALITY_ADMIN role exists first.');
      await sequelize.close();
      process.exit(1);
    }

    const roleId = municipalityRole[0].id;
    const roleName = municipalityRole[0].name;
    console.log(`✅ Found role: ${roleName} (ID: ${roleId})\n`);

    // Hash the password
    const hashedPassword = await bcrypt.hash('Municipality@123', 10);
    const userId = require('crypto').randomUUID();

    // Create municipality admin user
    await sequelize.query(`
      INSERT INTO users (
        user_id, username, email, password_hash,
        first_name, last_name, role, is_active,
        created_at, updated_at
      ) VALUES (
        '${userId}', 
        'municipality.admin', 
        'municipality.admin@school.edu.np',
        '${hashedPassword}',
        'Municipality',
        'Administrator',
        'municipality_admin',
        1,
        NOW(),
        NOW()
      );
    `);

    console.log('✅ Municipality admin user created!\n');

    // Assign MUNICIPALITY_ADMIN role
    await sequelize.query(`
      INSERT INTO user_roles (user_id, role_id, created_at)
      VALUES ('${userId}', '${roleId}', NOW());
    `);

    console.log('✅ Role assigned successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Municipality Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Email:    municipality.admin@school.edu.np');
    console.log('  Password: Municipality@123');
    console.log('  Role:     Municipality Administrator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await sequelize.close();
    console.log('✅ Process completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('Details:', error.original.message);
    }
    await sequelize.close();
    process.exit(1);
  }
}

checkAndSeedMunicipalityAdmin();
