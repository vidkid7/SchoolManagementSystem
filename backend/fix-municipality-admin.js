const { Sequelize } = require('sequelize');

async function fixMunicipalityAdmin() {
  let sequelize;
  
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false
    });
  } else if (process.env.DB_HOST && process.env.DB_NAME) {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );
  } else {
    console.log('No database configuration found');
    return;
  }

  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Get municipality ID
    const [munis] = await sequelize.query('SELECT municipality_id, code FROM municipalities LIMIT 1');
    if (munis.length === 0) {
      console.log('No municipality found');
      return;
    }
    const municipalityId = munis[0].municipality_id;
    console.log('Municipality ID:', municipalityId, 'Code:', munis[0].code);
    
    // Check municipality admin users
    const [users] = await sequelize.query('SELECT user_id, username, role, municipality_id FROM users WHERE role = "Municipality_Admin"');
    console.log('Municipality Admin users found:', users.length);
    users.forEach(u => {
      console.log(`  - User ${u.user_id}: ${u.username}, municipality_id: ${u.municipality_id || 'NULL'}`);
    });
    
    // Update them
    if (users.length > 0) {
      const [result] = await sequelize.query(
        'UPDATE users SET municipality_id = ? WHERE role = "Municipality_Admin"',
        { replacements: [municipalityId] }
      );
      console.log('Updated municipality admin users');
    }
    
    // Verify
    const [updated] = await sequelize.query('SELECT user_id, username, role, municipality_id FROM users WHERE role = "Municipality_Admin"');
    console.log('After update:');
    updated.forEach(u => {
      console.log(`  - User ${u.user_id}: ${u.username}, municipality_id: ${u.municipality_id}`);
    });
    
    await sequelize.close();
    console.log('✅ Done');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixMunicipalityAdmin();
