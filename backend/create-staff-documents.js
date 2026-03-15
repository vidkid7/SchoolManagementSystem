const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Dhire12345@@',
    database: 'school_management_system',
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'create-staff-documents-table.sql'), 'utf8');
    await connection.query(sql);
    console.log('✅ staff_documents table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    await connection.end();
  }
}

createTable();
