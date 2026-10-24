jest.mock('sanitize-html', () => (html: string) => html);

import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import SchoolConfig from '@models/SchoolConfig.model';
import Staff, { EmploymentType, StaffCategory } from '@models/Staff.model';
import User, { UserRole } from '@models/User.model';
import jwtService from '@modules/auth/jwt.service';

describe('Staff API CRUD with isolated SQLite', () => {
  let authToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const school = await SchoolConfig.create({
      schoolNameEn: 'Local Staff CRUD QA',
      schoolCode: 'LOCALSTAFFCRUD',
    });
    const admin = await User.create({
      username: 'localstaffadmin',
      email: 'local-staff-admin@example.test',
      password: 'LocalOnly!Test123',
      role: UserRole.SCHOOL_ADMIN,
      schoolConfigId: school.id,
    });
    authToken = jwtService.generateAccessToken({
      userId: admin.userId,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      schoolConfigId: school.id,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates, reads, updates and soft-deletes a synthetic staff member', async () => {
    const invalid = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstNameEn: 'Incomplete' });
    expect(invalid.status).toBe(400);
    expect(await Staff.count()).toBe(0);

    const created = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstNameEn: 'Local QA',
        lastNameEn: 'Teacher',
        email: 'local-qa-teacher@example.test',
        phone: '9801110001',
        category: StaffCategory.TEACHING,
        position: 'Mathematics Teacher',
        department: 'Science',
        employmentType: EmploymentType.FULL_TIME,
        joinDate: '2026-01-15',
      });

    expect(created.status).toBe(201);
    const staffId = created.body.data.staffId as number;
    expect(created.body.data.firstNameEn).toBe('Local QA');
    expect(await Staff.count()).toBe(1);

    const read = await request(app)
      .get(`/api/v1/staff/${staffId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(read.status).toBe(200);
    expect(read.body.data.email).toBe('local-qa-teacher@example.test');

    const updated = await request(app)
      .put(`/api/v1/staff/${staffId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ position: 'Senior Mathematics Teacher' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.position).toBe('Senior Mathematics Teacher');
    expect((await Staff.findByPk(staffId))?.position).toBe('Senior Mathematics Teacher');

    const deleted = await request(app)
      .delete(`/api/v1/staff/${staffId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(deleted.status).toBe(200);
    expect(await Staff.findByPk(staffId)).toBeNull();

    const afterDelete = await request(app)
      .get(`/api/v1/staff/${staffId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(afterDelete.status).toBe(404);
  });

  it('rejects missing or malformed academic-year query IDs before database lookup', async () => {
    const missing = await request(app)
      .get('/api/v1/staff/class/1/teacher')
      .set('Authorization', `Bearer ${authToken}`);
    expect(missing.status).toBe(400);

    const malformed = await request(app)
      .get('/api/v1/staff/class/1/subject/1/teachers')
      .query({ academicYearId: 'not-a-number' })
      .set('Authorization', `Bearer ${authToken}`);
    expect(malformed.status).toBe(400);

    const malformedAssignmentFilter = await request(app)
      .get('/api/v1/staff/1/assignments')
      .query({ academicYearId: 'not-a-number' })
      .set('Authorization', `Bearer ${authToken}`);
    expect(malformedAssignmentFilter.status).toBe(400);
  });
});
