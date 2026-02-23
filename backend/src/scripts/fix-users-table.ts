import 'dotenv/config';
import sequelize from '../config/database';
import { QueryInterface, DataTypes } from 'sequelize';

async function fixUsersTable() {
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  try {
    console.log('Checking and adding missing columns to users table...');

    // Check if password_reset_token exists
    try {
      await queryInterface.describeTable('users');
      
      // Add password_reset_token if it doesn't exist
      try {
        await queryInterface.addColumn('users', 'password_reset_token', {
          type: DataTypes.STRING(255),
          allowNull: true
        });
        console.log('✅ Added password_reset_token column');
      } catch (error: any) {
        if (error.original?.errno === 1060) {
          console.log('ℹ️  password_reset_token column already exists');
        } else {
          throw error;
        }
      }

      // Add password_reset_expires if it doesn't exist
      try {
        await queryInterface.addColumn('users', 'password_reset_expires', {
          type: DataTypes.DATE,
          allowNull: true
        });
        console.log('✅ Added password_reset_expires column');
      } catch (error: any) {
        if (error.original?.errno === 1060) {
          console.log('ℹ️  password_reset_expires column already exists');
        } else {
          throw error;
        }
      }

      // Add index for password_reset_token
      try {
        await queryInterface.addIndex('users', ['password_reset_token'], {
          name: 'idx_users_password_reset_token'
        });
        console.log('✅ Added index for password_reset_token');
      } catch (error: any) {
        if (error.original?.errno === 1061) {
          console.log('ℹ️  Index idx_users_password_reset_token already exists');
        } else {
          throw error;
        }
      }

      console.log('✅ Users table fixed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error fixing users table:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUsersTable();
