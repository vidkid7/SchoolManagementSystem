import 'dotenv/config';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import User, { UserRole, UserStatus } from '../models/User.model';
import Municipality from '../models/Municipality.model';
import SchoolConfig from '../models/SchoolConfig.model';
import { logger } from '../utils/logger';

/**
 * Database Seeder
 * Seeds initial data for development and testing
 */

// eslint-disable-next-line max-lines-per-function
async function seedDatabase(): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Demo account seeding is disabled in production');
    }

    const seedPassword = process.env.SEED_PASSWORD;
    if (!seedPassword || seedPassword.length < 16) {
      throw new Error('Set SEED_PASSWORD to at least 16 characters to seed local demo accounts');
    }
    logger.info('Starting database seeding...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Create default municipality for development bootstrapping
    const [defaultMunicipality] = await Municipality.findOrCreate({
      where: { code: 'KMC' },
      defaults: {
        nameEn: 'Kathmandu Metropolitan City',
        code: 'KMC',
        district: 'Kathmandu',
        province: 'Bagmati',
        isActive: true,
      },
    });
    logger.info('Default municipality is ready', { code: defaultMunicipality.code });
    const defaultMunicipalityId = String(defaultMunicipality.getDataValue('id'));

    let defaultSchoolConfig = await SchoolConfig.findOne({
      where: { isActive: true },
      order: [['createdAt', 'ASC']],
    });

    if (!defaultSchoolConfig) {
      defaultSchoolConfig = await SchoolConfig.create({
        municipalityId: defaultMunicipalityId,
        schoolNameEn: 'Default School',
        schoolCode: 'DEFAULT-SCHOOL',
        isActive: true,
      });
      logger.info('Created default school config', {
        id: defaultSchoolConfig.getDataValue('id'),
      });
    }

    const defaultSchoolConfigId = String(defaultSchoolConfig.getDataValue('id'));

    // Create default admin user
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@school.edu.np',
        password: seedPassword, // Will be hashed by beforeCreate hook
        role: UserRole.SCHOOL_ADMIN,
        status: UserStatus.ACTIVE,
        municipalityId: defaultMunicipalityId,
        schoolConfigId: defaultSchoolConfigId,
        phoneNumber: '+977-9841234567',
        failedLoginAttempts: 0
      });
      logger.info('Default admin user created');
      logger.info('Username: admin');
      logger.info('⚠️  IMPORTANT: Change this password immediately in production!');
    } else {
      let updatedAdmin = false;
      if (!adminExists.municipalityId) {
        adminExists.municipalityId = defaultMunicipalityId;
        updatedAdmin = true;
      }
      if (defaultSchoolConfigId && !adminExists.schoolConfigId) {
        adminExists.schoolConfigId = defaultSchoolConfigId;
        updatedAdmin = true;
      }
      if (updatedAdmin) {
        await adminExists.save();
        logger.info('Linked default admin user to default municipality/school');
      }
      logger.info('Admin user already exists, skipping...');
    }

    // Create municipality admin user
    const municipalityAdminExists = await User.findOne({
      where: { username: 'municipalityadmin' },
    });

    if (!municipalityAdminExists) {
      await User.create({
        username: 'municipalityadmin',
        email: 'municipality.admin@school.edu.np',
        password: seedPassword,
        role: UserRole.MUNICIPALITY_ADMIN,
        status: UserStatus.ACTIVE,
        municipalityId: defaultMunicipalityId,
        schoolConfigId: defaultSchoolConfigId,
        phoneNumber: '+977-9841234580',
        failedLoginAttempts: 0,
      });
      logger.info('Default municipality admin created');
      logger.info('Username: municipalityadmin');
    } else {
      logger.info('Municipality admin already exists, skipping...');
    }

    // Create sample teacher
    const teacherExists = await User.findOne({
      where: { username: 'teacher1' }
    });

    if (!teacherExists) {
      await User.create({
        username: 'teacher1',
        email: 'teacher1@school.edu.np',
        password: seedPassword,
        role: UserRole.SUBJECT_TEACHER,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234568',
        failedLoginAttempts: 0
      });
      logger.info('Sample teacher user created');
      logger.info('Username: teacher1');
    } else {
      logger.info('Teacher user already exists, skipping...');
    }

    // Create sample student
    const studentExists = await User.findOne({
      where: { username: 'student1' }
    });

    if (!studentExists) {
      await User.create({
        username: 'student1',
        email: 'student1@school.edu.np',
        password: seedPassword,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234569',
        failedLoginAttempts: 0
      });
      logger.info('Sample student user created');
      logger.info('Username: student1');
    } else {
      logger.info('Student user already exists, skipping...');
    }

    // Create sample parent
    const parentExists = await User.findOne({
      where: { username: 'parent1' }
    });

    if (!parentExists) {
      await User.create({
        username: 'parent1',
        email: 'parent1@school.edu.np',
        password: seedPassword,
        role: UserRole.PARENT,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234570',
        failedLoginAttempts: 0
      });
    } else {
      logger.info('Parent user already exists, skipping...');
    }

    // Create sample class teacher
    const classTeacherExists = await User.findOne({ where: { username: 'classteacher1' } });
    if (!classTeacherExists) {
      await User.create({
        username: 'classteacher1',
        email: 'classteacher1@school.edu.np',
        password: seedPassword,
        role: UserRole.CLASS_TEACHER,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234571',
        failedLoginAttempts: 0
      });
    }

    // Create sample department head
    const deptHeadExists = await User.findOne({ where: { username: 'depthead1' } });
    if (!deptHeadExists) {
      await User.create({
        username: 'depthead1',
        email: 'depthead1@school.edu.np',
        password: seedPassword,
        role: UserRole.DEPARTMENT_HEAD,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234572',
        failedLoginAttempts: 0
      });
    }

    // Create sample ECA coordinator
    const ecaCoordExists = await User.findOne({ where: { username: 'ecacoord1' } });
    if (!ecaCoordExists) {
      await User.create({
        username: 'ecacoord1',
        email: 'ecacoord1@school.edu.np',
        password: seedPassword,
        role: UserRole.ECA_COORDINATOR,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234573',
        failedLoginAttempts: 0
      });
    }

    // Create sample sports coordinator
    const sportsCoordExists = await User.findOne({ where: { username: 'sportscoord1' } });
    if (!sportsCoordExists) {
      await User.create({
        username: 'sportscoord1',
        email: 'sportscoord1@school.edu.np',
        password: seedPassword,
        role: UserRole.SPORTS_COORDINATOR,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234574',
        failedLoginAttempts: 0
      });
    }

    // Create sample librarian
    const librarianExists = await User.findOne({ where: { username: 'librarian1' } });
    if (!librarianExists) {
      await User.create({
        username: 'librarian1',
        email: 'librarian1@school.edu.np',
        password: seedPassword,
        role: UserRole.LIBRARIAN,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234575',
        failedLoginAttempts: 0
      });
    }

    // Create sample accountant
    const accountantExists = await User.findOne({ where: { username: 'accountant1' } });
    if (!accountantExists) {
      await User.create({
        username: 'accountant1',
        email: 'accountant1@school.edu.np',
        password: seedPassword,
        role: UserRole.ACCOUNTANT,
        status: UserStatus.ACTIVE,
        municipalityId: defaultMunicipalityId,
        schoolConfigId: defaultSchoolConfigId,
        phoneNumber: '+977-9841234576',
        failedLoginAttempts: 0
      });
    } else if (!accountantExists.municipalityId) {
      accountantExists.municipalityId = defaultMunicipalityId;
      accountantExists.schoolConfigId = defaultSchoolConfigId;
      await accountantExists.save();
      logger.info('Linked existing accountant1 to default municipality');
    }

    // Create sample transport manager
    const transportExists = await User.findOne({ where: { username: 'transport1' } });
    if (!transportExists) {
      await User.create({
        username: 'transport1',
        email: 'transport1@school.edu.np',
        password: seedPassword,
        role: UserRole.TRANSPORT_MANAGER,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234577',
        failedLoginAttempts: 0
      });
    }

    // Create sample hostel warden
    const hostelWardenExists = await User.findOne({ where: { username: 'hostelwarden1' } });
    if (!hostelWardenExists) {
      await User.create({
        username: 'hostelwarden1',
        email: 'hostelwarden1@school.edu.np',
        password: seedPassword,
        role: UserRole.HOSTEL_WARDEN,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234578',
        failedLoginAttempts: 0
      });
    }

    // Create sample non-teaching staff
    const nonTeachingExists = await User.findOne({ where: { username: 'staff1' } });
    if (!nonTeachingExists) {
      await User.create({
        username: 'staff1',
        email: 'staff1@school.edu.np',
        password: seedPassword,
        role: UserRole.NON_TEACHING_STAFF,
        status: UserStatus.ACTIVE,
        phoneNumber: '+977-9841234579',
        failedLoginAttempts: 0
      });
    }

    if (defaultSchoolConfigId) {
      const [updatedUsers] = await User.update(
        {
          schoolConfigId: defaultSchoolConfigId,
          municipalityId: defaultMunicipalityId,
        },
        {
          where: {
            schoolConfigId: null,
            role: {
              [Op.ne]: UserRole.MUNICIPALITY_ADMIN,
            },
          } as any,
        }
      );
      logger.info('Assigned default school/municipality to unassigned users', {
        updatedUsers,
      });
    }

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
