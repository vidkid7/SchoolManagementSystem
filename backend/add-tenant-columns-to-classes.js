const mysql = require('mysql2/promise');
require('dotenv').config();

async function addTenantColumnsToClasses() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
    multipleStatements: true
  });

  try {
    console.log('Checking if columns exist...');
    
    // Check if columns already exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'classes' 
        AND COLUMN_NAME IN ('municipality_id', 'school_config_id')
    `);
    
    const existingColumns = columns.map(row => row.COLUMN_NAME);
    
    if (!existingColumns.includes('municipality_id')) {
      console.log('Adding municipality_id column...');
      await connection.query(`
        ALTER TABLE \`classes\`
        ADD COLUMN \`municipality_id\` CHAR(36) NULL AFTER \`deleted_at\`
      `);
      console.log('✅ Added municipality_id column');
    } else {
      console.log('municipality_id column already exists');
    }
    
    if (!existingColumns.includes('school_config_id')) {
      console.log('Adding school_config_id column...');
      await connection.query(`
        ALTER TABLE \`classes\`
        ADD COLUMN \`school_config_id\` CHAR(36) NULL AFTER \`municipality_id\`
      `);
      console.log('✅ Added school_config_id column');
    } else {
      console.log('school_config_id column already exists');
    }
    
    // Add indexes
    console.log('Adding indexes...');
    try {
      await connection.query(`
        CREATE INDEX \`idx_classes_municipality\` ON \`classes\` (\`municipality_id\`)
      `);
      console.log('✅ Added municipality index');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('Municipality index already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await connection.query(`
        CREATE INDEX \`idx_classes_school_config\` ON \`classes\` (\`school_config_id\`)
      `);
      console.log('✅ Added school_config index');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('School config index already exists');
      } else {
        throw err;
      }
    }
    
    // Try to backfill from academic_years
    console.log('Attempting to backfill tenant data from academic_years...');
    const backfillSql = `
      UPDATE \`classes\` c
      INNER JOIN \`academic_years\` ay ON c.academic_year_id = ay.academic_year_id
      SET 
        c.municipality_id = ay.municipality_id,
        c.school_config_id = ay.school_config_id
      WHERE c.municipality_id IS NULL OR c.school_config_id IS NULL;
    `;
    
    const [result] = await connection.query(backfillSql);
    console.log(`✅ Backfilled ${result.affectedRows} records`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addTenantColumnsToClasses()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
