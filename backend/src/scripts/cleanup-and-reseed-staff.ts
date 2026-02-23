import 'dotenv/config';
import sequelize from '../config/database';
import Staff, { StaffCategory, StaffStatus, EmploymentType } from '../models/Staff.model';
import User from '../models/User.model';
import { logger } from '../utils/logger';

async function cleanupAndReseed(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Delete all staff records with corrupted names
    const deletedCount = await Staff.destroy({
      where: {},
      force: true // Hard delete
    });
    logger.info(`Deleted ${deletedCount} existing staff records`);

    // Get the properly seeded users
    const staffUsers = await User.findAll({
      where: {
        username: [
          'principal', 'viceprincipal', 
          'teacher1', 'teacher2', 'teacher3', 'teacher4', 'teacher5', 
          'teacher6', 'teacher7', 'teacher8', 'teacher9',
          'accountant', 'librarian', 'support1', 'support2'
        ]
      }
    });

    logger.info(`Found ${staffUsers.length} staff users to create records for`);

    const staffData: Record<string, { firstName: string; lastName: string; position: string; dept: string; category: StaffCategory; qualification: string; specialization?: string }> = {
      principal: { firstName: 'Ram', lastName: 'Sharma', position: 'principal', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.Ed.', specialization: 'Educational Administration' },
      viceprincipal: { firstName: 'Shyam', lastName: 'Poudel', position: 'vice_principal', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.A. Education', specialization: 'Curriculum Development' },
      teacher1: { firstName: 'Gita', lastName: 'Maharjan', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.Sc. Mathematics', specialization: 'Mathematics' },
      teacher2: { firstName: 'Bharat', lastName: 'Thapa', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.Sc. Physics', specialization: 'Physics' },
      teacher3: { firstName: 'Sarita', lastName: 'Karki', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.A. English', specialization: 'English Literature' },
      teacher4: { firstName: 'Ramesh', lastName: 'Budhathoki', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.A. Nepali', specialization: 'Nepali' },
      teacher5: { firstName: 'Laxmi', lastName: 'Poudel', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.Sc. Chemistry', specialization: 'Chemistry' },
      teacher6: { firstName: 'Kishor', lastName: 'Rana', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.Sc. Computer Science', specialization: 'Computer Science' },
      teacher7: { firstName: 'Nirmala', lastName: 'Tamang', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.A. Social', specialization: 'Social Studies' },
      teacher8: { firstName: 'Raj Kumar', lastName: 'Yadav', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.Sc. Biology', specialization: 'Biology' },
      teacher9: { firstName: 'Sabita', lastName: 'Malla', position: 'teacher', dept: 'academic', category: StaffCategory.TEACHING, qualification: 'M.A. Economics', specialization: 'Economics' },
      accountant: { firstName: 'Deepak', lastName: 'Khatri', position: 'accountant', dept: 'administration', category: StaffCategory.ADMINISTRATIVE, qualification: 'B.Com.', specialization: 'Accounting' },
      librarian: { firstName: 'Sunita', lastName: 'Acharya', position: 'librarian', dept: 'administration', category: StaffCategory.ADMINISTRATIVE, qualification: 'M.Lib.', specialization: 'Library Science' },
      support1: { firstName: 'Milan', lastName: 'Magar', position: 'support_staff', dept: 'support', category: StaffCategory.NON_TEACHING, qualification: 'Intermediate' },
      support2: { firstName: 'Punam', lastName: 'Sherpa', position: 'support_staff', dept: 'support', category: StaffCategory.NON_TEACHING, qualification: 'SLC' }
    };

    let created = 0;
    for (const user of staffUsers) {
      const data = staffData[user.username];
      if (!data) continue;

      const staffCode = `STF${String(created + 1).padStart(4, '0')}`;

      await Staff.create({
        userId: user.userId,
        staffCode: staffCode,
        firstNameEn: data.firstName,
        lastNameEn: data.lastName,
        gender: 'male',
        category: data.category,
        position: data.position,
        department: data.dept,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date(),
        phone: user.phoneNumber || '+977-9841000000',
        email: user.email,
        addressEn: 'Kathmandu, Nepal',
        highestQualification: data.qualification,
        specialization: data.specialization,
        status: StaffStatus.ACTIVE
      });

      created++;
      logger.info(`Created staff: ${data.firstName} ${data.lastName} (${data.position})`);
    }

    logger.info(`\n=== Cleanup and Reseed Complete ===`);
    logger.info(`Created: ${created} staff records`);

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

cleanupAndReseed();
