const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
const username = process.env.ADMIN_USERNAME?.trim();
const newPassword = process.env.ADMIN_RESET_PASSWORD;
if (process.env.CONFIRM_ADMIN_PASSWORD_RESET !== 'true' || !username || !newPassword || newPassword.length < 14) {
  throw new Error('Set CONFIRM_ADMIN_PASSWORD_RESET=true, ADMIN_USERNAME, and a 14+ character ADMIN_RESET_PASSWORD.');
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

async function resetAdminPassword() {
  try {
    console.log('🔍 Connecting to Railway database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await sequelize.query(`
      UPDATE users 
      SET password = :password,
          failed_login_attempts = 0,
          account_locked_until = NULL,
          updated_at = NOW()
      WHERE username = :username;
    `, { replacements: { password: hashedPassword, username } });

    const affectedRows = Number(result?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new Error('Selected account was not updated.');

    console.log('✅ Admin password has been reset!\n');
    console.log(`Administrator password updated for ${username}.`);

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
