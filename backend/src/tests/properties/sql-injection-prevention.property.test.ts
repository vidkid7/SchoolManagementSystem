/**
 * Property-Based Test: SQL Injection Prevention
 * 
 * **Property 29: SQL Injection Prevention**
 * **Validates: Requirements 36.6**
 * 
 * For any user input containing SQL injection patterns (e.g., "'; DROP TABLE", 
 * "1' OR '1'='1"), the input should either be sanitized by escaping special 
 * characters or rejected, and should never be executed as SQL.
 * 
 * This test validates that:
 * - SQL injection patterns are detected and rejected by validation middleware
 * - Parameterized queries prevent SQL injection even if patterns bypass validation
 * - Database operations with malicious input don't execute unintended SQL
 * - User data containing SQL keywords is safely stored and retrieved
 */

import * as fc from 'fast-check';
import { Sequelize, QueryInterface, Options } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import { detectSqlInjection } from '../../middleware/validation';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Property 29: SQL Injection Prevention', () => {
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
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.bulkDelete('students', {}, {});
    await queryInterface.bulkDelete('users', {}, {});
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  /**
   * Generator for common SQL injection attack patterns
   */
  const sqlInjectionPatterns = fc.constantFrom(
    // Classic SQL injection patterns
    "' OR '1'='1",
    "' OR 1=1--",
    "'; DROP TABLE users--",
    "'; DROP TABLE students--",
    "admin'--",
    "' OR 'x'='x",
    "1' OR '1' = '1",
    
    // Union-based injection
    "' UNION SELECT * FROM users--",
    "' UNION SELECT NULL, username, password FROM users--",
    
    // Comment-based injection
    "admin'/*",
    "admin'#",
    
    // Time-based blind injection
    "'; WAITFOR DELAY '00:00:05'--",
    "'; SELECT SLEEP(5)--",
    
    // Boolean-based blind injection
    "' AND 1=1--",
    "' AND 1=2--",
    
    // Stacked queries
    "'; DELETE FROM students WHERE '1'='1",
    "'; UPDATE users SET role='School_Admin' WHERE '1'='1",
    
    // Second-order injection
    "admin' OR '1'='1' /*",
    
    // Database-specific commands
    "'; EXEC xp_cmdshell('dir')--",
    "'; EXEC sp_executesql N'SELECT * FROM users'--"
  );

  /**
   * Property: SQL injection patterns are detected by validation middleware
   * For any input containing SQL injection patterns, the detectSqlInjection 
   * function should return true
   */
  it('should detect common SQL injection patterns', () => {
    fc.assert(
      fc.property(
        sqlInjectionPatterns,
        (maliciousInput) => {
          // Verify that the validation function detects the SQL injection pattern
          const isDetected = detectSqlInjection(maliciousInput);
          expect(isDetected).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Parameterized queries prevent SQL injection in user creation
   * For any username containing SQL injection patterns, the parameterized query 
   * should safely store the value without executing it as SQL
   * 
   * Note: This test validates that parameterized queries prevent SQL injection.
   * In practice, the validation middleware would reject these patterns before
   * they reach the database layer.
   */
  it('should safely handle SQL injection patterns in user creation via parameterized queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          safeUsername: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9_]+$/.test(s) && s.length >= 5)
            .map(s => `user_${Date.now()}_${s}`),
          email: fc.emailAddress()
            .map(e => `${Date.now()}_${Math.floor(Math.random() * 10000)}_${e}`),
          password: fc.string({ minLength: 8, maxLength: 50 })
            .filter(s => s.length >= 8 && !/\s/.test(s) && /[a-zA-Z0-9]/.test(s)),
          role: fc.constantFrom(
            'School_Admin',
            'Subject_Teacher',
            'Student',
            'Parent'
          ),
          maliciousInput: sqlInjectionPatterns
        }),
        async (userData) => {
          // Hash the password properly
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(userData.password, salt);

          // Create user with safe username
          const user = {
            username: userData.safeUsername,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          // Insert using parameterized query (Sequelize automatically uses prepared statements)
          await queryInterface.bulkInsert('users', [user]);

          // Now try to query using malicious input in WHERE clause
          // This should safely handle the malicious input without executing it
          const searchResults = await sequelize.query(
            'SELECT username, email, role FROM users WHERE username = ?',
            { replacements: [userData.maliciousInput], type: 'SELECT' }
          );

          // The malicious input should be treated as a literal string
          // No user should be found (unless by extreme coincidence)
          expect(Array.isArray(searchResults)).toBe(true);

          // Verify the users table still exists (wasn't dropped)
          const tableCheck = await sequelize.query(
            "SHOW TABLES LIKE 'users'",
            { type: 'SELECT' }
          );
          expect(tableCheck.length).toBeGreaterThan(0);

          // Verify our original user still exists
          const userCheck = await sequelize.query(
            'SELECT * FROM users WHERE username = ?',
            { replacements: [userData.safeUsername], type: 'SELECT' }
          );
          expect(userCheck).toHaveLength(1);
          expect((userCheck[0] as any).email).toBe(userData.email);
          expect((userCheck[0] as any).role).toBe(userData.role);
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property: Parameterized queries prevent SQL injection in student search
   * For any search query containing SQL injection patterns, the parameterized 
   * query should safely search without executing malicious SQL
   */
  it('should safely handle SQL injection patterns in student search via parameterized queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode: fc.string({ minLength: 5, maxLength: 50 })
            .map(s => `STU_${Date.now()}_${s}`),
          firstName: fc.string({ minLength: 2, maxLength: 50 })
            .filter(s => s.trim().length >= 2),
          lastName: fc.string({ minLength: 2, maxLength: 50 })
            .filter(s => s.trim().length >= 2),
          maliciousSearchTerm: sqlInjectionPatterns,
          dateOfBirth: fc.date({ min: new Date('2000-01-01'), max: new Date('2015-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.string({ minLength: 10, maxLength: 200 })
            .filter(s => s.trim().length >= 10),
          fatherName: fc.string({ minLength: 5, maxLength: 100 })
            .filter(s => s.trim().length >= 5),
          fatherPhone: fc.string({ minLength: 10, maxLength: 20 })
            .filter(s => s.trim().length >= 10),
          motherName: fc.string({ minLength: 5, maxLength: 100 })
            .filter(s => s.trim().length >= 5),
          motherPhone: fc.string({ minLength: 10, maxLength: 20 })
            .filter(s => s.trim().length >= 10),
          emergencyContact: fc.string({ minLength: 10, maxLength: 20 })
            .filter(s => s.trim().length >= 10),
          admissionClass: fc.integer({ min: 1, max: 12 })
        }),
        async (testData) => {
          // Create a legitimate student record
          const student = {
            student_code: testData.studentCode,
            first_name_en: testData.firstName.trim(),
            last_name_en: testData.lastName.trim(),
            date_of_birth_bs: '2060-01-01',
            date_of_birth_ad: testData.dateOfBirth,
            gender: testData.gender,
            address_en: testData.address.trim(),
            father_name: testData.fatherName.trim(),
            father_phone: testData.fatherPhone.trim(),
            mother_name: testData.motherName.trim(),
            mother_phone: testData.motherPhone.trim(),
            emergency_contact: testData.emergencyContact.trim(),
            admission_date: new Date(),
            admission_class: testData.admissionClass,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('students', [student]);

          // Attempt to search using malicious input via parameterized query
          const searchResults = await sequelize.query(
            'SELECT * FROM students WHERE first_name_en LIKE ? OR last_name_en LIKE ?',
            { 
              replacements: [`%${testData.maliciousSearchTerm}%`, `%${testData.maliciousSearchTerm}%`],
              type: 'SELECT' 
            }
          );

          // Verify search completed without error (no SQL injection executed)
          expect(Array.isArray(searchResults)).toBe(true);

          // Verify the students table still exists (wasn't dropped)
          const tableCheck = await sequelize.query(
            "SHOW TABLES LIKE 'students'",
            { type: 'SELECT' }
          );
          expect(tableCheck.length).toBeGreaterThan(0);

          // Verify our original student still exists
          const studentCheck = await sequelize.query(
            'SELECT * FROM students WHERE student_code = ?',
            { replacements: [testData.studentCode], type: 'SELECT' }
          );
          expect(studentCheck).toHaveLength(1);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Property: Parameterized queries prevent SQL injection in WHERE clauses
   * For any filter value containing SQL injection patterns, the parameterized 
   * query should treat it as a literal value, not executable SQL
   */
  it('should safely handle SQL injection patterns in WHERE clause filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode: fc.string({ minLength: 5, maxLength: 50 })
            .map(s => `STU_${Date.now()}_${s}`),
          firstName: fc.string({ minLength: 2, maxLength: 50 }),
          lastName: fc.string({ minLength: 2, maxLength: 50 }),
          maliciousFilter: sqlInjectionPatterns,
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
        async (testData) => {
          // Create a legitimate student record
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
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('students', [student]);

          // Count students before the malicious query
          const beforeCount = await sequelize.query(
            'SELECT COUNT(*) as count FROM students',
            { type: 'SELECT' }
          );
          const initialCount = (beforeCount[0] as any).count;

          // Attempt to filter using malicious input via parameterized query
          const filterResults = await sequelize.query(
            'SELECT * FROM students WHERE status = ?',
            { 
              replacements: [testData.maliciousFilter],
              type: 'SELECT' 
            }
          );

          // Verify query completed without error
          expect(Array.isArray(filterResults)).toBe(true);

          // Verify no records match (malicious input treated as literal status value)
          expect(filterResults).toHaveLength(0);

          // Verify the students table still exists
          const tableCheck = await sequelize.query(
            "SHOW TABLES LIKE 'students'",
            { type: 'SELECT' }
          );
          expect(tableCheck.length).toBeGreaterThan(0);

          // Verify student count hasn't changed (no deletion occurred)
          const afterCount = await sequelize.query(
            'SELECT COUNT(*) as count FROM students',
            { type: 'SELECT' }
          );
          expect((afterCount[0] as any).count).toBe(initialCount);

          // Verify our original student still exists with correct data
          const studentCheck = await sequelize.query(
            'SELECT * FROM students WHERE student_code = ?',
            { replacements: [testData.studentCode], type: 'SELECT' }
          );
          expect(studentCheck).toHaveLength(1);
          expect((studentCheck[0] as any).first_name_en).toBe(testData.firstName);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Property: Parameterized queries prevent SQL injection in UPDATE statements
   * For any update value containing SQL injection patterns, the parameterized 
   * query should safely update the field without executing malicious SQL
   */
  it('should safely handle SQL injection patterns in UPDATE statements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode: fc.string({ minLength: 5, maxLength: 50 })
            .map(s => `STU_${Date.now()}_${s}`),
          firstName: fc.string({ minLength: 2, maxLength: 50 }),
          lastName: fc.string({ minLength: 2, maxLength: 50 }),
          maliciousAddress: sqlInjectionPatterns,
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
        async (testData) => {
          // Create a legitimate student record
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
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('students', [student]);

          // Get student ID
          const studentRecords = await sequelize.query(
            'SELECT student_id FROM students WHERE student_code = ?',
            { replacements: [testData.studentCode], type: 'SELECT' }
          );
          const studentId = (studentRecords[0] as any).student_id;

          // Count students before update
          const beforeCount = await sequelize.query(
            'SELECT COUNT(*) as count FROM students',
            { type: 'SELECT' }
          );
          const initialCount = (beforeCount[0] as any).count;

          // Update address with malicious input using parameterized query
          await sequelize.query(
            'UPDATE students SET address_en = ?, updated_at = ? WHERE student_id = ?',
            { 
              replacements: [testData.maliciousAddress, new Date(), studentId]
            }
          );

          // Verify the update completed without error
          const updatedStudent = await sequelize.query(
            'SELECT * FROM students WHERE student_id = ?',
            { replacements: [studentId], type: 'SELECT' }
          );

          expect(updatedStudent).toHaveLength(1);
          
          // Verify the malicious input was stored as literal string
          expect((updatedStudent[0] as any).address_en).toBe(testData.maliciousAddress);

          // Verify other fields weren't affected
          expect((updatedStudent[0] as any).first_name_en).toBe(testData.firstName);
          expect((updatedStudent[0] as any).last_name_en).toBe(testData.lastName);
          expect((updatedStudent[0] as any).status).toBe('active');

          // Verify the students table still exists
          const tableCheck = await sequelize.query(
            "SHOW TABLES LIKE 'students'",
            { type: 'SELECT' }
          );
          expect(tableCheck.length).toBeGreaterThan(0);

          // Verify student count hasn't changed
          const afterCount = await sequelize.query(
            'SELECT COUNT(*) as count FROM students',
            { type: 'SELECT' }
          );
          expect((afterCount[0] as any).count).toBe(initialCount);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Property: Legitimate SQL keywords in user data are safely handled
   * For any input containing legitimate SQL keywords (e.g., "Select Street", 
   * "Union Avenue"), the parameterized query should store and retrieve them 
   * correctly without treating them as SQL commands
   */
  it('should safely handle legitimate SQL keywords in user data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentCode: fc.string({ minLength: 5, maxLength: 50 })
            .map(s => `STU_${Date.now()}_${s}`),
          // Names that contain SQL keywords but are legitimate
          firstName: fc.constantFrom(
            'Select',
            'Union',
            'Insert',
            'Delete',
            'Update',
            'Drop',
            'Create',
            'Alter'
          ),
          lastName: fc.constantFrom(
            'Street',
            'Avenue',
            'Road',
            'Lane',
            'Drive',
            'Court',
            'Place',
            'Way'
          ),
          dateOfBirth: fc.date({ min: new Date('2000-01-01'), max: new Date('2015-12-31') }),
          gender: fc.constantFrom('male', 'female', 'other'),
          address: fc.constantFrom(
            'Union Street',
            'Select Avenue',
            'Drop Road',
            'Insert Lane'
          ),
          fatherName: fc.constantFrom('John Smith', 'David Johnson', 'Michael Brown', 'Robert Davis'),
          fatherPhone: fc.constantFrom('9841234567', '9851234567', '9861234567'),
          motherName: fc.constantFrom('Mary Smith', 'Sarah Johnson', 'Lisa Brown', 'Jennifer Davis'),
          motherPhone: fc.constantFrom('9841234568', '9851234568', '9861234568'),
          emergencyContact: fc.constantFrom('9841234569', '9851234569', '9861234569'),
          admissionClass: fc.integer({ min: 1, max: 12 })
        }),
        async (testData) => {
          // Create student with SQL keywords in legitimate data
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
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('students', [student]);

          // Retrieve the student
          const retrievedStudents = await sequelize.query(
            'SELECT * FROM students WHERE student_code = ?',
            { replacements: [testData.studentCode], type: 'SELECT' }
          );

          expect(retrievedStudents).toHaveLength(1);
          const retrievedStudent = retrievedStudents[0] as any;

          // Verify all data was stored correctly as literal strings
          expect(retrievedStudent.first_name_en).toBe(testData.firstName);
          expect(retrievedStudent.last_name_en).toBe(testData.lastName);
          expect(retrievedStudent.address_en).toBe(testData.address);

          // Verify the table still exists
          const tableCheck = await sequelize.query(
            "SHOW TABLES LIKE 'students'",
            { type: 'SELECT' }
          );
          expect(tableCheck.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
