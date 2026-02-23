/**
 * Student Module Seeding Script
 * 
 * Seeds comprehensive data for testing all 21 Student Management features:
 * - Student Records (11 features)
 * - Academic History (6 features)
 * - CV Management (4 features)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import Student, { StudentStatus, Gender } from '../models/Student.model';
import Class from '../models/Class.model';
import { AcademicYear } from '../models/AcademicYear.model';
import { logger } from '../utils/logger';

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Sample data
const NEPALI_FIRST_NAMES = [
  'Aarav', 'Aayush', 'Anish', 'Bibek', 'Bishal', 'Dipesh', 'Kiran', 'Manish', 'Nabin', 'Prakash',
  'Rajesh', 'Roshan', 'Sagar', 'Sandesh', 'Suraj', 'Aashika', 'Anjali', 'Binita', 'Diksha', 'Kabita',
  'Kritika', 'Manisha', 'Nisha', 'Pooja', 'Priya', 'Rina', 'Sabina', 'Sita', 'Sunita', 'Urmila'
];

const NEPALI_LAST_NAMES = [
  'Adhikari', 'Basnet', 'Bhattarai', 'Chaudhary', 'Dahal', 'Gautam', 'Gurung', 'KC', 'Karki', 'Khadka',
  'Lama', 'Magar', 'Maharjan', 'Pandey', 'Poudel', 'Rai', 'Regmi', 'Sharma', 'Shrestha', 'Tamang',
  'Thapa', 'Upreti'
];

const DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski', 'Chitwan', 'Morang', 'Rupandehi', 'Dhanusha',
  'Banke', 'Kailali', 'Jhapa', 'Sunsari', 'Parsa', 'Bara', 'Makwanpur'
];

const CITIES = [
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal',
  'Hetauda', 'Janakpur', 'Nepalgunj', 'Dhangadhi', 'Itahari', 'Tulsipur', 'Ghorahi'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const GENDERS = [Gender.MALE, Gender.FEMALE];

const SECTIONS = ['A', 'B', 'C'];

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateNepaliDate(date: Date): string {
  // Simple BS date generation (approximate)
  const year = date.getFullYear() + 57;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generatePhone(): string {
  return `98${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.school.edu.np`;
}

async function seedStudentModule() {
  try {
    logger.info('Starting Student Module seeding...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Get or create academic year
    let academicYear: any = await AcademicYear.findOne({ 
      where: { isCurrent: true },
      raw: true 
    });
    
    if (!academicYear) {
      const created: any = await AcademicYear.create({
        name: '2081-2082',
        startDateBS: '2081-04-01',
        endDateBS: '2082-03-32',
        startDateAD: new Date('2024-07-15'),
        endDateAD: new Date('2025-07-14'),
        isCurrent: true,
      } as any);
      
      // Fetch the created record with raw: true
      academicYear = await AcademicYear.findOne({
        where: { academicYearId: (created as any).academicYearId },
        raw: true
      });
      
      logger.info('Created academic year: 2081-2082');
    }

    logger.info(`Using academic year: ${academicYear.name} (ID: ${academicYear.academicYearId})`);

    // Get or create classes
    const classes: any[] = [];
    for (let gradeLevel = 1; gradeLevel <= 12; gradeLevel++) {
      for (const section of SECTIONS) {
        let classRecord = await Class.findOne({
          where: { 
            gradeLevel, 
            section, 
            ...(academicYear.academicYearId ? { academicYearId: academicYear.academicYearId } : {})
          }
        });

        if (!classRecord) {
          classRecord = await Class.create({
            gradeLevel,
            section,
            shift: 'day',
            academicYearId: academicYear.academicYearId,
            capacity: 40,
            currentStrength: 0,
            classTeacherId: null,
          } as any);
        }
        classes.push(classRecord);
      }
    }
    logger.info(`Ensured ${classes.length} classes exist`);

    // Clear existing students (optional - comment out if you want to keep existing data)
    // await Student.destroy({ where: {}, force: true });
    // logger.info('Cleared existing students');

    // Generate students
    const students = [];
    const totalStudents = 100; // Generate 100 students
    
    // Get the current max student ID to avoid duplicates
    const maxStudent: any = await Student.findOne({
      attributes: [[sequelize.fn('MAX', sequelize.col('student_id')), 'maxId']],
      raw: true
    });
    const startId = (maxStudent?.maxId || 0) + 1;
    logger.info(`Starting from student ID: ${startId}`);

    for (let i = 0; i < totalStudents; i++) {
      const firstName = randomItem(NEPALI_FIRST_NAMES);
      const lastName = randomItem(NEPALI_LAST_NAMES);
      const gender = randomItem(GENDERS);
      const classRecord = randomItem(classes);
      
      // Generate dates
      const birthDate = randomDate(new Date('2005-01-01'), new Date('2015-12-31'));
      const admissionDate = randomDate(new Date('2020-01-01'), new Date('2024-06-30'));
      
      // Generate student code
      const year = admissionDate.getFullYear();
      const studentCode = `STU${year}${String(startId + i).padStart(4, '0')}`;

      // Determine status (90% active, 5% inactive, 3% graduated, 2% transferred)
      const rand = Math.random();
      let status = StudentStatus.ACTIVE;
      if (rand > 0.98) status = StudentStatus.TRANSFERRED;
      else if (rand > 0.95) status = StudentStatus.GRADUATED;
      else if (rand > 0.90) status = StudentStatus.INACTIVE;

      const studentData = {
        studentCode,
        firstNameEn: firstName,
        middleNameEn: Math.random() > 0.7 ? randomItem(NEPALI_FIRST_NAMES) : null,
        lastNameEn: lastName,
        firstNameNp: firstName, // In real scenario, would be Nepali script
        lastNameNp: lastName,
        dateOfBirthBS: generateNepaliDate(birthDate),
        dateOfBirthAD: birthDate,
        gender,
        bloodGroup: Math.random() > 0.3 ? randomItem(BLOOD_GROUPS) : null,
        currentClassId: classRecord.classId,
        section: classRecord.section,
        rollNumber: Math.floor(Math.random() * 40) + 1,
        admissionDate: generateNepaliDate(admissionDate),
        admissionClass: Math.max(1, classRecord.gradeLevel - Math.floor(Math.random() * 3)),
        phone: Math.random() > 0.2 ? generatePhone() : null,
        email: Math.random() > 0.5 ? generateEmail(firstName, lastName) : null,
        addressEn: `${randomItem(['Tole', 'Marg', 'Chowk'])}-${Math.floor(Math.random() * 50) + 1}`,
        addressNp: `${randomItem(['Tole', 'Marg', 'Chowk'])}-${Math.floor(Math.random() * 50) + 1}`,
        city: randomItem(CITIES),
        district: randomItem(DISTRICTS),
        fatherName: `${randomItem(NEPALI_FIRST_NAMES)} ${lastName}`,
        fatherPhone: generatePhone(),
        fatherOccupation: randomItem(['Business', 'Service', 'Agriculture', 'Teaching', 'Engineering']),
        motherName: `${randomItem(NEPALI_FIRST_NAMES.filter(n => ['Aashika', 'Anjali', 'Binita', 'Diksha', 'Kabita', 'Kritika', 'Manisha', 'Nisha', 'Pooja', 'Priya', 'Rina', 'Sabina', 'Sita', 'Sunita', 'Urmila'].includes(n)))} ${lastName}`,
        motherPhone: generatePhone(),
        motherOccupation: randomItem(['Housewife', 'Service', 'Teaching', 'Business', 'Healthcare']),
        guardianName: Math.random() > 0.9 ? `${randomItem(NEPALI_FIRST_NAMES)} ${randomItem(NEPALI_LAST_NAMES)}` : null,
        guardianRelation: Math.random() > 0.9 ? randomItem(['Uncle', 'Aunt', 'Grandfather', 'Grandmother']) : null,
        guardianPhone: Math.random() > 0.9 ? generatePhone() : null,
        emergencyContact: generatePhone(), // Required field
        emergencyContactName: `${randomItem(NEPALI_FIRST_NAMES)} ${lastName}`,
        emergencyContactNumber: generatePhone(),
        emergencyContactRelation: randomItem(['Father', 'Mother', 'Uncle', 'Aunt']),
        status,
        previousSchool: Math.random() > 0.5 ? `${randomItem(['Shree', 'Nepal', 'Himalayan', 'Valley'])} ${randomItem(['Secondary', 'Higher Secondary', 'English'])} School` : null,
        transferCertificateNumber: Math.random() > 0.7 ? `TC${year}${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` : null,
        symbolNumber: classRecord.gradeLevel >= 10 ? `SYM${year}${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}` : null,
        nebRegistrationNumber: classRecord.gradeLevel >= 11 ? `NEB${year}${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}` : null,
        photoUrl: Math.random() > 0.3 ? `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random` : null,
      };

      const student = await Student.create(studentData as any);
      students.push(student);

      if ((i + 1) % 10 === 0) {
        logger.info(`Created ${i + 1}/${totalStudents} students...`);
      }
    }

    logger.info(`✅ Successfully created ${students.length} students`);

    // Summary statistics
    const stats = {
      total: students.length,
      active: students.filter(s => s.status === StudentStatus.ACTIVE).length,
      inactive: students.filter(s => s.status === StudentStatus.INACTIVE).length,
      graduated: students.filter(s => s.status === StudentStatus.GRADUATED).length,
      transferred: students.filter(s => s.status === StudentStatus.TRANSFERRED).length,
      male: students.filter(s => s.gender === Gender.MALE).length,
      female: students.filter(s => s.gender === Gender.FEMALE).length,
      withPhoto: students.filter(s => s.photoUrl).length,
      withEmail: students.filter(s => s.email).length,
      withBloodGroup: students.filter(s => s.bloodGroup).length,
    };

    logger.info('\n📊 Student Statistics:');
    logger.info(`Total Students: ${stats.total}`);
    logger.info(`Active: ${stats.active} | Inactive: ${stats.inactive} | Graduated: ${stats.graduated} | Transferred: ${stats.transferred}`);
    logger.info(`Male: ${stats.male} | Female: ${stats.female}`);
    logger.info(`With Photo: ${stats.withPhoto} | With Email: ${stats.withEmail} | With Blood Group: ${stats.withBloodGroup}`);

    // Distribution by class
    logger.info('\n📚 Distribution by Class:');
    for (let gradeLevel = 1; gradeLevel <= 12; gradeLevel++) {
      const count = students.filter(s => {
        const classRecord = classes.find(c => c.classId === s.currentClassId);
        return classRecord?.gradeLevel === gradeLevel;
      }).length;
      if (count > 0) {
        logger.info(`Class ${gradeLevel}: ${count} students`);
      }
    }

    logger.info('\n✅ Student Module seeding completed successfully!');
    logger.info('\n📝 Next Steps:');
    logger.info('1. Run attendance seeding: npm run seed:attendance');
    logger.info('2. Run grades seeding: npm run seed:grades');
    logger.info('3. Run fees seeding: npm run seed:fees');
    logger.info('4. Run ECA/Sports seeding: npm run seed:eca');
    logger.info('5. Run library seeding: npm run seed:library');
    logger.info('6. Run documents seeding: npm run seed:documents');

  } catch (error) {
    logger.error('Error seeding student module:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the seeding
if (require.main === module) {
  seedStudentModule()
    .then(() => {
      logger.info('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding process failed:', error);
      process.exit(1);
    });
}

export default seedStudentModule;
