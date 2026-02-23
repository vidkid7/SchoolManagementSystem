import promotionService from '../promotion.service';
import Student, { StudentStatus, Gender } from '@models/Student.model';
import AcademicHistory, { CompletionStatus } from '@models/AcademicHistory.model';
import sequelize from '@config/database';
import fc from 'fast-check';

/**
 * Promotion Service Tests
 * Tests for student promotion functionality
 * Requirements: 2.10
 */

/**
 * Helper function to create test student data with correct types
 */
const createTestStudentData = (overrides: Partial<any> = {}) => ({
  studentCode: `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  firstNameEn: 'Test',
  lastNameEn: 'Student',
  firstNameNp: 'टेस्ट',
  lastNameNp: 'विद्यार्थी',
  dateOfBirthBS: '2067-01-01',
  dateOfBirthAD: new Date('2010-04-14'),
  gender: Gender.MALE,
  addressEn: 'Test Address',
  addressNp: 'परीक्षण ठेगाना',
  fatherName: 'Test Father',
  fatherPhone: '9800000000',
  motherName: 'Test Mother',
  motherPhone: '9800000001',
  emergencyContact: '9800000000',
  admissionDate: new Date('2024-01-01'),
  admissionClass: 1,
  currentClassId: 1,
  rollNumber: 1,
  status: StudentStatus.ACTIVE,
  ...overrides
});

describe('PromotionService', () => {
  beforeAll(async () => {
    // Sync database schema (create tables if they don't exist)
    try {
      // Disable foreign key checks before syncing
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Use force: true to drop and recreate tables for clean test environment
      await sequelize.sync({ force: true, logging: false });
    } catch (error) {
      throw error;
    }
  });

  afterAll(async () => {
    // Re-enable foreign key checks
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      // Ignore errors during cleanup
    }
    await sequelize.close();
  });

  describe('promoteStudent', () => {
    it('should promote an eligible student to next grade', async () => {
      // Create a test student
      const student = await Student.create(createTestStudentData({
        studentCode: 'TEST-2024-001'
      }));

      const result = await promotionService.promoteStudent(
        student.studentId,
        1, // academicYearId
        2, // nextClassId
        {
          currentClassId: 1,
          currentGradeLevel: 1,
          rollNumber: 1,
          attendancePercentage: 85,
          gpa: 3.5,
          totalMarks: 450,
          rank: 5,
          hasFailingGrades: false
        },
        {
          minAttendancePercentage: 75,
          minGpa: 1.6,
          requirePassingGrades: true
        },
        1 // userId
      );

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.fromGrade).toBe(1);
      expect(result.toGrade).toBe(2);
      expect(result.historyId).toBeDefined();

      // Verify student was updated
      const updatedStudent = await Student.findByPk(student.studentId);
      expect(updatedStudent?.currentClassId).toBe(2);

      // Verify academic history was created
      expect(result.historyId).toBeDefined();
      const history = await AcademicHistory.findByPk(result.historyId as number);
      expect(history).toBeDefined();
      expect(history?.completionStatus).toBe(CompletionStatus.PROMOTED);
      expect(history?.promotionEligible).toBe(true);
      expect(history?.promotedToClass).toBe(2);

      // Cleanup
      await history?.destroy({ force: true });
      await student.destroy({ force: true });
    });

    it('should not promote student with low attendance', async () => {
      const student = await Student.create(createTestStudentData({
        studentCode: 'TEST-2024-002',
        gender: Gender.FEMALE,
        rollNumber: 2
      }));

      const result = await promotionService.promoteStudent(
        student.studentId,
        1,
        2,
        {
          currentClassId: 1,
          currentGradeLevel: 1,
          rollNumber: 2,
          attendancePercentage: 60, // Below minimum 75%
          gpa: 3.5,
          hasFailingGrades: false
        },
        {
          minAttendancePercentage: 75,
          minGpa: 1.6,
          requirePassingGrades: true
        },
        1
      );

      expect(result.success).toBe(false);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Attendance');

      // Verify student was NOT updated
      const updatedStudent = await Student.findByPk(student.studentId);
      expect(updatedStudent?.currentClassId).toBe(1);

      // Verify academic history was created with failed status
      expect(result.historyId).toBeDefined();
      const history = await AcademicHistory.findByPk(result.historyId as number);
      expect(history).toBeDefined();
      expect(history?.completionStatus).toBe(CompletionStatus.FAILED);
      expect(history?.promotionEligible).toBe(false);

      // Cleanup
      await history?.destroy({ force: true });
      await student.destroy({ force: true });
    });

    it('should not promote student with low GPA', async () => {
      const student = await Student.create(createTestStudentData({
        studentCode: 'TEST-2024-003',
        rollNumber: 3
      }));

      const result = await promotionService.promoteStudent(
        student.studentId,
        1,
        2,
        {
          currentClassId: 1,
          currentGradeLevel: 1,
          rollNumber: 3,
          attendancePercentage: 85,
          gpa: 1.2, // Below minimum 1.6
          hasFailingGrades: false
        },
        {
          minAttendancePercentage: 75,
          minGpa: 1.6,
          requirePassingGrades: true
        },
        1
      );

      expect(result.success).toBe(false);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('GPA');

      // Cleanup
      if (result.historyId) {
        const history = await AcademicHistory.findByPk(result.historyId);
        await history?.destroy({ force: true });
      }
      await student.destroy({ force: true });
    });

    it('should not promote student with failing grades', async () => {
      const student = await Student.create(createTestStudentData({
        studentCode: 'TEST-2024-004',
        gender: Gender.FEMALE,
        rollNumber: 4
      }));

      const result = await promotionService.promoteStudent(
        student.studentId,
        1,
        2,
        {
          currentClassId: 1,
          currentGradeLevel: 1,
          rollNumber: 4,
          attendancePercentage: 85,
          gpa: 3.5,
          hasFailingGrades: true // Has failing grades
        },
        {
          minAttendancePercentage: 75,
          minGpa: 1.6,
          requirePassingGrades: true
        },
        1
      );

      expect(result.success).toBe(false);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('failing grades');

      // Cleanup
      if (result.historyId) {
        const history = await AcademicHistory.findByPk(result.historyId);
        await history?.destroy({ force: true });
      }
      await student.destroy({ force: true });
    });
  });

  describe('promoteClass', () => {
    it('should promote multiple students in bulk', async () => {
      // Create test students
      const students = await Promise.all([
        Student.create(createTestStudentData({
          studentCode: 'TEST-2024-101',
          rollNumber: 10
        })),
        Student.create(createTestStudentData({
          studentCode: 'TEST-2024-102',
          gender: Gender.FEMALE,
          rollNumber: 11
        }))
      ]);

      const studentsData = students.map((student, index) => ({
        studentId: student.studentId,
        currentGradeLevel: 1,
        rollNumber: 10 + index,
        attendancePercentage: 85,
        gpa: 3.5,
        totalMarks: 450,
        rank: index + 1,
        hasFailingGrades: false
      }));

      const result = await promotionService.promoteClass(
        1, // classId
        1, // academicYearId
        2, // nextClassId
        studentsData,
        {
          minAttendancePercentage: 75,
          minGpa: 1.6,
          requirePassingGrades: true
        },
        1 // userId
      );

      expect(result.totalStudents).toBe(2);
      expect(result.promoted).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);

      // Verify all students were promoted
      for (const student of students) {
        const updated = await Student.findByPk(student.studentId);
        expect(updated?.currentClassId).toBe(2);
      }

      // Cleanup
      for (const student of students) {
        const history = await AcademicHistory.findOne({
          where: { studentId: student.studentId, academicYearId: 1 }
        });
        await history?.destroy({ force: true });
        await student.destroy({ force: true });
      }
    });

    it('should handle mixed eligible and ineligible students', async () => {
      // Create test students with different eligibility
      const students = await Promise.all([
        Student.create(createTestStudentData({
          studentCode: 'TEST-2024-201',
          rollNumber: 20
        })),
        Student.create(createTestStudentData({
          studentCode: 'TEST-2024-202',
          gender: Gender.FEMALE,
          rollNumber: 21
        }))
      ]);

      const studentsData = [
        {
          studentId: students[0].studentId,
          currentGradeLevel: 1,
          rollNumber: 20,
          attendancePercentage: 85,
          gpa: 3.5,
          hasFailingGrades: false
        },
        {
          studentId: students[1].studentId,
          currentGradeLevel: 1,
          rollNumber: 21,
          attendancePercentage: 60, // Below minimum
          gpa: 3.5,
          hasFailingGrades: false
        }
      ];

      const result = await promotionService.promoteClass(
        1,
        1,
        2,
        studentsData,
        {
          minAttendancePercentage: 75,
          minGpa: 1.6,
          requirePassingGrades: true
        },
        1
      );

      expect(result.totalStudents).toBe(2);
      expect(result.promoted).toBe(1);
      expect(result.failed).toBe(1);

      // Verify first student was promoted
      const student1 = await Student.findByPk(students[0].studentId);
      expect(student1?.currentClassId).toBe(2);

      // Verify second student was NOT promoted
      const student2 = await Student.findByPk(students[1].studentId);
      expect(student2?.currentClassId).toBe(1);

      // Cleanup
      for (const student of students) {
        const history = await AcademicHistory.findOne({
          where: { studentId: student.studentId, academicYearId: 1 }
        });
        await history?.destroy({ force: true });
        await student.destroy({ force: true });
      }
    });
  });

  describe('getStudentHistory', () => {
    it('should retrieve student academic history', async () => {
      const student = await Student.create(createTestStudentData({
        studentCode: 'TEST-2024-301',
        rollNumber: 30
      }));

      // Create academic history record
      const history = await AcademicHistory.create({
        studentId: student.studentId,
        academicYearId: 1,
        classId: 1,
        gradeLevel: 1,
        rollNumber: 30,
        attendancePercentage: 85,
        gpa: 3.5,
        completionStatus: CompletionStatus.PROMOTED,
        promotionEligible: true,
        promotedToClass: 2
      });

      const historyRecords = await promotionService.getStudentHistory(student.studentId);

      expect(historyRecords).toHaveLength(1);
      expect(historyRecords[0].studentId).toBe(student.studentId);
      expect(historyRecords[0].gradeLevel).toBe(1);
      expect(historyRecords[0].completionStatus).toBe(CompletionStatus.PROMOTED);

      // Cleanup
      await history.destroy({ force: true });
      await student.destroy({ force: true });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Property 13: Student Promotion Grade Increment
     * Validates: Requirements 2.10
     * 
     * For any student promoted at year-end, their current_class should increase by 1,
     * and their academic history should include a record of the previous class with
     * completion status.
     */
    it('Property 13: promoted students have current_class incremented by 1', async () => {
      let testCounter = 0;
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 11 }), // currentGradeLevel (1-11, can't promote from 12)
          fc.integer({ min: 75, max: 100 }), // attendancePercentage
          fc.float({ min: Math.fround(1.6), max: Math.fround(4.0) }), // gpa
          async (currentGradeLevel, attendancePercentage, gpa) => {
            // Generate unique student code for each test run
            testCounter++;
            const uniqueCode = `PBT-${Date.now()}-${testCounter}-${Math.random().toString(36).substring(2, 11)}`;
            
            // Create test student with unique code
            const student = await Student.create(createTestStudentData({
              studentCode: uniqueCode,
              admissionClass: currentGradeLevel,
              currentClassId: currentGradeLevel,
              rollNumber: testCounter
            }));

            // Ensure student was created with a valid ID
            if (!student || !student.studentId) {
              throw new Error('Failed to create student with valid ID');
            }

            try {
              const result = await promotionService.promoteStudent(
                student.studentId,
                1,
                currentGradeLevel + 1,
                {
                  currentClassId: currentGradeLevel,
                  currentGradeLevel,
                  rollNumber: testCounter,
                  attendancePercentage,
                  gpa,
                  hasFailingGrades: false
                },
                {
                  minAttendancePercentage: 75,
                  minGpa: 1.6,
                  requirePassingGrades: true
                },
                1
              );

              // Property: If promotion was successful
              if (result.success && result.eligible) {
                // Then current_class should be incremented by 1
                const updatedStudent = await Student.findByPk(student.studentId);
                expect(updatedStudent?.currentClassId).toBe(currentGradeLevel + 1);

                // And academic history should exist with promoted status
                expect(result.historyId).toBeDefined();
                const history = await AcademicHistory.findByPk(result.historyId as number);
                expect(history).toBeDefined();
                expect(history?.gradeLevel).toBe(currentGradeLevel);
                expect(history?.promotedToClass).toBe(currentGradeLevel + 1);
                expect(history?.completionStatus).toBe(CompletionStatus.PROMOTED);
                expect(history?.promotionEligible).toBe(true);

                // Cleanup
                await history?.destroy({ force: true });
              }

              await student.destroy({ force: true });
            } catch (error) {
              await student.destroy({ force: true });
              throw error;
            }
          }
        ),
        { numRuns: 20 } // Run 20 test cases
      );
    });
  });
});
