const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
  }
);

async function fixAllSchoolAssignments() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Get the school_config_id where students exist (the main data school)
    const [dataSchool] = await sequelize.query(
      "SELECT school_config_id FROM students LIMIT 1"
    );
    const correctSchoolId = dataSchool[0].school_config_id;
    console.log('Correct school_config_id:', correctSchoolId);
    console.log('This is the school where all data should be assigned\n');

    // List of tables that might have school_config_id
    const tablesToCheck = [
      'users',
      'students',
      'staff',
      'classes',
      'books',
      'invoices',
      'payments',
      'exams',
      'grades',
      'attendance_records',
      'circulations',
      'library_fines',
      'ecas',
      'eca_enrollments',
      'sports',
      'sports_enrollments',
      'subjects',
      'periods',
      'syllabi',
      'staff_assignments'
    ];

    for (const table of tablesToCheck) {
      try {
        // Check if table exists and has school_config_id column
        const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${table}`);
        const hasSchoolConfigId = columns.some(col => col.Field === 'school_config_id');
        
        if (hasSchoolConfigId) {
          // Count records with different school_config_id
          const [wrongSchool] = await sequelize.query(
            `SELECT COUNT(*) as count FROM ${table} WHERE school_config_id != :schoolId OR school_config_id IS NULL`,
            { replacements: { schoolId: correctSchoolId } }
          );
          
          if (wrongSchool[0].count > 0) {
            console.log(`\n${table}:`);
            console.log(`  Found ${wrongSchool[0].count} records with wrong/null school_config_id`);
            
            // Update to correct school
            const [result] = await sequelize.query(
              `UPDATE ${table} SET school_config_id = :schoolId WHERE school_config_id != :schoolId OR school_config_id IS NULL`,
              { replacements: { schoolId: correctSchoolId } }
            );
            console.log(`  ✓ Updated ${result.affectedRows} records`);
          } else {
            console.log(`✓ ${table}: All records already have correct school_config_id`);
          }
        }
      } catch (error) {
        // Table doesn't exist or other error - skip it
        if (!error.message.includes("doesn't exist")) {
          console.log(`  ⚠ ${table}: ${error.message}`);
        }
      }
    }

    console.log('\n✓ All school assignments fixed!');
    console.log('\nNow all data is properly assigned to the same school.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixAllSchoolAssignments();
