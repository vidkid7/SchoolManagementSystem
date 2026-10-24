/**
 * Check and fix admin user for Railway
 * Run with: node check-and-fix-admin.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;
const username = process.env.ADMIN_USERNAME?.trim();
const newPassword = process.env.ADMIN_RESET_PASSWORD;

if (!DATABASE_URL || process.env.CONFIRM_ADMIN_PASSWORD_RESET !== 'true' || !username || !newPassword || newPassword.length < 14) {
  console.error('Set DATABASE_URL, CONFIRM_ADMIN_PASSWORD_RESET=true, ADMIN_USERNAME, and a 14+ character ADMIN_RESET_PASSWORD.');
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
    const [admins] = await sequelize.query('SELECT * FROM users WHERE username = :username', { replacements: { username } });
    
    if (admins.length === 0) {
      console.log('\n❌ No admin user found!');
      console.log('Creating admin user...\n');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await sequelize.query(`
        INSERT INTO users (username, email, password, role, status, created_at, updated_at)
        VALUES (:username, :email, :password, 'school_admin', 'active', NOW(), NOW())
      `, {
        replacements: { username, email: `${username}@school.com`, password: hashedPassword }
      });
      
      console.log('✅ Admin user created!');
      console.log(`Administrator account created for ${username}.`);
    } else {
      console.log('\n✅ Admin user exists!');
      console.log('Resetting password for the selected administrator.\n');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await sequelize.query(`
        UPDATE users 
        SET password = :password,
            status = 'active',
            failed_login_attempts = 0,
            account_locked_until = NULL
        WHERE username = :username
      `, {
        replacements: { password: hashedPassword, username }
      });
      
      console.log('✅ Admin password reset!');
      console.log(`Administrator password updated for ${username}.`);
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
