import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import User, { UserRole } from '@models/User.model';
import Staff, { StaffCategory, StaffStatus, EmploymentType } from '@models/Staff.model';
import StaffAssignment, { AssignmentType } from '@models/StaffAssignment.model';
import jwtService from '@modules/auth/jwt.service';

/**
 * Integration tests for Staff API endpoints
 * Tests all staff management endpoints with authentication and validation
 * Requirements: 4.1-4.10
 */
describe('Staff API Integration Tests', () => {
  let authToken: string;
  let adminUser: User;
  let testStaff: Staff;

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
    // Clean up staff before each test
    await StaffAssignment.destroy({ where: {}, force: true });
    await Staff.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/staff', () => {
    it('should create a new staff member with valid data', async () => {
      const staffData = {
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        email: 'john.doe@school.com',
        phone: '9841234567',
        category: StaffCategory.TEACHING,
        position: 'Mathematics Teacher',
        department: 'Science',
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-15'),
        highestQualification: 'M.Sc. Mathematics',
        status: StaffStatus.ACTIVE
      };

      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send(staffData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('staffId');
      expect(response.body.data).toHaveProperty('staffCode');
      expect(response.body.data.firstNameEn).toBe('John');
      expect(response.body.data.lastNameEn).toBe('Doe');
      expect(response.body.data.category).toBe(StaffCategory.TEACHING);
      expect(response.body.data.status).toBe(StaffStatus.ACTIVE);
    });

    it('should reject staff creation with missing required fields', async () => {
      const invalidData = {
        firstNameEn: 'John'
        // Missing lastNameEn, category, position
      };

      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject staff creation with invalid email', async () => {
      const invalidData = {
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        email: 'invalid-email',
        category: StaffCategory.TEACHING,
        position: 'Teacher'
      };

      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject staff creation with invalid category', async () => {
      const invalidData = {
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        category: 'INVALID_CATEGORY',
        position: 'Teacher'
      };

      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject staff creation without authentication', async () => {
      const staffData = {
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        category: StaffCategory.TEACHING,
        position: 'Teacher'
      };

      await request(app)
        .post('/api/v1/staff')
        .send(staffData)
        .expect(401);
    });
  });

  describe('GET /api/v1/staff', () => {
    beforeEach(async () => {
      // Create multiple staff members for testing
      await Staff.bulkCreate([
        {
          staffCode: 'STAFF-2024-001',
          firstNameEn: 'Alice',
          lastNameEn: 'Smith',
          email: 'alice@school.com',
          category: StaffCategory.TEACHING,
          position: 'English Teacher',
          department: 'Languages',
          employmentType: EmploymentType.FULL_TIME,
          status: StaffStatus.ACTIVE,
          joinDate: new Date('2024-01-01')
        },
        {
          staffCode: 'STAFF-2024-002',
          firstNameEn: 'Bob',
          lastNameEn: 'Johnson',
          email: 'bob@school.com',
          category: StaffCategory.TEACHING,
          position: 'Science Teacher',
          department: 'Science',
          employmentType: EmploymentType.FULL_TIME,
          status: StaffStatus.ACTIVE,
          joinDate: new Date('2024-01-15')
        },
        {
          staffCode: 'STAFF-2024-003',
          firstNameEn: 'Charlie',
          lastNameEn: 'Brown',
          email: 'charlie@school.com',
          category: StaffCategory.NON_TEACHING,
          position: 'Lab Assistant',
          department: 'Science',
          employmentType: EmploymentType.PART_TIME,
          status: StaffStatus.ACTIVE,
          joinDate: new Date('2024-02-01')
        },
        {
          staffCode: 'STAFF-2024-004',
          firstNameEn: 'Diana',
          lastNameEn: 'Wilson',
          email: 'diana@school.com',
          category: StaffCategory.ADMINISTRATIVE,
          position: 'Office Manager',
          department: 'Administration',
          employmentType: EmploymentType.FULL_TIME,
          status: StaffStatus.ON_LEAVE,
          joinDate: new Date('2024-01-10')
        }
      ]);
    });

    it('should list all staff with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBeGreaterThanOrEqual(4);
    });

    it('should filter staff by category', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ category: StaffCategory.TEACHING })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((s: any) => s.category === StaffCategory.TEACHING)).toBe(true);
    });

    it('should filter staff by status', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ status: StaffStatus.ON_LEAVE })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((s: any) => s.status === StaffStatus.ON_LEAVE)).toBe(true);
    });

    it('should filter staff by department', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ department: 'Science' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((s: any) => s.department === 'Science')).toBe(true);
    });

    it('should search staff by name', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ search: 'Alice' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((s: any) => s.firstNameEn === 'Alice')).toBe(true);
    });

    it('should respect pagination limits', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should reject invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ page: -1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/:id', () => {
    beforeEach(async () => {
      testStaff = await Staff.create({
        staffCode: 'STAFF-2024-005',
        firstNameEn: 'Emma',
        lastNameEn: 'Davis',
        email: 'emma@school.com',
        category: StaffCategory.TEACHING,
        position: 'Mathematics Teacher',
        department: 'Mathematics',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-01-20'),
        highestQualification: 'M.Sc. Mathematics'
      });
    });

    it('should get staff by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.staffId).toBe(testStaff.staffId);
      expect(response.body.data.staffCode).toBe('STAFF-2024-005');
      expect(response.body.data.firstNameEn).toBe('Emma');
    });

    it('should return 404 for non-existent staff', async () => {
      const response = await request(app)
        .get('/api/v1/staff/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/staff/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/staff/:id', () => {
    beforeEach(async () => {
      testStaff = await Staff.create({
        staffCode: 'STAFF-2024-006',
        firstNameEn: 'Frank',
        lastNameEn: 'Miller',
        email: 'frank@school.com',
        category: StaffCategory.TEACHING,
        position: 'Physics Teacher',
        department: 'Science',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-01-25')
      });
    });

    it('should update staff with valid data', async () => {
      const updateData = {
        position: 'Senior Physics Teacher',
        highestQualification: 'Ph.D. Physics'
      };

      const response = await request(app)
        .put(`/api/v1/staff/${testStaff.staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.position).toBe('Senior Physics Teacher');
      expect(response.body.data.highestQualification).toBe('Ph.D. Physics');
    });

    it('should update staff status', async () => {
      const updateData = {
        status: StaffStatus.ON_LEAVE
      };

      const response = await request(app)
        .put(`/api/v1/staff/${testStaff.staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(StaffStatus.ON_LEAVE);
    });

    it('should return 404 for non-existent staff', async () => {
      const response = await request(app)
        .put('/api/v1/staff/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 'Updated Position' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email update', async () => {
      const invalidData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put(`/api/v1/staff/${testStaff.staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/staff/:id', () => {
    beforeEach(async () => {
      testStaff = await Staff.create({
        staffCode: 'STAFF-2024-007',
        firstNameEn: 'Grace',
        lastNameEn: 'Taylor',
        email: 'grace@school.com',
        category: StaffCategory.TEACHING,
        position: 'Chemistry Teacher',
        department: 'Science',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-02-01')
      });
    });

    it('should soft delete staff', async () => {
      const response = await request(app)
        .delete(`/api/v1/staff/${testStaff.staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify soft delete - staff should still exist but with deletedAt set
      const deletedStaff = await Staff.findByPk(testStaff.staffId, { paranoid: false });
      expect(deletedStaff).toBeDefined();
      expect(deletedStaff?.deletedAt).not.toBeNull();
    });

    it('should return 404 for non-existent staff', async () => {
      const response = await request(app)
        .delete('/api/v1/staff/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not find soft-deleted staff in normal queries', async () => {
      await request(app)
        .delete(`/api/v1/staff/${testStaff.staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/staff/:id/assign', () => {
    beforeEach(async () => {
      testStaff = await Staff.create({
        staffCode: 'STAFF-2024-008',
        firstNameEn: 'Henry',
        lastNameEn: 'Anderson',
        email: 'henry@school.com',
        category: StaffCategory.TEACHING,
        position: 'Biology Teacher',
        department: 'Science',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-02-05'),
        highestQualification: 'M.Sc. Biology'
      });
    });

    it('should assign staff to class/subject', async () => {
      const assignmentData = {
        staffId: testStaff.staffId,
        classId: 1,
        subjectId: 1,
        academicYearId: 1,
        assignmentType: AssignmentType.SUBJECT_TEACHER
      };

      const response = await request(app)
        .post(`/api/v1/staff/${testStaff.staffId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('assignmentId');
      expect(response.body.data.staffId).toBe(testStaff.staffId);
      expect(response.body.data.classId).toBe(1);
      expect(response.body.data.subjectId).toBe(1);
    });

    it('should reject assignment with missing required fields', async () => {
      const invalidData = {
        staffId: testStaff.staffId
        // Missing classId, academicYearId
      };

      const response = await request(app)
        .post(`/api/v1/staff/${testStaff.staffId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject assignment with invalid assignment type', async () => {
      const invalidData = {
        staffId: testStaff.staffId,
        classId: 1,
        academicYearId: 1,
        assignmentType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post(`/api/v1/staff/${testStaff.staffId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/:id/assignments', () => {
    beforeEach(async () => {
      testStaff = await Staff.create({
        staffCode: 'STAFF-2024-009',
        firstNameEn: 'Ivy',
        lastNameEn: 'Thomas',
        email: 'ivy@school.com',
        category: StaffCategory.TEACHING,
        position: 'History Teacher',
        department: 'Social Studies',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-02-10')
      });

      // Create assignments
      await StaffAssignment.bulkCreate([
        {
          staffId: testStaff.staffId,
          classId: 1,
          subjectId: 1,
          academicYearId: 1,
          assignmentType: AssignmentType.SUBJECT_TEACHER,
          startDate: new Date('2024-01-01'),
          isActive: true
        },
        {
          staffId: testStaff.staffId,
          classId: 2,
          subjectId: 1,
          academicYearId: 1,
          assignmentType: AssignmentType.SUBJECT_TEACHER,
          startDate: new Date('2024-01-01'),
          isActive: true
        }
      ]);
    });

    it('should get staff assignments', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}/assignments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((a: any) => a.staffId === testStaff.staffId)).toBe(true);
    });

    it('should filter assignments by academic year', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}/assignments`)
        .query({ academicYearId: 1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((a: any) => a.academicYearId === 1)).toBe(true);
    });

    it('should include inactive assignments when requested', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}/assignments`)
        .query({ includeInactive: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return empty array for staff with no assignments', async () => {
      const newStaff = await Staff.create({
        staffCode: 'STAFF-2024-010',
        firstNameEn: 'Jack',
        lastNameEn: 'Wilson',
        email: 'jack@school.com',
        category: StaffCategory.TEACHING,
        position: 'Geography Teacher',
        department: 'Social Studies',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-02-15')
      });

      const response = await request(app)
        .get(`/api/v1/staff/${newStaff.staffId}/assignments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/staff/statistics', () => {
    beforeEach(async () => {
      // Create staff with different categories and statuses
      await Staff.bulkCreate([
        {
          staffCode: 'STAFF-2024-011',
          firstNameEn: 'Kate',
          lastNameEn: 'Harris',
          email: 'kate@school.com',
          category: StaffCategory.TEACHING,
          position: 'Teacher',
          employmentType: EmploymentType.FULL_TIME,
          status: StaffStatus.ACTIVE,
          joinDate: new Date('2024-01-01')
        },
        {
          staffCode: 'STAFF-2024-012',
          firstNameEn: 'Leo',
          lastNameEn: 'Martin',
          email: 'leo@school.com',
          category: StaffCategory.TEACHING,
          position: 'Teacher',
          employmentType: EmploymentType.FULL_TIME,
          status: StaffStatus.ACTIVE,
          joinDate: new Date('2024-01-01')
        },
        {
          staffCode: 'STAFF-2024-013',
          firstNameEn: 'Mia',
          lastNameEn: 'Garcia',
          email: 'mia@school.com',
          category: StaffCategory.NON_TEACHING,
          position: 'Assistant',
          employmentType: EmploymentType.PART_TIME,
          status: StaffStatus.ACTIVE,
          joinDate: new Date('2024-01-01')
        },
        {
          staffCode: 'STAFF-2024-014',
          firstNameEn: 'Noah',
          lastNameEn: 'Rodriguez',
          email: 'noah@school.com',
          category: StaffCategory.ADMINISTRATIVE,
          position: 'Manager',
          employmentType: EmploymentType.FULL_TIME,
          status: StaffStatus.ON_LEAVE,
          joinDate: new Date('2024-01-01')
        }
      ]);
    });

    it('should get staff statistics', async () => {
      const response = await request(app)
        .get('/api/v1/staff/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data.total).toBeGreaterThanOrEqual(4);
      expect(response.body.data.byCategory).toHaveProperty(StaffCategory.TEACHING);
      expect(response.body.data.byCategory).toHaveProperty(StaffCategory.NON_TEACHING);
      expect(response.body.data.byStatus).toHaveProperty(StaffStatus.ACTIVE);
    });
  });

  describe('POST /api/v1/staff/:id/documents', () => {
    beforeEach(async () => {
      testStaff = await Staff.create({
        staffCode: 'STAFF-2024-015',
        firstNameEn: 'Olivia',
        lastNameEn: 'Martinez',
        email: 'olivia@school.com',
        category: StaffCategory.TEACHING,
        position: 'Art Teacher',
        department: 'Arts',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-02-20')
      });
    });

    it('should upload staff document', async () => {
      const response = await request(app)
        .post(`/api/v1/staff/${testStaff.staffId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'certificate')
        .field('documentName', 'Teaching License')
        .field('description', 'Valid teaching license')
        .attach('document', Buffer.from('test file content'), 'license.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('documentId');
      expect(response.body.data.staffId).toBe(testStaff.staffId);
      expect(response.body.data.category).toBe('certificate');
      expect(response.body.data.documentName).toBe('Teaching License');
    });

    it('should reject document upload without file', async () => {
      const response = await request(app)
        .post(`/api/v1/staff/${testStaff.staffId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'certificate')
        .field('documentName', 'Teaching License')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject document upload with invalid category', async () => {
      const response = await request(app)
        .post(`/api/v1/staff/${testStaff.staffId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'INVALID_CATEGORY')
        .field('documentName', 'Document')
        .attach('document', Buffer.from('test'), 'doc.pdf')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/:id/documents', () => {
    beforeEach(async () => {
      testStaff = await Staff.create({
        staffCode: 'STAFF-2024-016',
        firstNameEn: 'Peter',
        lastNameEn: 'Lopez',
        email: 'peter@school.com',
        category: StaffCategory.TEACHING,
        position: 'Music Teacher',
        department: 'Arts',
        employmentType: EmploymentType.FULL_TIME,
        status: StaffStatus.ACTIVE,
        joinDate: new Date('2024-02-25')
      });
    });

    it('should get staff documents', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter documents by category', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}/documents`)
        .query({ category: 'certificate' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get only latest documents when requested', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/${testStaff.staffId}/documents`)
        .query({ latestOnly: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
