const { Sequelize } = require('sequelize');

async function checkStudentParentUsers() {
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

    console.log('🔍 Checking for Student and Parent accounts...');
    await sequelize.authenticate();

    // Check for student users
    const [students] = await sequelize.query(
      'SELECT user_id, username, email, role, status FROM users WHERE role = "Student" ORDER BY user_id LIMIT 10'
    );
    
    console.log('\n👨‍🎓 STUDENT ACCOUNTS:');
    if (students.length === 0) {
      console.log('  ❌ No student accounts found in local database');
    } else {
      students.forEach((user, index) => {
        console.log(`  ${index + 1}. Username: ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Status: ${user.status}`);
        console.log('     ---');
      });
    }

    // Check for parent users
    const [parents] = await sequelize.query(
      'SELECT user_id, username, email, role, status FROM users WHERE role = "Parent" ORDER BY user_id LIMIT 10'
    );
    
    console.log('\n👨‍👩‍👧‍👦 PARENT ACCOUNTS:');
    if (parents.length === 0) {
      console.log('  ❌ No parent accounts found in local database');
    } else {
      parents.forEach((user, index) => {
        console.log(`  ${index + 1}. Username: ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Status: ${user.status}`);
        console.log('     ---');
      });
    }

    // Check for teacher users too
    const [teachers] = await sequelize.query(
      'SELECT user_id, username, email, role, status FROM users WHERE role IN ("Subject_Teacher", "Class_Teacher") ORDER BY user_id LIMIT 5'
    );
    
    console.log('\n👨‍🏫 TEACHER ACCOUNTS:');
    if (teachers.length === 0) {
      console.log('  ❌ No teacher accounts found in local database');
    } else {
      teachers.forEach((user, index) => {
        console.log(`  ${index + 1}. Username: ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Status: ${user.status}`);
        console.log('     ---');
      });
    }

    // Get total count of all user types
    const [counts] = await sequelize.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC'
    );
    
    console.log('\n📊 USER STATISTICS:');
    counts.forEach(stat => {
      console.log(`  ${stat.role}: ${stat.count} accounts`);
    });

    console.log('\n🔐 DEFAULT PASSWORDS (if created by seeding):');
    console.log('  - Students: Usually Student@123 or generated passwords');
    console.log('  - Parents: Usually Parent@123 or generated passwords');
    console.log('  - Teachers: Usually Teacher@123 or generated passwords');
    console.log('\n💡 Note: Check the seeding scripts for exact password patterns');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

checkStudentParentUsers();