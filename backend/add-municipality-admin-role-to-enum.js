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
  logging: console.log
});

async function addMunicipalityAdminToEnum() {
  try {
    console.log('🔍 Connecting to Railway MySQL database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');

    console.log('🔧 Adding Municipality_Admin to role enum...');
    
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM(
        'School_Admin',
        'Subject_Teacher',
        'Class_Teacher',
        'Department_Head',
        'ECA_Coordinator',
        'Sports_Coordinator',
        'Student',
        'Parent',
        'Librarian',
        'Accountant',
        'Transport_Manager',
        'Hostel_Warden',
        'Non_Teaching_Staff',
        'Municipality_Admin'
      );
    `);

    console.log('✅ Municipality_Admin role added to enum!\n');

    await sequelize.close();
    console.log('✅ Process completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('SQL Error:', error.original.message);
    }
    await sequelize.close();
    process.exit(1);
  }
}

addMunicipalityAdminToEnum();
