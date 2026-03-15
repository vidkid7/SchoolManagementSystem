const { Sequelize } = require('sequelize');

const DATABASE_URL = 'mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function checkRolesTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    // Show all tables
    const [tables] = await sequelize.query(`SHOW TABLES;`);
    console.log('All tables in database:');
    tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));
    console.log('');

    // Check for role-related tables
    const rolesTables = tables.filter(t => 
      Object.values(t)[0].toLowerCase().includes('role')
    );
    
    if (rolesTables.length > 0) {
      console.log('Role-related tables:');
      for (const table of rolesTables) {
        const tableName = Object.values(table)[0];
        console.log(`\n${tableName}:`);
        const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${tableName};`);
        columns.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));
      }
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

checkRolesTables();
