import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import sequelize from './src/config/database';
import User from './src/models/User.model';
import bcrypt from 'bcrypt';

async function checkAndCreateMunicipalityAdmin() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully\n');

    // Check if municipality admin exists
    const existingAdmin = await User.findOne({
      where: { username: 'municipalityadmin' }
    });

    if (existingAdmin) {
      console.log('✅ Municipality admin user found:');
      console.log('   Username:', existingAdmin.username);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   Status:', existingAdmin.status);
      
      // Update password to ensure it's correct
      console.log('\n🔄 Updating password to: Municipality@123');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Municipality@123', salt);
      await existingAdmin.update({ password: hashedPassword });
      console.log('✅ Password updated successfully');
    } else {
      console.log('❌ Municipality admin user not found');
      console.log('🔄 Creating municipality admin user...\n');
      
      const newAdmin = await User.create({
        username: 'municipalityadmin',
        email: 'municipality.admin@school.edu.np',
        password: 'Municipality@123',
        role: 'Municipality_Admin',
        status: 'active',
        phoneNumber: '9841234567'
      });

      console.log('✅ Municipality admin user created successfully:');
      console.log('   Username: municipalityadmin');
      console.log('   Password: Municipality@123');
      console.log('   Email:', newAdmin.email);
      console.log('   Role:', newAdmin.role);
    }

    console.log('\n✅ Done! You can now login with:');
    console.log('   Username: municipalityadmin');
    console.log('   Password: Municipality@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndCreateMunicipalityAdmin();
