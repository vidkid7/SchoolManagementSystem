const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAdmissionsTable() {
  console.log('🔧 Fixing Admissions Table\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    // Check current table structure
    console.log('1️⃣ Checking current table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admissions'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'school_management_system']);

    console.log(`Found ${columns.length} columns`);
    
    const columnNames = columns.map(c => c.COLUMN_NAME);
    const missingColumns = [];

    // Check for missing columns
    const requiredColumns = {
      'temporary_id': 'VARCHAR(50)',
      'application_number': 'VARCHAR(50)',
      'inquiry_date': 'DATE',
      'student_name': 'VARCHAR(255)',
      'date_of_birth': 'DATE',
      'gender': 'ENUM("Male", "Female", "Other")',
      'parent_name': 'VARCHAR(255)',
      'parent_phone': 'VARCHAR(20)',
      'parent_email': 'VARCHAR(255)',
      'address': 'TEXT',
      'previous_school': 'VARCHAR(255)',
      'class_applied_for': 'VARCHAR(50)',
      'status': 'ENUM("Inquiry", "Application_Submitted", "Test_Scheduled", "Test_Completed", "Interview_Scheduled", "Interview_Completed", "Admitted", "Enrolled", "Rejected", "Withdrawn")',
      'admission_test_date': 'DATETIME',
      'admission_test_score': 'DECIMAL(5,2)',
      'interview_date': 'DATETIME',
      'interview_feedback': 'TEXT',
      'admission_decision': 'ENUM("Pending", "Approved", "Rejected")',
      'admission_date': 'DATE',
      'rejection_reason': 'TEXT',
      'notes': 'TEXT',
      'documents_submitted': 'JSON',
      'municipality_id': 'VARCHAR(36)',
      'school_config_id': 'VARCHAR(36)',
      'created_at': 'TIMESTAMP',
      'updated_at': 'TIMESTAMP'
    };

    for (const [colName, colType] of Object.entries(requiredColumns)) {
      if (!columnNames.includes(colName)) {
        missingColumns.push({ name: colName, type: colType });
      }
    }

    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist!');
      return;
    }

    console.log(`\n2️⃣ Found ${missingColumns.length} missing columns:`);
    missingColumns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });

    // Add missing columns
    console.log('\n3️⃣ Adding missing columns...');
    for (const col of missingColumns) {
      try {
        let nullable = 'NULL';
        let defaultValue = '';
        
        // Set defaults for specific columns
        if (col.name === 'status') {
          defaultValue = " DEFAULT 'Inquiry'";
          nullable = 'NOT NULL';
        } else if (col.name === 'admission_decision') {
          defaultValue = " DEFAULT 'Pending'";
          nullable = 'NOT NULL';
        } else if (col.name === 'created_at' || col.name === 'updated_at') {
          defaultValue = ' DEFAULT CURRENT_TIMESTAMP';
          nullable = 'NOT NULL';
        }

        const sql = `ALTER TABLE admissions ADD COLUMN ${col.name} ${col.type} ${nullable}${defaultValue}`;
        console.log(`   Adding ${col.name}...`);
        await connection.execute(sql);
        console.log(`   ✅ Added ${col.name}`);
      } catch (error) {
        console.log(`   ⚠️ Error adding ${col.name}:`, error.message);
      }
    }

    // Add indexes for better performance
    console.log('\n4️⃣ Adding indexes...');
    const indexes = [
      { name: 'idx_temporary_id', column: 'temporary_id' },
      { name: 'idx_application_number', column: 'application_number' },
      { name: 'idx_status', column: 'status' },
      { name: 'idx_municipality_id', column: 'municipality_id' },
      { name: 'idx_school_config_id', column: 'school_config_id' }
    ];

    for (const idx of indexes) {
      try {
        await connection.execute(`
          CREATE INDEX ${idx.name} ON admissions(${idx.column})
        `);
        console.log(`   ✅ Added index ${idx.name}`);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`   ℹ️ Index ${idx.name} already exists`);
        } else {
          console.log(`   ⚠️ Error adding index ${idx.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ Admissions table fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixAdmissionsTable().catch(console.error);
