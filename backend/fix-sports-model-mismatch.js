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

async function fixSportsModelMismatch() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Check sports table
    console.log('Checking sports table columns...');
    const [sportColumns] = await sequelize.query("SHOW COLUMNS FROM sports");
    const sportColumnNames = sportColumns.map(col => col.Field);
    
    console.log('Current columns:', sportColumnNames.join(', '));
    
    const fixes = [];
    
    // Add coordinator_id if missing (model expects coordinatorId)
    if (!sportColumnNames.includes('coordinator_id')) {
      console.log('\n  Adding coordinator_id column...');
      await sequelize.query("ALTER TABLE sports ADD COLUMN coordinator_id INT UNSIGNED NULL AFTER description_np");
      fixes.push('sports.coordinator_id');
    } else {
      console.log('  ✓ coordinator_id column exists');
    }
    
    // Add academic_year_id if missing (model expects academicYearId)
    if (!sportColumnNames.includes('academic_year_id')) {
      console.log('  Adding academic_year_id column...');
      await sequelize.query("ALTER TABLE sports ADD COLUMN academic_year_id INT UNSIGNED NULL AFTER coordinator_id");
      fixes.push('sports.academic_year_id');
    } else {
      console.log('  ✓ academic_year_id column exists');
    }

    // Check ecas table
    console.log('\nChecking ecas table columns...');
    const [ecaColumns] = await sequelize.query("SHOW COLUMNS FROM ecas");
    const ecaColumnNames = ecaColumns.map(col => col.Field);
    
    console.log('Current columns:', ecaColumnNames.join(', '));
    
    // Add missing columns for ecas
    if (!ecaColumnNames.includes('subcategory')) {
      console.log('\n  Adding subcategory column...');
      await sequelize.query("ALTER TABLE ecas ADD COLUMN subcategory VARCHAR(100) NULL AFTER category");
      fixes.push('ecas.subcategory');
    } else {
      console.log('  ✓ subcategory column exists');
    }
    
    if (!ecaColumnNames.includes('schedule')) {
      console.log('  Adding schedule column...');
      await sequelize.query("ALTER TABLE ecas ADD COLUMN schedule TEXT NULL");
      fixes.push('ecas.schedule');
    } else {
      console.log('  ✓ schedule column exists');
    }
    
    if (!ecaColumnNames.includes('capacity')) {
      console.log('  Adding capacity column...');
      await sequelize.query("ALTER TABLE ecas ADD COLUMN capacity INT NULL");
      fixes.push('ecas.capacity');
    } else {
      console.log('  ✓ capacity column exists');
    }
    
    if (!ecaColumnNames.includes('current_enrollment')) {
      console.log('  Adding current_enrollment column...');
      await sequelize.query("ALTER TABLE ecas ADD COLUMN current_enrollment INT NULL DEFAULT 0");
      fixes.push('ecas.current_enrollment');
    } else {
      console.log('  ✓ current_enrollment column exists');
    }
    
    if (!ecaColumnNames.includes('academic_year_id')) {
      console.log('  Adding academic_year_id column...');
      await sequelize.query("ALTER TABLE ecas ADD COLUMN academic_year_id INT UNSIGNED NULL");
      fixes.push('ecas.academic_year_id');
    } else {
      console.log('  ✓ academic_year_id column exists');
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

fixSportsModelMismatch();
