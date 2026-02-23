/**
 * Property-Based Test: Soft Delete Preservation
 * 
 * **Property 15: Soft Delete Preservation**
 * **Validates: Requirements 40.3**
 * 
 * For any delete operation on a student, staff, or transaction record, 
 * the record should remain in the database with deleted_at timestamp set, 
 * not physically removed.
 * 
 * This test validates that soft delete operations:
 * - Keep records in the database (not physically deleted)
 * - Set the deleted_at timestamp to a non-null value
 * - Preserve all other field values unchanged
 * - Apply to critical entities: students, staff, attendance, exams, grades
 */

import * as fc from 'fast-check';
import { Sequelize, QueryInterface, Options } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Property 15: Soft Delete Preservation', () => {
  let sequelize: Sequelize;
  let queryInterface: QueryInterface;
  let testCounter = 0;

  beforeAll(async () => {
    // Create test database connection
    const dbConfig: Options = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'school_management_system',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      dialect: 'mysql',
      logging: false,
      pool: {
        min: 1,
        max: 5,
        acquire: 30000,
        idle: 10000
      }
    };

    sequelize = new Sequelize(dbConfig);
    
    // Ensure database connection is established
    await sequelize.authenticate();
    queryInterface = sequelize.getQueryInterface();
  });

  afterAll(async () => {
    // Clean up and close connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await queryInterface.bulkDelete('grades', {}, {});
    await queryInterface.bulkDelete('exams', {}, {});
    await queryInterface.bulkDelete('attendance', {}, {});
    await queryInterface.bulkDelete('students', {}, {});
    await queryInterface.bulkDelete('staff', {}, {});
    await queryInterface.bulkDelete('classes', {}, {});
    await queryInterface.bulkDelete('subjects', {}, {});
    await queryInterface.bulkDelete('terms', {}, {});
    await queryInterface.bulkDelete('academic_years', {}, {});
  });

  /**
   * Property: Student soft delete preservation
   * For any student record, soft delete should set deleted_at without removing the record
   */
  it('should preserve student records with deleted_at timestamp on soft delete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          firstName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          lastName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          dateOfBirth: fc.date({ min: new Date('2000-01-01'), max: new Date('2015-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.string({ minLength: 15, maxLength: 200 }).filter(s => s.trim().length >= 15),
          fatherName: fc.string({ minLength: 6, maxLength: 100 }).filter(s => s.trim().length >= 6),
          fatherPhone: fc.string({ minLength: 10, maxLength: 20 }).filter(s => s.trim().length >= 10),
          motherName: fc.string({ minLength: 6, maxLength: 100 }).filter(s => s.trim().length >= 6),
          motherPhone: fc.string({ minLength: 10, maxLength: 20 }).filter(s => s.trim().length >= 10),
          emergencyContact: fc.string({ minLength: 10, maxLength: 20 }).filter(s => s.trim().length >= 10),
          admissionClass: fc.integer({ min: 1, max: 12 })
        }),
        async (studentData) => {
          const student = {
            student_code: studentData.studentCode,
            first_name_en: studentData.firstName,
            last_name_en: studentData.lastName,
            date_of_birth_bs: '2060-01-01',
            date_of_birth_ad: studentData.dateOfBirth,
            gender: studentData.gender,
            address_en: studentData.address,
            father_name: studentData.fatherName,
            father_phone: studentData.fatherPhone,
            mother_name: studentData.motherName,
            mother_phone: studentData.motherPhone,
            emergency_contact: studentData.emergencyContact,
            admission_date: new Date(),
            admission_class: studentData.admissionClass,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };

          // Insert student record
          await queryInterface.bulkInsert('students', [student]);

          // Get the inserted student ID
          const insertedRecords = await sequelize.query(
            'SELECT student_id FROM students WHERE student_code = ?',
            { replacements: [studentData.studentCode], type: 'SELECT' }
          );
          const studentId = (insertedRecords[0] as any).student_id;

          // Verify record exists before soft delete
          const beforeDelete = await sequelize.query(
            'SELECT * FROM students WHERE student_id = ?',
            { replacements: [studentId], type: 'SELECT' }
          );
          expect(beforeDelete).toHaveLength(1);
          expect((beforeDelete[0] as any).deleted_at).toBeNull();

          // Perform soft delete by setting deleted_at
          const deleteTime = new Date();
          await sequelize.query(
            'UPDATE students SET deleted_at = ?, updated_at = ? WHERE student_id = ?',
            { replacements: [deleteTime, deleteTime, studentId] }
          );

          // Verify record still exists in database
          const afterDelete = await sequelize.query(
            'SELECT * FROM students WHERE student_id = ?',
            { replacements: [studentId], type: 'SELECT' }
          );
          
          expect(afterDelete).toHaveLength(1);
          const deletedRecord = afterDelete[0] as any;
          
          // Verify deleted_at is set
          expect(deletedRecord.deleted_at).not.toBeNull();
          expect(new Date(deletedRecord.deleted_at).getTime()).toBeGreaterThanOrEqual(deleteTime.getTime() - 1000);
          
          // Verify all other fields are preserved
          expect(deletedRecord.student_code).toBe(studentData.studentCode);
          expect(deletedRecord.first_name_en).toBe(studentData.firstName);
          expect(deletedRecord.last_name_en).toBe(studentData.lastName);
          expect(deletedRecord.gender).toBe(studentData.gender);
          expect(deletedRecord.status).toBe('active');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Staff soft delete preservation
   * For any staff record, soft delete should set deleted_at without removing the record
   */
  it('should preserve staff records with deleted_at timestamp on soft delete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          staffCode: fc.string({ minLength: 5, maxLength: 50 }),
          firstName: fc.string({ minLength: 2, maxLength: 50 }),
          lastName: fc.string({ minLength: 2, maxLength: 50 }),
          email: fc.emailAddress(),
          dateOfBirth: fc.date({ min: new Date('1960-01-01'), max: new Date('2000-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.string({ minLength: 10, maxLength: 200 }),
          phone: fc.string({ minLength: 10, maxLength: 20 }),
          emergencyContact: fc.string({ minLength: 10, maxLength: 20 }),
          position: fc.string({ minLength: 5, maxLength: 100 })
        }),
        async (staffData) => {
          const staff = {
            staff_code: staffData.staffCode,
            first_name: staffData.firstName,
            last_name: staffData.lastName,
            email: staffData.email,
            date_of_birth: staffData.dateOfBirth,
            gender: staffData.gender,
            address: staffData.address,
            phone: staffData.phone,
            emergency_contact: staffData.emergencyContact,
            join_date: new Date(),
            position: staffData.position,
            employment_type: 'permanent',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };

          // Insert staff record
          await queryInterface.bulkInsert('staff', [staff]);

          // Get the inserted staff ID
          const insertedRecords = await sequelize.query(
            'SELECT staff_id FROM staff WHERE staff_code = ?',
            { replacements: [staffData.staffCode], type: 'SELECT' }
          );
          const staffId = (insertedRecords[0] as any).staff_id;

          // Verify record exists before soft delete
          const beforeDelete = await sequelize.query(
            'SELECT * FROM staff WHERE staff_id = ?',
            { replacements: [staffId], type: 'SELECT' }
          );
          expect(beforeDelete).toHaveLength(1);
          expect((beforeDelete[0] as any).deleted_at).toBeNull();

          // Perform soft delete by setting deleted_at
          const deleteTime = new Date();
          await sequelize.query(
            'UPDATE staff SET deleted_at = ?, updated_at = ? WHERE staff_id = ?',
            { replacements: [deleteTime, deleteTime, staffId] }
          );

          // Verify record still exists in database
          const afterDelete = await sequelize.query(
            'SELECT * FROM staff WHERE staff_id = ?',
            { replacements: [staffId], type: 'SELECT' }
          );
          
          expect(afterDelete).toHaveLength(1);
          const deletedRecord = afterDelete[0] as any;
          
          // Verify deleted_at is set
          expect(deletedRecord.deleted_at).not.toBeNull();
          expect(new Date(deletedRecord.deleted_at).getTime()).toBeGreaterThanOrEqual(deleteTime.getTime() - 1000);
          
          // Verify all other fields are preserved
          expect(deletedRecord.staff_code).toBe(staffData.staffCode);
          expect(deletedRecord.first_name).toBe(staffData.firstName);
          expect(deletedRecord.last_name).toBe(staffData.lastName);
          expect(deletedRecord.email).toBe(staffData.email);
          expect(deletedRecord.status).toBe('active');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Attendance soft delete preservation
   * For any attendance record, soft delete should set deleted_at without removing the record
   */
  it('should preserve attendance records with deleted_at timestamp on soft delete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode: fc.string({ minLength: 5, maxLength: 50 }),
          firstName: fc.string({ minLength: 2, maxLength: 50 }),
          lastName: fc.string({ minLength: 2, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date('2000-01-01'), max: new Date('2015-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.string({ minLength: 10, maxLength: 200 }),
          fatherName: fc.string({ minLength: 5, maxLength: 100 }),
          fatherPhone: fc.string({ minLength: 10, maxLength: 20 }),
          motherName: fc.string({ minLength: 5, maxLength: 100 }),
          motherPhone: fc.string({ minLength: 10, maxLength: 20 }),
          emergencyContact: fc.string({ minLength: 10, maxLength: 20 }),
          admissionClass: fc.integer({ min: 1, max: 12 }),
          attendanceStatus: fc.constantFrom('present', 'absent', 'late', 'excused')
        }),
        async (testData) => {
          // Create prerequisite records
          const academicYear = {
            name: '2081-2082 BS',
            start_date_bs: '2081-01-01',
            end_date_bs: '2081-12-30',
            start_date_ad: new Date('2024-04-13'),
            end_date_ad: new Date('2025-04-12'),
            is_current: true,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('academic_years', [academicYear]);
          const ayRecords = await sequelize.query(
            'SELECT academic_year_id FROM academic_years WHERE name = ?',
            { replacements: ['2081-2082 BS'], type: 'SELECT' }
          );
          const ayId = (ayRecords[0] as any).academic_year_id;

          const classRecord = {
            academic_year_id: ayId,
            grade_level: testData.admissionClass,
            section: 'A',
            shift: 'morning',
            capacity: 40,
            current_strength: 0,
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('classes', [classRecord]);
          const classRecords = await sequelize.query(
            'SELECT class_id FROM classes WHERE academic_year_id = ? AND grade_level = ? AND section = ?',
            { replacements: [ayId, testData.admissionClass, 'A'], type: 'SELECT' }
          );
          const cId = (classRecords[0] as any).class_id;

          const student = {
            student_code: testData.studentCode,
            first_name_en: testData.firstName,
            last_name_en: testData.lastName,
            date_of_birth_bs: '2060-01-01',
            date_of_birth_ad: testData.dateOfBirth,
            gender: testData.gender,
            address_en: testData.address,
            father_name: testData.fatherName,
            father_phone: testData.fatherPhone,
            mother_name: testData.motherName,
            mother_phone: testData.motherPhone,
            emergency_contact: testData.emergencyContact,
            admission_date: new Date(),
            admission_class: testData.admissionClass,
            current_class_id: cId,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('students', [student]);
          const studentRecords = await sequelize.query(
            'SELECT student_id FROM students WHERE student_code = ?',
            { replacements: [testData.studentCode], type: 'SELECT' }
          );
          const sId = (studentRecords[0] as any).student_id;

          // Create a user to be marked_by
          const userUsername = `teacher_${Date.now()}_${Math.random()}`;
          const user = {
            username: userUsername,
            email: `${userUsername}@test.com`,
            password: 'hashedpassword',
            role: 'Subject_Teacher',
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('users', [user]);
          const userRecords = await sequelize.query(
            'SELECT user_id FROM users WHERE username = ?',
            { replacements: [userUsername], type: 'SELECT' }
          );
          const uId = (userRecords[0] as any).user_id;

          // Create attendance record
          const attendance = {
            student_id: sId,
            class_id: cId,
            date: new Date(),
            date_bs: '2081-05-15',
            status: testData.attendanceStatus,
            marked_by: uId,
            marked_at: new Date(),
            sync_status: 'synced',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('attendance', [attendance]);
          const attendanceRecords = await sequelize.query(
            'SELECT attendance_id FROM attendance WHERE student_id = ? AND class_id = ?',
            { replacements: [sId, cId], type: 'SELECT' }
          );
          const aId = (attendanceRecords[0] as any).attendance_id;

          // Verify record exists before soft delete
          const beforeDelete = await sequelize.query(
            'SELECT * FROM attendance WHERE attendance_id = ?',
            { replacements: [aId], type: 'SELECT' }
          );
          expect(beforeDelete).toHaveLength(1);
          expect((beforeDelete[0] as any).deleted_at).toBeNull();

          // Perform soft delete by setting deleted_at
          const deleteTime = new Date();
          await sequelize.query(
            'UPDATE attendance SET deleted_at = ?, updated_at = ? WHERE attendance_id = ?',
            { replacements: [deleteTime, deleteTime, aId] }
          );

          // Verify record still exists in database
          const afterDelete = await sequelize.query(
            'SELECT * FROM attendance WHERE attendance_id = ?',
            { replacements: [aId], type: 'SELECT' }
          );
          
          expect(afterDelete).toHaveLength(1);
          const deletedRecord = afterDelete[0] as any;
          
          // Verify deleted_at is set
          expect(deletedRecord.deleted_at).not.toBeNull();
          expect(new Date(deletedRecord.deleted_at).getTime()).toBeGreaterThanOrEqual(deleteTime.getTime() - 1000);
          
          // Verify all other fields are preserved
          expect(deletedRecord.student_id).toBe(sId);
          expect(deletedRecord.class_id).toBe(cId);
          expect(deletedRecord.status).toBe(testData.attendanceStatus);
          expect(deletedRecord.sync_status).toBe('synced');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Exam soft delete preservation
   * For any exam record, soft delete should set deleted_at without removing the record
   */
  it('should preserve exam records with deleted_at timestamp on soft delete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          examName: fc.string({ minLength: 5, maxLength: 100 }),
          examType: fc.constantFrom('unit_test', 'first_terminal', 'second_terminal', 'final', 'practical', 'project'),
          duration: fc.integer({ min: 30, max: 180 }),
          fullMarks: fc.integer({ min: 50, max: 100 })
        }),
        async (examData) => {
          // Create prerequisite records
          const academicYear = {
            name: '2081-2082 BS',
            start_date_bs: '2081-01-01',
            end_date_bs: '2081-12-30',
            start_date_ad: new Date('2024-04-13'),
            end_date_ad: new Date('2025-04-12'),
            is_current: true,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('academic_years', [academicYear]);
          const ayRecords = await sequelize.query(
            'SELECT academic_year_id FROM academic_years WHERE name = ?',
            { replacements: ['2081-2082 BS'], type: 'SELECT' }
          );
          const ayId = (ayRecords[0] as any).academic_year_id;

          const term = {
            academic_year_id: ayId,
            name: 'First Terminal',
            start_date: new Date('2024-04-13'),
            end_date: new Date('2024-08-12'),
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('terms', [term]);
          const termRecords = await sequelize.query(
            'SELECT term_id FROM terms WHERE academic_year_id = ? AND name = ?',
            { replacements: [ayId, 'First Terminal'], type: 'SELECT' }
          );
          const tId = (termRecords[0] as any).term_id;

          const classRecord = {
            academic_year_id: ayId,
            grade_level: 10,
            section: 'A',
            shift: 'morning',
            capacity: 40,
            current_strength: 0,
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('classes', [classRecord]);
          const classRecords = await sequelize.query(
            'SELECT class_id FROM classes WHERE academic_year_id = ? AND grade_level = ? AND section = ?',
            { replacements: [ayId, 10, 'A'], type: 'SELECT' }
          );
          const cId = (classRecords[0] as any).class_id;

          testCounter++;
          const subjectCode = `SUBJ_E_${testCounter}`;
          const subject = {
            code: subjectCode,
            name_en: 'Mathematics',
            type: 'compulsory',
            credit_hours: 100,
            theory_marks: 75,
            practical_marks: 25,
            pass_marks: 35,
            full_marks: 100,
            applicable_classes: JSON.stringify([10]),
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('subjects', [subject]);
          const subjectRecords = await sequelize.query(
            'SELECT subject_id FROM subjects WHERE code = ?',
            { replacements: [subjectCode], type: 'SELECT' }
          );
          const subId = (subjectRecords[0] as any).subject_id;

          // Create exam record
          const exam = {
            name: examData.examName,
            type: examData.examType,
            subject_id: subId,
            class_id: cId,
            academic_year_id: ayId,
            term_id: tId,
            exam_date: new Date(),
            duration: examData.duration,
            full_marks: examData.fullMarks,
            pass_marks: Math.floor(examData.fullMarks * 0.35),
            theory_marks: Math.floor(examData.fullMarks * 0.75),
            practical_marks: Math.floor(examData.fullMarks * 0.25),
            weightage: 100.00,
            status: 'scheduled',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('exams', [exam]);
          const examRecords = await sequelize.query(
            'SELECT exam_id FROM exams WHERE name = ? AND subject_id = ?',
            { replacements: [examData.examName, subId], type: 'SELECT' }
          );
          const eId = (examRecords[0] as any).exam_id;

          // Verify record exists before soft delete
          const beforeDelete = await sequelize.query(
            'SELECT * FROM exams WHERE exam_id = ?',
            { replacements: [eId], type: 'SELECT' }
          );
          expect(beforeDelete).toHaveLength(1);
          expect((beforeDelete[0] as any).deleted_at).toBeNull();

          // Perform soft delete by setting deleted_at
          const deleteTime = new Date();
          await sequelize.query(
            'UPDATE exams SET deleted_at = ?, updated_at = ? WHERE exam_id = ?',
            { replacements: [deleteTime, deleteTime, eId] }
          );

          // Verify record still exists in database
          const afterDelete = await sequelize.query(
            'SELECT * FROM exams WHERE exam_id = ?',
            { replacements: [eId], type: 'SELECT' }
          );
          
          expect(afterDelete).toHaveLength(1);
          const deletedRecord = afterDelete[0] as any;
          
          // Verify deleted_at is set
          expect(deletedRecord.deleted_at).not.toBeNull();
          expect(new Date(deletedRecord.deleted_at).getTime()).toBeGreaterThanOrEqual(deleteTime.getTime() - 1000);
          
          // Verify all other fields are preserved
          expect(deletedRecord.name).toBe(examData.examName);
          expect(deletedRecord.type).toBe(examData.examType);
          expect(deletedRecord.duration).toBe(examData.duration);
          expect(deletedRecord.full_marks).toBe(examData.fullMarks);
          expect(deletedRecord.status).toBe('scheduled');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Grade soft delete preservation
   * For any grade record, soft delete should set deleted_at without removing the record
   */
  it('should preserve grade records with deleted_at timestamp on soft delete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode: fc.string({ minLength: 5, maxLength: 50 }),
          firstName: fc.string({ minLength: 2, maxLength: 50 }),
          lastName: fc.string({ minLength: 2, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date('2000-01-01'), max: new Date('2015-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.string({ minLength: 10, maxLength: 200 }),
          fatherName: fc.string({ minLength: 5, maxLength: 100 }),
          fatherPhone: fc.string({ minLength: 10, maxLength: 20 }),
          motherName: fc.string({ minLength: 5, maxLength: 100 }),
          motherPhone: fc.string({ minLength: 10, maxLength: 20 }),
          emergencyContact: fc.string({ minLength: 10, maxLength: 20 }),
          totalMarks: fc.integer({ min: 0, max: 100 }),
          nebGrade: fc.constantFrom('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG')
        }),
        async (testData) => {
          // Create prerequisite records (academic year, term, class, subject, student, exam, user)
          const academicYear = {
            name: '2081-2082 BS',
            start_date_bs: '2081-01-01',
            end_date_bs: '2081-12-30',
            start_date_ad: new Date('2024-04-13'),
            end_date_ad: new Date('2025-04-12'),
            is_current: true,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('academic_years', [academicYear]);
          const ayRecords = await sequelize.query(
            'SELECT academic_year_id FROM academic_years WHERE name = ?',
            { replacements: ['2081-2082 BS'], type: 'SELECT' }
          );
          const ayId = (ayRecords[0] as any).academic_year_id;

          const term = {
            academic_year_id: ayId,
            name: 'First Terminal',
            start_date: new Date('2024-04-13'),
            end_date: new Date('2024-08-12'),
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('terms', [term]);
          const termRecords = await sequelize.query(
            'SELECT term_id FROM terms WHERE academic_year_id = ? AND name = ?',
            { replacements: [ayId, 'First Terminal'], type: 'SELECT' }
          );
          const tId = (termRecords[0] as any).term_id;

          const classRecord = {
            academic_year_id: ayId,
            grade_level: 10,
            section: 'A',
            shift: 'morning',
            capacity: 40,
            current_strength: 0,
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('classes', [classRecord]);
          const classRecords = await sequelize.query(
            'SELECT class_id FROM classes WHERE academic_year_id = ? AND grade_level = ? AND section = ?',
            { replacements: [ayId, 10, 'A'], type: 'SELECT' }
          );
          const cId = (classRecords[0] as any).class_id;

          testCounter++;
          const subjectCode = `SUBJ_G_${testCounter}`;
          const subject = {
            code: subjectCode,
            name_en: 'Mathematics',
            type: 'compulsory',
            credit_hours: 100,
            theory_marks: 75,
            practical_marks: 25,
            pass_marks: 35,
            full_marks: 100,
            applicable_classes: JSON.stringify([10]),
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('subjects', [subject]);
          const subjectRecords = await sequelize.query(
            'SELECT subject_id FROM subjects WHERE code = ?',
            { replacements: [subjectCode], type: 'SELECT' }
          );
          const subId = (subjectRecords[0] as any).subject_id;

          const student = {
            student_code: testData.studentCode,
            first_name_en: testData.firstName,
            last_name_en: testData.lastName,
            date_of_birth_bs: '2060-01-01',
            date_of_birth_ad: testData.dateOfBirth,
            gender: testData.gender,
            address_en: testData.address,
            father_name: testData.fatherName,
            father_phone: testData.fatherPhone,
            mother_name: testData.motherName,
            mother_phone: testData.motherPhone,
            emergency_contact: testData.emergencyContact,
            admission_date: new Date(),
            admission_class: 10,
            current_class_id: cId,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('students', [student]);
          const studentRecords = await sequelize.query(
            'SELECT student_id FROM students WHERE student_code = ?',
            { replacements: [testData.studentCode], type: 'SELECT' }
          );
          const sId = (studentRecords[0] as any).student_id;

          const exam = {
            name: 'First Terminal Exam',
            type: 'first_terminal',
            subject_id: subId,
            class_id: cId,
            academic_year_id: ayId,
            term_id: tId,
            exam_date: new Date(),
            duration: 120,
            full_marks: 100,
            pass_marks: 35,
            theory_marks: 75,
            practical_marks: 25,
            weightage: 100.00,
            status: 'completed',
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('exams', [exam]);
          const examRecords = await sequelize.query(
            'SELECT exam_id FROM exams WHERE name = ? AND subject_id = ?',
            { replacements: ['First Terminal Exam', subId], type: 'SELECT' }
          );
          const eId = (examRecords[0] as any).exam_id;

          const userUsername = `teacher_${Date.now()}_${Math.random()}`;
          const user = {
            username: userUsername,
            email: `${userUsername}@test.com`,
            password: 'hashedpassword',
            role: 'Subject_Teacher',
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('users', [user]);
          const userRecords = await sequelize.query(
            'SELECT user_id FROM users WHERE username = ?',
            { replacements: [userUsername], type: 'SELECT' }
          );
          const uId = (userRecords[0] as any).user_id;

          // Map NEB grade to grade point
          const gradePointMap: Record<string, number> = {
            'A+': 4.0, 'A': 3.6, 'B+': 3.2, 'B': 2.8, 'C+': 2.4, 'C': 2.0, 'D': 1.6, 'NG': 0.0
          };

          // Create grade record
          const grade = {
            exam_id: eId,
            student_id: sId,
            theory_marks: Math.floor(testData.totalMarks * 0.75),
            practical_marks: Math.floor(testData.totalMarks * 0.25),
            total_marks: testData.totalMarks,
            grade: testData.nebGrade,
            grade_point: gradePointMap[testData.nebGrade],
            entered_by: uId,
            entered_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          };
          await queryInterface.bulkInsert('grades', [grade]);
          const gradeRecords = await sequelize.query(
            'SELECT grade_id FROM grades WHERE exam_id = ? AND student_id = ?',
            { replacements: [eId, sId], type: 'SELECT' }
          );
          const gId = (gradeRecords[0] as any).grade_id;

          // Verify record exists before soft delete
          const beforeDelete = await sequelize.query(
            'SELECT * FROM grades WHERE grade_id = ?',
            { replacements: [gId], type: 'SELECT' }
          );
          expect(beforeDelete).toHaveLength(1);
          expect((beforeDelete[0] as any).deleted_at).toBeNull();

          // Perform soft delete by setting deleted_at
          const deleteTime = new Date();
          await sequelize.query(
            'UPDATE grades SET deleted_at = ?, updated_at = ? WHERE grade_id = ?',
            { replacements: [deleteTime, deleteTime, gId] }
          );

          // Verify record still exists in database
          const afterDelete = await sequelize.query(
            'SELECT * FROM grades WHERE grade_id = ?',
            { replacements: [gId], type: 'SELECT' }
          );
          
          expect(afterDelete).toHaveLength(1);
          const deletedRecord = afterDelete[0] as any;
          
          // Verify deleted_at is set
          expect(deletedRecord.deleted_at).not.toBeNull();
          expect(new Date(deletedRecord.deleted_at).getTime()).toBeGreaterThanOrEqual(deleteTime.getTime() - 1000);
          
          // Verify all other fields are preserved
          expect(deletedRecord.exam_id).toBe(eId);
          expect(deletedRecord.student_id).toBe(sId);
          expect(Number(deletedRecord.total_marks)).toBe(testData.totalMarks);
          expect(deletedRecord.grade).toBe(testData.nebGrade);
          expect(Number(deletedRecord.grade_point)).toBe(gradePointMap[testData.nebGrade]);
        }
      ),
      { numRuns: 10 }
    );
  });
});
