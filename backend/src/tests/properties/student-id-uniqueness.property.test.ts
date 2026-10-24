/**
 * Property-Based Test: Student ID Uniqueness
 * 
 * **Property 11: Student ID Uniqueness**
 * **Validates: Requirements 2.2**
 * 
 * For any two students created in the system, their student IDs should be unique,
 * following the format {school_prefix}-{admission_year}-{sequential_number}.
 * 
 * This test validates that:
 * - The student ID generation service produces unique IDs
 * - Concurrent ID generation maintains uniqueness
 * - IDs follow the correct format
 * - Sequential numbering is properly maintained per admission year
 */

import * as fc from 'fast-check';
import { QueryInterface } from 'sequelize';
import sequelize from '@config/database';
import { env } from '@config/env';
import Student from '@models/Student.model';
import studentIdService from '@modules/student/studentId.service';

describe('Property 11: Student ID Uniqueness', () => {
  let queryInterface: QueryInterface;
  const schoolPrefix = env.DEFAULT_SCHOOL_CODE;

  beforeAll(async () => {
    if (sequelize.getDialect() !== 'sqlite') {
      throw new Error('Student ID property tests require TEST_DB_DIALECT=sqlite');
    }
    await sequelize.sync({ force: true });
    queryInterface = sequelize.getQueryInterface();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Student.destroy({ where: {}, force: true });
    await studentIdService.resetSequencesForTesting();
  });

  async function resetGenerationState(): Promise<void> {
    await Student.destroy({ where: {}, force: true });
    await studentIdService.resetSequencesForTesting();
  }

  /**
   * Helper function to generate student ID
   */
  async function generateStudentId(admissionDate: Date): Promise<string> {
    return studentIdService.generateStudentId(admissionDate);
  }

  /**
   * Property: Generated student IDs are always unique
   * For any set of admission dates, all generated student IDs should be unique
   */
  it('should generate unique student IDs for multiple students', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            admissionDate: fc.date({ 
              min: new Date('2020-01-01'), 
              max: new Date('2030-12-31') 
            }),
            firstName: fc.string({ minLength: 2, maxLength: 50 }),
            lastName: fc.string({ minLength: 2, maxLength: 50 })
          }),
          { minLength: 2, maxLength: 20 }
        ),
        async (students) => {
          await resetGenerationState();
          const generatedIds: string[] = [];

          // Generate student IDs sequentially
          for (const student of students) {
            const studentId = await generateStudentId(student.admissionDate);
            generatedIds.push(studentId);

            // Create student record to persist the ID
            await queryInterface.bulkInsert('students', [{
              student_code: studentId,
              first_name_en: student.firstName,
              last_name_en: student.lastName,
              date_of_birth_bs: '2080-01-01',
              date_of_birth_ad: new Date('2023-04-14'),
              gender: 'male',
              address_en: 'Test Address',
              father_name: 'Father Name',
              father_phone: '9841234567',
              mother_name: 'Mother Name',
              mother_phone: '9841234568',
              admission_date: student.admissionDate,
              admission_class: 1,
              emergency_contact: '9841234567',
              status: 'active',
              created_at: new Date(),
              updated_at: new Date()
            }]);
          }

          // Verify all IDs are unique
          const uniqueIds = new Set(generatedIds);
          expect(uniqueIds.size).toBe(generatedIds.length);

          // Verify all IDs follow the correct format
          generatedIds.forEach(id => {
            expect(id).toMatch(/^[A-Z0-9]+-\d{4}-\d{4}$/);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Concurrent ID generation maintains uniqueness
   * For any set of concurrent student ID generation requests, all IDs should be unique
   * Note: This test validates that the ID generation logic produces unique IDs,
   * but in practice, concurrent generation should use database transactions for safety.
   */
  it('should maintain uniqueness under concurrent ID generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          admissionYear: fc.integer({ min: 2020, max: 2030 }),
          concurrentCount: fc.integer({ min: 5, max: 15 })
        }),
        async ({ admissionYear, concurrentCount }) => {
          await resetGenerationState();
          const admissionDate = new Date(`${admissionYear}-01-15`);

          // Exercise actual concurrent calls through the production service.
          const generatedIds = await Promise.all(
            Array.from({ length: concurrentCount }, () => generateStudentId(admissionDate))
          );

          for (const [i, studentId] of generatedIds.entries()) {
            // Persist each ID immediately to simulate transaction commit
            await queryInterface.bulkInsert('students', [{
              student_code: studentId,
              first_name_en: `Student${i}`,
              last_name_en: 'Test',
              date_of_birth_bs: '2080-01-01',
              date_of_birth_ad: new Date('2023-04-14'),
              gender: 'male',
              address_en: 'Test Address',
              father_name: 'Father Name',
              father_phone: '9841234567',
              mother_name: 'Mother Name',
              mother_phone: '9841234568',
              admission_date: admissionDate,
              admission_class: 1,
              emergency_contact: '9841234567',
              status: 'active',
              created_at: new Date(),
              updated_at: new Date()
            }]);
          }

          // Verify all IDs are unique
          const uniqueIds = new Set(generatedIds);
          expect(uniqueIds.size).toBe(concurrentCount);

          // Verify all IDs are for the correct year
          generatedIds.forEach(id => {
            expect(id).toContain(`-${admissionYear}-`);
            expect(id).toMatch(/^[A-Z0-9]+-\d{4}-\d{4}$/);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Sequential numbering is maintained per year
   * For any admission year, student IDs should have sequential numbers without gaps
   */
  it('should maintain sequential numbering per admission year', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          admissionYear: fc.integer({ min: 2020, max: 2030 }),
          studentCount: fc.integer({ min: 3, max: 10 })
        }),
        async ({ admissionYear, studentCount }) => {
          await resetGenerationState();
          const admissionDate = new Date(`${admissionYear}-01-15`);
          const generatedIds: string[] = [];

          // Get the starting sequential number for this year
          const startingNumber = await getNextSequentialNumber(admissionYear);

          // Generate student IDs sequentially
          for (let i = 0; i < studentCount; i++) {
            const studentId = await generateStudentId(admissionDate);
            generatedIds.push(studentId);

            // Create student record to persist the ID
            await queryInterface.bulkInsert('students', [{
              student_code: studentId,
              first_name_en: `Student${i}`,
              last_name_en: 'Test',
              date_of_birth_bs: '2080-01-01',
              date_of_birth_ad: new Date('2023-04-14'),
              gender: 'male',
              address_en: 'Test Address',
              father_name: 'Father Name',
              father_phone: '9841234567',
              mother_name: 'Mother Name',
              mother_phone: '9841234568',
              admission_date: admissionDate,
              admission_class: 1,
              emergency_contact: '9841234567',
              status: 'active',
              created_at: new Date(),
              updated_at: new Date()
            }]);
          }

          // Parse sequential numbers from IDs
          const sequentialNumbers = generatedIds.map(id => {
            const parts = id.split('-');
            return parseInt(parts[2], 10);
          });

          // Verify sequential numbers are consecutive starting from the expected number
          for (let i = 0; i < sequentialNumbers.length; i++) {
            expect(sequentialNumbers[i]).toBe(startingNumber + i);
          }

          // Verify all IDs are unique
          const uniqueIds = new Set(generatedIds);
          expect(uniqueIds.size).toBe(studentCount);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Helper function to get next sequential number for a year
   */
  async function getNextSequentialNumber(admissionYear: number): Promise<number> {
    const results = await sequelize.query(
      "SELECT student_code FROM students WHERE strftime('%Y', admission_date) = ? ORDER BY student_code DESC LIMIT 1",
      { replacements: [admissionYear], type: 'SELECT' }
    );

    const lastStudents = results as any[];

    if (lastStudents.length === 0) {
      return 1;
    }

    const lastStudentCode = lastStudents[0].student_code;
    const parts = lastStudentCode.split('-');
    if (parts.length === 3) {
      const lastSeqNum = parseInt(parts[2], 10);
      if (!isNaN(lastSeqNum)) {
        return lastSeqNum + 1;
      }
    }

    return 1;
  }

  /**
   * Property: Different admission years have independent sequential numbering
   * For any two different admission years, sequential numbering should be independent
   */
  it('should maintain independent sequential numbering per admission year', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          year1: fc.integer({ min: 2020, max: 2025 }),
          year2: fc.integer({ min: 2026, max: 2030 }),
          count1: fc.integer({ min: 2, max: 5 }),
          count2: fc.integer({ min: 2, max: 5 })
        }),
        async ({ year1, year2, count1, count2 }) => {
          await resetGenerationState();
          const admissionDate1 = new Date(`${year1}-01-15`);
          const admissionDate2 = new Date(`${year2}-01-15`);

          const idsYear1: string[] = [];
          const idsYear2: string[] = [];

          // Get starting numbers for both years
          const startYear1 = await getNextSequentialNumber(year1);
          const startYear2 = await getNextSequentialNumber(year2);

          // Generate IDs for year 1
          for (let i = 0; i < count1; i++) {
            const studentId = await generateStudentId(admissionDate1);
            idsYear1.push(studentId);

            await queryInterface.bulkInsert('students', [{
              student_code: studentId,
              first_name_en: `Student${i}`,
              last_name_en: 'Test',
              date_of_birth_bs: '2080-01-01',
              date_of_birth_ad: new Date('2023-04-14'),
              gender: 'male',
              address_en: 'Test Address',
              father_name: 'Father Name',
              father_phone: '9841234567',
              mother_name: 'Mother Name',
              mother_phone: '9841234568',
              admission_date: admissionDate1,
              admission_class: 1,
              emergency_contact: '9841234567',
              status: 'active',
              created_at: new Date(),
              updated_at: new Date()
            }]);
          }

          // Generate IDs for year 2
          for (let i = 0; i < count2; i++) {
            const studentId = await generateStudentId(admissionDate2);
            idsYear2.push(studentId);

            await queryInterface.bulkInsert('students', [{
              student_code: studentId,
              first_name_en: `Student${i}`,
              last_name_en: 'Test',
              date_of_birth_bs: '2080-01-01',
              date_of_birth_ad: new Date('2023-04-14'),
              gender: 'male',
              address_en: 'Test Address',
              father_name: 'Father Name',
              father_phone: '9841234567',
              mother_name: 'Mother Name',
              mother_phone: '9841234568',
              admission_date: admissionDate2,
              admission_class: 1,
              emergency_contact: '9841234567',
              status: 'active',
              created_at: new Date(),
              updated_at: new Date()
            }]);
          }

          // Verify all IDs are unique across both years
          const allIds = [...idsYear1, ...idsYear2];
          const uniqueIds = new Set(allIds);
          expect(uniqueIds.size).toBe(count1 + count2);

          // Verify year 1 IDs have sequential numbering
          const seqYear1 = idsYear1.map(id => parseInt(id.split('-')[2], 10));
          for (let i = 0; i < seqYear1.length; i++) {
            expect(seqYear1[i]).toBe(startYear1 + i);
          }

          // Verify year 2 IDs have sequential numbering
          const seqYear2 = idsYear2.map(id => parseInt(id.split('-')[2], 10));
          for (let i = 0; i < seqYear2.length; i++) {
            expect(seqYear2[i]).toBe(startYear2 + i);
          }

          // Verify all year 1 IDs contain year1
          idsYear1.forEach(id => {
            expect(id).toContain(`-${year1}-`);
          });

          // Verify all year 2 IDs contain year2
          idsYear2.forEach(id => {
            expect(id).toContain(`-${year2}-`);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Student ID format consistency
   * For any generated student ID, it should follow the format {school_prefix}-{year}-{sequential}
   */
  it('should generate IDs with consistent format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        async (admissionDate) => {
          await resetGenerationState();
          const studentId = await generateStudentId(admissionDate);

          // Verify format
          expect(studentId).toMatch(/^[A-Z0-9]+-\d{4}-\d{4}$/);

          // Verify components
          const parts = studentId.split('-');
          expect(parts[0]).toBe(schoolPrefix);
          expect(parseInt(parts[1], 10)).toBe(admissionDate.getFullYear());
          expect(parseInt(parts[2], 10)).toBeGreaterThanOrEqual(1);

          // Verify sequential number is padded to 4 digits
          expect(parts[2]).toHaveLength(4);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: No duplicate IDs in database
   * For any set of students in the database, all student_code values should be unique
   */
  it('should prevent duplicate student IDs in database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            admissionDate: fc.date({ 
              min: new Date('2020-01-01'), 
              max: new Date('2030-12-31') 
            }),
            firstName: fc.string({ minLength: 2, maxLength: 50 }),
            lastName: fc.string({ minLength: 2, maxLength: 50 })
          }),
          { minLength: 3, maxLength: 8 }
        ),
        async (students) => {
          await resetGenerationState();
          // Generate and create students
          for (const student of students) {
            const studentId = await generateStudentId(student.admissionDate);

            await queryInterface.bulkInsert('students', [{
              student_code: studentId,
              first_name_en: student.firstName,
              last_name_en: student.lastName,
              date_of_birth_bs: '2080-01-01',
              date_of_birth_ad: new Date('2023-04-14'),
              gender: 'male',
              address_en: 'Test Address',
              father_name: 'Father Name',
              father_phone: '9841234567',
              mother_name: 'Mother Name',
              mother_phone: '9841234568',
              admission_date: student.admissionDate,
              admission_class: 1,
              emergency_contact: '9841234567',
              status: 'active',
              created_at: new Date(),
              updated_at: new Date()
            }]);
          }

          // Query all students from database
          const allStudents = await sequelize.query(
            'SELECT student_code FROM students',
            { type: 'SELECT' }
          );
          const studentCodes = allStudents.map((s: any) => s.student_code);

          // Verify all student codes are unique
          const uniqueCodes = new Set(studentCodes);
          expect(uniqueCodes.size).toBe(studentCodes.length);
        }
      ),
      { numRuns: 5 }
    );
  }, 20000); // 20 second timeout
});
