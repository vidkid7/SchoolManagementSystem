const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAdmissionsTableComplete() {
  console.log('🔧 Fixing Admissions Table - Complete Schema\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    // Get current columns
    console.log('1️⃣ Checking current table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admissions'
    `, [process.env.DB_NAME || 'school_management_system']);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log(`Found ${existingColumns.length} existing columns`);

    // Define all required columns based on the model
    const requiredColumns = [
      { name: 'admission_id', type: 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY' },
      { name: 'temporary_id', type: 'VARCHAR(50) NOT NULL UNIQUE' },
      
      // Applicant Information
      { name: 'first_name_en', type: 'VARCHAR(50) NOT NULL' },
      { name: 'middle_name_en', type: 'VARCHAR(50)' },
      { name: 'last_name_en', type: 'VARCHAR(50) NOT NULL' },
      { name: 'first_name_np', type: 'VARCHAR(100)' },
      { name: 'middle_name_np', type: 'VARCHAR(100)' },
      { name: 'last_name_np', type: 'VARCHAR(100)' },
      { name: 'date_of_birth_bs', type: 'VARCHAR(20)' },
      { name: 'date_of_birth_ad', type: 'DATE' },
      { name: 'gender', type: 'VARCHAR(20)' },
      
      // Contact Information
      { name: 'address_en', type: 'TEXT' },
      { name: 'address_np', type: 'TEXT' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'email', type: 'VARCHAR(255)' },
      
      // Guardian Information
      { name: 'father_name', type: 'VARCHAR(100)' },
      { name: 'father_phone', type: 'VARCHAR(20)' },
      { name: 'mother_name', type: 'VARCHAR(100)' },
      { name: 'mother_phone', type: 'VARCHAR(20)' },
      { name: 'guardian_name', type: 'VARCHAR(100)' },
      { name: 'guardian_phone', type: 'VARCHAR(20)' },
      { name: 'guardian_relation', type: 'VARCHAR(50)' },
      
      // Academic Information
      { name: 'applying_for_class', type: 'INT NOT NULL' },
      { name: 'previous_school', type: 'VARCHAR(255)' },
      { name: 'previous_class', type: 'INT' },
      { name: 'previous_gpa', type: 'DECIMAL(3,2)' },
      
      // Workflow Status
      { name: 'status', type: "ENUM('inquiry', 'applied', 'test_scheduled', 'tested', 'interview_scheduled', 'interviewed', 'admitted', 'enrolled', 'rejected', 'withdrawn') NOT NULL DEFAULT 'inquiry'" },
      
      // Inquiry Stage
      { name: 'inquiry_date', type: 'DATE NOT NULL' },
      { name: 'inquiry_source', type: 'VARCHAR(50)' },
      { name: 'inquiry_notes', type: 'TEXT' },
      
      // Application Stage
      { name: 'application_date', type: 'DATE' },
      { name: 'application_fee', type: 'DECIMAL(10,2)' },
      { name: 'application_fee_paid', type: 'BOOLEAN NOT NULL DEFAULT FALSE' },
      
      // Test Stage
      { name: 'admission_test_date', type: 'DATETIME' },
      { name: 'admission_test_score', type: 'DECIMAL(5,2)' },
      { name: 'admission_test_max_score', type: 'DECIMAL(5,2)' },
      { name: 'admission_test_remarks', type: 'TEXT' },
      
      // Interview Stage
      { name: 'interview_date', type: 'DATETIME' },
      { name: 'interviewer_name', type: 'VARCHAR(100)' },
      { name: 'interview_feedback', type: 'TEXT' },
      { name: 'interview_score', type: 'DECIMAL(5,2)' },
      
      // Admission Stage
      { name: 'admission_date', type: 'DATE' },
      { name: 'admission_offer_letter_url', type: 'VARCHAR(500)' },
      
      // Document Verification
      { name: 'documents_verified', type: 'BOOLEAN NOT NULL DEFAULT FALSE' },
      { name: 'documents_notes', type: 'TEXT' },
      
      // Enrollment
      { name: 'enrolled_student_id', type: 'INT' },
      { name: 'enrollment_date', type: 'DATE' },
      
      // Rejection
      { name: 'rejection_reason', type: 'TEXT' },
      { name: 'rejection_date', type: 'DATE' },
      
      // Metadata
      { name: 'processed_by', type: 'INT' },
      { name: 'academic_year_id', type: 'INT' },
      { name: 'municipality_id', type: 'VARCHAR(36)' },
      { name: 'school_config_id', type: 'VARCHAR(36)' },
      { name: 'created_at', type: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];

    // Find missing columns
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col.name));

    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist!');
    } else {
      console.log(`\n2️⃣ Found ${missingColumns.length} missing columns`);
      
      // Add missing columns
      console.log('\n3️⃣ Adding missing columns...');
      for (const col of missingColumns) {
        try {
          // Skip primary key if admission_id already exists
          if (col.name === 'admission_id' && existingColumns.includes('admission_id')) {
            console.log(`   ℹ️ Skipping ${col.name} (already exists)`);
            continue;
          }

          const sql = `ALTER TABLE admissions ADD COLUMN ${col.name} ${col.type}`;
          console.log(`   Adding ${col.name}...`);
          await connection.execute(sql);
          console.log(`   ✅ Added ${col.name}`);
        } catch (error) {
          console.log(`   ⚠️ Error adding ${col.name}:`, error.message);
        }
      }
    }

    // Add indexes
    console.log('\n4️⃣ Adding indexes...');
    const indexes = [
      'CREATE INDEX idx_temporary_id ON admissions(temporary_id)',
      'CREATE INDEX idx_status ON admissions(status)',
      'CREATE INDEX idx_inquiry_date ON admissions(inquiry_date)',
      'CREATE INDEX idx_municipality_id ON admissions(municipality_id)',
      'CREATE INDEX idx_school_config_id ON admissions(school_config_id)',
      'CREATE INDEX idx_applying_for_class ON admissions(applying_for_class)',
      'CREATE INDEX idx_academic_year_id ON admissions(academic_year_id)'
    ];

    for (const indexSql of indexes) {
      try {
        await connection.execute(indexSql);
        const indexName = indexSql.match(/idx_\w+/)[0];
        console.log(`   ✅ Added index ${indexName}`);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          const indexName = indexSql.match(/idx_\w+/)[0];
          console.log(`   ℹ️ Index ${indexName} already exists`);
        } else {
          console.log(`   ⚠️ Error:`, error.message);
        }
      }
    }

    console.log('\n✅ Admissions table schema is now complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixAdmissionsTableComplete().catch(console.error);
