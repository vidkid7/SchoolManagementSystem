import 'dotenv/config';
import sequelize from '../config/database';
import Staff, { StaffCategory, StaffStatus, EmploymentType } from '../models/Staff.model';
import User, { UserRole, UserStatus } from '../models/User.model';
import { logger } from '../utils/logger';

/**
 * Staff Seeder
 * Seeds sample staff members for testing
 */

interface StaffData {
  firstName: string;
  middleName?: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  qualification: string;
  specialization?: string;
  role: UserRole;
  username: string;
}

const staffMembers: StaffData[] = [
  {
    firstName: 'Ram',
    lastName: 'Sharma',
    position: 'principal',
    department: 'academic',
    email: 'principal@school.edu.np',
    phone: '+977-9841000001',
    gender: 'male',
    qualification: 'M.Ed.',
    specialization: 'Educational Administration',
    role: UserRole.SCHOOL_ADMIN,
    username: 'principal'
  },
  {
    firstName: 'Shyam',
    lastName: 'Poudel',
    position: 'vice_principal',
    department: 'academic',
    email: 'viceprincipal@school.edu.np',
    phone: '+977-9841000002',
    gender: 'male',
    qualification: 'M.A. Education',
    specialization: 'Curriculum Development',
    role: UserRole.DEPARTMENT_HEAD,
    username: 'viceprincipal'
  },
  {
    firstName: 'Gita',
    lastName: 'Maharjan',
    position: 'teacher',
    department: 'academic',
    email: 'gita.mathur@school.edu.np',
    phone: '+977-9841000003',
    gender: 'female',
    qualification: 'M.Sc. Mathematics',
    specialization: 'Mathematics',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher1'
  },
  {
    firstName: 'Bharat',
    lastName: 'Thapa',
    position: 'teacher',
    department: 'academic',
    email: 'bharat.science@school.edu.np',
    phone: '+977-9841000004',
    gender: 'male',
    qualification: 'M.Sc. Physics',
    specialization: 'Physics',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher2'
  },
  {
    firstName: 'Sarita',
    lastName: 'Karki',
    position: 'teacher',
    department: 'academic',
    email: 'sarita.english@school.edu.np',
    phone: '+977-9841000005',
    gender: 'female',
    qualification: 'M.A. English',
    specialization: 'English Literature',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher3'
  },
  {
    firstName: 'Ramesh',
    lastName: 'Budhathoki',
    position: 'teacher',
    department: 'academic',
    email: 'ramesh.nepali@school.edu.np',
    phone: '+977-9841000006',
    gender: 'male',
    qualification: 'M.A. Nepali',
    specialization: 'Nepali',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher4'
  },
  {
    firstName: 'Laxmi',
    lastName: 'Poudel',
    position: 'teacher',
    department: 'academic',
    email: 'laxmi.chem@school.edu.np',
    phone: '+977-9841000007',
    gender: 'female',
    qualification: 'M.Sc. Chemistry',
    specialization: 'Chemistry',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher5'
  },
  {
    firstName: 'Kishor',
    lastName: 'Rana',
    position: 'teacher',
    department: 'academic',
    email: 'kishor.comp@school.edu.np',
    phone: '+977-9841000008',
    gender: 'male',
    qualification: 'M.Sc. Computer Science',
    specialization: 'Computer Science',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher6'
  },
  {
    firstName: 'Nirmala',
    lastName: 'Tamang',
    position: 'teacher',
    department: 'academic',
    email: 'nirmala.social@school.edu.np',
    phone: '+977-9841000009',
    gender: 'female',
    qualification: 'M.A. Social',
    specialization: 'Social Studies',
    role: UserRole.CLASS_TEACHER,
    username: 'teacher7'
  },
  {
    firstName: 'Deepak',
    lastName: 'Khatri',
    position: 'accountant',
    department: 'administration',
    email: 'deepak.accounts@school.edu.np',
    phone: '+977-9841000010',
    gender: 'male',
    qualification: 'B.Com.',
    specialization: 'Accounting',
    role: UserRole.ACCOUNTANT,
    username: 'accountant'
  },
  {
    firstName: 'Sunita',
    lastName: 'Acharya',
    position: 'librarian',
    department: 'administration',
    email: 'sunita.library@school.edu.np',
    phone: '+977-9841000011',
    gender: 'female',
    qualification: 'M.Lib.',
    specialization: 'Library Science',
    role: UserRole.LIBRARIAN,
    username: 'librarian'
  },
  {
    firstName: 'Milan',
    lastName: 'Magar',
    position: 'support_staff',
    department: 'support',
    email: 'milan.support@school.edu.np',
    phone: '+977-9841000012',
    gender: 'male',
    qualification: 'Intermediate',
    role: UserRole.NON_TEACHING_STAFF,
    username: 'support1'
  },
  {
    firstName: 'Punam',
    lastName: 'Sherpa',
    position: 'support_staff',
    department: 'support',
    email: 'punam.support@school.edu.np',
    phone: '+977-9841000013',
    gender: 'female',
    qualification: 'SLC',
    role: UserRole.NON_TEACHING_STAFF,
    username: 'support2'
  },
  {
    firstName: 'Raj Kumar',
    lastName: 'Yadav',
    position: 'teacher',
    department: 'academic',
    email: 'raj.bio@school.edu.np',
    phone: '+977-9841000014',
    gender: 'male',
    qualification: 'M.Sc. Biology',
    specialization: 'Biology',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher8'
  },
  {
    firstName: 'Sabita',
    lastName: 'Malla',
    position: 'teacher',
    department: 'academic',
    email: 'sabita.eco@school.edu.np',
    phone: '+977-9841000015',
    gender: 'female',
    qualification: 'M.A. Economics',
    specialization: 'Economics',
    role: UserRole.SUBJECT_TEACHER,
    username: 'teacher9'
  }
];

function generateStaffCode(index: number): string {
  return `STF${String(index + 1).padStart(4, '0')}`;
}

async function seedStaff(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < staffMembers.length; i++) {
      const data = staffMembers[i];
      
      // Check if user already exists
      const userExists = await User.findOne({
        where: { username: data.username }
      });

      if (userExists) {
        logger.info(`User ${data.username} already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Create user first
      const user = await User.create({
        username: data.username,
        email: data.email,
        password: 'Password@123',
        role: data.role,
        status: UserStatus.ACTIVE,
        phoneNumber: data.phone,
        failedLoginAttempts: 0
      });

      // Determine category based on position
      let category = StaffCategory.NON_TEACHING;
      if (['principal', 'vice_principal', 'teacher'].includes(data.position)) {
        category = StaffCategory.TEACHING;
      } else if (['accountant', 'librarian'].includes(data.position)) {
        category = StaffCategory.ADMINISTRATIVE;
      }

      // Create staff record
      await Staff.create({
        userId: user.userId,
        staffCode: generateStaffCode(i),
        firstNameEn: data.firstName,
        middleNameEn: data.middleName,
        lastNameEn: data.lastName,
        gender: data.gender,
        dateOfBirthBS: '2055-01-15',
        position: data.position,
        category: category,
        department: data.department,
        employmentType: EmploymentType.FULL_TIME,
        highestQualification: data.qualification,
        specialization: data.specialization,
        joinDate: new Date(),
        phone: data.phone,
        email: data.email,
        addressEn: 'Kathmandu, Nepal',
        emergencyContact: data.phone,
        status: StaffStatus.ACTIVE
      });

      createdCount++;
      logger.info(`Created staff: ${data.firstName} ${data.lastName} (${data.position})`);
    }

    logger.info(`\n=== Staff Seeding Complete ===`);
    logger.info(`Created: ${createdCount} staff members`);
    logger.info(`Skipped: ${skippedCount} (already exists)`);
    logger.info(`\nLogin credentials for all staff:`);
    logger.info(`Username: <username>`);
    logger.info(`Password: Password@123`);
    logger.info(`\nSample accounts:`);
    logger.info(`- Principal: principal / Password@123`);
    logger.info(`- Teacher: teacher1 / Password@123`);
    logger.info(`- Accountant: accountant / Password@123`);
    logger.info(`- Librarian: librarian / Password@123`);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding staff:', error);
    process.exit(1);
  }
}

seedStaff();
