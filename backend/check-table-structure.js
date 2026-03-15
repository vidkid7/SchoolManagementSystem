require('dotenv').config();
const mysql = require('mysql2/promise');

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway';

async function checkTables() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('📋 Checking table structures...\n');
    
    // Check students table
    console.log('Students table:');
    const [studentsCols] = await connection.query('SHOW COLUMNS FROM students');
    studentsCols.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''}`);
    });
    
    console.log('\nAcademic_years table:');
    const [yearsCols] = await connection.query('SHOW COLUMNS FROM academic_years');
    yearsCols.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''}`);
    });
    
    console.log('\nStaff table:');
    const [staffCols] = await connection.query('SHOW COLUMNS FROM staff');
    staffCols.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();
