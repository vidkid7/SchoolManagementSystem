const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixFinanceModule() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'school_management_system',
  });

  console.log('✅ Connected to database');

  try {
    // Get admin tenant IDs
    const [adminUsers] = await connection.execute(`
      SELECT municipality_id, school_config_id 
      FROM users 
      WHERE role = 'School_Admin' 
      LIMIT 1
    `);

    if (adminUsers.length === 0) {
      console.log('❌ No admin user found');
      return;
    }

    const { municipality_id, school_config_id } = adminUsers[0];
    console.log(`\n🏢 Using tenant IDs: municipality=${municipality_id}, school=${school_config_id}`);

    // 1. Create invoice_items table
    console.log('\n📄 Creating invoice_items table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        invoice_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT UNSIGNED NOT NULL,
        fee_component_id INT UNSIGNED,
        description VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        municipality_id CHAR(36) NOT NULL,
        school_config_id CHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_invoice_items_invoice (invoice_id),
        INDEX idx_invoice_items_tenant (municipality_id, school_config_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ invoice_items table created');

    // 2. Create installment_plans table
    console.log('\n💳 Creating installment_plans table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS installment_plans (
        installment_plan_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT UNSIGNED NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        number_of_installments INT NOT NULL,
        installment_amount DECIMAL(10,2) NOT NULL,
        frequency ENUM('monthly', 'quarterly', 'semester', 'custom') DEFAULT 'monthly',
        start_date DATE NOT NULL,
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        created_by INT UNSIGNED,
        municipality_id CHAR(36) NOT NULL,
        school_config_id CHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_installment_plans_invoice (invoice_id),
        INDEX idx_installment_plans_student (student_id),
        INDEX idx_installment_plans_tenant (municipality_id, school_config_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ installment_plans table created');

    // 3. Add missing columns to payments table
    console.log('\n💰 Adding missing columns to payments table...');
    
    const columnsToAdd = [
      { name: 'receipt_number', type: 'VARCHAR(50) UNIQUE', after: 'payment_id' },
      { name: 'qr_code', type: 'TEXT', after: 'status' },
      { name: 'installment_number', type: 'INT', after: 'qr_code' },
      { name: 'installment_plan_id', type: 'INT UNSIGNED', after: 'installment_number' },
      { name: 'gateway_response', type: 'JSON', after: 'transaction_id' },
    ];

    for (const col of columnsToAdd) {
      try {
        await connection.execute(`
          ALTER TABLE payments 
          ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}
        `);
        console.log(`  ✅ Added column: ${col.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ℹ️  Column ${col.name} already exists`);
        } else {
          console.log(`  ⚠️  Error adding ${col.name}:`, error.message);
        }
      }
    }

    // 4. Generate receipt numbers for existing payments
    console.log('\n🧾 Generating receipt numbers for existing payments...');
    const [payments] = await connection.execute(`
      SELECT payment_id FROM payments WHERE receipt_number IS NULL
    `);
    
    for (const payment of payments) {
      const receiptNumber = `RCP-${Date.now()}-${payment.payment_id}`;
      await connection.execute(`
        UPDATE payments 
        SET receipt_number = ? 
        WHERE payment_id = ?
      `, [receiptNumber, payment.payment_id]);
    }
    console.log(`✅ Generated ${payments.length} receipt numbers`);

    console.log('\n✅ All finance module fixes completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Created invoice_items table');
    console.log('  - Created installment_plans table');
    console.log('  - Added missing columns to payments table');
    console.log('  - Generated receipt numbers for existing payments');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixFinanceModule().catch(console.error);
