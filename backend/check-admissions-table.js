const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdmissionsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
  });

  try {
    console.log('Checking admissions table...\n');

    // Check if table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'admissions'"
    );
    
    if (tables.length === 0) {
      console.log('❌ admissions table does NOT exist');
      console.log('\nCreating admissions table...');
      
      await connection.query(`
        CREATE TABLE admissions (
          admission_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          student_name VARCHAR(255) NOT NULL,
          date_of_birth DATE NOT NULL,
          gender ENUM('Male', 'Female', 'Other') NOT NULL,
          guardian_name VARCHAR(255) NOT NULL,
          guardian_phone VARCHAR(20) NOT NULL,
          guardian_email VARCHAR(255),
          address TEXT,
          applying_for_class INT NOT NULL,
          academic_year_id INT UNSIGNED,
          previous_school VARCHAR(255),
          status ENUM('inquiry', 'application_submitted', 'test_scheduled', 'test_completed', 'interview_scheduled', 'interview_completed', 'admitted', 'enrolled', 'rejected', 'withdrawn') DEFAULT 'inquiry',
          test_date DATE,
          test_score DECIMAL(5,2),
          interview_date DATE,
          interviewer_name VARCHAR(255),
          interview_feedback TEXT,
          admission_date DATE,
          rejection_reason TEXT,
          documents JSON,
          municipality_id VARCHAR(36),
          school_config_id VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL,
          INDEX idx_status (status),
          INDEX idx_academic_year (academic_year_id),
          INDEX idx_applying_class (applying_for_class),
          INDEX idx_tenant (municipality_id, school_config_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ admissions table created successfully');
    } else {
      console.log('✅ admissions table exists');
      
      // Show structure
      const [columns] = await connection.query(
        "DESCRIBE admissions"
      );
      console.log('\nTable structure:');
      console.table(columns);
      
      // Count records
      const [countResult] = await connection.query(
        'SELECT COUNT(*) as count FROM admissions'
      );
      console.log(`\nTotal records: ${countResult[0].count}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdmissionsTable();
