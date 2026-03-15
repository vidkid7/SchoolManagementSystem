const mysql = require('mysql2/promise');
require('dotenv').config();

async function createFinanceTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    console.log('🔧 Creating finance tables...\n');

    // Get admin user's tenant IDs
    const [adminUser] = await connection.execute(
      'SELECT municipality_id, school_config_id FROM users WHERE username = ?',
      ['admin']
    );
    const { municipality_id, school_config_id } = adminUser[0];

    // Create payments table
    console.log('📋 Creating payments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT UNSIGNED NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method ENUM('cash', 'bank_transfer', 'cheque', 'online', 'esewa', 'khalti', 'imepay') NOT NULL,
        payment_date DATETIME NOT NULL,
        transaction_id VARCHAR(100),
        reference_number VARCHAR(100),
        bank_name VARCHAR(100),
        cheque_number VARCHAR(50),
        cheque_date DATE,
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
        remarks TEXT,
        received_by INT UNSIGNED,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        municipality_id CHAR(36) NULL,
        school_config_id CHAR(36) NULL
      )
    `);
    console.log('✅ Created payments table');

    // Add missing columns to fee_structures if needed
    console.log('📋 Checking fee_structures table...');
    const [feeStructureExists] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'fee_structures'`,
      [process.env.DB_NAME]
    );

    if (feeStructureExists[0].count > 0) {
      // Check and add municipality_id
      const [hasMunicipalityId] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = 'fee_structures' AND column_name = 'municipality_id'`,
        [process.env.DB_NAME]
      );

      if (hasMunicipalityId[0].count === 0) {
        await connection.execute(
          `ALTER TABLE fee_structures ADD COLUMN municipality_id CHAR(36) NULL`
        );
        console.log('✅ Added municipality_id to fee_structures');
      }

      // Check and add school_config_id
      const [hasSchoolConfigId] = await connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = 'fee_structures' AND column_name = 'school_config_id'`,
        [process.env.DB_NAME]
      );

      if (hasSchoolConfigId[0].count === 0) {
        await connection.execute(
          `ALTER TABLE fee_structures ADD COLUMN school_config_id CHAR(36) NULL`
        );
        console.log('✅ Added school_config_id to fee_structures');
      }

      // Update existing records
      await connection.execute(
        `UPDATE fee_structures 
         SET municipality_id = ?, school_config_id = ? 
         WHERE municipality_id IS NULL OR school_config_id IS NULL`,
        [municipality_id, school_config_id]
      );
      console.log('✅ Updated fee_structures records');
    }

    // Add missing columns to payments if needed
    const [paymentsMunicipalityId] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'payments' AND column_name = 'municipality_id'`,
      [process.env.DB_NAME]
    );

    if (paymentsMunicipalityId[0].count === 0) {
      await connection.execute(
        `ALTER TABLE payments ADD COLUMN municipality_id CHAR(36) NULL`
      );
      console.log('✅ Added municipality_id to payments');
    }

    const [paymentsSchoolConfigId] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'payments' AND column_name = 'school_config_id'`,
      [process.env.DB_NAME]
    );

    if (paymentsSchoolConfigId[0].count === 0) {
      await connection.execute(
        `ALTER TABLE payments ADD COLUMN school_config_id CHAR(36) NULL`
      );
      console.log('✅ Added school_config_id to payments');
    }

    console.log('\n✨ Finance tables created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createFinanceTables();
