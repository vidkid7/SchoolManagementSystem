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

async function updateSportsCoordinator() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Get first staff member to use as coordinator
    const [staff] = await sequelize.query('SELECT staff_id FROM staff LIMIT 1');
    
    if (staff.length === 0) {
      console.log('No staff found - cannot update sports coordinator');
      return;
    }
    
    const staffId = staff[0].staff_id;
    console.log(`Using staff_id ${staffId} as coordinator\n`);

    // Get first academic year
    const [academicYears] = await sequelize.query('SELECT academic_year_id FROM academic_years LIMIT 1');
    
    if (academicYears.length === 0) {
      console.log('No academic year found - cannot update sports');
      return;
    }
    
    const academicYearId = academicYears[0].academic_year_id;
    console.log(`Using academic_year_id ${academicYearId}\n`);

    // Update sports table
    const [result] = await sequelize.query(
      'UPDATE sports SET coordinator_id = ?, academic_year_id = ? WHERE coordinator_id IS NULL',
      { replacements: [staffId, academicYearId] }
    );
    
    console.log(`✓ Updated ${result.affectedRows} sports records with coordinator_id and academic_year_id`);

    // Update ecas table
    const [ecaResult] = await sequelize.query(
      'UPDATE ecas SET academic_year_id = ? WHERE academic_year_id IS NULL',
      { replacements: [academicYearId] }
    );
    
    console.log(`✓ Updated ${ecaResult.affectedRows} ECA records with academic_year_id`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

updateSportsCoordinator();
