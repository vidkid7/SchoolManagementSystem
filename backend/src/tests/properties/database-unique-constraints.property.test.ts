/**
 * Property 14: unique constraints on identifiers declared unique by the
 * current Sequelize models. Uses only the isolated in-memory test database.
 */

import sequelize from '@config/database';
import Student, { Gender, StudentStatus } from '@models/Student.model';
import Staff, { EmploymentType, StaffCategory, StaffStatus } from '@models/Staff.model';
import User, { UserRole } from '@models/User.model';

describe('Property 14: Database Unique Constraints', () => {
  beforeAll(async () => {
    if (sequelize.getDialect() !== 'sqlite') {
      throw new Error('Unique-constraint tests require TEST_DB_DIALECT=sqlite');
    }
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Student.destroy({ where: {}, force: true });
    await Staff.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const studentData = (overrides: Record<string, unknown> = {}) => ({
    studentCode: 'UNIQUE-STUDENT-001',
    firstNameEn: 'Test',
    lastNameEn: 'Student',
    dateOfBirthBS: '2060-01-01',
    dateOfBirthAD: new Date('2003-04-14'),
    gender: Gender.MALE,
    addressEn: 'QA test address',
    fatherName: 'QA Parent',
    fatherPhone: '9841234567',
    motherName: 'QA Parent',
    motherPhone: '9841234568',
    emergencyContact: '9841234569',
    admissionDate: new Date('2024-04-14'),
    admissionClass: 1,
    status: StudentStatus.ACTIVE,
    ...overrides
  });

  const staffData = (overrides: Record<string, unknown> = {}) => ({
    staffCode: 'UNIQUE-STAFF-001',
    firstNameEn: 'Test',
    lastNameEn: 'Staff',
    category: StaffCategory.TEACHING,
    employmentType: EmploymentType.FULL_TIME,
    joinDate: new Date('2024-01-01'),
    status: StaffStatus.ACTIVE,
    ...overrides
  });

  const userData = (overrides: Record<string, unknown> = {}) => ({
    username: 'uniqueuser',
    email: 'uniqueuser@example.test',
    password: 'qa-test-password',
    role: UserRole.SCHOOL_ADMIN,
    ...overrides
  });

  it('rejects duplicate student codes', async () => {
    const first = studentData();
    await Student.create(first);
    await expect(Student.create({ ...first, symbolNumber: 'SYMBOL-2' })).rejects.toThrow();
  });

  it('rejects duplicate symbol numbers', async () => {
    await Student.create(studentData({ studentCode: 'UNIQUE-STUDENT-002', symbolNumber: 'SYMBOL-1' }));
    await expect(Student.create(studentData({ studentCode: 'UNIQUE-STUDENT-003', symbolNumber: 'SYMBOL-1' }))).rejects.toThrow();
  });

  it('rejects duplicate NEB registration numbers', async () => {
    await Student.create(studentData({ studentCode: 'UNIQUE-STUDENT-004', nebRegistrationNumber: 'NEB-1' }));
    await expect(Student.create(studentData({ studentCode: 'UNIQUE-STUDENT-005', nebRegistrationNumber: 'NEB-1' }))).rejects.toThrow();
  });

  it('rejects duplicate staff codes', async () => {
    const first = staffData();
    await Staff.create(first);
    await expect(Staff.create({ ...first, email: 'another@example.test' })).rejects.toThrow();
  });

  it('rejects duplicate usernames', async () => {
    const first = userData();
    await User.create(first);
    await expect(User.create({ ...first, email: 'another@example.test' })).rejects.toThrow();
  });

  it('rejects duplicate user email addresses', async () => {
    await User.create(userData({ username: 'uniqueuser1' }));
    await expect(User.create(userData({ username: 'uniqueuser2' }))).rejects.toThrow();
  });

  it('rejects duplicate staff email addresses', async () => {
    await Staff.create(staffData({ staffCode: 'UNIQUE-STAFF-002', email: 'shared@example.test' }));
    await expect(Staff.create(staffData({ staffCode: 'UNIQUE-STAFF-003', email: 'shared@example.test' }))).rejects.toThrow();
  });
});
