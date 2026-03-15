/**
 * Script to optimize attendance table queries by adding proper indexes
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function optimizeAttendanceQueries() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Checking existing indexes on attendance table...');
    
    const [existingIndexes] = await connection.query('SHOW INDEX FROM attendance');
    console.log('\nExisting indexes:');
    existingIndexes.forEach(idx => {
      console.log(`  - ${idx.Key_name} on ${idx.Column_name}`);
    });

    console.log('\n📊 Adding optimized indexes...');

    // Helper function to create index if it doesn't exist
    async function createIndexIfNotExists(indexName, sql) {
      const [indexes] = await connection.query(
        `SELECT COUNT(*) as count FROM information_schema.statistics 
         WHERE table_schema = DATABASE() 
         AND table_name = 'attendance' 
         AND index_name = ?`,
        [indexName]
      );
      
      if (indexes[0].count === 0) {
        console.log(`Creating ${indexName}...`);
        await connection.query(sql);
        console.log(`✅ ${indexName} created`);
      } else {
        console.log(`⏭️  ${indexName} already exists, skipping`);
      }
    }

    // Index for date range queries with status
    await createIndexIfNotExists(
      'idx_attendance_date_status',
      'CREATE INDEX idx_attendance_date_status ON attendance(date, status, deleted_at)'
    );

    // Index for tenant isolation with date
    await createIndexIfNotExists(
      'idx_attendance_tenant_date',
      'CREATE INDEX idx_attendance_tenant_date ON attendance(municipality_id, school_config_id, date, deleted_at)'
    );

    // Composite index for the exact query pattern being used
    await createIndexIfNotExists(
      'idx_attendance_tenant_date_status',
      'CREATE INDEX idx_attendance_tenant_date_status ON attendance(municipality_id, school_config_id, date, status, deleted_at)'
    );

    // Index for student lookups (already exists, will skip)
    await createIndexIfNotExists(
      'idx_attendance_student',
      'CREATE INDEX idx_attendance_student ON attendance(student_id, date, deleted_at)'
    );

    // Index for class lookups (already exists, will skip)
    await createIndexIfNotExists(
      'idx_attendance_class',
      'CREATE INDEX idx_attendance_class ON attendance(class_id, date, deleted_at)'
    );

    console.log('\n✅ All indexes created successfully!');

    // Show updated indexes
    const [updatedIndexes] = await connection.query('SHOW INDEX FROM attendance');
    console.log('\nUpdated indexes:');
    updatedIndexes.forEach(idx => {
      console.log(`  - ${idx.Key_name} on ${idx.Column_name} (${idx.Index_type})`);
    });

    // Analyze the table to update statistics
    console.log('\n🔄 Analyzing table to update statistics...');
    await connection.query('ANALYZE TABLE attendance');
    console.log('✅ Table analysis complete!');

  } catch (error) {
    console.error('❌ Error optimizing attendance queries:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

optimizeAttendanceQueries()
  .then(() => {
    console.log('\n🎉 Attendance query optimization completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to optimize attendance queries:', error);
    process.exit(1);
  });
