require('dotenv').config();
const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway";

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

async function checkUsersTable() {
  try {
    console.log('🔍 Connecting to Railway MySQL database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // Show table structure
    const [columns] = await sequelize.query(`
      DESCRIBE users;
    `);

    console.log('📋 Users table structure:');
    console.log('='.repeat(80));
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(30)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Show existing users
    const [users] = await sequelize.query(`
      SELECT * FROM users LIMIT 5;
    `);

    console.log('\n👥 Sample users:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(users, null, 2));

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersTable();
