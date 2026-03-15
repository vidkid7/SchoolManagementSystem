require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

// Railway DATABASE_URL should be set as environment variable
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required!');
  console.log('\nUsage:');
  console.log('  $env:DATABASE_URL = "your_railway_postgres_url"');
  console.log('  node backend/seed-railway-database.js');
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

async function seedRailwayDatabase() {
  try {
    console.log('🔍 Connecting to Railway MySQL database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');

    // Check if roles exist
    const [roles] = await sequelize.query('SELECT COUNT(*) as count FROM roles;');
    console.log(`📋 Current roles in database: ${roles[0].count}`);

    // Check if users exist
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users;');
    console.log(`👥 Current users in database: ${users[0].count}\n`);

    if (roles[0].count === 0) {
      console.log('⚠️  No roles found. You need to seed roles first!');
      console.log('Run this from your backend directory:');
      console.log('  npm run seed:roles\n');
    }

    if (users[0].count === 0) {
      console.log('🔧 Creating default admin user...\n');
      
      // Get School Admin role
      const [adminRole] = await sequelize.query(
        "SELECT id FROM roles WHERE code = 'SCHOOL_ADMIN' LIMIT 1;"
      );

      if (adminRole.length === 0) {
        console.error('❌ SCHOOL_ADMIN role not found. Please seed roles first!');
        process.exit(1);
      }

      const roleId = adminRole[0].id;
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      // Create admin user (MySQL syntax)
      const userId = require('crypto').randomUUID();
      
      await sequelize.query(`
        INSERT INTO users (
          user_id, username, email, password_hash, 
          first_name, last_name, role, is_active, 
          created_at, updated_at
        ) VALUES (
          '${userId}', 'admin', 'admin@school.edu.np', 
          '${hashedPassword}', 'System', 'Administrator', 
          'admin', 1, NOW(), NOW()
        );
      `);

      // Get the created user
      const [newUser] = await sequelize.query(
        "SELECT user_id FROM users WHERE username = 'admin' LIMIT 1;"
      );

      // Assign SCHOOL_ADMIN role
      await sequelize.query(`
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES ('${newUser[0].user_id}', '${roleId}', NOW());
      `);

      console.log('✅ Admin user created successfully!\n');
      console.log('Login credentials:');
      console.log('  Username: admin');
      console.log('  Password: Admin@123\n');
    } else {
      console.log('ℹ️  Users already exist in database.\n');
      
      // Show existing users
      const [existingUsers] = await sequelize.query(`
        SELECT username, email, first_name, last_name, is_active
        FROM users
        ORDER BY created_at
        LIMIT 10;
      `);

      console.log('Existing users:');
      existingUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.email}) - ${user.first_name} ${user.last_name}`);
      });
      console.log('');
    }

    await sequelize.close();
    console.log('✅ Database check completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('Details:', error.original.message);
    }
    process.exit(1);
  }
}

seedRailwayDatabase();
