/**
 * Property-based checks that the application models preserve rows on destroy.
 * The database is an isolated in-memory SQLite instance selected by the test
 * runner; no direct connection or unscoped delete against a shared DB is used.
 */

import * as fc from 'fast-check';
import sequelize from '@config/database';
import Student, { Gender, StudentStatus } from '@models/Student.model';
import Staff, { EmploymentType, StaffCategory, StaffStatus } from '@models/Staff.model';
import AttendanceRecord, { AttendanceStatus } from '@models/AttendanceRecord.model';

describe('Property 15: Soft Delete Preservation', () => {
  let sequence = 0;

  beforeAll(async () => {
    if (sequelize.getDialect() !== 'sqlite') {
      throw new Error('Soft-delete property tests require TEST_DB_DIALECT=sqlite');
    }
    await sequelize.sync({ force: true });
    await sequelize.query('PRAGMA foreign_keys = OFF');
  });

  beforeEach(async () => {
    await Student.destroy({ where: {}, force: true });
    await Staff.destroy({ where: {}, force: true });
    await AttendanceRecord.destroy({ where: {}, force: true });
    sequence = 0;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('preserves student fields and sets deletedAt when the model is destroyed', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        firstName: fc.string({ minLength: 1, maxLength: 40 }).filter(value => value.trim().length > 0),
        lastName: fc.string({ minLength: 1, maxLength: 40 }).filter(value => value.trim().length > 0),
        admissionClass: fc.integer({ min: 1, max: 12 })
      }),
      async data => {
        sequence += 1;
        const student = await Student.create({
          studentCode: `SOFT-DELETE-STUDENT-${sequence}`,
          firstNameEn: data.firstName,
          lastNameEn: data.lastName,
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
          admissionClass: data.admissionClass,
          status: StudentStatus.ACTIVE
        });

        await student.destroy();

        expect(await Student.findByPk(student.studentId)).toBeNull();
        const preserved = await Student.findByPk(student.studentId, { paranoid: false });
        expect(preserved).not.toBeNull();
        expect(preserved?.deletedAt).toBeInstanceOf(Date);
        expect(preserved?.studentCode).toBe(student.studentCode);
        expect(preserved?.firstNameEn).toBe(data.firstName);
        expect(preserved?.lastNameEn).toBe(data.lastName);
        expect(preserved?.admissionClass).toBe(data.admissionClass);
      }
    ), { numRuns: 20 });
  });

  it('preserves staff fields and sets deletedAt when the model is destroyed', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        firstName: fc.string({ minLength: 1, maxLength: 40 }).filter(value => value.trim().length > 0),
        lastName: fc.string({ minLength: 1, maxLength: 40 }).filter(value => value.trim().length > 0),
        position: fc.string({ minLength: 1, maxLength: 60 }).filter(value => value.trim().length > 0)
      }),
      async data => {
        sequence += 1;
        const staff = await Staff.create({
          staffCode: `SOFT-DELETE-STAFF-${sequence}`,
          firstNameEn: data.firstName,
          lastNameEn: data.lastName,
          category: StaffCategory.TEACHING,
          employmentType: EmploymentType.FULL_TIME,
          joinDate: new Date('2024-01-01'),
          position: data.position,
          status: StaffStatus.ACTIVE
        });

        await staff.destroy();

        expect(await Staff.findByPk(staff.staffId)).toBeNull();
        const preserved = await Staff.findByPk(staff.staffId, { paranoid: false });
        expect(preserved).not.toBeNull();
        expect(preserved?.deletedAt).toBeInstanceOf(Date);
        expect(preserved?.staffCode).toBe(staff.staffCode);
        expect(preserved?.firstNameEn).toBe(data.firstName);
        expect(preserved?.lastNameEn).toBe(data.lastName);
        expect(preserved?.position).toBe(data.position);
      }
    ), { numRuns: 20 });
  });

  it('preserves attendance fields and sets deletedAt when the model is destroyed', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom(...Object.values(AttendanceStatus)),
      async status => {
        const attendance = await AttendanceRecord.create({
          studentId: 1,
          classId: 1,
          date: new Date('2026-10-01'),
          status,
          markedBy: 1,
          markedAt: new Date('2026-10-01T08:00:00Z')
        });

        await attendance.destroy();

        expect(await AttendanceRecord.findByPk(attendance.attendanceId)).toBeNull();
        const preserved = await AttendanceRecord.findByPk(attendance.attendanceId, { paranoid: false });
        expect(preserved).not.toBeNull();
        expect(preserved?.deletedAt).toBeInstanceOf(Date);
        expect(preserved?.studentId).toBe(1);
        expect(preserved?.classId).toBe(1);
        expect(preserved?.status).toBe(status);
      }
    ), { numRuns: 20 });
  });
});
