const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

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

async function resetAdminPassword() {
  try {
    console.log('🔍 Connecting to Railway database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(`
      UPDATE users 
      SET password = '${hashedPassword}',
          failed_login_attempts = 0,
          account_locked_until = NULL,
          updated_at = NOW()
      WHERE username = 'admin';
    `);

    console.log('✅ Admin password has been reset!\n');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: Admin@123\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
