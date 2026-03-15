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

async function createLibraryFinesTable() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Check if table exists
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'library_fines'"
    );

    if (tables.length > 0) {
      console.log('✓ library_fines table already exists');
      return;
    }

    console.log('Creating library_fines table...\n');

    // Create library_fines table
    await sequelize.query(`
      CREATE TABLE library_fines (
        fine_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        circulation_id INT UNSIGNED NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        fine_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        balance DECIMAL(10, 2) NOT NULL,
        fine_reason ENUM('overdue', 'lost', 'damaged') NOT NULL,
        days_overdue INT NULL,
        daily_rate DECIMAL(10, 2) NULL,
        status ENUM('pending', 'partial', 'paid', 'waived') NOT NULL DEFAULT 'pending',
        waived_amount DECIMAL(10, 2) NULL,
        waived_by INT UNSIGNED NULL,
        waived_reason TEXT NULL,
        waived_date DATETIME NULL,
        paid_date DATETIME NULL,
        payment_method VARCHAR(50) NULL,
        transaction_id VARCHAR(100) NULL,
        remarks TEXT NULL,
        municipality_id CHAR(36) NOT NULL,
        school_config_id CHAR(36) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_library_fines_circulation_id (circulation_id),
        INDEX idx_library_fines_student_id (student_id),
        INDEX idx_library_fines_status (status),
        INDEX idx_library_fines_municipality (municipality_id),
        INDEX idx_library_fines_school (school_config_id),
        FOREIGN KEY (circulation_id) REFERENCES circulations(circulation_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (waived_by) REFERENCES users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ library_fines table created successfully');

    // Verify table structure
    const [columns] = await sequelize.query('SHOW COLUMNS FROM library_fines');
    console.log('\nTable columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.original) {
      console.error('SQL Error:', error.original.message);
    }
  } finally {
    await sequelize.close();
  }
}

createLibraryFinesTable();
