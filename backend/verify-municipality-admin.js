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

async function verifyMunicipalityAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Railway database\n');

    const [user] = await sequelize.query(`
      SELECT user_id, username, email, role, status, created_at
      FROM users
      WHERE username = 'municipalityadmin'
      LIMIT 1;
    `);

    if (user.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Municipality Admin User Created Successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`User ID:   ${user[0].user_id}`);
      console.log(`Username:  ${user[0].username}`);
      console.log(`Email:     ${user[0].email}`);
      console.log(`Role:      ${user[0].role}`);
      console.log(`Status:    ${user[0].status}`);
      console.log(`Created:   ${user[0].created_at}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\nLogin Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Username: municipalityadmin');
      console.log('Password: Municipality@123');
      console.log('Email:    municipality.admin@school.edu.np');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('❌ Municipality admin user not found!');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

verifyMunicipalityAdmin();
