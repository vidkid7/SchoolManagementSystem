import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import sequelize from './src/config/database';
import User from './src/models/User.model';
import { v4 as uuidv4 } from 'uuid';

async function setupMunicipality() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully\n');

    const queryInterface = sequelize.getQueryInterface();

    // Check if municipalities table exists
    const tables = await queryInterface.showAllTables();
    const hasMunicipalitiesTable = tables.includes('municipalities');

    if (!hasMunicipalitiesTable) {
      console.log('Creating municipalities table...');
      await queryInterface.createTable('municipalities', {
        id: {
          type: 'CHAR(36)',
          primaryKey: true,
        },
        name_en: {
          type: 'VARCHAR(255)',
          allowNull: false,
        },
        name_np: {
          type: 'VARCHAR(255)',
          allowNull: true,
        },
        code: {
          type: 'VARCHAR(50)',
          allowNull: false,
          unique: true,
        },
        district: {
          type: 'VARCHAR(100)',
          allowNull: false,
        },
        province: {
          type: 'VARCHAR(100)',
          allowNull: true,
        },
        contact_email: {
          type: 'VARCHAR(255)',
          allowNull: true,
        },
        contact_phone: {
          type: 'VARCHAR(20)',
          allowNull: true,
        },
        address: {
          type: 'TEXT',
          allowNull: true,
        },
        is_active: {
          type: 'BOOLEAN',
          defaultValue: true,
        },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
        },
        updated_at: {
          type: 'DATETIME',
          allowNull: false,
        },
      });
      console.log('✅ Municipalities table created\n');
    }

    // Check if municipality exists
    const [municipalities] = await sequelize.query(
      'SELECT * FROM municipalities WHERE code = "KMC001"'
    );

    let municipalityId: string;

    if (municipalities.length === 0) {
      console.log('Creating default municipality (Kathmandu Metropolitan City)...');
      municipalityId = uuidv4();
      
      await sequelize.query(
        `INSERT INTO municipalities (id, name_en, name_np, code, district, province, contact_email, contact_phone, address, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            municipalityId,
            'Kathmandu Metropolitan City',
            'काठमाडौं महानगरपालिका',
            'KMC001',
            'Kathmandu',
            'Bagmati',
            'info@kathmandu.gov.np',
            '01-4200000',
            'Kathmandu, Nepal',
            true
          ]
        }
      );
      console.log('✅ Municipality created successfully');
      console.log('   Name: Kathmandu Metropolitan City');
      console.log('   Code: KMC001');
      console.log('   ID:', municipalityId);
    } else {
      municipalityId = municipalities[0].id;
      console.log('✅ Municipality already exists');
      console.log('   Name:', municipalities[0].name_en);
      console.log('   Code:', municipalities[0].code);
      console.log('   ID:', municipalityId);
    }

    // Update municipality admin user
    console.log('\n🔄 Assigning municipality to admin user...');
    const admin = await User.findOne({
      where: { username: 'municipalityadmin' }
    });

    if (admin) {
      await admin.update({ municipalityId });
      console.log('✅ Municipality assigned to admin user successfully');
    } else {
      console.log('❌ Admin user not found');
    }

    console.log('\n✅ Setup complete! Please logout and login again.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupMunicipality();
