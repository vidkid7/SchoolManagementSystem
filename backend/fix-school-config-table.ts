import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import sequelize from './src/config/database';
import { DataTypes } from 'sequelize';

async function fixSchoolConfigTable() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully\n');

    const queryInterface = sequelize.getQueryInterface();

    // Check if school_config table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('school_config')) {
      console.log('❌ school_config table does not exist');
      process.exit(1);
    }

    // Check table structure
    const tableDescription = await queryInterface.describeTable('school_config');
    
    if (!tableDescription.municipality_id) {
      console.log('Adding municipality_id column to school_config table...');
      await queryInterface.addColumn('school_config', 'municipality_id', {
        type: DataTypes.UUID,
        allowNull: true,
      });
      console.log('✅ municipality_id column added successfully');
    } else {
      console.log('✅ municipality_id column already exists');
    }

    console.log('\n✅ All columns verified/added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSchoolConfigTable();
