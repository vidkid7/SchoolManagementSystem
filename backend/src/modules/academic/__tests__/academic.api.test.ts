import request from 'supertest';
import app from '../../../app';
import { AcademicYear, Term } from '@models/AcademicYear.model';
import Class from '@models/Class.model';
import { Subject } from '@models/Subject.model';
import Staff, { StaffStatus, EmploymentType, StaffCategory } from '@models/Staff.model';
import { Timetable, Period, Syllabus, SyllabusTopic } from '@models/Timetable.model';
import User, { UserRole } from '@models/User.model';
import jwtService from '../../auth/jwt.service';

/**
 * Academic API Integration Tests
 * Tests all academic endpoints with authentication and authorization
 * Requirements: 5.1-5.11
 */
describe('Academic API Integration Tests', () => {
  let adminToken: string;
  let teacherToken: string;
  let adminUser: User;
  let teacherUser: User;
  let testAcademicYear: AcademicYear;
  let testTerm: Term;
  let testClass: Class;
  let testSubject: Subject;
  let testTeacher: Staff;

  beforeAll(async () => {
    // Create admin user
    adminUser = await User.create({
      username: 'academicadmin',
      email: 'academic_admin@test.com',
      password: 'Admin@1234',
      role: UserRole.SCHOOL_ADMIN
    });

    adminToken = jwtService.generateAccessToken({
      userId: adminUser.userId,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });

    // Create teacher user
    teacherUser = await User.create({
      username: 'academicteacher',
      email: 'academic_teacher@test.com',
      password: 'Teacher@1234',
      role: UserRole.SUBJECT_TEACHER
    });

    teacherToken = jwtService.generateAccessToken({
      userId: teacherUser.userId,
      username: teacherUser.username,
      email: teacherUser.email,
      role: teacherUser.role
    });

    // Create test teacher staff
    testTeacher = await Staff.create({
      staffCode: 'ACADEMIC-TEST-STAFF-001',
      firstNameEn: 'Test',
      lastNameEn: 'Teacher',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2020-01-01'),
      status: StaffStatus.ACTIVE
    });
  });

  afterAll(async () => {
    // Clean up test data
    await SyllabusTopic.destroy({ where: {}, force: true });
    await Syllabus.destroy({ where: {}, force: true });
    await Period.destroy({ where: {}, force: true });
    await Timetable.destroy({ where: {}, force: true });
    await Subject.destroy({ where: {}, force: true });
    await Class.destroy({ where: {}, force: true });
    await Term.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
    await Staff.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  // ============ Academic Year Tests ============

  describe('Academic Year Endpoints', () => {
    describe('POST /api/v1/academic/years', () => {
      it('should create a new academic year', async () => {
        const response = await request(app)
          .post('/api/v1/academic/years')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '2081-2082 BS Test',
            startDateBS: '2081-01-01',
            endDateBS: '2081-12-30',
            startDateAD: '2024-04-13',
            endDateAD: '2025-04-12',
            isCurrent: false
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('2081-2082 BS Test');
        testAcademicYear = response.body.data;
      });

      it('should reject creation without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/academic/years')
          .send({
            name: '2082-2083 BS Test',
            startDateBS: '2082-01-01',
            endDateBS: '2082-12-30',
            startDateAD: '2025-04-13',
            endDateAD: '2026-04-12'
          });

        expect(response.status).toBe(401);
      });

      it('should reject creation by non-admin', async () => {
        const response = await request(app)
          .post('/api/v1/academic/years')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            name: '2082-2083 BS Test',
            startDateBS: '2082-01-01',
            endDateBS: '2082-12-30',
            startDateAD: '2025-04-13',
            endDateAD: '2026-04-12'
          });

        expect(response.status).toBe(403);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/v1/academic/years')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '2082-2083 BS Test'
            // Missing required fields
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/academic/years', () => {
      it('should retrieve all academic years', async () => {
        const response = await request(app)
          .get('/api/v1/academic/years')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should allow teachers to view academic years', async () => {
        const response = await request(app)
          .get('/api/v1/academic/years')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/v1/academic/years', () => {
      it('should update an academic year', async () => {
        const response = await request(app)
          .put('/api/v1/academic/years')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            academicYearId: testAcademicYear.academicYearId,
            name: '2081-2082 BS Updated'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('2081-2082 BS Updated');
      });

      it('should validate academic year ID', async () => {
        const response = await request(app)
          .put('/api/v1/academic/years')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '2081-2082 BS Updated'
            // Missing academicYearId
          });

        expect(response.status).toBe(400);
      });
    });
  });

  // ============ Term Tests ============

  describe('Term Endpoints', () => {
    describe('POST /api/v1/academic/terms', () => {
      it('should create a new term', async () => {
        const response = await request(app)
          .post('/api/v1/academic/terms')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            academicYearId: testAcademicYear.academicYearId,
            name: 'First Terminal Test',
            startDate: '2024-04-13',
            endDate: '2024-08-15',
            examStartDate: '2024-08-01',
            examEndDate: '2024-08-15'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('First Terminal Test');
        testTerm = response.body.data;
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/v1/academic/terms')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Second Terminal Test'
            // Missing academicYearId and dates
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/academic/terms', () => {
      it('should retrieve terms for an academic year', async () => {
        const response = await request(app)
          .get('/api/v1/academic/terms')
          .query({ academicYearId: testAcademicYear.academicYearId })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should require academicYearId parameter', async () => {
        const response = await request(app)
          .get('/api/v1/academic/terms')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/v1/academic/terms', () => {
      it('should update a term', async () => {
        const response = await request(app)
          .put('/api/v1/academic/terms')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            termId: testTerm.termId,
            name: 'First Terminal Updated'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('First Terminal Updated');
      });
    });
  });

  // ============ Class Tests ============

  describe('Class Endpoints', () => {
    describe('POST /api/v1/academic/classes', () => {
      it('should create a new class', async () => {
        const response = await request(app)
          .post('/api/v1/academic/classes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            academicYearId: testAcademicYear.academicYearId,
            gradeLevel: 10,
            section: 'TEST_A',
            shift: 'morning',
            capacity: 40,
            classTeacherId: testTeacher.staffId
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.gradeLevel).toBe(10);
        expect(response.body.data.section).toBe('TEST_A');
        testClass = response.body.data;
      });

      it('should validate grade level range', async () => {
        const response = await request(app)
          .post('/api/v1/academic/classes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            academicYearId: testAcademicYear.academicYearId,
            gradeLevel: 13, // Invalid
            section: 'TEST_B',
            shift: 'morning'
          });

        expect(response.status).toBe(400);
      });

      it('should validate shift values', async () => {
        const response = await request(app)
          .post('/api/v1/academic/classes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            academicYearId: testAcademicYear.academicYearId,
            gradeLevel: 10,
            section: 'TEST_C',
            shift: 'invalid_shift'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/academic/classes', () => {
      it('should retrieve all classes', async () => {
        const response = await request(app)
          .get('/api/v1/academic/classes')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by grade level', async () => {
        const response = await request(app)
          .get('/api/v1/academic/classes')
          .query({ gradeLevel: 10 })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.every((c: Class) => c.gradeLevel === 10)).toBe(true);
      });

      it('should filter by academic year', async () => {
        const response = await request(app)
          .get('/api/v1/academic/classes')
          .query({ academicYearId: testAcademicYear.academicYearId })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/v1/academic/classes', () => {
      it('should update a class', async () => {
        const response = await request(app)
          .put('/api/v1/academic/classes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            classId: testClass.classId,
            capacity: 45
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.capacity).toBe(45);
      });
    });
  });

  // ============ Subject Tests ============

  describe('Subject Endpoints', () => {
    describe('POST /api/v1/academic/subjects', () => {
      it('should create a new subject', async () => {
        const response = await request(app)
          .post('/api/v1/academic/subjects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            code: 'ACADEMIC_TEST_MATH',
            nameEn: 'Mathematics Test',
            nameNp: 'गणित परीक्षण',
            type: 'compulsory',
            creditHours: 100,
            theoryMarks: 75,
            practicalMarks: 25,
            passMarks: 35
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.code).toBe('ACADEMIC_TEST_MATH');
        testSubject = response.body.data;
      });

      it('should validate subject type', async () => {
        const response = await request(app)
          .post('/api/v1/academic/subjects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            code: 'ACADEMIC_TEST_ENG',
            nameEn: 'English Test',
            nameNp: 'अंग्रेजी परीक्षण',
            type: 'invalid_type'
          });

        expect(response.status).toBe(400);
      });

      it('should create optional subject with stream', async () => {
        const response = await request(app)
          .post('/api/v1/academic/subjects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            code: 'ACADEMIC_TEST_PHYSICS',
            nameEn: 'Physics Test',
            nameNp: 'भौतिक विज्ञान परीक्षण',
            type: 'optional',
            stream: 'science',
            creditHours: 100,
            theoryMarks: 75,
            practicalMarks: 25,
            passMarks: 35
          });

        expect(response.status).toBe(201);
        expect(response.body.data.stream).toBe('science');
      });
    });

    describe('GET /api/v1/academic/subjects', () => {
      it('should retrieve all subjects', async () => {
        const response = await request(app)
          .get('/api/v1/academic/subjects')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by type', async () => {
        const response = await request(app)
          .get('/api/v1/academic/subjects')
          .query({ type: 'compulsory' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every((s: Subject) => s.type === 'compulsory')).toBe(true);
      });

      it('should filter by stream', async () => {
        const response = await request(app)
          .get('/api/v1/academic/subjects')
          .query({ stream: 'science' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every((s: Subject) => s.stream === 'science')).toBe(true);
      });
    });

    describe('PUT /api/v1/academic/subjects', () => {
      it('should update a subject', async () => {
        const response = await request(app)
          .put('/api/v1/academic/subjects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            subjectId: testSubject.subjectId,
            creditHours: 120
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.creditHours).toBe(120);
      });
    });
  });

  // ============ Timetable Tests ============

  describe('Timetable Endpoints', () => {
    let testTimetable: Timetable;

    describe('POST /api/v1/academic/timetable', () => {
      it('should create a new timetable', async () => {
        const response = await request(app)
          .post('/api/v1/academic/timetable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            classId: testClass.classId,
            academicYearId: testAcademicYear.academicYearId,
            dayOfWeek: 1
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.dayOfWeek).toBe(1);
        testTimetable = response.body.data;
      });

      it('should validate day of week range', async () => {
        const response = await request(app)
          .post('/api/v1/academic/timetable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            classId: testClass.classId,
            academicYearId: testAcademicYear.academicYearId,
            dayOfWeek: 7 // Invalid
          });

        expect(response.status).toBe(400);
      });

      it('should add a period to timetable', async () => {
        const response = await request(app)
          .post('/api/v1/academic/timetable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            timetableId: testTimetable.timetableId,
            periodNumber: 1,
            startTime: '09:00',
            endTime: '09:45',
            subjectId: testSubject.subjectId,
            teacherId: testTeacher.staffId,
            roomNumber: 'Room 101'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.periodNumber).toBe(1);
      });

      it('should validate time format', async () => {
        const response = await request(app)
          .post('/api/v1/academic/timetable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            timetableId: testTimetable.timetableId,
            periodNumber: 2,
            startTime: '9:00', // Invalid format
            endTime: '09:45',
            subjectId: testSubject.subjectId
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/academic/timetable', () => {
      it('should retrieve timetable with classId', async () => {
        const response = await request(app)
          .get('/api/v1/academic/timetable')
          .query({ classId: testClass.classId })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should require classId parameter', async () => {
        const response = await request(app)
          .get('/api/v1/academic/timetable')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/academic/timetable/:classId', () => {
      it('should retrieve timetable by class ID', async () => {
        const response = await request(app)
          .get(`/api/v1/academic/timetable/${testClass.classId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('PUT /api/v1/academic/timetable', () => {
      let testPeriod: Period;

      beforeAll(async () => {
        testPeriod = await Period.create({
          timetableId: testTimetable.timetableId,
          periodNumber: 3,
          startTime: '10:00',
          endTime: '10:45',
          subjectId: testSubject.subjectId,
          teacherId: testTeacher.staffId
        });
      });

      it('should update a period', async () => {
        const response = await request(app)
          .put('/api/v1/academic/timetable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            periodId: testPeriod.periodId,
            roomNumber: 'Room 202'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.roomNumber).toBe('Room 202');
      });
    });
  });

  // ============ Syllabus Tests ============

  describe('Syllabus Endpoints', () => {
    let testSyllabus: Syllabus;

    describe('POST /api/v1/academic/syllabus', () => {
      it('should create a new syllabus', async () => {
        const response = await request(app)
          .post('/api/v1/academic/syllabus')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            subjectId: testSubject.subjectId,
            classId: testClass.classId,
            academicYearId: testAcademicYear.academicYearId
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.subjectId).toBe(testSubject.subjectId);
        testSyllabus = response.body.data;
      });

      it('should add a topic to syllabus', async () => {
        const response = await request(app)
          .post('/api/v1/academic/syllabus')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            syllabusId: testSyllabus.syllabusId,
            title: 'Algebra Basics',
            description: 'Introduction to algebraic expressions',
            estimatedHours: 10
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Algebra Basics');
      });

      it('should validate estimated hours range', async () => {
        const response = await request(app)
          .post('/api/v1/academic/syllabus')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            syllabusId: testSyllabus.syllabusId,
            title: 'Geometry',
            estimatedHours: 1000 // Invalid
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/academic/syllabus', () => {
      it('should retrieve syllabus', async () => {
        const response = await request(app)
          .get('/api/v1/academic/syllabus')
          .query({
            subjectId: testSubject.subjectId,
            classId: testClass.classId
          })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.subjectId).toBe(testSubject.subjectId);
      });

      it('should require subjectId and classId', async () => {
        const response = await request(app)
          .get('/api/v1/academic/syllabus')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/academic/syllabus/:subjectId', () => {
      it('should retrieve syllabus by subject ID', async () => {
        const response = await request(app)
          .get(`/api/v1/academic/syllabus/${testSubject.subjectId}`)
          .query({ classId: testClass.classId })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.subjectId).toBe(testSubject.subjectId);
      });

      it('should require classId parameter', async () => {
        const response = await request(app)
          .get(`/api/v1/academic/syllabus/${testSubject.subjectId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/v1/academic/syllabus', () => {
      let testTopic: SyllabusTopic;

      beforeAll(async () => {
        testTopic = await SyllabusTopic.create({
          syllabusId: testSyllabus.syllabusId,
          title: 'Trigonometry',
          estimatedHours: 15,
          completedHours: 0,
          status: 'not_started'
        });
      });

      it('should update topic progress', async () => {
        const response = await request(app)
          .put('/api/v1/academic/syllabus')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            topicId: testTopic.topicId,
            completedHours: 5
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should validate completed hours range', async () => {
        const response = await request(app)
          .put('/api/v1/academic/syllabus')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            topicId: testTopic.topicId,
            completedHours: 1000 // Invalid
          });

        expect(response.status).toBe(400);
      });
    });
  });
});
