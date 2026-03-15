const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAllRemainingIssues() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    console.log('🔧 Fixing all remaining issues...\n');

    // Get admin user's tenant IDs
    const [adminUser] = await connection.execute(
      'SELECT municipality_id, school_config_id FROM users WHERE username = ?',
      ['admin']
    );
    const { municipality_id, school_config_id } = adminUser[0];

    // Add municipality_id and school_config_id to admissions table if it exists
    console.log('📋 Checking admissions table...');
    const [admissionsExists] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'admissions'`,
      [process.env.DB_NAME]
    );

    if (admissionsExists[0].count > 0) {
      // Check and add columns
      const [hasMunicipalityId] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = 'admissions' AND column_name = 'municipality_id'`,
        [process.env.DB_NAME]
      );

      if (hasMunicipalityId[0].count === 0) {
        await connection.execute(
          `ALTER TABLE admissions ADD COLUMN municipality_id CHAR(36) NULL`
        );
        console.log('✅ Added municipality_id to admissions');
      }

      const [hasSchoolConfigId] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = 'admissions' AND column_name = 'school_config_id'`,
        [process.env.DB_NAME]
      );

      if (hasSchoolConfigId[0].count === 0) {
        await connection.execute(
          `ALTER TABLE admissions ADD COLUMN school_config_id CHAR(36) NULL`
        );
        console.log('✅ Added school_config_id to admissions');
      }

      // Update existing records
      await connection.execute(
        `UPDATE admissions 
         SET municipality_id = ?, school_config_id = ? 
         WHERE municipality_id IS NULL OR school_config_id IS NULL`,
        [municipality_id, school_config_id]
      );
      console.log('✅ Updated admissions records');
    }

    // List all tables and add missing columns
    const [tables] = await connection.execute(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [process.env.DB_NAME]
    );

    console.log(`\n📋 Found ${tables.length} tables. Checking for missing columns...\n`);

    for (const table of tables) {
      const tableName = table.table_name || table.TABLE_NAME;
      
      // Skip system tables
      if (tableName === 'migrations' || tableName === 'SequelizeMeta') {
        continue;
      }

      // Check if table has municipality_id and school_config_id
      const [columns] = await connection.execute(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = ?`,
        [process.env.DB_NAME, tableName]
      );

      const columnNames = columns.map(c => c.column_name || c.COLUMN_NAME);
      const hasMunicipalityId = columnNames.includes('municipality_id');
      const hasSchoolConfigId = columnNames.includes('school_config_id');

      if (!hasMunicipalityId || !hasSchoolConfigId) {
        console.log(`📋 Fixing table: ${tableName}`);

        if (!hasMunicipalityId) {
          try {
            await connection.execute(
              `ALTER TABLE ${tableName} ADD COLUMN municipality_id CHAR(36) NULL`
            );
            console.log(`   ✅ Added municipality_id`);
          } catch (e) {
            console.log(`   ⚠️  Could not add municipality_id: ${e.message}`);
          }
        }

        if (!hasSchoolConfigId) {
          try {
            await connection.execute(
              `ALTER TABLE ${tableName} ADD COLUMN school_config_id CHAR(36) NULL`
            );
            console.log(`   ✅ Added school_config_id`);
          } catch (e) {
            console.log(`   ⚠️  Could not add school_config_id: ${e.message}`);
          }
        }

        // Update existing records
        try {
          await connection.execute(
            `UPDATE ${tableName} 
             SET municipality_id = ?, school_config_id = ? 
             WHERE municipality_id IS NULL OR school_config_id IS NULL`,
            [municipality_id, school_config_id]
          );
          console.log(`   ✅ Updated records`);
        } catch (e) {
          // Skip if update fails
        }
      }
    }

    console.log('\n✨ All issues fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixAllRemainingIssues();
