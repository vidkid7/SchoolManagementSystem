import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import User, { UserRole } from '@models/User.model';
import Admission, { AdmissionStatus } from '@models/Admission.model';
import Student from '@models/Student.model';
import jwtService from '@modules/auth/jwt.service';

/**
 * Integration tests for Admission API endpoints
 * Tests all admission workflow endpoints with authentication and validation
 * Requirements: 3.1-3.12
 */
describe('Admission API Integration Tests', () => {
  let authToken: string;
  let adminUser: User;
  let testAdmission: Admission;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create admin user for authentication
    adminUser = await User.create({
      username: 'admin_test',
      email: 'admin@test.com',
      password: 'Admin@1234',
      role: UserRole.SCHOOL_ADMIN
    });

    // Generate auth token
    authToken = jwtService.generateAccessToken({
      userId: adminUser.userId,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up admissions before each test
    await Admission.destroy({ where: {}, force: true });
    await Student.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/admissions/inquiry', () => {
    it('should create a new inquiry with valid data', async () => {
      const inquiryData = {
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        applyingForClass: 5,
        guardianPhone: '9841234567',
        email: 'john.doe@example.com',
        inquirySource: 'online'
      };

      const response = await request(app)
        .post('/api/v1/admissions/inquiry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('admissionId');
      expect(response.body.data).toHaveProperty('temporaryId');
      expect(response.body.data.status).toBe(AdmissionStatus.INQUIRY);
      expect(response.body.data.firstNameEn).toBe('John');
      expect(response.body.data.lastNameEn).toBe('Doe');
      expect(response.body.data.applyingForClass).toBe(5);
    });

    it('should reject inquiry with missing required fields', async () => {
      const invalidData = {
        firstNameEn: 'John'
        // Missing lastNameEn and applyingForClass
      };

      const response = await request(app)
        .post('/api/v1/admissions/inquiry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject inquiry with invalid class number', async () => {
      const invalidData = {
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        applyingForClass: 15 // Invalid: must be 1-12
      };

      const response = await request(app)
        .post('/api/v1/admissions/inquiry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject inquiry without authentication', async () => {
      const inquiryData = {
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        applyingForClass: 5
      };

      await request(app)
        .post('/api/v1/admissions/inquiry')
        .send(inquiryData)
        .expect(401);
    });
  });

  describe('POST /api/v1/admissions/:id/apply', () => {
    beforeEach(async () => {
      // Create an inquiry for testing
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        applyingForClass: 5,
        status: AdmissionStatus.INQUIRY,
        inquiryDate: new Date(),
        applicationFeePaid: false,
        documentsVerified: false
      });
    });

    it('should convert inquiry to application with valid data', async () => {
      const applicationData = {
        firstNameNp: 'जोन',
        lastNameNp: 'डो',
        dateOfBirthBS: '2070-05-15',
        dateOfBirthAD: new Date('2013-08-30'),
        gender: 'male',
        addressEn: 'Kathmandu, Nepal',
        fatherName: 'John Doe Sr.',
        fatherPhone: '9841234567',
        motherName: 'Jane Doe',
        motherPhone: '9841234568',
        applicationFee: 1000,
        applicationFeePaid: true
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AdmissionStatus.APPLIED);
      expect(response.body.data.firstNameNp).toBe('जोन');
      expect(response.body.data.applicationFeePaid).toBe(true);
    });

    it('should reject conversion with invalid admission ID', async () => {
      const response = await request(app)
        .post('/api/v1/admissions/99999/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ gender: 'male' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject conversion with invalid gender', async () => {
      const invalidData = {
        gender: 'invalid_gender'
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admissions/:id/schedule-test', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0002',
        firstNameEn: 'Jane',
        lastNameEn: 'Smith',
        applyingForClass: 6,
        status: AdmissionStatus.APPLIED,
        inquiryDate: new Date(),
        applicationDate: new Date(),
        applicationFeePaid: true,
        documentsVerified: false
      });
    });

    it('should schedule admission test with valid date', async () => {
      const testDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/schedule-test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ testDate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AdmissionStatus.TEST_SCHEDULED);
      expect(response.body.data.admissionTestDate).toBeDefined();
    });

    it('should reject scheduling without test date', async () => {
      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/schedule-test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admissions/:id/record-test-score', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0003',
        firstNameEn: 'Bob',
        lastNameEn: 'Johnson',
        applyingForClass: 7,
        status: AdmissionStatus.TEST_SCHEDULED,
        inquiryDate: new Date(),
        applicationDate: new Date(),
        admissionTestDate: new Date(),
        applicationFeePaid: true,
        documentsVerified: false
      });
    });

    it('should record test score with valid data', async () => {
      const scoreData = {
        score: 85,
        maxScore: 100,
        remarks: 'Good performance'
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/record-test-score`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scoreData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AdmissionStatus.TESTED);
      expect(response.body.data.admissionTestScore).toBe(85);
      expect(response.body.data.admissionTestMaxScore).toBe(100);
    });

    it('should reject negative scores', async () => {
      const invalidData = {
        score: -10,
        maxScore: 100
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/record-test-score`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const invalidData = {
        score: 85
        // Missing maxScore
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/record-test-score`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admissions/:id/schedule-interview', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0004',
        firstNameEn: 'Alice',
        lastNameEn: 'Williams',
        applyingForClass: 8,
        status: AdmissionStatus.TESTED,
        inquiryDate: new Date(),
        applicationDate: new Date(),
        admissionTestDate: new Date(),
        admissionTestScore: 85,
        admissionTestMaxScore: 100,
        applicationFeePaid: true,
        documentsVerified: false
      });
    });

    it('should schedule interview with valid data', async () => {
      const interviewDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/schedule-interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interviewDate,
          interviewerName: 'Principal Smith'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AdmissionStatus.INTERVIEW_SCHEDULED);
      expect(response.body.data.interviewDate).toBeDefined();
      expect(response.body.data.interviewerName).toBe('Principal Smith');
    });

    it('should reject scheduling without interview date', async () => {
      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/schedule-interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ interviewerName: 'Principal Smith' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admissions/:id/record-interview', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0005',
        firstNameEn: 'Charlie',
        lastNameEn: 'Brown',
        applyingForClass: 9,
        status: AdmissionStatus.INTERVIEW_SCHEDULED,
        inquiryDate: new Date(),
        applicationDate: new Date(),
        admissionTestDate: new Date(),
        admissionTestScore: 90,
        admissionTestMaxScore: 100,
        interviewDate: new Date(),
        applicationFeePaid: true,
        documentsVerified: false
      });
    });

    it('should record interview feedback with valid data', async () => {
      const feedbackData = {
        feedback: 'Excellent communication skills and good academic background',
        score: 95
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/record-interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(feedbackData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AdmissionStatus.INTERVIEWED);
      expect(response.body.data.interviewFeedback).toBe(feedbackData.feedback);
      expect(response.body.data.interviewScore).toBe(95);
    });

    it('should reject without feedback', async () => {
      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/record-interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ score: 95 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid score range', async () => {
      const invalidData = {
        feedback: 'Good candidate',
        score: 150 // Invalid: must be 0-100
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/record-interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admissions/:id/admit', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0006',
        firstNameEn: 'David',
        lastNameEn: 'Miller',
        applyingForClass: 10,
        status: AdmissionStatus.INTERVIEWED,
        inquiryDate: new Date(),
        applicationDate: new Date(),
        admissionTestDate: new Date(),
        admissionTestScore: 88,
        admissionTestMaxScore: 100,
        interviewDate: new Date(),
        interviewFeedback: 'Strong candidate',
        interviewScore: 92,
        applicationFeePaid: true,
        documentsVerified: true
      });
    });

    it('should admit applicant and generate offer letter', async () => {
      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/admit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AdmissionStatus.ADMITTED);
      expect(response.body.data.admissionDate).toBeDefined();
      expect(response.body.data.admissionOfferLetterUrl).toBeDefined();
    });

    it('should reject admission for non-existent applicant', async () => {
      const response = await request(app)
        .post('/api/v1/admissions/99999/admit')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admissions/:id/enroll', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0007',
        firstNameEn: 'Emma',
        lastNameEn: 'Davis',
        applyingForClass: 11,
        status: AdmissionStatus.ADMITTED,
        inquiryDate: new Date(),
        applicationDate: new Date(),
        admissionDate: new Date(),
        admissionOfferLetterUrl: '/uploads/offer-letters/test.pdf',
        applicationFeePaid: true,
        documentsVerified: true,
        dateOfBirthBS: '2068-03-15',
        dateOfBirthAD: new Date('2011-06-28'),
        gender: 'female',
        addressEn: 'Pokhara, Nepal',
        fatherName: 'Father Davis',
        fatherPhone: '9841111111',
        motherName: 'Mother Davis',
        motherPhone: '9841111112'
      });
    });

    it('should enroll admitted applicant as student', async () => {
      const enrollmentData = {
        rollNumber: 1
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admission.status).toBe(AdmissionStatus.ENROLLED);
      expect(response.body.data.student).toBeDefined();
      expect(response.body.data.student.studentCode).toBeDefined();
      expect(response.body.data.student.rollNumber).toBe(1);
    });

    it('should reject enrollment with invalid roll number', async () => {
      const invalidData = {
        rollNumber: -5 // Invalid: must be positive
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admissions/:id/reject', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0008',
        firstNameEn: 'Frank',
        lastNameEn: 'Wilson',
        applyingForClass: 12,
        status: AdmissionStatus.INTERVIEWED,
        inquiryDate: new Date(),
        applicationDate: new Date(),
        admissionTestDate: new Date(),
        admissionTestScore: 45,
        admissionTestMaxScore: 100,
        interviewDate: new Date(),
        interviewFeedback: 'Needs improvement',
        applicationFeePaid: true,
        documentsVerified: false
      });
    });

    it('should reject applicant with valid reason', async () => {
      const rejectionData = {
        reason: 'Did not meet minimum score requirements'
      };

      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AdmissionStatus.REJECTED);
      expect(response.body.data.rejectionReason).toBe(rejectionData.reason);
      expect(response.body.data.rejectionDate).toBeDefined();
    });

    it('should reject without reason', async () => {
      const response = await request(app)
        .post(`/api/v1/admissions/${testAdmission.admissionId}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admissions/:id', () => {
    beforeEach(async () => {
      testAdmission = await Admission.create({
        temporaryId: 'TEST-INQ-2024-0009',
        firstNameEn: 'Grace',
        lastNameEn: 'Taylor',
        applyingForClass: 3,
        status: AdmissionStatus.INQUIRY,
        inquiryDate: new Date(),
        applicationFeePaid: false,
        documentsVerified: false
      });
    });

    it('should get admission by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/admissions/${testAdmission.admissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admissionId).toBe(testAdmission.admissionId);
      expect(response.body.data.temporaryId).toBe('TEST-INQ-2024-0009');
      expect(response.body.data.firstNameEn).toBe('Grace');
    });

    it('should return 404 for non-existent admission', async () => {
      const response = await request(app)
        .get('/api/v1/admissions/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admissions/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admissions', () => {
    beforeEach(async () => {
      // Create multiple admissions for testing
      await Admission.bulkCreate([
        {
          temporaryId: 'TEST-INQ-2024-0010',
          firstNameEn: 'Henry',
          lastNameEn: 'Anderson',
          applyingForClass: 4,
          status: AdmissionStatus.INQUIRY,
          inquiryDate: new Date(),
          applicationFeePaid: false,
          documentsVerified: false
        },
        {
          temporaryId: 'TEST-INQ-2024-0011',
          firstNameEn: 'Ivy',
          lastNameEn: 'Thomas',
          applyingForClass: 5,
          status: AdmissionStatus.APPLIED,
          inquiryDate: new Date(),
          applicationDate: new Date(),
          applicationFeePaid: true,
          documentsVerified: false
        },
        {
          temporaryId: 'TEST-INQ-2024-0012',
          firstNameEn: 'Jack',
          lastNameEn: 'Jackson',
          applyingForClass: 5,
          status: AdmissionStatus.ADMITTED,
          inquiryDate: new Date(),
          applicationDate: new Date(),
          admissionDate: new Date(),
          applicationFeePaid: true,
          documentsVerified: true
        }
      ]);
    });

    it('should list all admissions with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admissions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter admissions by status', async () => {
      const response = await request(app)
        .get('/api/v1/admissions')
        .query({ status: AdmissionStatus.APPLIED })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((a: any) => a.status === AdmissionStatus.APPLIED)).toBe(true);
    });

    it('should filter admissions by class', async () => {
      const response = await request(app)
        .get('/api/v1/admissions')
        .query({ applyingForClass: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((a: any) => a.applyingForClass === 5)).toBe(true);
    });

    it('should search admissions by name', async () => {
      const response = await request(app)
        .get('/api/v1/admissions')
        .query({ search: 'Ivy' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((a: any) => a.firstNameEn === 'Ivy')).toBe(true);
    });

    it('should respect pagination limits', async () => {
      const response = await request(app)
        .get('/api/v1/admissions')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should reject invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/admissions')
        .query({ page: -1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admissions/reports', () => {
    beforeEach(async () => {
      // Create admissions with different statuses
      await Admission.bulkCreate([
        {
          temporaryId: 'TEST-INQ-2024-0013',
          firstNameEn: 'Kate',
          lastNameEn: 'White',
          applyingForClass: 6,
          status: AdmissionStatus.INQUIRY,
          inquiryDate: new Date(),
          applicationFeePaid: false,
          documentsVerified: false
        },
        {
          temporaryId: 'TEST-INQ-2024-0014',
          firstNameEn: 'Leo',
          lastNameEn: 'Harris',
          applyingForClass: 7,
          status: AdmissionStatus.APPLIED,
          inquiryDate: new Date(),
          applicationDate: new Date(),
          applicationFeePaid: true,
          documentsVerified: false
        },
        {
          temporaryId: 'TEST-INQ-2024-0015',
          firstNameEn: 'Mia',
          lastNameEn: 'Martin',
          applyingForClass: 6,
          status: AdmissionStatus.ADMITTED,
          inquiryDate: new Date(),
          applicationDate: new Date(),
          admissionDate: new Date(),
          applicationFeePaid: true,
          documentsVerified: true
        }
      ]);
    });

    it('should get admission statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admissions/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byClass');
      expect(response.body.data.total).toBeGreaterThanOrEqual(3);
      expect(response.body.data.byStatus).toHaveProperty(AdmissionStatus.INQUIRY);
      expect(response.body.data.byStatus).toHaveProperty(AdmissionStatus.APPLIED);
      expect(response.body.data.byStatus).toHaveProperty(AdmissionStatus.ADMITTED);
    });

    it('should reject invalid academic year ID', async () => {
      const response = await request(app)
        .get('/api/v1/admissions/reports')
        .query({ academicYearId: -1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
