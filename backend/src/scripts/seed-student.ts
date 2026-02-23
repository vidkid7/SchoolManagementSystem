import 'dotenv/config';
import sequelize from '../config/database';
import Student, { StudentStatus, Gender } from '../models/Student.model';
import { logger } from '../utils/logger';

/**
 * Student Seeder
 * Seeds sample students for development
 */

async function seedStudents(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Check if student already exists
    const existingStudent = await Student.findOne({
      where: { firstNameEn: 'Ram' }
    });

    if (existingStudent) {
      logger.info('Sample student already exists, skipping...');
      return;
    }

    // Create sample student
    const student = await Student.create({
      studentCode: 'STU001',
      firstNameEn: 'Ram',
      middleNameEn: 'Bahadur',
      lastNameEn: 'Sharma',
      firstNameNp: 'राम',
      middleNameNp: 'बहादुर',
      lastNameNp: 'शर्मा',
      dateOfBirthBS: '2067-05-15',
      dateOfBirthAD: new Date('2010-08-31'),
      gender: Gender.MALE,
      bloodGroup: 'B+',
      addressEn: 'Kathmandu, Nepal',
      addressNp: 'काठमाडौं, नेपाल',
      phone: '9841000001',
      email: 'ram.sharma@email.com',
      fatherName: 'Hari Sharma',
      fatherPhone: '9841000001',
      motherName: 'Sita Sharma',
      motherPhone: '9841000002',
      currentClassId: 1,
      rollNumber: 1,
      admissionDate: new Date('2024-04-01'),
      admissionClass: 1,
      status: StudentStatus.ACTIVE,
      emergencyContact: '9841000001'
    } as any);

    logger.info('Sample student created successfully!');
    logger.info(`Student ID: ${student.studentId}`);
    logger.info(`Student Code: ${student.studentCode}`);
    logger.info(`Name: ${student.firstNameEn} ${student.lastNameEn}`);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding student:', error);
    process.exit(1);
  }
}

seedStudents();
