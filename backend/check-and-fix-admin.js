/**
 * Check and fix admin user for Railway
 * Run with: node check-and-fix-admin.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  logging: false
});

async function checkAndFixAdmin() {
  try {
    console.log('🔍 Checking Railway database users...\n');

    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Check if users table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'users'");
    if (!tables || tables.length === 0) {
      console.log('❌ Users table does not exist!');
      console.log('Run migrations first: node dist/scripts/run-migrations.js up');
      process.exit(1);
    }

    // Get all users
    const [users] = await sequelize.query('SELECT user_id, username, email, role, status FROM users');
    
    console.log(`Found ${users.length} users:\n`);
    console.table(users);

    // Check for admin user
    const [admins] = await sequelize.query("SELECT * FROM users WHERE username = 'admin'");
    
    if (admins.length === 0) {
      console.log('\n❌ No admin user found!');
      console.log('Creating admin user...\n');
      
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      await sequelize.query(`
        INSERT INTO users (username, email, password, role, status, created_at, updated_at)
        VALUES ('admin', 'admin@school.com', ?, 'school_admin', 'active', NOW(), NOW())
      `, {
        replacements: [hashedPassword]
      });
      
      console.log('✅ Admin user created!');
      console.log('Username: admin');
      console.log('Password: Admin@123');
    } else {
      console.log('\n✅ Admin user exists!');
      console.log('Resetting password to: Admin@123\n');
      
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      await sequelize.query(`
        UPDATE users 
        SET password = ?, 
            status = 'active',
            failed_login_attempts = 0,
            account_locked_until = NULL
        WHERE username = 'admin'
      `, {
        replacements: [hashedPassword]
      });
      
      console.log('✅ Admin password reset!');
      console.log('Username: admin');
      console.log('Password: Admin@123');
    }

    console.log('\n🎉 All done! Try logging in now.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkAndFixAdmin();
