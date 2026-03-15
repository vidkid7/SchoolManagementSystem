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

async function verifyAndFixSportsColumns() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Check sports table
    console.log('Checking sports table...');
    const [sportColumns] = await sequelize.query("SHOW COLUMNS FROM sports");
    const sportColumnNames = sportColumns.map(col => col.Field);
    
    console.log('Current columns:', sportColumnNames.join(', '));
    
    const fixes = [];
    
    if (!sportColumnNames.includes('name_np')) {
      console.log('\n  Adding name_np column...');
      await sequelize.query("ALTER TABLE sports ADD COLUMN name_np VARCHAR(255) NULL AFTER name");
      fixes.push('sports.name_np');
    } else {
      console.log('  ✓ name_np column exists');
    }
    
    if (!sportColumnNames.includes('description_np')) {
      console.log('  Adding description_np column...');
      await sequelize.query("ALTER TABLE sports ADD COLUMN description_np TEXT NULL AFTER description");
      fixes.push('sports.description_np');
    } else {
      console.log('  ✓ description_np column exists');
    }

    // Check ecas table
    console.log('\nChecking ecas table...');
    const [ecaColumns] = await sequelize.query("SHOW COLUMNS FROM ecas");
    const ecaColumnNames = ecaColumns.map(col => col.Field);
    
    console.log('Current columns:', ecaColumnNames.join(', '));
    
    if (!ecaColumnNames.includes('name_np')) {
      console.log('\n  Adding name_np column...');
      await sequelize.query("ALTER TABLE ecas ADD COLUMN name_np VARCHAR(255) NULL AFTER name");
      fixes.push('ecas.name_np');
    } else {
      console.log('  ✓ name_np column exists');
    }
    
    if (!ecaColumnNames.includes('description_np')) {
      console.log('  Adding description_np column...');
      await sequelize.query("ALTER TABLE ecas ADD COLUMN description_np TEXT NULL AFTER description");
      fixes.push('ecas.description_np');
    } else {
      console.log('  ✓ description_np column exists');
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

verifyAndFixSportsColumns();
