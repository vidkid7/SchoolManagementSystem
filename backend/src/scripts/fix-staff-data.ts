import 'dotenv/config';
import sequelize from '../config/database';
import Staff, { StaffCategory, StaffStatus, EmploymentType } from '../models/Staff.model';
import User, { UserRole } from '../models/User.model';
import { logger } from '../utils/logger';

async function fixStaffData(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Check existing staff
    const existingStaff = await Staff.findAll();
    logger.info(`Found ${existingStaff.length} existing staff records`);

    // Get all users that should have staff records
    const users = await User.findAll({
      where: {
        role: [
          UserRole.SCHOOL_ADMIN,
          UserRole.DEPARTMENT_HEAD,
          UserRole.SUBJECT_TEACHER,
          UserRole.CLASS_TEACHER,
          UserRole.ACCOUNTANT,
          UserRole.LIBRARIAN,
          UserRole.NON_TEACHING_STAFF
        ]
      }
    });

    logger.info(`Found ${users.length} users that need staff records`);

    let created = 0;
    for (const user of users) {
      // Check if staff record exists
      const staffExists = await Staff.findOne({ where: { userId: user.userId } });
      
      if (!staffExists) {
        // Determine category and position based on role
        let category = StaffCategory.NON_TEACHING;
        let position = 'staff';
        let department = 'general';
        
        if (user.role === UserRole.SCHOOL_ADMIN) {
          category = StaffCategory.TEACHING;
          position = 'principal';
          department = 'academic';
        } else if (user.role === UserRole.DEPARTMENT_HEAD) {
          category = StaffCategory.TEACHING;
          position = 'vice_principal';
          department = 'academic';
        } else if (user.role === UserRole.SUBJECT_TEACHER || user.role === UserRole.CLASS_TEACHER) {
          category = StaffCategory.TEACHING;
          position = 'teacher';
          department = 'academic';
        } else if (user.role === UserRole.ACCOUNTANT) {
          category = StaffCategory.ADMINISTRATIVE;
          position = 'accountant';
          department = 'administration';
        } else if (user.role === UserRole.LIBRARIAN) {
          category = StaffCategory.ADMINISTRATIVE;
          position = 'librarian';
          department = 'administration';
        } else if (user.role === UserRole.NON_TEACHING_STAFF) {
          category = StaffCategory.NON_TEACHING;
          position = 'support_staff';
          department = 'support';
        }

        // Generate staff code
        const staffCount = await Staff.count();
        const staffCode = `STF${String(staffCount + 1).padStart(4, '0')}`;

        // Create staff record
        await Staff.create({
          userId: user.userId,
          staffCode: staffCode,
          firstNameEn: user.username.charAt(0).toUpperCase() + user.username.slice(1),
          lastNameEn: 'Staff',
          gender: 'male',
          category: category,
          position: position,
          department: department,
          employmentType: EmploymentType.FULL_TIME,
          joinDate: new Date(),
          phone: user.phoneNumber || '+977-9841000000',
          email: user.email,
          addressEn: 'Kathmandu, Nepal',
          status: StaffStatus.ACTIVE
        });

        created++;
        logger.info(`Created staff record for user: ${user.username}`);
      }
    }

    logger.info(`\n=== Fix Complete ===`);
    logger.info(`Created: ${created} new staff records`);
    logger.info(`Total staff: ${await Staff.count()}`);

    process.exit(0);
  } catch (error) {
    logger.error('Error fixing staff data:', error);
    process.exit(1);
  }
}

fixStaffData();
