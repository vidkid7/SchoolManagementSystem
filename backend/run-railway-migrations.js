require('dotenv').config();
const mysql = require('mysql2/promise');

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway';

async function runMigrations() {
  console.log('🚀 Running migrations on Railway database...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Check existing tables
    console.log('📋 Checking existing tables...');
    const [tables] = await connection.query('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);
    console.log(`Found ${existingTables.length} tables\n`);
    
    // List of tables that should exist
    const requiredTables = [
      'invoices', 'invoice_items', 'payments', 'refunds',
      'books', 'circulations', 
      'ecas', 'eca_enrollments',
      'sports', 'sports_enrollments',
      'grades', 'exams'
    ];
    
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:');
      missingTables.forEach(t => console.log(`   - ${t}`));
      console.log('\n⚠️  Need to run migrations to create these tables');
      console.log('   Run: npm run migrate:up\n');
    } else {
      console.log('✅ All required tables exist\n');
    }
    
    // Check for missing columns
    console.log('📋 Checking for missing columns...');
    
    // Check grades table
    if (existingTables.includes('grades')) {
      const [gradesCols] = await connection.query('SHOW COLUMNS FROM grades');
      const gradesColumns = gradesCols.map(col => col.Field);
      if (!gradesColumns.includes('school_config_id')) {
        console.log('❌ grades table missing school_config_id column');
      }
    }
    
    // Check exams table
    if (existingTables.includes('exams')) {
      const [examsCols] = await connection.query('SHOW COLUMNS FROM exams');
      const examsColumns = examsCols.map(col => col.Field);
      if (!examsColumns.includes('school_config_id')) {
        console.log('❌ exams table missing school_config_id column');
      }
    }
    
    // Check staff table
    if (existingTables.includes('staff')) {
      const [staffCols] = await connection.query('SHOW COLUMNS FROM staff');
      const staffColumns = staffCols.map(col => col.Field);
      if (!staffColumns.includes('role')) {
        console.log('❌ staff table missing role column');
      }
    }
    
    console.log('\n✅ Migration check complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

runMigrations();
