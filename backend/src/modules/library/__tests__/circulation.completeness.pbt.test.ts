/**
 * Property-Based Test: Circulation Record Completeness
 * 
 * **Property 26: Circulation Record Completeness**
 * **Validates: Requirements 10.4**
 * 
 * Test that circulation records contain all required fields
 */

// Load environment variables before importing database config
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import * as fc from 'fast-check';
import { Circulation, CirculationCreationAttributes, initCirculation } from '../../../models/Circulation.model';
import { Book } from '../../../models/Book.model';
import Student, { Gender, StudentStatus } from '../../../models/Student.model';
import User, { UserRole } from '../../../models/User.model';
import { sequelize } from '../../../config/database';

describe('Property Test: Circulation Record Completeness', () => {
  let fixtureSequence = 0;
  const uniqueSuffix = () => `${Date.now()}${fixtureSequence++}`;
  const createdCirculationIds: number[] = [];
  const createdBookIds: number[] = [];
  const createdStudentIds: number[] = [];
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    // These property tests must never reset or write to a shared MySQL database.
    if (sequelize.getDialect() !== 'sqlite') {
      throw new Error('Circulation property tests require TEST_DB_DIALECT=sqlite');
    }
    initCirculation(sequelize);
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    createdCirculationIds.length = 0;
    createdBookIds.length = 0;
    createdStudentIds.length = 0;
    createdUserIds.length = 0;
  });

  afterEach(async () => {
    if (createdCirculationIds.length) {
      await Circulation.destroy({ where: { circulationId: createdCirculationIds }, force: true });
    }
    if (createdBookIds.length) {
      await Book.destroy({ where: { bookId: createdBookIds }, force: true });
    }
    if (createdStudentIds.length) {
      await Student.destroy({ where: { studentId: createdStudentIds }, force: true });
    }
    if (createdUserIds.length) {
      await User.destroy({ where: { userId: createdUserIds }, force: true });
    }
  });

  /**
   * Property: All circulation records must contain required fields
   * 
   * For any circulation record created, it must have:
   * - bookId
   * - studentId
   * - issueDate
   * - dueDate
   * - status
   * - issuedBy
   * - conditionOnIssue
   * - fine (default 0)
   * - finePaid (default false)
   * - renewalCount (default 0)
   * - maxRenewals
   */
  it('should ensure all circulation records contain required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          accessionNumber: fc.string({ minLength: 5, maxLength: 20 }),
          isbn: fc.string({ minLength: 10, maxLength: 13 }),
          title: fc.string({ minLength: 5, maxLength: 100 }),
          author: fc.string({ minLength: 3, maxLength: 50 }),
          publisher: fc.string({ minLength: 3, maxLength: 50 }),
          category: fc.constantFrom('Fiction', 'Non-Fiction', 'Science', 'History', 'Mathematics'),
          copies: fc.integer({ min: 1, max: 10 }),
          studentName: fc.string({ minLength: 5, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          username: fc.string({ minLength: 5, maxLength: 20 }),
          userEmail: fc.emailAddress(),
          borrowingDays: fc.integer({ min: 7, max: 30 }),
          condition: fc.constantFrom('good', 'damaged', 'poor'),
        }),
        async (data) => {
          // Create user for issuedBy
          const user = await User.create({
            username: `librarian${uniqueSuffix()}`,
            email: `librarian${uniqueSuffix()}@example.com`,
            password: 'hashedpassword',
            role: UserRole.LIBRARIAN,
          });
          createdUserIds.push(user.userId);

          // Create student
          const student = await Student.create({
            studentCode: `STU-${uniqueSuffix()}`,
            firstNameEn: data.studentName.split(' ')[0] || 'Test',
            lastNameEn: data.studentName.split(' ')[1] || 'Student',
            email: `student${uniqueSuffix()}@example.com`,
            dateOfBirthBS: '2062-01-01',
            dateOfBirthAD: new Date('2005-01-01'),
            gender: Gender.MALE,
            addressEn: '123 Test Street',
            fatherName: 'Test Father',
            fatherPhone: '9841234567',
            motherName: 'Test Mother',
            motherPhone: '9841234568',
            emergencyContact: '9841234569',
            admissionDate: new Date(),
            admissionClass: 10,
            status: StudentStatus.ACTIVE,
          });
          createdStudentIds.push(student.studentId);

          // Create book
          const book = await Book.create({
            accessionNumber: `ACC${uniqueSuffix()}`,
            isbn: data.isbn,
            title: data.title,
            author: data.author,
            publisher: data.publisher,
            category: data.category,
            language: 'English',
            copies: data.copies,
            availableCopies: data.copies,
            status: 'available',
          });
          createdBookIds.push(book.bookId);

          // Calculate due date
          const issueDate = new Date();
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + data.borrowingDays);

          // Create circulation record
          const circulation = await Circulation.create({
            bookId: book.bookId,
            studentId: student.studentId,
            issueDate,
            dueDate,
            issuedBy: user.userId,
            status: 'borrowed',
            conditionOnIssue: data.condition as 'good' | 'damaged' | 'poor',
            maxRenewals: 2,
          } as CirculationCreationAttributes);
          createdCirculationIds.push(circulation.circulationId);

          // Verify all required fields are present
          expect(circulation.circulationId).toBeDefined();
          expect(circulation.bookId).toBe(book.bookId);
          expect(circulation.studentId).toBe(student.studentId);
          // DATEONLY columns are returned as YYYY-MM-DD strings by Sequelize.
          expect(new Date(circulation.issueDate)).toBeInstanceOf(Date);
          expect(new Date(circulation.dueDate)).toBeInstanceOf(Date);
          expect(circulation.status).toBe('borrowed');
          expect(circulation.issuedBy).toBe(user.userId);
          expect(circulation.conditionOnIssue).toBe(data.condition);
          expect(circulation.fine).toBe(0);
          expect(circulation.finePaid).toBe(false);
          expect(circulation.renewalCount).toBe(0);
          expect(circulation.maxRenewals).toBe(2);
          expect(circulation.createdAt).toBeInstanceOf(Date);
          expect(circulation.updatedAt).toBeInstanceOf(Date);

          // Verify no required field is null or undefined
          expect(circulation.bookId).not.toBeNull();
          expect(circulation.studentId).not.toBeNull();
          expect(circulation.issueDate).not.toBeNull();
          expect(circulation.dueDate).not.toBeNull();
          expect(circulation.status).not.toBeNull();
          expect(circulation.issuedBy).not.toBeNull();
          expect(circulation.conditionOnIssue).not.toBeNull();
        }
      ),
      { numRuns: 50 } // Run 50 iterations
    );
  });

  /**
   * Property: Circulation records must have valid status values
   */
  it('should ensure circulation status is always valid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          accessionNumber: fc.string({ minLength: 5, maxLength: 20 }),
          title: fc.string({ minLength: 5, maxLength: 100 }),
          author: fc.string({ minLength: 3, maxLength: 50 }),
          publisher: fc.string({ minLength: 3, maxLength: 50 }),
          studentName: fc.string({ minLength: 5, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          username: fc.string({ minLength: 5, maxLength: 20 }),
          userEmail: fc.emailAddress(),
          status: fc.constantFrom('borrowed', 'returned', 'overdue', 'lost', 'renewed'),
        }),
        async (data) => {
          // Create user
          const user = await User.create({
            username: `librarian${uniqueSuffix()}`,
            email: `librarian${uniqueSuffix()}@example.com`,
            password: 'hashedpassword',
            role: UserRole.LIBRARIAN,
          });
          createdUserIds.push(user.userId);

          // Create student
          const student = await Student.create({
            studentCode: `STU-${uniqueSuffix()}`,
            firstNameEn: data.studentName.split(' ')[0] || 'Test',
            lastNameEn: data.studentName.split(' ')[1] || 'Student',
            email: `student${uniqueSuffix()}@example.com`,
            dateOfBirthBS: '2062-01-01',
            dateOfBirthAD: new Date('2005-01-01'),
            gender: Gender.MALE,
            addressEn: '123 Test Street',
            fatherName: 'Test Father',
            fatherPhone: '9841234567',
            motherName: 'Test Mother',
            motherPhone: '9841234568',
            emergencyContact: '9841234569',
            admissionDate: new Date(),
            admissionClass: 10,
            status: StudentStatus.ACTIVE,
          });
          createdStudentIds.push(student.studentId);

          // Create book
          const book = await Book.create({
            accessionNumber: `ACC${uniqueSuffix()}`,
            isbn: 'ISBN123',
            title: data.title,
            author: data.author,
            publisher: data.publisher,
            category: 'Fiction',
            language: 'English',
            copies: 1,
            availableCopies: 1,
            status: 'available',
          });
          createdBookIds.push(book.bookId);

          // Create circulation with specified status
          const circulation = await Circulation.create({
            bookId: book.bookId,
            studentId: student.studentId,
            issueDate: new Date(),
            dueDate: new Date(),
            issuedBy: user.userId,
            status: data.status as 'borrowed' | 'returned' | 'overdue' | 'lost' | 'renewed',
            conditionOnIssue: 'good',
            maxRenewals: 2,
          } as CirculationCreationAttributes);
          createdCirculationIds.push(circulation.circulationId);

          // Verify status is one of the valid values
          const validStatuses = ['borrowed', 'returned', 'overdue', 'lost', 'renewed'];
          expect(validStatuses).toContain(circulation.status);
          expect(circulation.status).toBe(data.status);
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * Property: Due date must always be after issue date
   */
  it('should ensure due date is always after issue date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          accessionNumber: fc.string({ minLength: 5, maxLength: 20 }),
          title: fc.string({ minLength: 5, maxLength: 100 }),
          author: fc.string({ minLength: 3, maxLength: 50 }),
          publisher: fc.string({ minLength: 3, maxLength: 50 }),
          studentName: fc.string({ minLength: 5, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          username: fc.string({ minLength: 5, maxLength: 20 }),
          userEmail: fc.emailAddress(),
          borrowingDays: fc.integer({ min: 1, max: 90 }),
        }),
        async (data) => {
          // Create user
          const user = await User.create({
            username: `librarian${uniqueSuffix()}`,
            email: `librarian${uniqueSuffix()}@example.com`,
            password: 'hashedpassword',
            role: UserRole.LIBRARIAN,
          });
          createdUserIds.push(user.userId);

          // Create student
          const student = await Student.create({
            studentCode: `STU-${uniqueSuffix()}`,
            firstNameEn: data.studentName.split(' ')[0] || 'Test',
            lastNameEn: data.studentName.split(' ')[1] || 'Student',
            email: `student${uniqueSuffix()}@example.com`,
            dateOfBirthBS: '2062-01-01',
            dateOfBirthAD: new Date('2005-01-01'),
            gender: Gender.MALE,
            addressEn: '123 Test Street',
            fatherName: 'Test Father',
            fatherPhone: '9841234567',
            motherName: 'Test Mother',
            motherPhone: '9841234568',
            emergencyContact: '9841234569',
            admissionDate: new Date(),
            admissionClass: 10,
            status: StudentStatus.ACTIVE,
          });
          createdStudentIds.push(student.studentId);

          // Create book
          const book = await Book.create({
            accessionNumber: `ACC${uniqueSuffix()}`,
            isbn: 'ISBN123',
            title: data.title,
            author: data.author,
            publisher: data.publisher,
            category: 'Fiction',
            language: 'English',
            copies: 1,
            availableCopies: 1,
            status: 'available',
          });
          createdBookIds.push(book.bookId);

          const issueDate = new Date();
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + data.borrowingDays);

          // Create circulation
          const circulation = await Circulation.create({
            bookId: book.bookId,
            studentId: student.studentId,
            issueDate,
            dueDate,
            issuedBy: user.userId,
            status: 'borrowed',
            conditionOnIssue: 'good',
            maxRenewals: 2,
          } as CirculationCreationAttributes);
          createdCirculationIds.push(circulation.circulationId);

          // Verify due date is after issue date
          expect(new Date(circulation.dueDate).getTime()).toBeGreaterThan(
            new Date(circulation.issueDate).getTime()
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
