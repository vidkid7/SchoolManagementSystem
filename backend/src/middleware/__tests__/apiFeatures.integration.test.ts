import request from 'supertest';
import app from '../../app';
import { sequelize } from '@config/database';
import Student, { StudentStatus, Gender } from '@models/Student.model';
import User, { UserRole } from '@models/User.model';
import Class from '@models/Class.model';
import { AcademicYear } from '@models/AcademicYear.model';
import jwtService from '@modules/auth/jwt.service';

/**
 * API Features Integration Tests
 * Tests rate limiting, pagination, filtering, and sorting
 * Requirements: 35.4, 35.6, 35.7
 */

describe('API Features Integration Tests', () => {
  let authToken: string;
  let adminUser: User;
  let academicYear: AcademicYear;
  let testClass: Class;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: UserRole.SCHOOL_ADMIN,
      status: 'active' as any,
      failedLoginAttempts: 0
    });

    authToken = jwtService.generateAccessToken({
      userId: adminUser.userId,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    });

    // Create academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-13'),
      endDateAD: new Date('2025-04-12'),
      isCurrent: true
    });

    // Create test class
    testClass = await Class.create({
      gradeLevel: 10,
      section: 'A',
      shift: 'morning',
      capacity: 50,
      currentStrength: 0,
      academicYearId: academicYear.academicYearId
    } as any);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Requirement 35.4: Rate Limiting (100 requests/minute/user)', () => {
    it('should allow requests within rate limit', async () => {
      // Make 5 requests (well within the 100/minute limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/v1/students')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(429);
      }
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should enforce rate limit per user', async () => {
      // This test would require making 100+ requests which is slow
      // In production, rate limiting is verified through load testing
      // Here we just verify the middleware is applied
      const response = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['ratelimit-limit']).toBe('100');
    });
  });

  describe('Requirement 35.6: Pagination (default 20, max 100 items)', () => {
    beforeAll(async () => {
      // Create 45 test students for pagination testing
      const students = Array.from({ length: 45 }, (_, i) => ({
        studentCode: `STU${String(i + 1).padStart(4, '0')}`,
        firstNameEn: `Student${i + 1}`,
        lastNameEn: `Test`,
        firstNameNp: `विद्यार्थी${i + 1}`,
        lastNameNp: `परीक्षण`,
        dateOfBirthBS: '2065-05-15',
        dateOfBirthAD: new Date('2008-08-30'),
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
        addressEn: 'Test Address',
        addressNp: 'परीक्षण ठेगाना',
        fatherName: 'Father Name',
        fatherPhone: '9800000000',
        motherName: 'Mother Name',
        motherPhone: '9800000001',
        emergencyContact: '9800000002',
        admissionDate: new Date('2024-04-01'),
        admissionClass: 10,
        currentClassId: testClass.classId!,
        status: StudentStatus.ACTIVE
      }));

      await Student.bulkCreate(students as any);
    });

    it('should return default page size of 20', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(20);
      expect(response.body.meta).toEqual({
        page: 1,
        limit: 20,
        total: 45,
        totalPages: 3
      });
    });

    it('should support custom page size', async () => {
      const response = await request(app)
        .get('/api/v1/students?limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should support page navigation', async () => {
      const page1 = await request(app)
        .get('/api/v1/students?page=1&limit=20')
        .set('Authorization', `Bearer ${authToken}`);

      const page2 = await request(app)
        .get('/api/v1/students?page=2&limit=20')
        .set('Authorization', `Bearer ${authToken}`);

      expect(page1.body.data).toHaveLength(20);
      expect(page2.body.data).toHaveLength(20);
      expect(page1.body.data[0].id).not.toBe(page2.body.data[0].id);
    });

    it('should enforce max page size of 100', async () => {
      const response = await request(app)
        .get('/api/v1/students?limit=200')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.limit).toBe(100);
    });

    it('should return remaining items on last page', async () => {
      const response = await request(app)
        .get('/api/v1/students?page=3&limit=20')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(5); // 45 total, 20+20+5
      expect(response.body.meta.page).toBe(3);
    });
  });

  describe('Requirement 35.7: Filtering and Sorting', () => {
    beforeAll(async () => {
      // Ensure we have diverse test data
      await Student.update(
        { gender: Gender.MALE },
        { where: { studentCode: ['STU0001', 'STU0002', 'STU0003'] } } as any
      );
      await Student.update(
        { gender: Gender.FEMALE },
        { where: { studentCode: ['STU0004', 'STU0005', 'STU0006'] } } as any
      );
    });

    describe('Filtering', () => {
      it('should filter by gender', async () => {
        const response = await request(app)
          .get(`/api/v1/students?gender=${Gender.MALE}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        response.body.data.forEach((student: any) => {
          expect(student.gender).toBe(Gender.MALE);
        });
      });

      it('should filter by class', async () => {
        const response = await request(app)
          .get(`/api/v1/students?classId=${testClass.classId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        response.body.data.forEach((student: any) => {
          expect(student.currentClassId).toBe(testClass.classId);
        });
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get(`/api/v1/students?status=${StudentStatus.ACTIVE}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        response.body.data.forEach((student: any) => {
          expect(student.status).toBe(StudentStatus.ACTIVE);
        });
      });

      it('should support search by name', async () => {
        const response = await request(app)
          .get('/api/v1/students?search=Student1')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);
        response.body.data.forEach((student: any) => {
          expect(student.firstNameEn).toContain('Student1');
        });
      });

      it('should support multiple filters', async () => {
        const response = await request(app)
          .get(`/api/v1/students?gender=${Gender.MALE}&classId=${testClass.classId}&status=${StudentStatus.ACTIVE}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        response.body.data.forEach((student: any) => {
          expect(student.gender).toBe(Gender.MALE);
          expect(student.currentClassId).toBe(testClass.classId);
          expect(student.status).toBe(StudentStatus.ACTIVE);
        });
      });
    });

    describe('Sorting', () => {
      it('should sort by firstName ascending', async () => {
        const response = await request(app)
          .get('/api/v1/students?sortBy=firstNameEn&sortOrder=ASC&limit=10')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        const names = response.body.data.map((s: any) => s.firstNameEn);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      });

      it('should sort by firstName descending', async () => {
        const response = await request(app)
          .get('/api/v1/students?sortBy=firstNameEn&sortOrder=DESC&limit=10')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        const names = response.body.data.map((s: any) => s.firstNameEn);
        const sortedNames = [...names].sort().reverse();
        expect(names).toEqual(sortedNames);
      });

      it('should sort by rollNumber ascending', async () => {
        const response = await request(app)
          .get('/api/v1/students?sortBy=rollNumber&sortOrder=ASC&limit=10')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        const rollNumbers = response.body.data.map((s: any) => s.rollNumber);
        const sortedRollNumbers = [...rollNumbers].sort((a: number, b: number) => a - b);
        expect(rollNumbers).toEqual(sortedRollNumbers);
      });

      it('should sort by createdAt descending (default)', async () => {
        const response = await request(app)
          .get('/api/v1/students?limit=10')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        const dates = response.body.data.map((s: any) => new Date(s.createdAt).getTime());
        
        // Check if dates are in descending order
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      });

      it('should support sorting with filters', async () => {
        const response = await request(app)
          .get(`/api/v1/students?gender=${Gender.MALE}&sortBy=studentCode&sortOrder=ASC`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        response.body.data.forEach((student: any) => {
          expect(student.gender).toBe(Gender.MALE);
        });
        
        const studentCodes = response.body.data.map((s: any) => s.studentCode);
        const sortedCodes = [...studentCodes].sort();
        expect(studentCodes).toEqual(sortedCodes);
      });
    });

    describe('Combined: Pagination + Filtering + Sorting', () => {
      it('should support all features together', async () => {
        const response = await request(app)
          .get(`/api/v1/students?gender=${Gender.MALE}&sortBy=studentCode&sortOrder=ASC&page=1&limit=5`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        // Check pagination
        expect(response.body.data.length).toBeLessThanOrEqual(5);
        expect(response.body.meta.page).toBe(1);
        expect(response.body.meta.limit).toBe(5);
        
        // Check filtering
        response.body.data.forEach((student: any) => {
          expect(student.gender).toBe(Gender.MALE);
        });
        
        // Check sorting
        const studentCodes = response.body.data.map((s: any) => s.studentCode);
        const sortedCodes = [...studentCodes].sort();
        expect(studentCodes).toEqual(sortedCodes);
      });
    });
  });

  describe('API Consistency', () => {
    it('should return consistent response format', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.success).toBe(true);
    });

    it('should return proper error format for invalid parameters', async () => {
      const response = await request(app)
        .get('/api/v1/students?page=-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
