import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import User, { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import Class from '@models/Class.model';
import { AcademicYear } from '@models/AcademicYear.model';
import { AttendanceStatus } from '@models/AttendanceRecord.model';
import LeaveApplication, { LeaveStatus } from '@models/LeaveApplication.model';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';

/**
 * Attendance Routes Integration Tests
 * Tests all attendance API endpoints
 * Requirements: 6.1-6.14
 */

describe('Attendance Routes', () => {
  let teacherToken: string;
  let parentToken: string;
  let teacherUser: User;
  let parentUser: User;
  let academicYear: AcademicYear;
  let testClass: Class;
  let student1: Student;
  let student2: Student;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    teacherUser = await User.create({
      username: 'teacher1',
      email: 'teacher@test.com',
      password: 'password123',
      role: UserRole.CLASS_TEACHER
    });

    parentUser = await User.create({
      username: 'parent1',
      email: 'parent@test.com',
      password: 'password123',
      role: UserRole.PARENT
    });

    // Generate tokens
    teacherToken = jwt.sign(
      { 
        userId: teacherUser.userId, 
        username: teacherUser.username,
        email: teacherUser.email,
        role: teacherUser.role 
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    parentToken = jwt.sign(
      { 
        userId: parentUser.userId, 
        username: parentUser.username,
        email: parentUser.email,
        role: parentUser.role 
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: '2024-04-13',
      endDateAD: '2025-04-12',
      isCurrent: true
    });

    // Create class
    testClass = await Class.create({
      gradeLevel: 5,
      section: 'A',
      shift: 'morning',
      classTeacherId: teacherUser.userId,
      capacity: 40,
      currentStrength: 2,
      academicYearId: academicYear.academicYearId
    });

    // Create students
    student1 = await Student.create({
      studentCode: 'STU-2024-00001',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      firstNameNp: 'जोन',
      lastNameNp: 'डो',
      dateOfBirthBS: '2070-05-15',
      dateOfBirthAD: new Date('2013-08-30'),
      gender: 'MALE' as any,
      addressEn: 'Kathmandu',
      addressNp: 'काठमाडौं',
      fatherName: 'Father Name',
      fatherPhone: '9841234567',
      motherName: 'Mother Name',
      motherPhone: '9841234568',
      emergencyContact: '9841234567',
      admissionDate: new Date('2024-04-13'),
      admissionClass: 1,
      currentClassId: testClass.classId,
      status: 'ACTIVE' as any
    });

    student2 = await Student.create({
      studentCode: 'STU-2024-00002',
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      firstNameNp: 'जेन',
      lastNameNp: 'स्मिथ',
      dateOfBirthBS: '2070-06-20',
      dateOfBirthAD: new Date('2013-10-05'),
      gender: 'FEMALE' as any,
      addressEn: 'Lalitpur',
      addressNp: 'ललितपुर',
      fatherName: 'Father Name 2',
      fatherPhone: '9841234569',
      motherName: 'Mother Name 2',
      motherPhone: '9841234570',
      emergencyContact: '9841234569',
      admissionDate: new Date('2024-04-13'),
      admissionClass: 1,
      currentClassId: testClass.classId,
      status: 'ACTIVE' as any
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/attendance/student/mark', () => {
    it('should mark attendance for a student', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/student/mark')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentId: student1.studentId,
          classId: testClass.classId,
          date: new Date().toISOString(),
          status: AttendanceStatus.PRESENT
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('attendanceId');
      expect(response.body.data.status).toBe(AttendanceStatus.PRESENT);
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/student/mark')
        .send({
          studentId: student1.studentId,
          classId: testClass.classId,
          date: new Date().toISOString(),
          status: AttendanceStatus.PRESENT
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/attendance/student/mark-all-present', () => {
    it('should mark all students present', async () => {
      const response = await request(app)
        .post('/api/v1/attendance/student/mark-all-present')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: testClass.classId,
          studentIds: [student1.studentId, student2.studentId],
          date: new Date().toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalStudents).toBe(2);
      expect(response.body.data.recordsProcessed).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/attendance/student/:classId', () => {
    it('should get class attendance for a date', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/v1/attendance/student/${testClass.classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ date: today });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('records');
      expect(response.body.data).toHaveProperty('totalStudents');
    });
  });

  describe('GET /api/v1/attendance/student/report', () => {
    it('should get attendance report with filters', async () => {
      const response = await request(app)
        .get('/api/v1/attendance/student/report')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          studentId: student1.studentId,
          page: 1,
          limit: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('records');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('POST /api/v1/attendance/leave/apply', () => {
    it('should allow parent to apply for leave', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app)
        .post('/api/v1/attendance/leave/apply')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId: student1.studentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Family emergency - need to travel out of town for medical treatment'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('leaveId');
      expect(response.body.data.status).toBe(LeaveStatus.PENDING);
    });
  });

  describe('GET /api/v1/attendance/leave/pending', () => {
    it('should get pending leave applications', async () => {
      const response = await request(app)
        .get('/api/v1/attendance/leave/pending')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/v1/attendance/leave/:id/approve', () => {
    let leaveId: number;

    beforeAll(async () => {
      // Create a leave application to approve
      const leave = await LeaveApplication.create({
        studentId: student1.studentId,
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Test leave',
        appliedBy: parentUser.userId,
        appliedAt: new Date(),
        status: LeaveStatus.PENDING
      });
      leaveId = leave.leaveId;
    });

    it('should approve leave application', async () => {
      const response = await request(app)
        .put(`/api/v1/attendance/leave/${leaveId}/approve`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          action: 'approve',
          remarks: 'Approved'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(LeaveStatus.APPROVED);
    });
  });

  describe('GET /api/v1/attendance/staff/report', () => {
    it('should return placeholder for staff attendance', async () => {
      const response = await request(app)
        .get('/api/v1/attendance/staff/report')
        .set('Authorization', `Bearer ${teacherToken}`);

      // Teacher doesn't have permission for staff reports
      expect(response.status).toBe(403);
    });
  });
});
