// Keep this route suite independent of Jest's CommonJS loader for htmlparser2 ESM.
jest.mock('sanitize-html', () => (html: string) => html);

import request from 'supertest';
import app from '../../../app';
import { Op } from 'sequelize';
import sequelize from '@config/database';
import { AcademicYear } from '@models/AcademicYear.model';
import Class from '@models/Class.model';
import { Subject } from '@models/Subject.model';
import Staff, { StaffStatus, EmploymentType, StaffCategory } from '@models/Staff.model';
import { Timetable, Period } from '@models/Timetable.model';
import User, { UserRole } from '@models/User.model';
import SchoolConfig from '@models/SchoolConfig.model';
import jwtService from '../../auth/jwt.service';

describe('Timetable API Integration Tests', () => {
  let authToken: string;
  let academicYear: AcademicYear;
  let testClass: Class;
  let subject1: Subject;
  let subject2: Subject;
  let teacher1: Staff;
  let teacher2: Staff;
  let adminUser: User;
  let schoolConfigId: string;
  let schoolConfig: SchoolConfig;

  beforeAll(async () => {
    // Build a disposable schema only for the isolated in-memory SQLite adapter.
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.sync({ force: true });
    }

    schoolConfig = await SchoolConfig.create({
      schoolNameEn: 'Timetable API QA School',
      schoolCode: `TIMETABLE${Date.now()}`,
    });
    schoolConfigId = schoolConfig.id;

    // Create admin user for authentication
    adminUser = await User.create({
      username: 'timetableadmin',
      email: 'timetable_admin@test.com',
      password: 'hashedpassword',
      role: UserRole.SCHOOL_ADMIN,
      schoolConfigId,
    });

    // Generate auth token
    authToken = jwtService.generateAccessToken({
      userId: adminUser.userId,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });

    // Create test data
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS Test',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-13'),
      endDateAD: new Date('2025-04-12'),
      isCurrent: false,
      schoolConfigId,
    });

    testClass = await Class.create({
      academicYearId: academicYear.academicYearId,
      gradeLevel: 10,
      section: 'Z',
      shift: 'morning',
      capacity: 40,
      currentStrength: 0,
      schoolConfigId,
    });

    subject1 = await Subject.create({
      code: 'TIMETABLE_MATH',
      nameEn: 'Mathematics Test',
      nameNp: 'गणित',
      type: 'compulsory',
      creditHours: 100,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100,
      applicableClasses: [10],
      schoolConfigId,
    });

    subject2 = await Subject.create({
      code: 'TIMETABLE_ENG',
      nameEn: 'English Test',
      nameNp: 'अंग्रेजी',
      type: 'compulsory',
      creditHours: 100,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100,
      applicableClasses: [10],
      schoolConfigId,
    });

    teacher1 = await Staff.create({
      staffCode: 'TIMETABLE-STAFF-001',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2020-01-01'),
      status: StaffStatus.ACTIVE,
      schoolConfigId,
    });

    teacher2 = await Staff.create({
      staffCode: 'TIMETABLE-STAFF-002',
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2020-01-01'),
      status: StaffStatus.ACTIVE,
      schoolConfigId,
    });
  });

  afterAll(async () => {
    // Derive only this fixture's timetable IDs; never delete from shared tables.
    if (testClass?.classId) {
      const timetableRows = await Timetable.findAll({
        where: { classId: testClass.classId },
        attributes: ['timetableId'],
      });
      const timetableIds = timetableRows.map((row) => row.timetableId);
      if (timetableIds.length) {
        await Period.destroy({ where: { timetableId: { [Op.in]: timetableIds } }, force: true });
        await Timetable.destroy({ where: { timetableId: { [Op.in]: timetableIds } }, force: true });
      }
      await Class.destroy({ where: { classId: testClass.classId }, force: true });
    }
    const staffIds = [teacher1?.staffId, teacher2?.staffId].filter((id): id is number => Boolean(id));
    if (staffIds.length) {
      await Staff.destroy({ where: { staffId: { [Op.in]: staffIds } }, force: true });
    }
    const subjectIds = [subject1?.subjectId, subject2?.subjectId].filter((id): id is number => Boolean(id));
    if (subjectIds.length) {
      await Subject.destroy({ where: { subjectId: { [Op.in]: subjectIds } }, force: true });
    }
    if (academicYear?.academicYearId) {
      await AcademicYear.destroy({ where: { academicYearId: academicYear.academicYearId }, force: true });
    }
    if (adminUser?.userId) {
      await User.destroy({ where: { userId: adminUser.userId }, force: true });
    }
    if (schoolConfig?.id) {
      await SchoolConfig.destroy({ where: { id: schoolConfig.id }, force: true });
    }
    await sequelize.close();
  });

  describe('POST /api/v1/academic/timetable', () => {
    it('should create a new timetable', async () => {
      const response = await request(app)
        .post('/api/v1/academic/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          classId: testClass.classId,
          academicYearId: academicYear.academicYearId,
          dayOfWeek: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.classId).toBe(testClass.classId);
      expect(response.body.data.dayOfWeek).toBe(1);
    });

    it('should reject invalid day of week', async () => {
      const response = await request(app)
        .post('/api/v1/academic/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          classId: testClass.classId,
          academicYearId: academicYear.academicYearId,
          dayOfWeek: 7
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/academic/timetable - Add Period', () => {
    let timetableId: number;

    beforeAll(async () => {
      const timetable = await Timetable.create({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 2,
        schoolConfigId,
      });
      timetableId = timetable.timetableId;
    });

    it('should add a period to timetable', async () => {
      const response = await request(app)
        .post('/api/v1/academic/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timetableId,
          periodNumber: 1,
          startTime: '09:00',
          endTime: '09:45',
          subjectId: subject1.subjectId,
          teacherId: teacher1.staffId,
          roomNumber: 'Room 101'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.periodNumber).toBe(1);
      expect(response.body.data.startTime).toBe('09:00');
      expect(response.body.data.endTime).toBe('09:45');
    });

    it('should reject invalid time format', async () => {
      const response = await request(app)
        .post('/api/v1/academic/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timetableId,
          periodNumber: 2,
          startTime: '9:00', // Invalid format
          endTime: '09:45',
          subjectId: subject1.subjectId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should detect teacher conflicts', async () => {
      // Add first period
      await request(app)
        .post('/api/v1/academic/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timetableId,
          periodNumber: 3,
          startTime: '10:00',
          endTime: '10:45',
          subjectId: subject1.subjectId,
          teacherId: teacher1.staffId
        });

      // Try to add overlapping period with same teacher
      const response = await request(app)
        .post('/api/v1/academic/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timetableId,
          periodNumber: 4,
          startTime: '10:30', // Overlaps with period 3
          endTime: '11:15',
          subjectId: subject2.subjectId,
          teacherId: teacher1.staffId // Same teacher
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('conflicting period');
    });
  });

  describe('GET /api/v1/academic/timetable/:classId', () => {
    let timetableId: number;

    beforeAll(async () => {
      const timetable = await Timetable.create({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 3,
        schoolConfigId,
      });
      timetableId = timetable.timetableId;

      await Period.create({
        timetableId,
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId,
        schoolConfigId,
      });

      await Period.create({
        timetableId,
        periodNumber: 2,
        startTime: '10:00',
        endTime: '10:45',
        subjectId: subject2.subjectId,
        teacherId: teacher2.staffId,
        schoolConfigId,
      });
    });

    it('should retrieve timetable with periods', async () => {
      const response = await request(app)
        .get(`/api/v1/academic/timetable/${testClass.classId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/v1/academic/timetable - Update Period', () => {
    let periodId: number;

    beforeAll(async () => {
      const timetable = await Timetable.create({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 4,
        schoolConfigId,
      });

      const period = await Period.create({
        timetableId: timetable.timetableId,
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId,
        schoolConfigId,
      });

      periodId = period.periodId;
    });

    it('should update period details', async () => {
      const response = await request(app)
        .put('/api/v1/academic/timetable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          periodId,
          startTime: '11:00',
          endTime: '11:45',
          roomNumber: 'Room 202'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.startTime).toBe('11:00');
      expect(response.body.data.endTime).toBe('11:45');
      expect(response.body.data.roomNumber).toBe('Room 202');
    });
  });
});
