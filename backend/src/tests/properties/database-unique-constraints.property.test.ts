/**
 * Property-Based Test: Database Unique Constraints
 * 
 * **Property 14: Database Unique Constraints**
 * **Validates: Requirements 40.1**
 * 
 * For any attempt to insert a student with a student_id, email, or symbol_number 
 * that already exists in the database, the operation should be rejected with a 
 * unique constraint violation error.
 * 
 * This test validates that the database properly enforces unique constraints on:
 * - students.student_code (unique student ID)
 * - students.symbol_number (SEE exam registration)
 * - students.neb_registration_number (Class 11-12 registration)
 * - staff.staff_code (unique staff ID)
 * - staff.email (staff email)
 * - users.username (user login)
 * - users.email (user email)
 */

import * as fc from 'fast-check';
import { Sequelize, QueryInterface, Options } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Property 14: Database Unique Constraints', () => {
  let sequelize: Sequelize;
  let queryInterface: QueryInterface;

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
    await queryInterface.bulkDelete('students', {}, {});
    await queryInterface.bulkDelete('staff', {}, {});
    await queryInterface.bulkDelete('users', {}, {});
  });

  /**
   * Property: Student code uniqueness
   * For any two students with the same student_code, the second insertion should fail
   */
  it('should reject duplicate student_code insertions', async () => {
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
          admissionClass: fc.integer({ min: 1, max: 12 })
        }),
        async (studentData) => {
          const baseStudent = {
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

          // First insertion should succeed
          await queryInterface.bulkInsert('students', [baseStudent]);

          // Second insertion with same student_code should fail
          const duplicateStudent = {
            ...baseStudent,
            first_name_en: 'Different' + studentData.firstName,
            last_name_en: 'Different' + studentData.lastName
          };

          await expect(
            queryInterface.bulkInsert('students', [duplicateStudent])
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Symbol number uniqueness
   * For any two students with the same symbol_number, the second insertion should fail
   */
  it('should reject duplicate symbol_number insertions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode1: fc.string({ minLength: 5, maxLength: 50 }),
          studentCode2: fc.string({ minLength: 5, maxLength: 50 }),
          symbolNumber: fc.string({ minLength: 5, maxLength: 50 }),
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
          admissionClass: fc.integer({ min: 1, max: 12 })
        }).filter(data => data.studentCode1 !== data.studentCode2),
        async (studentData) => {
          const student1 = {
            student_code: studentData.studentCode1,
            symbol_number: studentData.symbolNumber,
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

          // First insertion should succeed
          await queryInterface.bulkInsert('students', [student1]);

          // Second insertion with same symbol_number but different student_code should fail
          const student2 = {
            ...student1,
            student_code: studentData.studentCode2,
            first_name_en: 'Different' + studentData.firstName
          };

          await expect(
            queryInterface.bulkInsert('students', [student2])
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: NEB registration number uniqueness
   * For any two students with the same neb_registration_number, the second insertion should fail
   */
  it('should reject duplicate neb_registration_number insertions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode1: fc.string({ minLength: 5, maxLength: 50 }),
          studentCode2: fc.string({ minLength: 5, maxLength: 50 }),
          nebRegNumber: fc.string({ minLength: 5, maxLength: 50 }),
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
          admissionClass: fc.integer({ min: 1, max: 12 })
        }).filter(data => data.studentCode1 !== data.studentCode2),
        async (studentData) => {
          const student1 = {
            student_code: studentData.studentCode1,
            neb_registration_number: studentData.nebRegNumber,
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

          // First insertion should succeed
          await queryInterface.bulkInsert('students', [student1]);

          // Second insertion with same neb_registration_number but different student_code should fail
          const student2 = {
            ...student1,
            student_code: studentData.studentCode2,
            first_name_en: 'Different' + studentData.firstName
          };

          await expect(
            queryInterface.bulkInsert('students', [student2])
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Staff code uniqueness
   * For any two staff members with the same staff_code, the second insertion should fail
   */
  it('should reject duplicate staff_code insertions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          staffCode: fc.string({ minLength: 5, maxLength: 50 }),
          firstName: fc.string({ minLength: 2, maxLength: 50 }),
          lastName: fc.string({ minLength: 2, maxLength: 50 }),
          email1: fc.emailAddress(),
          email2: fc.emailAddress(),
          dateOfBirth: fc.date({ min: new Date('1960-01-01'), max: new Date('2000-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.string({ minLength: 10, maxLength: 200 }),
          phone: fc.string({ minLength: 10, maxLength: 20 }),
          emergencyContact: fc.string({ minLength: 10, maxLength: 20 }),
          position: fc.string({ minLength: 5, maxLength: 100 })
        }).filter(data => data.email1 !== data.email2),
        async (staffData) => {
          const staff1 = {
            staff_code: staffData.staffCode,
            first_name: staffData.firstName,
            last_name: staffData.lastName,
            email: staffData.email1,
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

          // First insertion should succeed
          await queryInterface.bulkInsert('staff', [staff1]);

          // Second insertion with same staff_code should fail
          const staff2 = {
            ...staff1,
            email: staffData.email2,
            first_name: 'Different' + staffData.firstName
          };

          await expect(
            queryInterface.bulkInsert('staff', [staff2])
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Staff email uniqueness
   * For any two staff members with the same email, the second insertion should fail
   */
  it('should reject duplicate staff email insertions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          staffCode1: fc.string({ minLength: 5, maxLength: 50 }),
          staffCode2: fc.string({ minLength: 5, maxLength: 50 }),
          email: fc.emailAddress(),
          firstName: fc.string({ minLength: 2, maxLength: 50 }),
          lastName: fc.string({ minLength: 2, maxLength: 50 }),
          dateOfBirth: fc.date({ min: new Date('1960-01-01'), max: new Date('2000-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.string({ minLength: 10, maxLength: 200 }),
          phone: fc.string({ minLength: 10, maxLength: 20 }),
          emergencyContact: fc.string({ minLength: 10, maxLength: 20 }),
          position: fc.string({ minLength: 5, maxLength: 100 })
        }).filter(data => data.staffCode1 !== data.staffCode2),
        async (staffData) => {
          const staff1 = {
            staff_code: staffData.staffCode1,
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

          // First insertion should succeed
          await queryInterface.bulkInsert('staff', [staff1]);

          // Second insertion with same email but different staff_code should fail
          const staff2 = {
            ...staff1,
            staff_code: staffData.staffCode2,
            first_name: 'Different' + staffData.firstName
          };

          await expect(
            queryInterface.bulkInsert('staff', [staff2])
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: User username uniqueness
   * For any two users with the same username, the second insertion should fail
   */
  it('should reject duplicate username insertions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 5, maxLength: 50 }),
          email1: fc.emailAddress(),
          email2: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 100 }),
          role: fc.constantFrom(
            'School_Admin',
            'Subject_Teacher',
            'Class_Teacher',
            'Student',
            'Parent',
            'Librarian',
            'Accountant'
          )
        }).filter(data => data.email1 !== data.email2),
        async (userData) => {
          const user1 = {
            username: userData.username,
            email: userData.email1,
            password: userData.password,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          // First insertion should succeed
          await queryInterface.bulkInsert('users', [user1]);

          // Second insertion with same username should fail
          const user2 = {
            ...user1,
            email: userData.email2
          };

          await expect(
            queryInterface.bulkInsert('users', [user2])
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: User email uniqueness
   * For any two users with the same email, the second insertion should fail
   */
  it('should reject duplicate user email insertions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username1: fc.string({ minLength: 5, maxLength: 50 }),
          username2: fc.string({ minLength: 5, maxLength: 50 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 100 }),
          role: fc.constantFrom(
            'School_Admin',
            'Subject_Teacher',
            'Class_Teacher',
            'Student',
            'Parent',
            'Librarian',
            'Accountant'
          )
        }).filter(data => data.username1 !== data.username2),
        async (userData) => {
          const user1 = {
            username: userData.username1,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          // First insertion should succeed
          await queryInterface.bulkInsert('users', [user1]);

          // Second insertion with same email but different username should fail
          const user2 = {
            ...user1,
            username: userData.username2
          };

          await expect(
            queryInterface.bulkInsert('users', [user2])
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });
});
