/**
 * Quick script to check Railway database status
 * Run with: node check-railway-db.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔍 Checking Railway Database Status...\n');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 10000
  }
});

async function checkDatabase() {
  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Check for tables
    console.log('2️⃣ Checking for required tables...');
    const [tables] = await sequelize.query("SHOW TABLES");
    
    if (tables.length === 0) {
      console.log('❌ No tables found! Database needs to be set up.');
      console.log('\n📝 Run this command to set up:');
      console.log('   npm run railway:setup');
      process.exit(1);
    }

    console.log(`✅ Found ${tables.length} tables\n`);

    // Check critical tables
    const requiredTables = [
      'users',
      'students', 
      'staff',
      'classes',
      'subjects',
      'academic_years'
    ];

    console.log('3️⃣ Checking critical tables...');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    let allPresent = true;
    for (const table of requiredTables) {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allPresent = false;
    }

    if (!allPresent) {
      console.log('\n⚠️  Some critical tables are missing!');
      console.log('📝 Run migrations: npm run migrate:up');
      process.exit(1);
    }

    // Check for users
    console.log('\n4️⃣ Checking for users...');
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const userCount = users[0].count;
    
    if (userCount === 0) {
      console.log('❌ No users found! Database needs to be seeded.');
      console.log('\n📝 Run this command to seed:');
      console.log('   npm run seed');
      process.exit(1);
    }

    console.log(`✅ Found ${userCount} users\n`);

    // Check for admin user
    console.log('5️⃣ Checking for admin user...');
    const [admins] = await sequelize.query(
      "SELECT username, role FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (admins.length === 0) {
      console.log('❌ No admin user found!');
      process.exit(1);
    }

    console.log(`✅ Admin user found: ${admins[0].username}\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Database is properly set up!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Default Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('\n⚠️  Change the password after first login!');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n📝 Troubleshooting:');
    console.error('   1. Check DATABASE_URL is correct');
    console.error('   2. Ensure MySQL service is running');
    console.error('   3. Run: npm run railway:setup');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
