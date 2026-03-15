const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabaseSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    console.log('🔧 Fixing database schema...\n');

    // Add missing columns to students table
    console.log('📋 Checking students table...');
    try {
      await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN IF NOT EXISTS municipality_id CHAR(36) NULL,
        ADD COLUMN IF NOT EXISTS school_config_id CHAR(36) NULL
      `);
      console.log('✅ Added municipality_id and school_config_id to students');
    } catch (e) {
      console.log('ℹ️  Students columns may already exist');
    }

    // Add missing columns to attendance table
    console.log('📋 Checking attendance table...');
    try {
      await connection.execute(`
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS municipality_id CHAR(36) NULL,
        ADD COLUMN IF NOT EXISTS school_config_id CHAR(36) NULL
      `);
      console.log('✅ Added municipality_id and school_config_id to attendance');
    } catch (e) {
      console.log('ℹ️  Attendance columns may already exist');
    }

    // Add missing columns to invoices table
    console.log('📋 Checking invoices table...');
    try {
      await connection.execute(`
        ALTER TABLE invoices 
        ADD COLUMN IF NOT EXISTS municipality_id CHAR(36) NULL,
        ADD COLUMN IF NOT EXISTS school_config_id CHAR(36) NULL
      `);
      console.log('✅ Added municipality_id and school_config_id to invoices');
    } catch (e) {
      console.log('ℹ️  Invoices columns may already exist');
    }

    // Add missing columns to grades table
    console.log('📋 Checking grades table...');
    try {
      await connection.execute(`
        ALTER TABLE grades 
        ADD COLUMN IF NOT EXISTS municipality_id CHAR(36) NULL,
        ADD COLUMN IF NOT EXISTS school_config_id CHAR(36) NULL
      `);
      console.log('✅ Added municipality_id and school_config_id to grades');
    } catch (e) {
      console.log('ℹ️  Grades columns may already exist');
    }

    // Create eca_enrollments table if not exists
    console.log('📋 Creating eca_enrollments table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS eca_enrollments (
          enrollment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          eca_id INT UNSIGNED NOT NULL,
          student_id INT UNSIGNED NOT NULL,
          enrollment_date DATE NOT NULL,
          status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
          attendance_count INT DEFAULT 0,
          total_sessions INT DEFAULT 0,
          remarks TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          municipality_id CHAR(36) NULL,
          school_config_id CHAR(36) NULL
        )
      `);
      console.log('✅ Created eca_enrollments table');
    } catch (e) {
      console.log('ℹ️  eca_enrollments table may already exist');
    }

    // Create sports_enrollments table if not exists
    console.log('📋 Creating sports_enrollments table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sports_enrollments (
          enrollment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          sport_id INT UNSIGNED NOT NULL,
          student_id INT UNSIGNED NOT NULL,
          team_id INT UNSIGNED NULL,
          enrollment_date DATE NOT NULL,
          status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
          attendance_count INT DEFAULT 0,
          total_sessions INT DEFAULT 0,
          remarks TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          municipality_id CHAR(36) NULL,
          school_config_id CHAR(36) NULL
        )
      `);
      console.log('✅ Created sports_enrollments table');
    } catch (e) {
      console.log('ℹ️  sports_enrollments table may already exist');
    }

    // Create circulations table if not exists
    console.log('📋 Creating circulations table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS circulations (
          circulation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          book_id INT UNSIGNED NOT NULL,
          student_id INT UNSIGNED NOT NULL,
          issue_date DATE NOT NULL,
          due_date DATE NOT NULL,
          return_date DATE NULL,
          status ENUM('issued', 'returned', 'overdue') DEFAULT 'issued',
          renewal_count INT DEFAULT 0,
          max_renewals INT DEFAULT 2,
          issued_by INT UNSIGNED NULL,
          returned_by INT UNSIGNED NULL,
          condition_on_issue VARCHAR(50),
          condition_on_return VARCHAR(50),
          fine DECIMAL(10,2) DEFAULT 0,
          fine_paid BOOLEAN DEFAULT FALSE,
          remarks TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          municipality_id CHAR(36) NULL,
          school_config_id CHAR(36) NULL
        )
      `);
      console.log('✅ Created circulations table');
    } catch (e) {
      console.log('ℹ️  circulations table may already exist');
    }

    console.log('\n✨ Database schema fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixDatabaseSchema();
