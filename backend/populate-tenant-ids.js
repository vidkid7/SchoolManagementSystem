const mysql = require('mysql2/promise');
require('dotenv').config();

async function populateTenantIds() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    console.log('🔧 Populating tenant IDs...\n');

    // Get the admin user's municipality_id and school_config_id
    const [adminUser] = await connection.execute(
      'SELECT municipality_id, school_config_id FROM users WHERE username = ?',
      ['admin']
    );

    if (adminUser.length === 0) {
      console.error('❌ Admin user not found!');
      return;
    }

    const { municipality_id, school_config_id } = adminUser[0];
    console.log('📋 Admin user tenant IDs:');
    console.log('   Municipality ID:', municipality_id);
    console.log('   School Config ID:', school_config_id);
    console.log('');

    // Update students table
    console.log('📋 Updating students table...');
    const [studentsResult] = await connection.execute(
      `UPDATE students 
       SET municipality_id = ?, school_config_id = ? 
       WHERE municipality_id IS NULL OR school_config_id IS NULL`,
      [municipality_id, school_config_id]
    );
    console.log(`✅ Updated ${studentsResult.affectedRows} student records`);

    // Update attendance table
    console.log('📋 Updating attendance table...');
    const [attendanceResult] = await connection.execute(
      `UPDATE attendance 
       SET municipality_id = ?, school_config_id = ? 
       WHERE municipality_id IS NULL OR school_config_id IS NULL`,
      [municipality_id, school_config_id]
    );
    console.log(`✅ Updated ${attendanceResult.affectedRows} attendance records`);

    // Update invoices table
    console.log('📋 Updating invoices table...');
    const [invoicesResult] = await connection.execute(
      `UPDATE invoices 
       SET municipality_id = ?, school_config_id = ? 
       WHERE municipality_id IS NULL OR school_config_id IS NULL`,
      [municipality_id, school_config_id]
    );
    console.log(`✅ Updated ${invoicesResult.affectedRows} invoice records`);

    // Update grades table
    console.log('📋 Updating grades table...');
    const [gradesResult] = await connection.execute(
      `UPDATE grades 
       SET municipality_id = ?, school_config_id = ? 
       WHERE municipality_id IS NULL OR school_config_id IS NULL`,
      [municipality_id, school_config_id]
    );
    console.log(`✅ Updated ${gradesResult.affectedRows} grade records`);

    // Update other tables if they exist
    const tables = [
      'classes', 'subjects', 'academic_years', 'exams', 
      'fee_structures', 'staff', 'teachers', 'ecas', 'sports'
    ];

    for (const table of tables) {
      try {
        const [tableExists] = await connection.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = ? AND table_name = ?`,
          [process.env.DB_NAME, table]
        );

        if (tableExists[0].count > 0) {
          // Check if columns exist
          const [hasColumns] = await connection.execute(
            `SELECT COUNT(*) as count FROM information_schema.columns 
             WHERE table_schema = ? AND table_name = ? 
             AND column_name IN ('municipality_id', 'school_config_id')`,
            [process.env.DB_NAME, table]
          );

          if (hasColumns[0].count === 2) {
            const [result] = await connection.execute(
              `UPDATE ${table} 
               SET municipality_id = ?, school_config_id = ? 
               WHERE municipality_id IS NULL OR school_config_id IS NULL`,
              [municipality_id, school_config_id]
            );
            console.log(`✅ Updated ${result.affectedRows} ${table} records`);
          }
        }
      } catch (e) {
        // Skip tables that don't exist or have issues
      }
    }

    console.log('\n✨ All tenant IDs populated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

populateTenantIds();
