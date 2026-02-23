/**
 * Script to link student user to student record
 * Creates a student record for the student1 user if it doesn't exist
 */

import { sequelize } from '../config/database';
import { User } from '../models/User.model';
import { Student } from '../models/Student.model';
import { Class } from '../models/Class.model';
import { Section } from '../models/Section.model';
import logger from '../utils/logger';

async function linkStudentUser() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Find the student1 user
    const user = await User.findOne({
      where: { username: 'student1' }
    });

    if (!user) {
      logger.error('Student1 user not found. Please run seed script first.');
      process.exit(1);
    }

    logger.info(`Found user: ${user.username} (ID: ${user.userId})`);

    // Check if student record already exists
    const existingStudent = await Student.findOne({
      where: { userId: user.userId }
    });

    if (existingStudent) {
      logger.info(`Student record already exists for user ${user.username}`);
      logger.info(`Student ID: ${existingStudent.studentId}`);
      process.exit(0);
    }

    // Find a class and section to assign
    const firstClass = await Class.findOne();
    const firstSection = await Section.findOne();

    if (!firstClass || !firstSection) {
      logger.error('No class or section found. Please create classes first.');
      process.exit(1);
    }

    // Create student record
    const student = await Student.create({
      userId: user.userId,
      firstName: 'Test',
      lastName: 'Student',
      dateOfBirth: new Date('2010-01-01'),
      gender: 'male',
      classId: firstClass.classId,
      sectionId: firstSection.sectionId,
      rollNumber: 1,
      admissionNumber: 'ADM2024001',
      admissionDate: new Date(),
      studentCode: 'STU001',
      bloodGroup: 'O+',
      address: 'Kathmandu, Nepal',
      guardianName: 'Parent Name',
      guardianPhone: '+977-9841234567',
      guardianEmail: 'parent@example.com',
      guardianRelation: 'father',
      status: 'active',
    });

    logger.info('✅ Student record created successfully!');
    logger.info(`Student ID: ${student.studentId}`);
    logger.info(`User ID: ${student.userId}`);
    logger.info(`Class: ${firstClass.className}`);
    logger.info(`Section: ${firstSection.sectionName}`);

    process.exit(0);
  } catch (error) {
    logger.error('Error linking student user:', error);
    process.exit(1);
  }
}

linkStudentUser();
