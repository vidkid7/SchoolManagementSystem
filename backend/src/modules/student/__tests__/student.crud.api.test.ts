jest.mock('sanitize-html', () => (html: string) => html);
jest.mock('../studentId.service', () => ({
  __esModule: true,
  default: { generateStudentId: jest.fn().mockResolvedValue('QA-LOCAL-2026-0001') },
}));

import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import User, { UserRole } from '@models/User.model';
import SchoolConfig from '@models/SchoolConfig.model';
import Student from '@models/Student.model';
import jwtService from '@modules/auth/jwt.service';

describe('Student API CRUD with isolated SQLite', () => {
  let authToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const school = await SchoolConfig.create({
      schoolNameEn: 'Local Student CRUD QA',
      schoolCode: 'LOCALCRUDQA',
    });
    const admin = await User.create({
      username: 'localcrudadmin',
      email: 'local-crud-admin@example.test',
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

  it('validates create, persists and reads, updates, then soft-deletes a synthetic student', async () => {
    const invalid = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstNameEn: 'Incomplete' });

    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe('Validation failed');
    expect(await Student.count()).toBe(0);

    const payload = {
      firstNameEn: 'Local QA',
      lastNameEn: 'Student',
      dateOfBirthBS: '2070-01-01',
      dateOfBirthAD: '2013-04-14',
      gender: 'female',
      addressEn: 'Local test address',
      fatherName: 'Local Father',
      fatherPhone: '9801110001',
      motherName: 'Local Mother',
      motherPhone: '9801110002',
      emergencyContact: '9801110003',
      admissionDate: '2026-01-01',
      admissionClass: 1,
    };
    const created = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    const studentId = created.body.data.studentId as number;
    expect(created.body.data.studentCode).toBe('QA-LOCAL-2026-0001');
    expect((await Student.findByPk(studentId))?.firstNameEn).toBe('Local QA');

    const read = await request(app)
      .get(`/api/v1/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(read.status).toBe(200);
    expect(read.body.data.lastNameEn).toBe('Student');

    const updated = await request(app)
      .put(`/api/v1/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstNameEn: 'Local QA Edited' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.firstNameEn).toBe('Local QA Edited');
    expect((await Student.findByPk(studentId))?.firstNameEn).toBe('Local QA Edited');

    const deleted = await request(app)
      .delete(`/api/v1/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(deleted.status).toBe(200);
    expect(await Student.findByPk(studentId)).toBeNull();

    const afterDelete = await request(app)
      .get(`/api/v1/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(afterDelete.status).toBe(404);
  });
});
