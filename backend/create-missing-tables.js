/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines-per-function */
require('dotenv').config();
const mysql = require('mysql2/promise');

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway';

async function createMissingTables() {
  console.log('🚀 Creating missing tables on Railway database...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Create invoices table
    console.log('Creating invoices table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        academic_year_id INT UNSIGNED NOT NULL,
        school_config_id VARCHAR(36),
        total_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        due_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
        due_date DATE,
        issued_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(academic_year_id)
      )
    `);
    
    // Create invoice_items table
    console.log('Creating invoice_items table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT UNSIGNED NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);
    
    // Create payments table
    console.log('Creating payments table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT UNSIGNED NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        school_config_id VARCHAR(36),
        amount DECIMAL(10,2) NOT NULL,
        payment_method ENUM('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'cheque') NOT NULL,
        payment_date DATE NOT NULL,
        transaction_id VARCHAR(100),
        reference_number VARCHAR(100),
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        FOREIGN KEY (student_id) REFERENCES students(student_id)
      )
    `);
    
    // Create refunds table
    console.log('Creating refunds table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        payment_id INT UNSIGNED NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reason TEXT,
        refund_date DATE NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
        approved_by INT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id)
      )
    `);
    
    // Create books table
    console.log('Creating books table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        isbn VARCHAR(20) UNIQUE,
        publisher VARCHAR(255),
        publication_year INT,
        category VARCHAR(100),
        total_copies INT DEFAULT 1,
        available_copies INT DEFAULT 1,
        school_config_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);
    
    // Create circulations table
    console.log('Creating circulations table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS circulations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        book_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        user_type ENUM('student', 'staff') NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE,
        status ENUM('issued', 'returned', 'overdue', 'lost') DEFAULT 'issued',
        fine_amount DECIMAL(10,2) DEFAULT 0,
        school_config_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id)
      )
    `);
    
    // Create ecas table
    console.log('Creating ecas table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ecas (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        coordinator_id INT UNSIGNED,
        academic_year_id INT UNSIGNED NOT NULL,
        school_config_id VARCHAR(36),
        max_students INT,
        schedule VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (coordinator_id) REFERENCES staff(staff_id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(academic_year_id)
      )
    `);
    
    // Create eca_enrollments table
    console.log('Creating eca_enrollments table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS eca_enrollments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        eca_id INT UNSIGNED NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        enrollment_date DATE NOT NULL,
        status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (eca_id) REFERENCES ecas(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        UNIQUE KEY unique_eca_student (eca_id, student_id)
      )
    `);
    
    // Create sports table
    console.log('Creating sports table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sports (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        coordinator_id INT UNSIGNED,
        academic_year_id INT UNSIGNED NOT NULL,
        school_config_id VARCHAR(36),
        max_students INT,
        schedule VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (coordinator_id) REFERENCES staff(staff_id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(academic_year_id)
      )
    `);
    
    // Create sports_enrollments table
    console.log('Creating sports_enrollments table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sports_enrollments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sport_id INT UNSIGNED NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        enrollment_date DATE NOT NULL,
        status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        UNIQUE KEY unique_sport_student (sport_id, student_id)
      )
    `);
    
    // Add missing columns
    console.log('\n📋 Adding missing columns...');
    
    // Add school_config_id to grades
    try {
      await connection.query(`
        ALTER TABLE grades ADD COLUMN school_config_id VARCHAR(36)
      `);
      console.log('✅ Added school_config_id to grades table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  school_config_id already exists in grades table');
      } else {
        console.log('⚠️  Could not add school_config_id to grades:', err.message);
      }
    }
    
    // Add school_config_id to exams
    try {
      await connection.query(`
        ALTER TABLE exams ADD COLUMN school_config_id VARCHAR(36)
      `);
      console.log('✅ Added school_config_id to exams table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  school_config_id already exists in exams table');
      } else {
        console.log('⚠️  Could not add school_config_id to exams:', err.message);
      }
    }
    
    // Add role to staff
    try {
      await connection.query(`
        ALTER TABLE staff ADD COLUMN role VARCHAR(50)
      `);
      console.log('✅ Added role column to staff table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  role column already exists in staff table');
      } else {
        console.log('⚠️  Could not add role to staff:', err.message);
      }
    }
    
    console.log('\n✅ All tables and columns created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createMissingTables().catch(console.error);
