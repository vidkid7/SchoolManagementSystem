import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import sequelize from './src/config/database';
import { DataTypes } from 'sequelize';

async function fixUsersTable() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully');

    const queryInterface = sequelize.getQueryInterface();

    // Check if school_config_id column exists
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.school_config_id) {
      console.log('Adding school_config_id column to users table...');
      await queryInterface.addColumn('users', 'school_config_id', {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'school_config',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
      console.log('✅ school_config_id column added successfully');
    } else {
      console.log('✅ school_config_id column already exists');
    }

    // Check if municipality_id column exists
    if (!tableDescription.municipality_id) {
      console.log('Adding municipality_id column to users table...');
      await queryInterface.addColumn('users', 'municipality_id', {
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

fixUsersTable();
