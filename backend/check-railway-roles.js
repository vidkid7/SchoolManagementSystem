require('dotenv').config({ path: './backend/.env' });
const { Sequelize } = require('sequelize');

// Use DATABASE_URL if available (Railway), otherwise use local MySQL config
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

async function checkRoles() {
  try {
    const dbType = process.env.DATABASE_URL ? 'Railway (PostgreSQL)' : 'Local (MySQL)';
    console.log(`🔍 Connecting to ${dbType} database...\n`);
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');

    // Check roles table
    const [roles] = await sequelize.query(`
      SELECT id, name, code, description, is_system, created_at
      FROM roles
      ORDER BY name;
    `);

    console.log(`📋 Total Roles: ${roles.length}\n`);
    console.log('Roles in database:');
    console.log('='.repeat(80));
    
    roles.forEach((role, index) => {
      console.log(`\n${index + 1}. ${role.name} (${role.code})`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Description: ${role.description || 'N/A'}`);
      console.log(`   System Role: ${role.is_system ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(role.created_at).toLocaleString()}`);
    });

    console.log('\n' + '='.repeat(80));

    // Check permissions count
    const [permCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM permissions;
    `);
    console.log(`\n📝 Total Permissions: ${permCount[0].count}`);

    // Check role-permission mappings
    const [mappings] = await sequelize.query(`
      SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name
      ORDER BY r.name;
    `);

    console.log('\n🔗 Role-Permission Mappings:');
    console.log('='.repeat(80));
    mappings.forEach(m => {
      console.log(`${m.role_name}: ${m.permission_count} permissions`);
    });

    await sequelize.close();
    console.log('\n✅ Check completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
}

checkRoles();
