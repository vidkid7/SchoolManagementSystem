import sequelize from '@config/database';
import { env } from '@config/env';
import Student, { Gender, StudentStatus } from '@models/Student.model';
import studentIdService from '../studentId.service';

describe('StudentIdService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Student.destroy({ where: {}, force: true });
  });

  describe('generateStudentId', () => {
    it('should generate student ID with correct format', async () => {
      const admissionDate = new Date('2024-01-15');
      const studentId = await studentIdService.generateStudentId(admissionDate);

      expect(studentId).toBeDefined();
      expect(studentId).toMatch(/^[A-Z0-9]+-\d{4}-\d{4}$/);
      expect(studentId).toContain('2024');
      expect(studentId).toContain(env.DEFAULT_SCHOOL_CODE);
    });

    it('should generate first student ID as 0001', async () => {
      const admissionDate = new Date('2024-01-15');
      const studentId = await studentIdService.generateStudentId(admissionDate);

      expect(studentId).toBe(`${env.DEFAULT_SCHOOL_CODE}-2024-0001`);
    });

    it('should increment sequential number for same year', async () => {
      const admissionDate = new Date('2024-01-15');

      // Create first student
      await Student.create({
        studentCode: `${env.DEFAULT_SCHOOL_CODE}-2024-0001`,
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        dateOfBirthBS: '2080-10-15',
        dateOfBirthAD: new Date('2024-01-28'),
        gender: Gender.MALE,
        addressEn: 'Kathmandu',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        admissionDate: admissionDate,
        admissionClass: 1,
        emergencyContact: '9841234567',
        status: StudentStatus.ACTIVE
      });

      // Generate next student ID
      const studentId = await studentIdService.generateStudentId(admissionDate);

      expect(studentId).toBe(`${env.DEFAULT_SCHOOL_CODE}-2024-0002`);
    });

    it('should handle different admission years separately', async () => {
      const admissionDate2023 = new Date('2023-01-15');
      const admissionDate2024 = new Date('2024-01-15');

      // Create student for 2023
      await Student.create({
        studentCode: `${env.DEFAULT_SCHOOL_CODE}-2023-0001`,
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        dateOfBirthBS: '2079-10-15',
        dateOfBirthAD: new Date('2023-01-28'),
        gender: Gender.MALE,
        addressEn: 'Kathmandu',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        admissionDate: admissionDate2023,
        admissionClass: 1,
        emergencyContact: '9841234567',
        status: StudentStatus.ACTIVE
      });

      // Generate student ID for 2024 - should start from 0001
      const studentId2024 = await studentIdService.generateStudentId(admissionDate2024);

      expect(studentId2024).toBe(`${env.DEFAULT_SCHOOL_CODE}-2024-0001`);
    });

    it('should handle concurrent ID generation safely', async () => {
      const admissionDate = new Date('2024-01-15');

      // Simulate concurrent ID generation
      const promises = Array.from({ length: 10 }, () =>
        studentIdService.generateStudentId(admissionDate)
      );

      const studentIds = await Promise.all(promises);

      // All IDs should be unique
      const uniqueIds = new Set(studentIds);
      expect(uniqueIds.size).toBe(10);

      // All IDs should have correct format
      studentIds.forEach(id => {
        expect(id).toMatch(/^[A-Z0-9]+-2024-\d{4}$/);
      });
    });

    it('should pad sequential number with leading zeros', async () => {
      const admissionDate = new Date('2024-01-15');

      // Create 9 students
      for (let i = 1; i <= 9; i++) {
        await Student.create({
          studentCode: `${env.DEFAULT_SCHOOL_CODE}-2024-${i.toString().padStart(4, '0')}`,
          firstNameEn: `Student${i}`,
          lastNameEn: 'Test',
          dateOfBirthBS: '2080-10-15',
          dateOfBirthAD: new Date('2024-01-28'),
          gender: Gender.MALE,
          addressEn: 'Kathmandu',
          fatherName: 'Father Name',
          fatherPhone: '9841234567',
          motherName: 'Mother Name',
          motherPhone: '9841234568',
          admissionDate: admissionDate,
          admissionClass: 1,
          emergencyContact: '9841234567',
          status: StudentStatus.ACTIVE
        });
      }

      // Generate 10th student ID
      const studentId = await studentIdService.generateStudentId(admissionDate);

      expect(studentId).toBe(`${env.DEFAULT_SCHOOL_CODE}-2024-0010`);
    });

    it('should work within a transaction', async () => {
      const admissionDate = new Date('2024-01-15');
      const transaction = await sequelize.transaction();

      try {
        const studentId = await studentIdService.generateStudentId(admissionDate, transaction);

        expect(studentId).toBe(`${env.DEFAULT_SCHOOL_CODE}-2024-0001`);

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  });

  describe('validateStudentIdFormat', () => {
    it('should validate correct student ID format', () => {
      const validIds = [
        'SCH001-2024-0001',
        'ABC123-2023-9999',
        'TEST-2025-0100'
      ];

      validIds.forEach(id => {
        expect(studentIdService.validateStudentIdFormat(id)).toBe(true);
      });
    });

    it('should reject invalid student ID formats', () => {
      const invalidIds = [
        'SCH001-2024-001',      // Too few digits in sequential number
        'SCH001-24-0001',       // Too few digits in year
        'SCH001-2024',          // Missing sequential number
        '2024-0001',            // Missing prefix
        'SCH001_2024_0001',     // Wrong separator
        'sch001-2024-0001',     // Lowercase prefix
        'SCH001-2024-ABCD',     // Non-numeric sequential number
        ''                      // Empty string
      ];

      invalidIds.forEach(id => {
        expect(studentIdService.validateStudentIdFormat(id)).toBe(false);
      });
    });
  });

  describe('parseStudentId', () => {
    it('should parse valid student ID correctly', () => {
      const studentId = 'SCH001-2024-0001';
      const parsed = studentIdService.parseStudentId(studentId);

      expect(parsed).not.toBeNull();
      expect(parsed?.prefix).toBe('SCH001');
      expect(parsed?.year).toBe(2024);
      expect(parsed?.sequentialNumber).toBe(1);
    });

    it('should parse student ID with different values', () => {
      const studentId = 'ABC123-2023-9999';
      const parsed = studentIdService.parseStudentId(studentId);

      expect(parsed).not.toBeNull();
      expect(parsed?.prefix).toBe('ABC123');
      expect(parsed?.year).toBe(2023);
      expect(parsed?.sequentialNumber).toBe(9999);
    });

    it('should return null for invalid student ID', () => {
      const invalidIds = [
        'SCH001-2024-001',
        'INVALID',
        ''
      ];

      invalidIds.forEach(id => {
        expect(studentIdService.parseStudentId(id)).toBeNull();
      });
    });
  });

  describe('getNextSequentialNumber', () => {
    it('should return 1 for first student of the year', async () => {
      const nextNum = await studentIdService.getNextSequentialNumber(2024);
      expect(nextNum).toBe(1);
    });

    it('should return correct next number when students exist', async () => {
      const admissionDate = new Date('2024-01-15');

      // Create 3 students
      for (let i = 1; i <= 3; i++) {
        await Student.create({
          studentCode: `${env.DEFAULT_SCHOOL_CODE}-2024-${i.toString().padStart(4, '0')}`,
          firstNameEn: `Student${i}`,
          lastNameEn: 'Test',
          dateOfBirthBS: '2080-10-15',
          dateOfBirthAD: new Date('2024-01-28'),
          gender: Gender.MALE,
          addressEn: 'Kathmandu',
          fatherName: 'Father Name',
          fatherPhone: '9841234567',
          motherName: 'Mother Name',
          motherPhone: '9841234568',
          admissionDate: admissionDate,
          admissionClass: 1,
          emergencyContact: '9841234567',
          status: StudentStatus.ACTIVE
        });
      }

      const nextNum = await studentIdService.getNextSequentialNumber(2024);
      expect(nextNum).toBe(4);
    });

    it('should handle different years independently', async () => {
      const admissionDate2023 = new Date('2023-01-15');

      // Create students for 2023
      await Student.create({
        studentCode: `${env.DEFAULT_SCHOOL_CODE}-2023-0005`,
        firstNameEn: 'Student',
        lastNameEn: 'Test',
        dateOfBirthBS: '2079-10-15',
        dateOfBirthAD: new Date('2023-01-28'),
        gender: Gender.MALE,
        addressEn: 'Kathmandu',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        admissionDate: admissionDate2023,
        admissionClass: 1,
        emergencyContact: '9841234567',
        status: StudentStatus.ACTIVE
      });

      // Next number for 2024 should be 1
      const nextNum2024 = await studentIdService.getNextSequentialNumber(2024);
      expect(nextNum2024).toBe(1);

      // Next number for 2023 should be 6
      const nextNum2023 = await studentIdService.getNextSequentialNumber(2023);
      expect(nextNum2023).toBe(6);
    });
  });

  describe('countStudentsByAdmissionYear', () => {
    it('should return 0 when no students exist', async () => {
      const count = await studentIdService.countStudentsByAdmissionYear(2024);
      expect(count).toBe(0);
    });

    it('should count students correctly for a specific year', async () => {
      const admissionDate2024 = new Date('2024-01-15');
      const admissionDate2023 = new Date('2023-01-15');

      // Create 3 students for 2024
      for (let i = 1; i <= 3; i++) {
        await Student.create({
          studentCode: `${env.DEFAULT_SCHOOL_CODE}-2024-${i.toString().padStart(4, '0')}`,
          firstNameEn: `Student${i}`,
          lastNameEn: 'Test',
          dateOfBirthBS: '2080-10-15',
          dateOfBirthAD: new Date('2024-01-28'),
          gender: Gender.MALE,
          addressEn: 'Kathmandu',
          fatherName: 'Father Name',
          fatherPhone: '9841234567',
          motherName: 'Mother Name',
          motherPhone: '9841234568',
          admissionDate: admissionDate2024,
          admissionClass: 1,
          emergencyContact: '9841234567',
          status: StudentStatus.ACTIVE
        });
      }

      // Create 2 students for 2023
      for (let i = 1; i <= 2; i++) {
        await Student.create({
          studentCode: `${env.DEFAULT_SCHOOL_CODE}-2023-${i.toString().padStart(4, '0')}`,
          firstNameEn: `Student${i}`,
          lastNameEn: 'Test',
          dateOfBirthBS: '2079-10-15',
          dateOfBirthAD: new Date('2023-01-28'),
          gender: Gender.MALE,
          addressEn: 'Kathmandu',
          fatherName: 'Father Name',
          fatherPhone: '9841234567',
          motherName: 'Mother Name',
          motherPhone: '9841234568',
          admissionDate: admissionDate2023,
          admissionClass: 1,
          emergencyContact: '9841234567',
          status: StudentStatus.ACTIVE
        });
      }

      const count2024 = await studentIdService.countStudentsByAdmissionYear(2024);
      const count2023 = await studentIdService.countStudentsByAdmissionYear(2023);

      expect(count2024).toBe(3);
      expect(count2023).toBe(2);
    });
  });
});

