const { Sequelize } = require('sequelize');

async function checkSimpleUsers() {
  try {
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

    await sequelize.authenticate();

    // Check for the simple test accounts
    const [simpleUsers] = await sequelize.query(
      `SELECT user_id, username, email, role, status FROM users 
       WHERE username IN ('student1', 'teacher1', 'parent1', 'classteacher1') 
       ORDER BY username`
    );
    
    console.log('🔍 SIMPLE TEST ACCOUNTS:');
    if (simpleUsers.length === 0) {
      console.log('  ❌ No simple test accounts found');
      console.log('  💡 These may not have been created in your database');
    } else {
      simpleUsers.forEach(user => {
        console.log(`  ✅ Username: ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Status: ${user.status}`);
        console.log('     ---');
      });
    }

    // Check the seeded accounts pattern
    console.log('\n🔍 SEEDED ACCOUNTS (using SeedPass123!):');
    const [seededUsers] = await sequelize.query(
      `SELECT username, email, role FROM users 
       WHERE username LIKE 'stu_%' OR username LIKE 'par_%' OR username LIKE 'ct_%' OR username LIKE 'st_%'
       ORDER BY role, username LIMIT 10`
    );
    
    seededUsers.forEach(user => {
      console.log(`  Username: ${user.username} (${user.role})`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSimpleUsers();