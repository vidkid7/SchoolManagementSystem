import 'dotenv/config';
import sequelize from '../config/database';
import Staff from '../models/Staff.model';

async function checkStaffData(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const staff = await Staff.findAll({
      limit: 5,
      attributes: ['staffId', 'staffCode', 'firstNameEn', 'lastNameEn', 'position', 'department'],
      raw: true
    });

    console.log('\n=== Staff Data in Database ===');
    console.log(JSON.stringify(staff, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStaffData();
