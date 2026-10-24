import fs from 'fs';
import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import SchoolConfig from '@models/SchoolConfig.model';
import Staff, { EmploymentType, StaffCategory } from '@models/Staff.model';
import StaffDocument from '@models/StaffDocument.model';
import User, { UserRole } from '@models/User.model';
import jwtService from '@modules/auth/jwt.service';

describe('Staff document API CRUD with isolated SQLite', () => {
  let authToken: string;
  let staffId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const school = await SchoolConfig.create({
      schoolNameEn: 'Local Staff Document QA',
      schoolCode: 'LOCALSTAFFDOCQA',
    });
    const admin = await User.create({
      username: 'localstaffdocadmin',
      email: 'local-staff-doc-admin@example.test',
      password: 'LocalOnly!Test123',
      role: UserRole.SCHOOL_ADMIN,
      schoolConfigId: school.id,
    });
    const staff = await Staff.create({
      staffCode: 'LOCAL-DOC-001',
      firstNameEn: 'Local QA',
      lastNameEn: 'Document Owner',
      email: 'local-doc-owner@example.test',
      phone: '9801110099',
      category: StaffCategory.TEACHING,
      position: 'teacher',
      department: 'academic',
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2026-01-15'),
      schoolConfigId: school.id,
    });
    staffId = staff.staffId;
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

  it('uploads, reads, updates, and soft-deletes a document record without touching the filesystem', async () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const writeSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

    try {
      const uploaded = await request(app)
        .post(`/api/v1/staff/${staffId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('documentName', 'Local QA License')
        .field('category', 'certificate')
        .attach('document', Buffer.from('synthetic test document'), {
          filename: 'qa-license.pdf',
          contentType: 'application/pdf',
        });

      expect(uploaded.status).toBe(201);
      expect(uploaded.body.data.documentName).toBe('Local QA License');
      expect(uploaded.body.data.originalFileName).toBe('qa-license.pdf');
      expect(writeSpy).toHaveBeenCalledTimes(1);
      const documentId = uploaded.body.data.documentId as number;
      expect(await StaffDocument.count()).toBe(1);

      const list = await request(app)
        .get(`/api/v1/staff/${staffId}/documents`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0].documentId).toBe(documentId);

      const details = await request(app)
        .get(`/api/v1/staff/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(details.status).toBe(200);
      expect(details.body.data.documentUrl).toContain('/uploads/documents/staff/');

      const updated = await request(app)
        .put(`/api/v1/staff/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentName: 'Updated QA License', category: 'qualification' });
      expect(updated.status).toBe(200);
      expect(updated.body.data.documentName).toBe('Updated QA License');
      expect((await StaffDocument.findByPk(documentId))?.category).toBe('qualification');

      const deleted = await request(app)
        .delete(`/api/v1/staff/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleted.status).toBe(200);
      expect(await StaffDocument.count()).toBe(0);
      expect(await StaffDocument.count({ paranoid: false })).toBe(1);

      const afterDelete = await request(app)
        .get(`/api/v1/staff/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(afterDelete.status).toBe(404);
    } finally {
      writeSpy.mockRestore();
      existsSpy.mockRestore();
    }
  });
});
