const { Sequelize } = require('sequelize');

const DATABASE_URL = "mysql://root:hrgERFnAMnCQHIQhZEiPpIDcDUJlucPX@shortline.proxy.rlwy.net:23491/railway";

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

const tablesToUpdate = [
  'students',
  'attendance',
  'classes',
  'staff',
  'academic_years'
];

async function addSchoolConfigIdColumns() {
  try {
    console.log('🔍 Connecting to Railway database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    for (const table of tablesToUpdate) {
      try {
        // Check if table exists
        const [tables] = await sequelize.query(`SHOW TABLES LIKE '${table}';`);
        
        if (tables.length === 0) {
          console.log(`⏭️  Table '${table}' doesn't exist, skipping...\n`);
          continue;
        }

        // Check if column exists
        const [columns] = await sequelize.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'railway' 
          AND TABLE_NAME = '${table}'
          AND COLUMN_NAME = 'school_config_id';
        `);

        if (columns.length > 0) {
          console.log(`✓ Table '${table}' already has school_config_id column\n`);
          continue;
        }

        console.log(`➕ Adding school_config_id to '${table}'...`);
        await sequelize.query(`
          ALTER TABLE ${table} 
          ADD COLUMN school_config_id VARCHAR(36) NULL DEFAULT '00000000-0000-0000-0000-000000000000';
        `);
        console.log(`✅ Added school_config_id to '${table}'\n`);
      } catch (error) {
        console.log(`⚠️  Error with table '${table}': ${error.message}\n`);
      }
    }

    console.log('✅ All updates completed!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSchoolConfigIdColumns();
