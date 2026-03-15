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

async function fixMissingColumns() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    const fixes = [];

    // Fix 1: Add missing columns to books table
    console.log('Checking books table...');
    const [bookColumns] = await sequelize.query("SHOW COLUMNS FROM books");
    const bookColumnNames = bookColumns.map(col => col.Field);
    
    if (!bookColumnNames.includes('accession_number')) {
      console.log('  Adding accession_number column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN accession_number VARCHAR(50) NULL AFTER book_id");
      fixes.push('books.accession_number');
    }
    if (!bookColumnNames.includes('title_np')) {
      console.log('  Adding title_np column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN title_np VARCHAR(255) NULL AFTER title");
      fixes.push('books.title_np');
    }
    if (!bookColumnNames.includes('author_np')) {
      console.log('  Adding author_np column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN author_np VARCHAR(255) NULL AFTER author");
      fixes.push('books.author_np');
    }
    if (!bookColumnNames.includes('subcategory')) {
      console.log('  Adding subcategory column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN subcategory VARCHAR(100) NULL AFTER category");
      fixes.push('books.subcategory');
    }
    if (!bookColumnNames.includes('language')) {
      console.log('  Adding language column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN language VARCHAR(50) NULL");
      fixes.push('books.language');
    }
    if (!bookColumnNames.includes('edition')) {
      console.log('  Adding edition column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN edition VARCHAR(50) NULL");
      fixes.push('books.edition');
    }
    if (!bookColumnNames.includes('pages')) {
      console.log('  Adding pages column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN pages INT NULL");
      fixes.push('books.pages');
    }
    if (!bookColumnNames.includes('price')) {
      console.log('  Adding price column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN price DECIMAL(10,2) NULL");
      fixes.push('books.price');
    }
    if (!bookColumnNames.includes('copies')) {
      console.log('  Adding copies column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN copies INT NULL DEFAULT 1");
      fixes.push('books.copies');
    }
    if (!bookColumnNames.includes('available_copies')) {
      console.log('  Adding available_copies column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN available_copies INT NULL DEFAULT 1");
      fixes.push('books.available_copies');
    }
    if (!bookColumnNames.includes('shelf_number')) {
      console.log('  Adding shelf_number column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN shelf_number VARCHAR(50) NULL");
      fixes.push('books.shelf_number');
    }
    if (!bookColumnNames.includes('barcode')) {
      console.log('  Adding barcode column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN barcode VARCHAR(100) NULL");
      fixes.push('books.barcode');
    }
    if (!bookColumnNames.includes('cover_image')) {
      console.log('  Adding cover_image column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN cover_image VARCHAR(255) NULL");
      fixes.push('books.cover_image');
    }
    if (!bookColumnNames.includes('description')) {
      console.log('  Adding description column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN description TEXT NULL");
      fixes.push('books.description');
    }
    if (!bookColumnNames.includes('keywords')) {
      console.log('  Adding keywords column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN keywords TEXT NULL");
      fixes.push('books.keywords');
    }
    if (!bookColumnNames.includes('status')) {
      console.log('  Adding status column...');
      await sequelize.query("ALTER TABLE books ADD COLUMN status VARCHAR(20) NULL DEFAULT 'available'");
      fixes.push('books.status');
    }

    // Fix 2: Add missing columns to ecas table
    console.log('\nChecking ecas table...');
    try {
      const [ecaColumns] = await sequelize.query("SHOW COLUMNS FROM ecas");
      const ecaColumnNames = ecaColumns.map(col => col.Field);
      
      if (!ecaColumnNames.includes('name_np')) {
        console.log('  Adding name_np column...');
        await sequelize.query("ALTER TABLE ecas ADD COLUMN name_np VARCHAR(255) NULL AFTER name");
        fixes.push('ecas.name_np');
      }
      if (!ecaColumnNames.includes('description_np')) {
        console.log('  Adding description_np column...');
        await sequelize.query("ALTER TABLE ecas ADD COLUMN description_np TEXT NULL AFTER description");
        fixes.push('ecas.description_np');
      }
    } catch (err) {
      console.log('  ⚠ ECAs table not found or error:', err.message);
    }

    // Fix 3: Add missing columns to sports table
    console.log('\nChecking sports table...');
    try {
      const [sportColumns] = await sequelize.query("SHOW COLUMNS FROM sports");
      const sportColumnNames = sportColumns.map(col => col.Field);
      
      if (!sportColumnNames.includes('name_np')) {
        console.log('  Adding name_np column...');
        await sequelize.query("ALTER TABLE sports ADD COLUMN name_np VARCHAR(255) NULL AFTER name");
        fixes.push('sports.name_np');
      }
      if (!sportColumnNames.includes('description_np')) {
        console.log('  Adding description_np column...');
        await sequelize.query("ALTER TABLE sports ADD COLUMN description_np TEXT NULL AFTER description");
        fixes.push('sports.description_np');
      }
    } catch (err) {
      console.log('  ⚠ Sports table not found or error:', err.message);
    }

    // Fix 4: Add missing columns to exams table
    console.log('\nChecking exams table...');
    try {
      const [examColumns] = await sequelize.query("SHOW COLUMNS FROM exams");
      const examColumnNames = examColumns.map(col => col.Field);
      
      if (!examColumnNames.includes('is_internal')) {
        console.log('  Adding is_internal column...');
        await sequelize.query("ALTER TABLE exams ADD COLUMN is_internal BOOLEAN NULL DEFAULT FALSE");
        fixes.push('exams.is_internal');
      }
    } catch (err) {
      console.log('  ⚠ Exams table not found or error:', err.message);
    }

    console.log('\n' + '='.repeat(60));
    if (fixes.length > 0) {
      console.log(`✓ Fixed ${fixes.length} missing columns:`);
      fixes.forEach(fix => console.log(`  - ${fix}`));
    } else {
      console.log('✓ All columns are present - no fixes needed');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

fixMissingColumns();
