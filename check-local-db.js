const mysql = require('mysql2/promise');

async function checkLocalDatabase() {
  try {
    // Connect to local MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Dhire12345@@'
    });

    console.log('✅ Connected to local MySQL');

    // Check if school_management_system database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('\n📁 Available databases:');
    databases.forEach(db => console.log(`  - ${db.Database}`));

    const hasSchoolDB = databases.some(db => db.Database === 'school_management_system');
    
    if (hasSchoolDB) {
      console.log('\n✅ school_management_system database found');
      
      // Connect to the school database
      await connection.execute('USE school_management_system');
      
      // Check if users table exists and get user credentials
      try {
        const [users] = await connection.execute(
          'SELECT user_id, username, email, role, status FROM users WHERE role IN ("School_Admin", "Municipality_Admin") ORDER BY user_id'
        );
        
        console.log('\n👥 Available user accounts:');
        if (users.length === 0) {
          console.log('  ❌ No admin users found in database');
          console.log('  💡 You may need to run database seeding');
        } else {
          users.forEach(user => {
            console.log(`  - Username: ${user.username}`);
            console.log(`    Email: ${user.email}`);
            console.log(`    Role: ${user.role}`);
            console.log(`    Status: ${user.status}`);
            console.log('    ---');
          });
        }
      } catch (tableError) {
        console.log('  ❌ Users table not found or error accessing it');
        console.log('  💡 Database may not be properly initialized');
      }
    } else {
      console.log('\n❌ school_management_system database not found');
      console.log('💡 You may need to create and seed the database');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL server may not be running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Check your MySQL username/password');
    }
  }
}

checkLocalDatabase();