const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkInvoicesStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'school_management_system',
  });

  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'invoices'
    ORDER BY ORDINAL_POSITION
  `, [process.env.DB_NAME || 'school_management_system']);

  console.log('\n📋 Invoices Table Structure:');
  console.table(columns);

  const [paymentsColumns] = await connection.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payments'
    ORDER BY ORDINAL_POSITION
  `, [process.env.DB_NAME || 'school_management_system']);

  console.log('\n💰 Payments Table Structure:');
  console.table(paymentsColumns);

  await connection.end();
}

checkInvoicesStructure().catch(console.error);
