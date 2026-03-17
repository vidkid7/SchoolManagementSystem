const { Sequelize } = require('sequelize');

async function checkLocalDatabase() {
  try {
    // Connect to local MySQL using the same config as the app
    const sequelize = new Sequelize(
      'school_management_system',
      'root',
      'Dhire12345@@',
      {
        host: 'localhost',
        port: 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    console.log('🔍 Checking local database connection...');
    await sequelize.authenticate();
    console.log('✅ Connected to local MySQL database: school_management_system');

    // Check for admin users
    const [users] = await sequelize.query(
      'SELECT user_id, username, email, role, status FROM users WHERE role IN ("School_Admin", "Municipality_Admin") ORDER BY user_id'
    );
    
    console.log('\n👥 Available user accounts in LOCAL database:');
    if (users.length === 0) {
      console.log('  ❌ No admin users found in local database');
      console.log('  💡 You may need to run: npm run seed');
    } else {
      users.forEach(user => {
        console.log(`  🔑 Username: ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Status: ${user.status}`);
        console.log('     ---');
      });
      
      console.log('\n🔐 Default passwords (if users were created by seeding):');
      console.log('  - admin: Admin@123');
      console.log('  - municipalityadmin: Municipality@123');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Local database connection failed:', error.message);
    
    if (error.original?.code === 'ECONNREFUSED') {
      console.log('💡 MySQL server may not be running locally');
    } else if (error.original?.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Check your MySQL username/password');
    } else if (error.original?.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database "school_management_system" does not exist');
      console.log('   Create it with: CREATE DATABASE school_management_system;');
    }
  }
}

// Also check which database the frontend is connecting to
function checkFrontendConfig() {
  console.log('\n🌐 Frontend Database Connection Check:');
  console.log('When you access http://localhost:5173/login:');
  
  // Check if backend is running locally
  const backendUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  console.log(`Frontend will try to connect to: ${backendUrl}`);
  
  if (backendUrl.includes('localhost')) {
    console.log('✅ Frontend is configured to use LOCAL backend');
    console.log('   Which connects to LOCAL database (if backend is running)');
  } else {
    console.log('⚠️  Frontend is configured to use REMOTE backend');
    console.log('   Which connects to RAILWAY database');
  }
  
  console.log('\n💡 To use local database:');
  console.log('   1. Start local backend: cd backend && npm run dev');
  console.log('   2. Start local frontend: cd frontend && npm run dev');
  console.log('   3. Access: http://localhost:5173 (not the Railway URL)');
}

checkLocalDatabase().then(() => {
  checkFrontendConfig();
});